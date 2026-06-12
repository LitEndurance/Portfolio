# Skills

This directory contains reusable agent skills synced from the global workspace cache.

## How skills get here

1. Add a skill repo to the global cache (one time):
   ```bash
   ./scripts/workspace add mattpocock/skills
   ```

2. Declare it in `workspace.json`:
   ```json
   { "skills": ["mattpocock-skills"] }
   ```

3. Sync it into this project:
   ```bash
   ./scripts/workspace sync
   ```

## Active skills

See `workspace.json` for the current list. To check cached/synced status:

```bash
./scripts/workspace status
```

> Do not edit files in this directory directly — they are overwritten on sync. If a skill needs project-specific tuning, copy the relevant prompt into `docs/` or `AGENTS.md` instead.
