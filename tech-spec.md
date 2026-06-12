# Technical Specification — William Barnhart Portfolio

## Dependencies

### Production

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.1 | UI framework |
| react-dom | ^19.1 | DOM rendering |
| three | ^0.172 | 3D warp grid renderer |
| @types/three | ^0.172 | Three.js type definitions |
| gsap | ^3.13 | Animation engine (ScrollTrigger plugin) |
| lenis | ^1.3 | Smooth scroll with inertia |
| geist | ^1.4 | Geist Mono font (CSS import) |
| lucide-react | ^0.468 | Icons (scroll arrow) |

### Development

| Package | Version | Purpose |
|---------|---------|---------|
| vite | ^6.3 | Build tool |
| @vitejs/plugin-react | ^4.5 | React fast refresh for Vite |
| typescript | ^5.8 | Type checking |
| tailwindcss | ^4.1 | Utility CSS |
| @tailwindcss/vite | ^4.1 | Tailwind Vite integration |
| @types/react | ^19.1 | React type definitions |
| @types/react-dom | ^19.1 | ReactDOM type definitions |

### Fonts (External, no package)

Inter (weight 600) and Instrument Serif (400 italic) loaded via Google Fonts `<link>` tags in `index.html`. Geist Mono loaded via `geist` npm package CSS import.

---

## Component Inventory

### Layout

| Component | Source | Notes |
|-----------|--------|-------|
| Header | Custom | Fixed top bar, transparent. "WILLIAM BARNHART" left, "CONTACT" right (scrolls to footer). |
| Footer | Custom | 4-column grid (contact, location, links, status) + copyright. Responsive: single column on mobile. |

### Sections

| Component | Source | Notes |
|-----------|--------|-------|
| HeroSection | Custom | Full viewport. Contains WarpGrid canvas + LiquidGlass content overlay. Scroll indicator with pulse animation. |
| AboutSection | Custom | Label + AnimatedHeading + bio paragraph. FadeIn wrapper. |
| SkillsGridSection | Custom | Label + AnimatedHeading + 2x2 grid of SkillBlock components. |
| ProjectsSection | Custom | Label + AnimatedHeading + 3 ProjectItem components with number/title/description/tags. |
| ContactSection | Custom | Label + AnimatedHeading + email CTA link. |

### Reusable Components

| Component | Source | Reuse | Notes |
|-----------|--------|-------|-------|
| WarpGrid | Custom | 1 | Three.js canvas with custom vertex/fragment shaders. Owns renderer, scene, camera, animation loop. See imperative API below. |
| LiquidGlass | Custom | 1 | CSS-only translucent panel for hero content overlay. Radial gradient + subtle border. ScaleY entrance animation via GSAP. |
| AnimatedHeading | Custom | 5 | Double-layer word-stack reveal (top/bottom spans). Integrates GSAP ScrollTrigger. Handles italic accent words with Instrument Serif. See animation notes below. |
| AnimatedText | Custom | 4 | Character-by-character opacity/translateY stagger. Used in skill block category titles. |
| FadeIn | Custom | ~8 | Generic scroll-triggered wrapper: opacity 0→1 + translateY 40→0 via GSAP ScrollTrigger. Accepts delay prop. |
| ScrollIndicator | Custom | 1 | SVG arrow + "SCROLL" label. CSS infinite pulse animation. Fades out on first scroll event. |
| SkillBlock | Custom | 4 | Single skill category cell: AnimatedText title + bullet list. Hover: bg + text color transition. |
| ProjectItem | Custom | 3 | Numbered project: index, title (hover→golden), description, tags row. Bottom border separator. |

---

## Animation Implementation

