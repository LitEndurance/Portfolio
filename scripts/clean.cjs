#!/usr/bin/env node
/**
 * Cleanup script for William Barnhart Portfolio.
 *
 * Removes local build artifacts, logs, caches, and other files that should not
 * be committed or deployed. Use `--deploy` when preparing a build for
 * Cloudflare Pages (removes the uncompressed mountain binary that exceeds
 * Cloudflare's 25 MB per-file limit).
 *
 * Usage:
 *   node scripts/clean.cjs           # standard cleanup
 *   node scripts/clean.cjs --deploy  # Cloudflare / GitHub deploy prep
 *   node scripts/clean.cjs --all     # also remove node_modules
 *   node scripts/clean.cjs --init-git # run `git init` after cleanup
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const isDeploy = args.includes("--deploy");
const isAll = args.includes("--all");
const initGit = args.includes("--init-git");
const dryRun = args.includes("--dry-run");

const removedInDryRun = new Set();

function rel(target) {
  return path.relative(process.cwd(), target) || ".";
}

function exists(target) {
  try {
    fs.accessSync(target);
    return true;
  } catch {
    return false;
  }
}

function remove(target, reason) {
  const full = path.resolve(ROOT, target);
  if (!exists(full)) return false;
  if (dryRun && removedInDryRun.has(full)) return false;

  const label = reason ? `${rel(full)} (${reason})` : rel(full);
  if (dryRun) {
    removedInDryRun.add(full);
    console.log(`[dry-run] would remove ${label}`);
    return true;
  }

  const stat = fs.statSync(full);
  if (stat.isDirectory()) {
    fs.rmSync(full, { recursive: true, force: true });
  } else {
    fs.unlinkSync(full);
  }
  console.log(`removed ${label}`);
  return true;
}

function removeGlob(dir, pattern, reason) {
  const fullDir = path.resolve(ROOT, dir);
  if (!exists(fullDir)) return;

  const entries = fs.readdirSync(fullDir);
  for (const entry of entries) {
    if (typeof pattern === "string" ? entry === pattern : pattern.test(entry)) {
      remove(path.join(dir, entry), reason);
    }
  }
}

function cleanSkillSubmodules() {
  // The skills/ directory contains cloned third-party skill repos managed by
  // scripts/workspace. They are large and should not be committed to this repo.
  const skillsDir = path.resolve(ROOT, "skills");
  if (!exists(skillsDir)) return;

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name !== "README.md") {
      remove(path.join("skills", entry.name), "managed skill submodule");
    }
  }
}

console.log("\n🧹  Cleaning William Barnhart Portfolio...\n");

// Build artifacts and caches
remove(".next", "Next.js build cache");
remove("build", "static export output");
remove("out", "legacy export output");
remove("tsconfig.tsbuildinfo", "TypeScript incremental build info");

// Logs and local runtime files
remove("server.log", "local server log");
removeGlob(".", /\.(log|tmp)$/, "log/temp file");
remove(".playwright-mcp", "Playwright MCP browser logs");

// Duplicate / generated assets
remove(
  "IT Focused Resume - Google Docs.pdf",
  "duplicate resume (public/IT-Focused-Resume.pdf is canonical)"
);

// Managed skill repos (large, not part of this project)
cleanSkillSubmodules();

// Deploy-specific: remove the uncompressed 42 MB mountain binary.
// The site fetches mountain.bin.gz first (9.2 MB) and falls back to .bin only
// when gz is unavailable. Cloudflare Pages has a 25 MB per-file limit, so the
// .bin must not be in the published output.
if (isDeploy) {
  remove("public/mountain.bin", "uncompressed asset > Cloudflare 25 MB limit");
}

// Optional deep clean
if (isAll) {
  remove("node_modules", "installed dependencies");
}

// Initialize a fresh git repo if requested.
if (initGit) {
  const gitDir = path.resolve(ROOT, ".git");
  if (exists(gitDir)) {
    console.log("\n⚠️  Git repository already exists; skipping git init.");
  } else if (dryRun) {
    console.log("\n[dry-run] would run: git init");
  } else {
    console.log("\n📦  Initializing git repository...");
    execSync("git init", { cwd: ROOT, stdio: "inherit" });
    console.log("   Run `git add . && git commit -m \"initial commit\"` when ready.");
  }
}

console.log("\n✅  Cleanup complete.");
if (!isDeploy) {
  console.log(
    "\n💡  Tip: run with --deploy before pushing to GitHub / Cloudflare Pages."
  );
}
if (!isAll) {
  console.log("   Run with --all to also remove node_modules.");
}
