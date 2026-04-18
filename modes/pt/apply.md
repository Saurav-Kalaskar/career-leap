# Mode: apply - Live Application Assistant

Interactive mode for filling job application forms in real time.

## Requirements

- Best with visible Playwright session.
- Without Playwright, user can share screenshots or paste questions.

## Workflow

1. Detect the active job page.
2. Identify company and role.
3. Look up an existing report in `reports/`.
4. Load report context (including Section G if present).
5. Detect role mismatch and warn/adapt.
6. Extract all visible form questions.
7. Generate tailored answers.
8. Present copy-paste-ready outputs.

## Form Question Types

- Free text fields (cover letter, motivation, etc.)
- Dropdowns (authorization, referral source, etc.)
- Yes/No fields (relocation, visa, etc.)
- Salary fields
- Upload fields (resume, cover letter)

## Answering Rules

- Use report evidence first (proof points + STAR stories).
- Reuse Section G draft answers when available.
- Keep the "I'm choosing you" tone: confident, specific, concise.
- Reference concrete role/company details from the job post.
- Avoid generic fluff.

## Output Format

```markdown
## Answers for [Company] - [Role]

Based on: Report #NNN | Score: X.X/5 | Archetype: [type]

### 1. [Exact form question]
> [Answer]

### 2. [Next question]
> [Answer]
```

## Post-Apply

If user confirms submission:
1. Update `data/applications.md` status from `Evaluated` to `Applied`.
2. Save final form answers into report Section H/G as appropriate.
3. Suggest next step: `/career-ops contact` for LinkedIn outreach.
