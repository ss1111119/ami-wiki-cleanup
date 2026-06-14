import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(__dirname, '..', 'categories', 'index.html'), 'utf8');
const pages = new Set(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'all-pages.json'), 'utf8')));

const missing = [], ok = [];

// Match spans with optional data-title attribute
// 1) <span class="tag" data-title="...">...</span>  — use data-title directly
// 2) <span class="tag">plain text</span>             — strip Chinese, derive title
const dtRe = /class="tag"[^>]*\bdata-title="([^"]+)"/g;
// Only match spans WITHOUT data-title (hand-written sections)
const plainRe = /class="tag"(?![^>]*\bdata-title)[^>]*>([^<]+)<\/span>/g;

const seen = new Set();

for (const m of html.matchAll(dtRe)) {
  const title = m[1];
  if (seen.has(title)) continue;
  seen.add(title);
  if (pages.has(title)) ok.push(title);
  else missing.push({ tag: title, wikiName: title });
}

for (const m of html.matchAll(plainRe)) {
  const text = m[1].trim();
  const wikiName = text.replace(/[一-鿿＀-￯（）()【】]+/g, '').trim();
  if (!wikiName) continue;
  if (seen.has(wikiName)) continue;
  seen.add(wikiName);
  if (pages.has(wikiName)) ok.push(wikiName);
  else missing.push({ tag: text, wikiName });
}

console.log(`✓ 正確：${ok.length} 筆`);
console.log(`✗ 找不到：${missing.length} 筆\n`);
missing.forEach(m => {
  const similar = [...pages].find(p => p.toLowerCase() === m.wikiName.toLowerCase());
  console.log(`  ✗ "${m.wikiName}"${similar ? `  →  應為 "${similar}"` : '  （wiki 上不存在）'}`);
});
