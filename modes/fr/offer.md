# Mode: offer - Full Evaluation A-G

When the candidate shares a job post (text or URL), ALWAYS deliver all 7 blocks (A-F evaluation + G legitimacy).

## Step 0 - Archetype Detection

Classify the role into one of the 6 archetypes (see `_shared.md`). If hybrid, list the 2 closest.
This determines:
- Which proof points to prioritize in Block B
- How to rewrite summary in Block E
- Which STAR stories to prepare in Block F

## Block A - Role Summary

Create a table with:
- Detected archetype
- Domain (platform/agentic/LLMOps/ML/enterprise)
- Function (build/consult/manage/deploy)
- Seniority
- Remote model (full/hybrid/onsite)
- Team size (if mentioned)
- One-line TL;DR

## Block B - CV Match

Read `cv.md`. Build a table mapping each JD requirement to exact evidence in the CV.

**Archetype-adapted emphasis:**
- FDE: fast delivery and client-facing proof points
- SA: systems design and integrations
- PM: product discovery and metrics
- LLMOps: evals, observability, pipelines
- Agentic: multi-agent, HITL, orchestration
- Transformation: change management, adoption, scaling

Add a **gaps** section with mitigation strategy for each gap. For each gap answer:
1. Hard blocker or nice-to-have?
2. Can adjacent experience cover it?
3. Is there a portfolio project that can close it?
4. Concrete mitigation plan (cover-letter line, quick project, interview framing)

## Block C - Level and Strategy

1. Detected level in JD vs candidate's natural level for this archetype
2. "Sell senior without lying" plan: specific phrasing, concrete achievements, founder background framing
3. "If down-leveled" plan: compensation floor, 6-month review negotiation, explicit promotion criteria

## Block D - Compensation and Demand

Use WebSearch for:
- Current salary ranges (Glassdoor, Levels.fyi, Blind)
- Company compensation reputation
- Market demand trend for this role

Provide table with cited sources. If data is missing, state that explicitly.

## Block E - Personalization Plan

| # | Section | Current State | Proposed Change | Why |
|---|---------|---------------|-----------------|-----|

Include top 5 CV changes and top 5 LinkedIn changes to maximize fit.

## Block F - Interview Plan

Create 6-10 STAR+R stories mapped to JD requirements (STAR + **Reflection**):

| # | JD Requirement | STAR+R Story | S | T | A | R | Reflection |
|---|----------------|--------------|---|---|---|---|------------|

Reflection should capture learning/trade-offs, not just outcomes.

**Story Bank:** If `interview-prep/story-bank.md` exists, reuse or append stories so it evolves into a reusable master bank.

**Archetype framing:**
- FDE: speed and client ownership
- SA: architecture decisions
- PM: discovery and trade-offs
- LLMOps: metrics, evals, production hardening
- Agentic: orchestration, error handling, HITL
- Transformation: adoption and organizational change

Also include:
- 1 recommended case study project and presentation framing
- Red-flag questions and response strategy (for example: "Why did you sell your company?", "Have you managed direct reports?")

## Block G - Posting Legitimacy

Analyze whether the job post appears real and active so the candidate can prioritize effort.

Present observations, not accusations. Every signal can have benign explanations.

### Signals (in order):

**1. Posting Freshness**
- Date posted / "X days ago"
- Apply button state (active/closed/missing/generic redirect)
- Redirect behavior to generic careers page

**2. Description Quality**
- Specific technologies/frameworks/tools listed
- Team/org context provided
- Realistic requirements (experience years vs tech age)
- Scope for first 6-12 months
- Compensation transparency
- Role-specific content vs boilerplate ratio
- Internal contradictions

**3. Company Hiring Signals**
- Search `"{company}" layoffs {year}`
- Search `"{company}" hiring freeze {year}`
- Check whether affected teams overlap this role

**4. Reposting Detection**
- Check `scan-history.tsv` for similar company + role over time

**5. Role Market Context**
- Typical fill time for this role type
- Business relevance for company stage
- Seniority-level expected time-to-fill

### Output format

**Assessment tier:**
- `High Confidence`
- `Proceed with Caution`
- `Suspicious`

Provide:
- Signals table with finding + weight (Positive/Neutral/Concerning)
- Context notes and caveats

### Edge cases

- Government/academic: longer cycles are normal
- Evergreen roles: mark as continuous pipeline role
- Niche executive roles: may stay open for months legitimately
- Early startups: vague descriptions may be expected
- No posting date: default to `Proceed with Caution` if no other concerns
- Recruiter-sourced role: active recruiter contact is a positive legitimacy signal

## Post-Evaluation

ALWAYS after blocks A-G:

### 1. Save report

Save full evaluation to:
`reports/{###}-{company-slug}-{YYYY-MM-DD}.md`

- `{###}` = next 3-digit zero-padded sequence
- `{company-slug}` = lowercase, hyphenated
- `{YYYY-MM-DD}` = current date

Report template:

```markdown
# Evaluation: {Company} - {Role}

**Date:** {YYYY-MM-DD}
**Archetype:** {detected}
**Score:** {X/5}
**Legitimacy:** {High Confidence | Proceed with Caution | Suspicious}
**PDF:** {path or pending}

---

## A) Role Summary
(full Block A)

## B) CV Match
(full Block B)

## C) Level and Strategy
(full Block C)

## D) Compensation and Demand
(full Block D)

## E) Personalization Plan
(full Block E)

## F) Interview Plan
(full Block F)

## G) Posting Legitimacy
(full Block G)

## H) Draft Application Answers
(only if score >= 4.5)

---

## Extracted Keywords
(15-20 JD keywords for ATS optimization)
```

### 2. Update tracker

ALWAYS append/update `data/applications.md` with:
- Next sequence number
- Current date
- Company
- Role
- Score (1-5)
- Status: `Evaluated`
- PDF: `❌` (or `✅` if generated)
- Report link (for example `[001](reports/001-company-2026-01-01.md)`)

Tracker columns:

```markdown
| # | Date | Company | Role | Score | Status | PDF | Report |
```
