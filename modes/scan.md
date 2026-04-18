# Mode: scan - Portal Scanner (Job Discovery)

Scan configured job portals, filter by title relevance, and add new openings into the evaluation pipeline.

## Recommended execution

Run as a subagent to preserve main-context budget:

```text
Agent(
    subagent_type="general-purpose",
    prompt="[content of this file + specific runtime data]",
    run_in_background=True
)
```

## Configuration

Read `portals.yml`:
- `search_queries`: WebSearch queries with `site:` filters
- `tracked_companies`: specific target companies with direct `careers_url`
- `title_filter`: positive/negative/seniority_boost title keywords

## Discovery strategy (3 levels)

### Level 1 - Direct Playwright (PRIMARY)

For each enabled company in `tracked_companies`:
- Navigate to `careers_url` with Playwright
- Extract all visible listings (title + URL + company)
- Handle pagination and relevant filter tabs

Why primary:
- Real-time rendering
- Works for ATS SPAs (Ashby, Lever, Workday)
- Not dependent on search indexing lag

Every tracked company should have `careers_url` in `portals.yml`.

### Level 2 - ATS APIs / feeds (COMPLEMENTARY)

Use APIs/feeds when available for speed and consistency.

Supported patterns:
- Greenhouse: `https://boards-api.greenhouse.io/v1/boards/{company}/jobs`
- Ashby: `https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobBoardWithTeams`
- BambooHR list/detail:
  - `https://{company}.bamboohr.com/careers/list`
  - `https://{company}.bamboohr.com/careers/{id}/detail`
- Lever: `https://api.lever.co/v0/postings/{company}?mode=json`
- Teamtailor RSS: `https://{company}.teamtailor.com/jobs.rss`
- Workday: `https://{company}.{shard}.myworkdayjobs.com/wday/cxs/{company}/{site}/jobs`

Parser conventions:
- `greenhouse`: `jobs[]` -> `title`, `absolute_url`
- `ashby`: `jobBoard.jobPostings[]` -> `title`, `id` (+construct URL if missing)
- `bamboohr`: list gives metadata; fetch detail to read full JD from `result.jobOpening`
- `lever`: root array -> `text`, `hostedUrl` (or `applyUrl` fallback)
- `teamtailor`: RSS items -> `title`, `link`
- `workday`: `jobPostings[]` -> `title`, `externalPath` or built URL

### Level 3 - WebSearch queries (BROAD DISCOVERY)

Run enabled `search_queries` to discover new companies or listings not yet tracked.

Execution priority:
1. Level 1 (Playwright)
2. Level 2 (API/feed)
3. Level 3 (WebSearch)

Results are additive and then deduplicated.

## Workflow

1. Read `portals.yml`.
2. Read `data/scan-history.tsv`.
3. Read dedup sources: `data/applications.md` + `data/pipeline.md`.

4. Level 1 scan (parallel in batches of 3-5 companies):
   - Navigate and snapshot each `careers_url`
   - Extract listings
   - Follow pagination
   - If `careers_url` fails, use fallback query and flag URL update needed

5. Level 2 scan (parallel):
   - Fetch each configured API/feed
   - Use provider parser (explicit `api_provider` or inferred by domain)
   - For Ashby use GraphQL `ApiJobBoardWithTeams`
   - For BambooHR enrich relevant entries with detail endpoint
   - For Workday POST with pagination offset

6. Level 3 scan (parallel where possible):
   - Execute each enabled query
   - Extract normalized `{title, url, company}`

7. Title filtering from `title_filter`:
   - At least one positive keyword present
   - No negative keyword present
   - Seniority boost affects ordering, not eligibility

8. Deduplicate against:
   - Exact URL in `scan-history.tsv`
   - Normalized company+role already in `applications.md`
   - Exact URL already in `pipeline.md`

8.5. Liveness check for Level 3 URLs (required before adding):

WebSearch links can be stale. For each new Level 3 URL, sequentially:
- `browser_navigate`
- `browser_snapshot`
- Classify:
  - **Active**: role title + substantive JD + visible apply control in main content
  - **Expired** if any of:
    - final URL contains `?error=true` (common Greenhouse closed pattern)
    - content includes: "job no longer available", "position has been filled", "this job has expired", "page not found"
    - only shell page (nav/footer) with no meaningful JD content

If expired: mark `skipped_expired` in history and discard.

If navigate fails (timeout, 403, etc.): mark `skipped_expired` and continue.

9. For each verified new listing that passes filters:
   - Add to `pipeline.md` pending section:
     `- [ ] {url} | {company} | {title}`
   - Log in `scan-history.tsv` as `added`

10. Log filtered titles as `skipped_title`.
11. Log duplicates as `skipped_dup`.
12. Log expired listings as `skipped_expired`.

## Title and company extraction from WebSearch results

Common formats:
- `Job Title @ Company`
- `Job Title | Company`
- `Job Title - Company`
- `Job Title at Company`

Regex guideline:
`(.+?)(?:\s*[@|—–-]\s*|\s+at\s+)(.+?)$`

## Private URL handling

If listing URL is not publicly accessible:
1. Save JD text to `jds/{company}-{role-slug}.md`
2. Add pipeline entry:
   `- [ ] local:jds/{company}-{role-slug}.md | {company} | {title}`

## Scan history format

`data/scan-history.tsv` should track all seen URLs:

```text
url\tfirst_seen\tportal\ttitle\tcompany\tstatus
https://...\t2026-02-10\tAshby - AI PM\tPM AI\tAcme\tadded
https://...\t2026-02-10\tGreenhouse - SA\tJunior Dev\tBigCo\tskipped_title
https://...\t2026-02-10\tAshby - AI PM\tSA AI\tOldCo\tskipped_dup
https://...\t2026-02-10\tWebSearch - AI PM\tPM AI\tClosedCo\tskipped_expired
```

## Output summary

```text
Portal Scan - {YYYY-MM-DD}
━━━━━━━━━━━━━━━━━━━━━━━━━━
Queries executed: N
Listings found: N total
Title-relevant: N
Duplicates: N
Expired discarded: N
New added to pipeline.md: N

  + {company} | {title} | {query_name}
  ...

-> Run /career-ops pipeline to evaluate new listings.
```

## careers_url management

Every tracked company should include direct `careers_url`.

Known ATS URL patterns:
- Ashby: `https://jobs.ashbyhq.com/{slug}`
- Greenhouse: `https://job-boards.greenhouse.io/{slug}` or `...eu...`
- Lever: `https://jobs.lever.co/{slug}`
- BambooHR list/detail endpoints
- Teamtailor: `https://{company}.teamtailor.com/jobs`
- Workday: `https://{company}.{shard}.myworkdayjobs.com/{site}`
- Custom: company-hosted careers page

If missing `careers_url`:
1. Try known ATS pattern
2. Fallback WebSearch: `"{company}" careers jobs`
3. Validate with Playwright
4. Save in `portals.yml`

If `careers_url` breaks (404/redirect):
1. Mention in scan summary
2. Fallback to `scan_query`
3. Flag for config update

## portals.yml maintenance

- Always persist discovered `careers_url`
- Add or disable queries based on signal/noise
- Tune `title_filter` as target roles evolve
- Add/remove tracked companies intentionally
- Re-validate `careers_url` periodically (ATS providers change)
