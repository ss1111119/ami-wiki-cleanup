import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, '..', 'categories', 'index.html');
const pagesPath = path.join(__dirname, '..', 'all-pages.json');

const pages = new Set(JSON.parse(fs.readFileSync(pagesPath, 'utf8')));
let html = fs.readFileSync(htmlPath, 'utf8');

// For each tag, try replacing straight apostrophes with curly ones to match wiki titles
const tagRe = /(<span class="tag">)([^<]+)(<\/span>)/g;
let fixed = 0;

html = html.replace(tagRe, (match, open, text, close) => {
  const wikiName = text.trim().replace(/[一-鿿＀-￯（-）　-〿（）()【】]+/g, '').trim();
  if (!wikiName || pages.has(wikiName)) return match;

  // Try replacing straight apostrophe U+0027 with curly U+2019
  const curly = wikiName.replace(/'/g, '’');
  if (pages.has(curly)) {
    const newText = text.replace(/'/g, '’');
    fixed++;
    console.log(`Fixed: "${wikiName}" → "${curly}"`);
    return `${open}${newText}${close}`;
  }

  return match;
});

fs.writeFileSync(htmlPath, html, 'utf8');
console.log(`\n✓ 修正 apostrophe：${fixed} 筆`);
