# Project Brief — William Barnhart Portfolio

## Identity

This is **William Barnhart Portfolio** — a single-page, climb-themed developer portfolio built with Next.js, React, TypeScript, Tailwind CSS, GSAP, and Three.js. It tells a career story as an ascent: each section is a *zone* on a mountain, and the 3D mountain reacts to scroll progress.

## Tech Stack

- **Framework**: Next.js 16 (App Router, static export)
- **Language**: TypeScript 5.8
- **Styling**: Tailwind CSS 4 + custom CSS in `src/app/globals.css`
- **Animation**: GSAP + ScrollTrigger, Lenis smooth scroll
- **3D**: Three.js (raw imperative renderer in `Mountain3D.tsx`)
- **Build output**: `distDir: "build"` (configured in `next.config.ts`)
- **Deployment**: Static export (drop `build/` on any static host)

## Conventions

- **Files**: kebab-case for config/scripts, PascalCase for React components, camelCase for utilities
- **Components**: colocate section components in `src/components/`, page layout in `src/app/`
- **Imports**: use `@/` path alias for `src/`
- **State**: prefer `useReducer` + context for global state (see `ClimbContext.tsx`); keep Three.js objects in refs, never React state
- **Effects**: clean up GSAP ScrollTriggers and Three.js resources on unmount
- **Types**: keep shared domain types in `src/components/zoneTypes.ts`
- **Git hooks**: active via `.githooks/` — run `./scripts/setup-hooks.sh` after `git init`

## Context Pointers

- Domain language → `docs/CONTEXT.md`
- Architecture decisions → `docs/adr/`
- Reusable skills → `skills/` (managed by `scripts/workspace`)
- Design/tech spec → `tech-spec.md`

## Issue Tracker

- **Type**: File-based (use `docs/adr/` for decisions, tech-debt notes in code comments)
- **Triage labels**: `bug`, `feature`, `polish`, `tech-debt`, `content`

---

> Keep this file under 50 lines. Anything longer belongs in a skill or doc behind a context pointer.
