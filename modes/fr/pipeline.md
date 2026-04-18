# Mode: pipeline - URL Inbox (Second Brain)

Process accumulated job URLs from `data/pipeline.md`.

## Workflow

1. Read unchecked `- [ ]` entries in the `Pending` section.
2. For each pending URL:
   a. Compute next report number from `reports/`.
   b. Extract JD (Playwright -> WebFetch -> WebSearch fallback).
   c. If inaccessible, mark `- [!]` with reason and continue.
   d. Run full auto-pipeline: evaluation -> report -> PDF (if score >= 3.0) -> tracker update.
   e. Move item to `Processed` as `- [x] #NNN | URL | Company | Role | Score/5 | PDF ✅/❌`.
3. If 3+ items pending, parallelize with agents.
4. Show final summary table.

## Format

```markdown
## Pending
- [ ] https://...

## Processed
- [x] #143 | https://... | Company | Role | 4.2/5 | PDF ✅
```

## URL Handling

- LinkedIn may require login -> mark `[!]` and request pasted JD.
- PDF URL -> read directly.
- `local:` prefix -> read local file path.

## Preflight

Run:

```bash
node cv-sync-check.mjs
```

If sync fails, warn before continuing.
