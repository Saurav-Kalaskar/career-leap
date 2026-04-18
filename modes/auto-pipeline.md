# Mode: auto-pipeline - Full Automatic Pipeline

When user drops a JD (text or URL) without explicit sub-command, run the full sequence.

## Step 0 - JD Extraction

If input is URL:
1. Playwright first (best for ATS SPAs).
2. WebFetch fallback.
3. WebSearch last resort.

If extraction fails, ask user to paste JD text or share screenshot.

If input is JD text, use directly.

## Step 1 - Evaluation A-G

Run exactly as `modes/offer.md`.

## Step 2 - Save Report

Write full evaluation to:
`reports/{###}-{company-slug}-{YYYY-MM-DD}.md`

Include Block G and add `Legitimacy` in report header.

## Step 3 - Generate PDF

Run full pipeline from `modes/pdf.md`.

## Step 4 - Draft Application Answers (score >= 4.5)

If score >= 4.5:
1. Extract form questions via Playwright.
2. If unavailable, use default common questions.
3. Generate concise tailored answers.
4. Save in report section `H) Draft Application Answers`.

### Tone Rules

- Confident and specific.
- Evidence over claims.
- Concise and direct (2-4 sentences).
- Real references to JD + candidate proof points.
- Generate in JD language (EN default).

## Step 5 - Update Tracker

Append/update `data/applications.md` with report + PDF status.

If any step fails, continue pipeline and mark failed step as pending follow-up.
