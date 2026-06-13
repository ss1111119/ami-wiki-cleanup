import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(__dirname, '..', 'categories', 'index.html'), 'utf8');
const pages = new Set(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'all-pages.json'), 'utf8')));

// 同 JS 邏輯：移除中文字，取 wiki 條目名
const tagRe = /class="tag"[^>]*>([^<]+)<\/span>/g;
const missing = [], ok = [];

for (const m of html.matchAll(tagRe)) {
  const text = m[1].trim();
  const wikiName = text.replace(/[一-鿿＀-￯（）()【】]+/g, '').trim();
  if (!wikiName) continue;
  if (pages.has(wikiName)) {
    ok.push(wikiName);
  } else {
    missing.push({ tag: text, wikiName });
  }
}

console.log(`✓ 正確：${ok.length} 筆`);
console.log(`✗ 找不到：${missing.length} 筆\n`);
missing.forEach(m => {
  // 找大小寫相近的
  const similar = [...pages].find(p => p.toLowerCase() === m.wikiName.toLowerCase());
  console.log(`  ✗ "${m.wikiName}"${similar ? `  →  應為 "${similar}"` : '  （wiki 上不存在）'}`);
});
