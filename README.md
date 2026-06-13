# William Barnhart Portfolio

A single-page, climb-themed developer portfolio built with **Next.js 16**, **React 19**, **TypeScript 5.8**, **Tailwind CSS 4**, **GSAP**, and **Three.js**. The career story is framed as a mountain ascent: each section is a *zone*, scroll progress drives the 3D mountain camera, and a small gamified layer rewards exploration.

Live repo: https://github.com/LitEndurance/Portfolio

## Tech Stack

- **Framework**: Next.js 16 (App Router, static export)
- **Language**: TypeScript 5.8
- **Styling**: Tailwind CSS 4 + custom CSS in `src/app/globals.css`
- **Animation**: GSAP + ScrollTrigger, Lenis smooth scroll
- **3D**: Three.js (raw imperative renderer in `Mountain3D.tsx`)
- **Fonts**: Inter, Instrument Serif (Google Fonts), Geist Mono (`geist` package)
- **Build output**: `build/` (configured in `next.config.ts`)
- **Deployment**: Static export (drop `build/` on any static host)

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

## The Climb Metaphor

The page is organized as a single ascent with six zones:

| Zone | Label | Purpose |
|------|-------|---------|
| Hero | Trailhead | Full-viewport intro with the 3D mountain and scroll indicator. |
| About | Base Camp | Bio paragraph and background. |
| Skills | Gear Wall | Skill categories in a grid. |
| Projects | Summit Log | Numbered project entries. |
| Gallery | Trail Markers | Project screenshots and highlights. |
| Contact | Summit | Email CTA and final status. |

Scroll progress (0.0 at the top to 1.0 at the bottom) drives the mountain camera in `Mountain3D`. A fixed status bar shows current **altitude** (0–8000) and zone label.

## Key Features

### Mountain3D

Imperative Three.js scene mounted inside a React component. It owns the renderer, scene, camera, geometry, and animation loop in refs — never in React state. Scroll progress updates the camera path and mountain appearance; all Three.js resources are disposed on unmount.

### Mountain Boot Sequence

A full-screen intro animation (`MountainBootSequence.tsx`) plays before the page becomes interactive. Scroll is locked until the sequence completes.

### Summit Terminal

A fixed overlay UI (`SummitTerminal.tsx`) that accepts typed commands and reports climb status. It reads from `ClimbContext` and exposes stats like altitude, checkpoints, strawberries, falls, and golden-strawberry eligibility.

### Gamification Layer

- **Checkpoint** — marked when the user spends meaningful time in a zone.
- **Strawberry** — collectible milestone earned by interactions and easter eggs.
- **Golden Strawberry** — ultimate achievement: all zones discovered, all checkpoints marked, 5+ commands run, summit reached.
- **Fall** — failure/recovery counter that increments the resilience bonus.

### Smooth Scroll

Lenis owns scroll position and is synced to GSAP ScrollTrigger via `lenis.on('scroll', ScrollTrigger.update)`.

## Available Scripts

```bash
npm run dev              # Start the Next.js dev server
npm run dev:lan          # Dev server exposed on local network
npm run build            # Static export to build/
npm run start            # Start the production Next.js server
npm run lint             # Run ESLint
npm run test:orb         # Run the orb-path debug script
npm run clean            # Remove build artifacts, logs, caches
npm run clean:deploy     # Also remove the 42 MB uncompressed mountain.bin
npm run clean:all        # Nuclear option: also remove node_modules
npm run predeploy        # clean:deploy + build
```

## Cleanup

This repo includes a cross-platform cleanup script:

```bash
# Standard cleanup: build artifacts, logs, caches, managed skill repos
npm run clean

# Deploy prep: also removes the 42 MB uncompressed mountain.bin
# (the site uses the 9.2 MB mountain.bin.gz instead)
npm run clean:deploy

# Nuclear option: also remove node_modules
npm run clean:all
```

## Deploy

This is a static export. After building, upload the `build/` directory to any static host (Cloudflare Pages, Vercel, Netlify, GitHub Pages, etc.).

```bash
npm run clean:deploy
npm run build
# Upload build/
```

### Cloudflare Pages Notes

- **Build command**: `npm run build`
- **Build output directory**: `build`
- **Node version**: set `NODE_VERSION` to `20` if auto-detection picks an older version.
- Cloudflare Pages has a **25 MB per-file limit**. `npm run clean:deploy` removes the uncompressed `public/mountain.bin` (~42 MB); the site loads `public/mountain.bin.gz` (~9 MB) first and only falls back to `.bin` if the gzipped file fails.

## Project Structure

- `src/app/` — Next.js app layout and root page
- `src/components/` — React components for each zone and UI
  - `Mountain3D.tsx` — imperative Three.js mountain scene
  - `MountainBootSequence.tsx` — full-screen intro animation
  - `SummitTerminal.tsx` — command overlay and climb stats
  - `ClimbContext.tsx` — global climb/game state
  - `ClimbStatusBar.tsx` — fixed altitude / zone status bar
  - `*Section.tsx` — zone section components
- `src/hooks/` — Custom React hooks
- `src/lib/` — Utilities (Lenis, sound engine)
- `public/` — Static assets (fonts, images, resume PDF, mountain binary)
- `scripts/` — Build helpers, debug tools, and cleanup
- `docs/` — Domain language (`CONTEXT.md`) and architecture decisions (`adr/`)
- `skills/` — Reusable skill notes (managed by `scripts/workspace`)

## Domain Docs

- `docs/CONTEXT.md` — ubiquitous language and bounded contexts
- `docs/adr/` — architecture decision records
- `tech-spec.md` — original technical specification (some details predate the Next.js migration)

## License

See [LICENSE](./LICENSE).
