import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '..', 'all-pages.json');

const base = 'https://ami.wikipedia.org/w/api.php?action=query&list=allpages&aplimit=500&format=json';
let continueParam = '';
const all = [];

while (true) {
  const url = continueParam ? `${base}&apcontinue=${encodeURIComponent(continueParam)}` : base;
  const res = await fetch(url);
  const data = await res.json();
  const pages = data.query.allpages;
  all.push(...pages.map(p => p.title));
  process.stdout.write(`\r抓取中... ${all.length} 筆`);
  if (!data.continue) break;
  continueParam = data.continue.apcontinue;
}

fs.writeFileSync(outPath, JSON.stringify(all, null, 2), 'utf8');
console.log(`\n✓ 完成，共 ${all.length} 筆 → all-pages.json`);
