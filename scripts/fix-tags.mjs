import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, '..', 'categories', 'index.html');
const pages = new Set(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'all-pages.json'), 'utf8')));

// Build case-insensitive lookup: lowercase → exact wiki title
const caseMap = new Map();
for (const p of pages) caseMap.set(p.toLowerCase(), p);

let html = fs.readFileSync(htmlPath, 'utf8');

const tagRe = /(<span class="tag">)([^<]+)(<\/span>)/g;
let fixed = 0, notFound = 0;

html = html.replace(tagRe, (match, open, text, close) => {
  const wikiName = text.trim().replace(/[一-鿿＀-￯（）()【】]+/g, '').trim();
  if (!wikiName) return match;

  // Already correct
  if (pages.has(wikiName)) return match;

  // Try case-insensitive match
  const correct = caseMap.get(wikiName.toLowerCase());
  if (correct) {
    // Replace only the wikiName part, keep Chinese annotations
    const newText = text.replace(wikiName, correct);
    fixed++;
    return `${open}${newText}${close}`;
  }

  // Not fixable automatically
  notFound++;
  return match;
});

fs.writeFileSync(htmlPath, html, 'utf8');
console.log(`✓ 自動修正：${fixed} 筆`);
console.log(`✗ 無法自動修正（wiki 上不存在）：${notFound} 筆`);
