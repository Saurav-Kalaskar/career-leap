import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import https from 'https';
import { URL, fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readFile(p) {
  return fs.readFileSync(p, 'utf8');
}

// ------- 0. Utility helpers -------------------------------------------------
/**
 * Count non‑whitespace characters in a string.
 */
function charCount(text) {
  return text.replace(/\s/g, '').length;
}

/**
 * Strip predefined fluff adverbs from a sentence.
 */
const FLUFF_WORDS = new Set([
  'successfully','effectively','rapidly','efficiently','seamlessly','proactively',
  'extremely','very','quite','rather','somewhat','basically','actually','simply',
  'just','really','clearly','obviously','certainly','definitely','truly','highly'
]);
function stripFluff(text) {
  return text.replace(new RegExp(`\\b(${[...FLUFF_WORDS].join('|')})\\b\\s*`, 'gi'), '');
}

/**
 * Preserve numeric metrics by replacing them with placeholders.
 * Returns an object {clean, placeholders} where `clean` is the text with placeholders,
 * and `placeholders` maps placeholder => original metric.
 */
function preserveMetricPattern(text) {
  const metricRegex = /([\$]?\d+[\d,.]*%?|\d+\s?(?:k|K|m|M|b|B)?)/g;
  const placeholders = {};
  let idx = 0;
  const clean = text.replace(metricRegex, (match) => {
    const key = `__METRIC${idx}__`;
    placeholders[key] = match;
    idx += 1;
    return key;
  });
  return { clean, placeholders };
}

/**
 * Restore metric placeholders back to their original values.
 */
function restorePlaceholders(text, placeholders) {
  let restored = text;
  for (const [key, val] of Object.entries(placeholders)) {
    restored = restored.split(key).join(val);
  }
  return restored;
}

/**
 * Build a simple term‑mapping from JD to translate legacy domain words.
 * Returns an object {legacyTerm: jdTerm, ...}.
 */
function buildTermMap(jdText) {
  // crude noun extraction: capitalised words or phrases (allow spaces)
  const nounCandidates = jdText.match(/\b[A-Z][a-z0-9&]+(?:\s+[A-Z][a-z0-9&]+)*\b/g) || [];
  const freq = {};
  nounCandidates.forEach(n => { freq[n] = (freq[n] || 0) + 1; });
  const topNouns = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,10).map(e=>e[0]);
  // hard‑coded legacy terms list (extendable)
  const legacy = ['platform','pipeline','stack','toolchain','framework','module','feature'];
  const map = {};
  legacy.forEach(l => {
    // pick the JD term that contains the legacy term as substring, else fallback to first top noun
    const match = topNouns.find(t => t.toLowerCase().includes(l)) || topNouns[0];
    if (match) map[l] = match;
  });
  return map;
}

/**
 * Replace legacy terms in a text using the termMap.
 */
function translateDomainTerms(text, termMap) {
  let result = text;
  for (const [legacy, jdTerm] of Object.entries(termMap)) {
    const re = new RegExp(`\\b${legacy}\\b`, 'gi');
    result = result.replace(re, jdTerm);
  }
  return result;
}

/**
 * Apply bold tags to a set of keywords within a bullet, respecting a global budget.
 * Returns {text, used} where `used` is the updated global count.
 */
function applyBoldBudget(bullet, candidateKeywords, globalState, maxBudget = 12) {
  let remaining = maxBudget - globalState.used;
  if (remaining <= 0) return { text: bullet, used: globalState.used };
  // aim for 2‑4 bolds per Experience bullet, but never exceed remaining
  const desired = Math.min(4, Math.max(2, remaining));
  const toBold = candidateKeywords.slice(0, desired);
  let result = bullet;
  const usedNow = new Set();
  toBold.forEach(kw => {
    if (globalState.used >= maxBudget) return; // safety
    const re = new RegExp(`(${kw})`, 'gi');
    if (re.test(result) && !usedNow.has(kw.toLowerCase())) {
      result = result.replace(re, '\\textbf{$1}');
      globalState.used += 1;
      usedNow.add(kw.toLowerCase());
    }
  });
  return { text: result, used: globalState.used };
}

