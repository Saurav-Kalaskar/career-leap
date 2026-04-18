# Mode: pdf - ATS-Optimized PDF Generation

## Full pipeline

1. Read `cv.md` as source of truth
2. Ask user for JD if missing (text or URL)
3. Extract 15-20 JD keywords
4. Detect JD language -> CV language (EN default)
5. Detect company location -> paper format:
   - US/Canada -> `letter`
   - Rest of world -> `a4`
6. Detect role archetype -> adapt framing
7. Rewrite Professional Summary with JD keywords + transition bridge
8. Select top 3-4 most relevant projects
9. Reorder experience bullets by JD relevance
10. Build competency grid from JD requirements (6-8 phrases)
11. Inject keywords naturally into real achievements (never fabricate)
12. Generate full HTML from template + tailored content
13. Read `name` from `config/profile.yml`, normalize to kebab-case -> `{candidate}`
14. Write HTML to `/tmp/cv-{candidate}-{company}.html`
15. Run:
   `node generate-pdf.mjs /tmp/cv-{candidate}-{company}.html output/cv-{candidate}-{company}-{YYYY-MM-DD}.pdf --format={letter|a4}`
16. Report output path, page count, and keyword coverage

## ATS parsing rules

- Single-column layout (no sidebars / parallel columns)
- Standard headers: Professional Summary, Work Experience, Education, Skills, Certifications, Projects
- No text-in-image/SVG for critical information
- No critical content in PDF header/footer
- UTF-8 and selectable text (not rasterized)
- Avoid nested tables
- Distribute keywords across summary, early bullets, and skills

## PDF design

- Fonts: Space Grotesk (headings) + DM Sans (body)
- Self-hosted fonts from `fonts/`
- Header: large name + 2px gradient rule + contact row
- Section headers: uppercase, tracked letters, cyan primary
- Body: 11px, line-height 1.5
- Company names: accent purple
- Margins: 0.6in
- Background: pure white

## Section order (6-second scan optimization)

1. Header
2. Professional Summary
3. Core Competencies
4. Work Experience
5. Projects
6. Education & Certifications
7. Skills

## Keyword injection strategy (truthful)

Examples:
- JD: "RAG pipelines" and CV: "retrieval workflows" -> "RAG pipeline design and retrieval orchestration"
- JD: "MLOps" and CV: "evals, observability" -> "MLOps and observability"
- JD: "stakeholder management" and CV: "cross-functional collaboration" -> aligned terminology

Never add skills the candidate does not have.

## HTML template placeholders

Use `templates/cv-template.html` and replace:

| Placeholder | Content |
|-------------|---------|
| `{{LANG}}` | `en` or `es` |
| `{{PAGE_WIDTH}}` | `8.5in` (letter) or `210mm` (A4) |
| `{{NAME}}` | from profile.yml |
| `{{PHONE}}` | include only when non-empty |
| `{{EMAIL}}` | from profile.yml |
| `{{LINKEDIN_URL}}` | from profile.yml |
| `{{LINKEDIN_DISPLAY}}` | from profile.yml |
| `{{PORTFOLIO_URL}}` | from profile.yml |
| `{{PORTFOLIO_DISPLAY}}` | from profile.yml |
| `{{LOCATION}}` | from profile.yml |
| `{{SECTION_SUMMARY}}` | localized section label |
| `{{SUMMARY_TEXT}}` | tailored summary |
| `{{SECTION_COMPETENCIES}}` | localized section label |
| `{{COMPETENCIES}}` | competency tags |
| `{{SECTION_EXPERIENCE}}` | localized section label |
| `{{EXPERIENCE}}` | experience HTML |
| `{{SECTION_PROJECTS}}` | localized section label |
| `{{PROJECTS}}` | projects HTML |
| `{{SECTION_EDUCATION}}` | localized section label |
| `{{EDUCATION}}` | education HTML |
| `{{SECTION_CERTIFICATIONS}}` | localized section label |
| `{{CERTIFICATIONS}}` | certifications HTML |
| `{{SECTION_SKILLS}}` | localized section label |
| `{{SKILLS}}` | skills HTML |

## Canva CV generation (optional)

If `config/profile.yml` has `canva_resume_design_id`, offer:
- `HTML/PDF (fast, ATS-optimized)`
- `Canva CV (visual, design-preserving)`

If no Canva design id is configured, run HTML/PDF flow by default.

### Canva workflow

#### Step 1 - Duplicate base design

1. Export base design as PDF
2. Import from URL to create editable duplicate
3. Store new duplicate `design_id`

#### Step 2 - Parse design structure

1. `get-design-content` on duplicate
2. Map text elements to CV sections by pattern matching
3. If mapping fails, show findings and ask for guidance

#### Step 3 - Generate tailored replacement content

Use same tailoring logic as HTML flow.

**Character budget rule:** each replacement should stay within +/-15% of original element character count to prevent overlap.

#### Step 4 - Apply edits

1. Start editing transaction
2. Replace text sections
3. Reflow layout by repositioning affected section blocks
4. Validate with design thumbnail
5. Iterate fixes until clean
6. Ask user approval
7. Commit transaction

#### Step 5 - Export and download PDF

1. Export duplicate as PDF (letter or a4)
2. Immediately download presigned URL:
   `curl -sL -o "output/cv-{candidate}-{company}-canva-{YYYY-MM-DD}.pdf" "{download_url}"`
3. Verify file type:
   `file output/cv-{candidate}-{company}-canva-{YYYY-MM-DD}.pdf`
4. Report output path, file size, and design URL

## Error handling

- Import failure -> fallback to HTML/PDF flow
- Mapping failure -> request manual mapping
- Replacement miss -> widen matching rules
- Always share design URL for manual final edits

## Post-generation

If role exists in tracker, update PDF status from `❌` to `✅`.
