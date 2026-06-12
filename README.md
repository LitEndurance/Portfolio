# William Barnhart Portfolio

A single-page, climb-themed developer portfolio built with Next.js, React, TypeScript, Tailwind CSS, GSAP, and Three.js. Each section is a *zone* on a mountain ascent, and the 3D mountain reacts to scroll progress.

## Tech Stack

- **Framework**: Next.js 16 (App Router, static export)
- **Language**: TypeScript 5.8
- **Styling**: Tailwind CSS 4
- **Animation**: GSAP + ScrollTrigger, Lenis smooth scroll
- **3D**: Three.js (imperative renderer)
- **Deployment**: Static export → Cloudflare Pages

## Getting Started

Requires **Node.js 18.17+** (recommended: 20 — see `.nvmrc`).

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Create a production static export
npm run build
```

The static export is written to the `build/` directory.

## Cleanup

This repo includes a cross-platform cleanup script:

```bash
# Standard cleanup: build artifacts, logs, caches, managed skill repos
npm run clean

# Cloudflare / GitHub deploy prep: also removes the 42 MB uncompressed
# mountain.bin (the site uses the 9.2 MB mountain.bin.gz instead)
npm run clean:deploy

# Nuclear option: also remove node_modules
npm run clean:all

# Initialize a fresh git repo after cleanup
node scripts/clean.cjs --init-git
```

## Deploy to Cloudflare Pages

The fastest path is connecting this GitHub repo to Cloudflare Pages.

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. Connect to Cloudflare Pages

1. In the Cloudflare dashboard, go to **Pages** → **Create a project** → **Connect to Git**.
2. Select this repository.
3. Build settings:
   - **Framework preset**: Next.js (or None — static export is used)
   - **Build command**: `npm run build`
   - **Build output directory**: `build`
4. Add an environment variable if Cloudflare auto-detects the wrong Node version:
   - `NODE_VERSION` = `20`
5. Save and deploy.

Cloudflare will run `npm run build` on every push to `main` and serve the contents of `build/`.

### Important: Asset Size Limit

Cloudflare Pages has a **25 MB per-file limit**. The uncompressed `public/mountain.bin` is ~42 MB, so `npm run clean:deploy` removes it before the build. The site loads `mountain.bin.gz` (~9 MB) first and only falls back to the uncompressed `.bin` if the gzipped file fails, so removing it is safe for deployment.

### Alternative: Deploy with Wrangler

If you prefer deploying manually from your machine:

```bash
npm run clean:deploy
npm run build
npx wrangler pages deploy build
```

## Project Structure

- `src/app/` — Next.js app layout and root page
- `src/components/` — React components for each zone and UI
- `src/hooks/` — Custom React hooks
- `src/lib/` — Utilities (Lenis, sound engine)
- `public/` — Static assets (fonts, images, resume PDF, mountain binary)
- `scripts/` — Build helpers, debug tools, and cleanup
- `docs/` — Domain language (`CONTEXT.md`) and architecture decisions (`adr/`)

## License

See [LICENSE](./LICENSE).
