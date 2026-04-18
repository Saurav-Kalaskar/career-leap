# Mode: deep - Deep Research Prompt

Generate a structured research prompt for Perplexity/Claude/ChatGPT using these 6 axes:

```markdown
## Deep Research: [Company] - [Role]

Context: I am evaluating an application for [role] at [company]. I need interview-ready, actionable intelligence.

### 1. AI / Product Strategy
- What AI/ML features are in production?
- Which stack is used (models, infra, tooling)?
- Engineering blog and technical publications?
- Relevant papers/talks?

### 2. Recent Moves (last 6 months)
- Key hires in engineering/AI/product?
- Acquisitions/partnerships?
- Product launches/pivots?
- Funding rounds or leadership changes?

### 3. Engineering Culture
- Delivery cadence, CI/CD, ownership model
- Repo and architecture patterns
- Remote vs onsite expectations
- Quality of engineering culture signals (Glassdoor/Blind)

### 4. Probable Challenges
- Scaling, reliability, latency, or cost pain points
- Ongoing migrations (infra/models/platform)
- Recurring issues from public reviews/posts

### 5. Competitors and Differentiation
- Main competitors
- Defensible moat
- Positioning vs alternatives

### 6. Candidate Angle
Given my profile (read `cv.md` + `config/profile.yml`):
- Unique value I bring
- Most relevant projects/proof points
- Best interview narrative
```

Personalize each section with the specific evaluated role context.
