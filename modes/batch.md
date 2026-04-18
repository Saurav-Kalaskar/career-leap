# Mode: batch - Bulk Offer Processing

Two execution styles:
- Conductor mode (`claude --chrome --dangerously-skip-permissions`)
- Standalone script mode for pre-collected URLs

## Architecture

- Conductor navigates portals in real time.
- For each offer, spawn clean worker (`claude -p`) with `batch/batch-prompt.md`.
- Worker returns report, PDF, tracker addition, and structured result.
- Conductor merges tracker additions at the end.

## Files

```text
batch/
  batch-input.tsv
  batch-state.tsv
  batch-runner.sh
  batch-prompt.md
  logs/
  tracker-additions/
```

## Conductor Mode

1. Read `batch-state.tsv`.
2. Navigate portal in Chrome.
3. Extract offer URLs and append to `batch-input.tsv`.
4. For each pending URL:
   - Open listing
   - Extract JD from DOM
   - Compute next report number
   - Invoke worker with JD path + URL + report number
   - Update state/logs
5. Continue pagination.
6. Merge tracker additions.

## Standalone Mode

```bash
batch/batch-runner.sh [--dry-run] [--retry-failed] [--start-from N] [--parallel N] [--max-retries N]
```

## Resumability

- Completed IDs are skipped on rerun.
- PID lock prevents double execution.
- Worker failures are isolated per offer.

## Error Strategy

- Inaccessible URL -> mark failed and continue.
- Login-only JD -> mark failed and continue.
- Worker crash -> retry using `--retry-failed`.
- PDF failure -> keep report, flag PDF pending.
