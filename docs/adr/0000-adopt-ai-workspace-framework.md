# ADR-0000: Adopt AI Workspace Initializer Framework

## Status

- Accepted

## Context

We want AI-assisted development on this portfolio to be productive without becoming chaotic. The project has complex, tightly-coupled parts: a custom Three.js scene, GSAP scroll animations, and a gamified climb state machine. Without shared conventions and guardrails, agents can easily:

- Misname concepts (e.g., calling zones "sections")
- Skip cleanup in Three.js / GSAP effects
- Commit placeholder text or temporary AI markers
- Forget to document architectural decisions

## Decision

Adopt the **AI Workspace Initializer** framework from `C:\Users\willb\OneDrive\Documents\initialize-workspace-endurance`, focusing on the **Hands-On / Pair Programming** and **Balanced / Skills-Based** modes:

1. Maintain a short `AGENTS.md` project brief.
2. Keep a living `docs/CONTEXT.md` ubiquitous-language glossary.
3. Record architectural decisions in `docs/adr/`.
4. Install git hooks via `.githooks/` that block `[FILL]` markers, AI temporary markers, large files, trailing whitespace, `.env` files, and vague commit messages.
5. Use `scripts/workspace` to deduplicate skill repos across projects, synced by `workspace.json`.

We intentionally **do not** enable Autonomous / Agent Orchestration mode. This codebase is small, personal, and visually precise; a human must review every diff.

## Consequences

- Easier: onboarding any agent, consistent terminology, safer commits, reusable skills.
- Harder: an extra file to keep updated; hooks can be bypassed with `--no-verify`.
- Accepted trade-off: the framework adds files to the repo root. We keep them minimal and cross-reference rather than duplicate information.

## Alternatives Considered

| Alternative | Why rejected |
|-------------|--------------|
| No framework, ad-hoc prompts | Leads to inconsistent output and repeated context loss. |
| Full autonomous orchestration (e.g., OpenHands) | Overkill for a personal portfolio; visual polish requires human review. |
| Only hands-on tools (Aider, Continue) | Missing reusable conventions and shared language that `AGENTS.md`/`CONTEXT.md` provide. |
