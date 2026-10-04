# Ubiquitous Language — William Barnhart Portfolio

> Living document. Add terms as the domain evolves. Agents read this to stay concise and consistent.

## Core Terms

| Term | Definition | Usage |
|------|------------|-------|
| **Zone** | One of six `/infrastructure` page sections mapped to a point on the mountain climb: `hero`, `about`, `skills`, `projects`, `gallery`, `contact`. | "The user scrolled into the `about` zone." |
| **Trailhead** | Label for the `hero` zone (start of the climb). | "Trailhead is the first zone the user sees." |
| **Base Camp** | Label for the `about` zone. | "Base Camp contains the bio paragraph." |
| **Gear Wall** | Label for the `skills` zone. | "Gear Wall shows the skill categories." |
| **Summit Log** | Label for the `projects` zone. | "Summit Log lists numbered projects." |
| **Trail Markers** | Label for the `gallery` zone. | "Trail Markers is the gallery section." |
| **Summit** | Label for the `contact` zone; also the final goal of the climb. | "The Summit zone holds the email CTA." |
| **Trail** | One page's climb up the shared mountain: its own hoop route, stops, and camera path. `infrastructure` (spiral around the peak) or `websites` (switchbacks up the front face). | "Pass `trail="websites"` to AdaptiveMountain." |
| **Stop** | A page section along a trail (the infrastructure stops are its zones; the websites stops are `hero`, `overlook`, `services`, `who`, `how`, `about`, `contact`). | "The orb reaches the `services` hoop when that stop begins." |
| **Progress** | Scroll progress through the page, 0.0 at the top to 1.0 at the bottom. | "Progress 0.44 marks the start of the projects zone." |
| **Altitude** | Gamified climb height, 0–8000, shown in the status bar. | "Altitude increases as the user scrolls." |
| **Checkpoint** | A zone where the user spent meaningful time; contributes to golden strawberry eligibility. | "Mark a checkpoint when the user pauses in a zone." |
| **Strawberry** | Collectible milestone (Celeste reference) earned by interacting with the page. | "Record a strawberry when an easter egg fires." |
| **Golden Strawberry** | Ultimate achievement: all zones discovered, all checkpoints marked, 5+ commands run, summit reached. | "Check golden strawberry eligibility on summit." |
| **Fall** | Gamified failure/recovery counter; increments resilience bonus. | "Record a fall when the user triggers a specific interaction." |
| **Resilience Bonus** | Counter derived from falls; adds character to the climb metaphor. | "Resilience bonus increases with each fall." |
| **Boot Sequence** | Full-screen intro animation that plays before the page becomes interactive, on both trails (SummitOS wording on `/infrastructure`, trail wording on `/websites`). | "The boot sequence locks scroll until it finishes." |
| **All trails link** | The `BackToTrails` pill (`← All trails`) at the left of both trail headers (and first in the `/infrastructure` mobile menu). A client-side `next/link` back to `/`, the trail-choice landing page. Leaving a trail unmounts it fully: the sound engine is stopped, Lenis and its ticker are removed, and the WebGL context is released, so re-entering boots fresh. | "All trails returns to the landing page from either trail." |
| **Summit Terminal** | Fixed overlay UI that accepts typed commands and shows climb status. | "The Summit Terminal reads from ClimbContext." |
| **Mountain3D** | The imperative Three.js scene that renders the mountain and handles scroll-driven camera. | "Mountain3D exposes a ref handle for external control." |

## Bounded Contexts

- **Climb / game state** — `ClimbContext.tsx`, `zoneTypes.ts`, `zoneConfig.ts`. Owns progression, persistence, and achievements. Only `/infrastructure` runs the game; `/websites` mounts `ClimbProvider` with `persist={false} audio={false}` just for the boot stage.
- **3D rendering** — `Mountain3D.tsx`. Owns the Three.js scene, camera, animation loop, and disposal. Imperative; no React state. Each trail's orb/hoop route is data in `hoopRoutes/<trail>.json` (read via `hoopRoute.ts`); `trails.ts` pairs it with the trail's stops (`zoneConfig.ts` for infrastructure, `websitesZoneConfig.ts` for websites). `npm run test:orb` checks both routes against the terrain, their stop thresholds, and each other.
- **UI / sections** — `src/components/*Section.tsx`, `Header.tsx`, `BackToTrails.tsx`, `Footer.tsx`, `SummitTerminal.tsx`. Presentational React components. The `/websites` sections (`src/components/sites/*`, copy in `src/content/sites.ts`) get their visual layer from `src/app/websites/sites.css`, scoped to `.sites-page` so the infrastructure trail is unaffected. The `terms` section ("How I work": prices, payment/revision/ownership terms, care plans; `SitesTerms.tsx`, copy in `sites.terms`) sits between `how` and `about` and is not a stop of its own.
- **Contact endpoint** — `functions/api/contact.ts`, a Cloudflare Pages Function (the site is a static export, so Next.js has no server routes). Validates the `/websites` form, drops honeypot hits, and sends through Resend. Env vars and local testing are in `CONTACT_SETUP.md`; `npm run test:contact` exercises it offline.
- **Boot / sequencing** — `MountainBootSequence.tsx`, `BootLockedContent` in `infrastructure/page.tsx`, `sites/SitesBootScreen.tsx`. Owns the intro animation and scroll lock.

## Anti-Language

> Words we intentionally *don't* use, and what to say instead.

| Don't say | Say instead | Why |
|-----------|-------------|-----|
| "Section" (ambiguous) | "Zone" | The whole app is organized around the climb metaphor. |
| "Page" for the whole experience | "Climb" or "ascent" | Reinforces the narrative framing. |
| "Scroll position" when meaning normalized progress | "Progress" | `progress` is the normalized 0–1 value used throughout the code. |