/**
 * Trim or pad a bullet to satisfy the 95‑%‑to‑100 % length rule.
 * Returns the adjusted bullet string.
 */
function enforceVolumeFloor(original, rewritten, floor = 0.95) {
  const origLen = charCount(original);
  const rewLen = charCount(rewritten);
  if (rewLen > origLen) {
    // trim excess characters while preserving whole words
    let trimmed = rewritten;
    while (charCount(trimmed) > origLen && trimmed.length > 0) {
      trimmed = trimmed.slice(0, -1).trim();
    }
    return trimmed;
  }
  const minLen = Math.floor(floor * origLen);
  if (rewLen < minLen) {
    // pad by re‑adding stripped fluff (if any) from original
    const deficit = minLen - rewLen;
    // naive padding: repeat a harmless adjective from original until we meet floor
    const adjectives = original.match(/\b(quick|fast|robust|scalable|secure)\b/gi) || [];
    let pad = '';
    let i = 0;
    while (charCount(pad) < deficit && adjectives.length) {
      pad += ' ' + adjectives[i % adjectives.length];
      i += 1;
    }
    return rewritten + pad;
  }
  return rewritten;
}

/**
 * Extract JD keywords (top 15 frequent non‑stop words >3 chars).
 */
function extractKeywords(text, max = 15) {
  const stop = new Set([
    'the','and','with','for','that','you','your','have','this','from','will','are','was','but','not','can','all','any','our','their','there','which','when','who','what','how','why','been','being','into','over','such','than','then','these','those','use','used','using','via','like','also','its','both','each','most','some','more','many','few','one','two','three','four','five','six','seven','eight','nine','ten',
    'job','role','position','candidate','applicant','experience','work','team','company','client','service','business','product','technology','system','development','engineering','design','implementation','management','leadership','communication','problem','solution','architect','developer','engineer','manager','senior','staff','principal','lead','director','vp','cto','cio'
  ]);
  const words = text.toLowerCase().match(/\b[\w']{4,}\b/g) || [];
  const freq = {};
  for (const w of words) if (!stop.has(w)) freq[w] = (freq[w] || 0) + 1;
  return Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0, max).map(e=>e[0]);
}

/**
 * Extract company name from JD URL or text.
 */
function extractCompany(jdText, jdArg) {
  try {
    const u = new URL(jdArg);
    const host = u.hostname.replace('www.', '').split('.');
    const name = host[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch (_) {}
  const matches = jdText.match(/\b([A-Z][A-Za-z0-9&]+)\b/g) || [];
  const freq = {};
  for (const m of matches) freq[m] = (freq[m] || 0) + 1;
  const sorted = Object.entries(freq).sort((a,b)=>b[1]-a[1]);
  return sorted.length ? sorted[0][0] : 'Company';
}

/**
 * Fetch JD content if argument is a URL.
 */
async function fetchJD(arg) {
  if (!arg) return '';
  try {
    const url = new URL(arg);
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
  } catch (_) {
    return arg; // treat as raw text
  }
}

/**
 * Parse cv.md into sections keyed by lower‑cased heading.
 */
function parseCV(content) {
  const lines = content.split('\n');
  const sections = {};
  let current = null;
  for (const line of lines) {
    const headerMatch = line.match(/^##?\s*(.+)$/);
    if (headerMatch) {
      current = headerMatch[1].toLowerCase().trim();
      sections[current] = [];
    } else if (current && line.trim() !== '') {
      sections[current].push(line);
    }
  }
  return sections;
}

/**
 * Process experience bullets with the new directives.
 */
function processExperienceBullets(bullets, keywords, termMap, globalState) {
  // Score bullets by keyword matches
  const scored = bullets.map(bullet => {
    const text = bullet.replace(/^-\s*/, '').trim();
    const lower = text.toLowerCase();
    let score = 0;
    const matched = [];
    for (const kw of keywords) {
      const re = new RegExp(`\\b${kw}\\b`, 'i');
      if (re.test(text)) { score++; matched.push(kw); }
    }
    return { bullet, original: text, score, matched };
  });
  scored.sort((a,b)=>b.score - a.score);

  const processed = scored.map(item => {
    let newBullet = item.original;
    // Preserve metrics
    const {clean, placeholders} = preserveMetricPattern(newBullet);
    // Translate legacy terms
    let translated = translateDomainTerms(clean, termMap);
    // Remove fluff
    translated = stripFluff(translated);
    // Ensure at least one JD keyword
    const hasKeyword = keywords.some(kw => new RegExp(`\\b${kw}\\b`, 'i').test(translated));
    if (!hasKeyword && keywords.length) {
      const kw = keywords[0];
      translated = `${kw.charAt(0).toUpperCase()+kw.slice(1)}: ${translated}`;
    }
    // Enforce volume floor (95‑%‑100%)
    translated = enforceVolumeFloor(item.original, translated, 0.95);
    // Determine which keywords are present for bolding
    const presentKW = keywords.filter(kw => new RegExp(`\\b${kw}\\b`, 'i').test(translated));
    // Apply bold budget (2‑4 per bullet)
    const {text: bolded, used} = applyBoldBudget(translated, presentKW, globalState, 12);
    // Restore metrics
    const final = restorePlaceholders(bolded, placeholders);
    return `- ${final}`;
  });
  return processed;
}

/**
 * Process project sections with same directives, but allocate remaining bold budget.
 */
function processProjects(projectLines, keywords, termMap, globalState) {
  const projects = [];
  let currentTitle = '';
  let currentBullets = [];
  for (const line of projectLines) {
    const titleMatch = line.match(/^###\s+(.+)$/);
    if (titleMatch) {
      if (currentTitle) projects.push({ title: currentTitle, bullets: currentBullets });
      currentTitle = titleMatch[1];
      currentBullets = [];
    } else if (line.trim().startsWith('-') && currentTitle) {
      currentBullets.push(line);
    }
  }
  if (currentTitle) projects.push({ title: currentTitle, bullets: currentBullets });

  const processedProjects = projects.map(proj => {
    const newBullets = proj.bullets.map(bullet => {
      let txt = bullet.replace(/^-\s*/, '').trim();
      const {clean, placeholders} = preserveMetricPattern(txt);
      let translated = translateDomainTerms(clean, termMap);
      translated = stripFluff(translated);
      // Ensure keyword presence
      const hasKeyword = keywords.some(kw => new RegExp(`\\b${kw}\\b`, 'i').test(translated));
      if (!hasKeyword && keywords.length) {
        const kw = keywords[0];
        translated = `${kw.charAt(0).toUpperCase()+kw.slice(1)}: ${translated}`;
      }
      // Volume floor enforcement
      translated = enforceVolumeFloor(txt, translated, 0.95);
      // Bold remaining budget (1‑2 per bullet)
      const presentKW = keywords.filter(kw => new RegExp(`\\b${kw}\\b`, 'i').test(translated));
      const {text: bolded, used} = applyBoldBudget(translated, presentKW, globalState, 12);
      const final = restorePlaceholders(bolded, placeholders);
      return `- ${final}`;
    });
    return { ...proj, bullets: newBullets };
  });

  return { projects: processedProjects, boldCount: globalState.used };
}

// -------------------- Main execution ---------------------------------------
(async () => {
  const jdArg = process.argv.find(a => a !== '--output' && !a.startsWith('-')) || '';
  const jdText = await fetchJD(jdArg);
  if (!jdText) {
    console.error('❌ No JD provided. Pass text or URL as argument.');
    process.exit(1);
  }

  const keywords = extractKeywords(jdText);
  const termMap = buildTermMap(jdText);
  const company = extractCompany(jdText, jdArg);

  console.log(`🎯 Company: ${company}`);
  console.log(`🔑 Keywords (${keywords.length}): ${keywords.join(', ')}`);

  // Load CV and profile
  const cvPath = path.resolve('cv.md');
  if (!fs.existsSync(cvPath)) {
    console.error('❌ cv.md not found');
    process.exit(1);
  }
  const cvContent = readFile(cvPath);

  const profilePath = path.resolve('config/profile.yml');
  const profile = fs.existsSync(profilePath) ? (() => {
    const yaml = readFile(profilePath);
    const lines = yaml.split('\n');
    const data = {};
    for (const line of lines) {
      const match = line.match(/^([^:]+):\s*(.*)$/);
      if (match) data[match[1].trim()] = match[2].trim();
    }
    return data;
  })() : {};

  // Parse sections
  const sections = parseCV(cvContent);

  // Global bold state
  const globalBold = { used: 0 };

  // -------- Experience --------
  let expLines = sections['professional experience'] || sections['experience'] || [];
  if (expLines.length > 0) {
    const bullets = expLines.filter(l => l.trim().startsWith('-'));
    const nonBullets = expLines.filter(l => !l.trim().startsWith('-'));
    const processedBullets = processExperienceBullets(bullets, keywords, termMap, globalBold);
    expLines = [...nonBullets, ...processedBullets];
    sections['professional experience'] = expLines;
  }

  // -------- Projects --------
  let projectsLines = sections['projects'] || [];
  if (projectsLines.length > 0) {
    const { projects: processedProjects } = processProjects(projectsLines, keywords, termMap, globalBold);
    // Reconstruct project lines
    const newProjLines = [];
    for (const proj of processedProjects) {
      newProjLines.push(`### ${proj.title}`);
      newProjLines.push(...proj.bullets);
      newProjLines.push('');
    }
    // Remove trailing blank line
    if (newProjLines.length && newProjLines[newProjLines.length-1] === '') newProjLines.pop();
    sections['projects'] = newProjLines;
  }

  // ------- Assemble LaTeX -------
  const education = sections['education'] ? sections['education'].join('\\\n') : '';
  const skills = sections['skills'] ? sections['skills'].join('\\\n') : '';
  const experience = sections['professional experience'] ? sections['professional experience'].join('\\\n') : '';
  const projects = sections['projects'] ? sections['projects'].join('\\\n') : '';
  const publications = sections['publications'] || sections['publications & virtual internship'] || [];
  const pubsStr = publications.length ? publications.join('\\\n') : '';

  const name = profile.full_name || profile.name || 'Saurav Sunil Kalaskar';

  const templatePath = path.resolve('templates', 'cv-latex.tex');
  if (!fs.existsSync(templatePath)) {
    console.error('❌ templates/cv-latex.tex not found');
    process.exit(1);
  }
  let tex = readFile(templatePath);
  tex = tex.replace(/\\Huge\\textbf\{[^}]+\}/, `\\Huge \\textbf{${name}}`);
  tex = tex.replace('%EDUCATION%', education);
  tex = tex.replace('%SKILLS%', skills);
  tex = tex.replace('%EXPERIENCE%', experience);
  tex = tex.replace('%PROJECTS%', projects);
  if (pubsStr) {
    const pubsSection = `\\section{Publications \\& Virtual Internship}\n\\sectioncontent{\n${pubsStr}\n}`;
    tex = tex.replace('\\end{document}', `${pubsSection}\n\\end{document}`);
  }

  // One‑page character limit check (≤5000)
  const totalChars = charCount(tex);
  if (totalChars > 5000) {
    console.error(`❌ Resume exceeds one‑page limit (${totalChars} characters).`);
    process.exit(1);
  }

  // Output LaTeX inside a markdown code block (no extra text)
  console.log('```latex');
  console.log(tex);
  console.log('```');
})();