| Animation | Library | Implementation Approach | Complexity |
|-----------|---------|------------------------|------------|
| Interactive warp grid (vertex displacement + specular) | Three.js raw (ShaderMaterial) | Custom vertex/fragment shaders. PlaneGeometry(180,180,250,250). Per-frame uniform updates for uCursor, uTime, uMouse. Mouse world-position unprojection. | **High** 🔒 |
| Liquid glass scale reveal | GSAP | scaleY: 0→1, transform-origin bottom. Triggered on page load (0.5s delay). | Low |
| Word-by-word heading reveal | GSAP + ScrollTrigger | Per-word DOM split into two stacked layers. ScrollTrigger scrubs both layers (top: 100%→0, bottom: 0→-100). Stagger 0.1s between words. | **High** 🔒 |
| Character shimmer (hero only) | GSAP | Post-word-reveal: per-character color shift #555→#f0f0f0, stagger 0.03s. Chained after word animation completes. | Medium |
| Character-by-character reveal | GSAP + SplitType | Split text into char spans. Per-char opacity 0→1 + translateY 20→0, stagger 0.03s. ScrollTrigger start "top 85%". | Medium |
| Fade-in on scroll | GSAP + ScrollTrigger | opacity 0→1 + y 40→0. Trigger start "top 85%". Applied via reusable FadeIn wrapper component. | Low |
| Page load sequence | GSAP timeline | Orchestrated timeline: grid fade (2s) → glass scale (1.2s) → name fade (1s) → title fade (0.8s) → subtitle fade (0.6s) → indicator fade (0.5s). | Medium |
| Scroll indicator pulse | CSS @keyframes | translateY 0→8→0, 2s ease-in-out infinite. Fades out via GSAP on first Lenis scroll event. | Low |
| Smooth scroll | Lenis | Lenis instance synced to GSAP ScrollTrigger via `lenis.on('scroll', ScrollTrigger.update)`. | Low |
| Skill block hover | CSS transition | background-color and color transition, 0.3s ease-out. Pure CSS, no JS. | Low |
| Project title hover | CSS transition | color transition to #c9a45c, 0.3s. Pure CSS. | Low |

---

## State & Logic

### WarpGrid — Imperative Three.js in React

The grid is a self-contained imperative Three.js system mounted inside a React component. All Three.js objects (renderer, scene, camera, geometry, material, mesh) are created in a `useEffect` and stored in refs — never in React state. The animation loop runs via `requestAnimationFrame` and directly mutates uniform values. Cleanup on unmount disposes all Three.js resources (geometry, material, renderer) and cancels the RAF loop. Mouse/touch events are attached to the canvas element directly, not through React synthetic events, to avoid re-renders. The component exposes nothing to parent — it is fully self-managing.

### WebGL Fallback

If WebGL is unavailable (detected via `try/catch` around WebGLRenderer construction), render a static CSS fallback: `body` background set to a radial-gradient centered grid pattern using `repeating-linear-gradient` in warm grey tones. This preserves the dark technical aesthetic without the interactive component.

### Lenis ↔ ScrollTrigger Sync

Lenis owns scroll position; ScrollTrigger must read it. Create a single Lenis instance at app root. Register `lenis.on('scroll', ScrollTrigger.update)` and drive Lenis from GSAP's ticker: `gsap.ticker.add((time) => lenis.raf(time * 1000))`. Disable GSAP lag smoothing (`gsap.ticker.lagSmoothing(0)`). This is a one-time wiring at app initialization — no state involved.

### AnimatedHeading — DOM Splitting

The heading text must be split into per-word spans at render time (two copies per word, stacked). Since the text is static and known at build time, the split can be done at render without a library like SplitType for the word layer. However, the character shimmer on the hero heading requires per-character spans — use `split-type` library here only. The italic accent words ("infrastructure", "expertise", "together") are identified by markdown-like markers in the text prop and rendered with a different font family.

---

## Other Key Decisions

### No shadcn/ui

This is a fully custom design with no standard UI patterns (no forms, dialogs, tables, dropdowns). Every component has bespoke styling and animation. Adding shadcn would introduce unused infrastructure. All components are hand-built.

### No React Three Fiber

The WarpGrid uses a single PlaneGeometry with custom ShaderMaterial and a simple render loop. R3F's declarative scene graph and reconciler add abstraction without benefit for this use case. Raw Three.js in a `useEffect` is simpler, lighter, and gives direct control over the animation loop and uniform updates.

### No next/font

This is a Vite project, not Next.js. Fonts are loaded via Google Fonts `<link>` tags (Inter, Instrument Serif) and the `geist` npm package CSS import. No font optimization library needed.
