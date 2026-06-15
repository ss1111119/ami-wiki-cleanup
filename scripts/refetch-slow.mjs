/**
 * Slow re-fetch for remaining empty descriptions (batch=25, delay=1000ms).
 */
import fs from 'fs';

const descs = JSON.parse(fs.readFileSync('scripts/wiki-descriptions.json', 'utf8'));
const empty = Object.keys(descs).filter(k => !descs[k]);
console.log(`空白條目：${empty.length} 筆`);

const API = 'https://ami.wikipedia.org/w/api.php';
const BATCH = 25;
const DELAY_MS = 1000;

function extractChinese(text, title) {
  if (!text) return '';
  text = text.replace(/\s+/g, ' ').trim();
  const head = text.slice(0, 500);

  // Pattern A: （中文）or (中文) near start
  const mA = head.match(/[（(]([^（(）)]{1,30}[一-鿿][^（(）)]{0,20})[）)]/);
  if (mA) {
    const inner = mA[1];
    if (/[一-鿿]/.test(inner) && !/[a-z]{3}/i.test(inner.replace(/[一-鿿·、。，！？]/g, ''))) {
      const chinese = inner.replace(/[^一-鿿·]/g, '').trim();
      if (chinese.length >= 2) return chinese;
    }
  }

  // Pattern B: Ripong sowal .../漢字 (Japanese person name format)
  const mB = head.match(/[Rr]ipong sowal[^)）]*\/([一-鿿\s]{2,20})[,，\s]/);
  if (mB) {
    const cn = mB[1].replace(/\s/g, '');
    if (cn.length >= 2) return cn;
  }

  // Pattern C: title（中文）
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const mC = head.match(new RegExp(escaped + '\\s*[（(]([一-鿿]{2,15})[）)]'));
  if (mC) return mC[1];

  // Pattern D: first 2+ Chinese char cluster in first 150 chars
  const mD = head.slice(0, 150).match(/[一-鿿]{2,12}/);
  if (mD && !['出生','死亡','是的'].includes(mD[0])) return mD[0];

  return '';
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

let updated = 0;
for (let i = 0; i < empty.length; i += BATCH) {
  const batch = empty.slice(i, i + BATCH);
  const params = new URLSearchParams({
    action: 'query', prop: 'extracts',
    exintro: '1', explaintext: '1', exsentences: '3',
    titles: batch.join('|'), format: 'json', origin: '*',
  });
  try {
    const res = await fetch(`${API}?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const data = JSON.parse(text);
    for (const page of Object.values(data.query?.pages ?? {})) {
      const desc = extractChinese(page.extract ?? '', page.title);
      if (desc && desc !== descs[page.title]) {
        descs[page.title] = desc;
        updated++;
      }
    }
    process.stdout.write(`\r  ${Math.min(i+BATCH, empty.length)}/${empty.length}  更新 ${updated} 筆`);
    fs.writeFileSync('scripts/wiki-descriptions.json', JSON.stringify(descs, null, 2), 'utf8');
  } catch (e) {
    process.stdout.write(`\n  429/錯誤，等待 5 秒後重試... (${e.message.slice(0,30)})\n`);
    await sleep(5000);
    i -= BATCH;
    continue;
  }
  await sleep(DELAY_MS);
}

console.log(`\n✓ 完成，共更新 ${updated} 筆`);
const withDesc = Object.values(descs).filter(v => v).length;
console.log(`有說明：${withDesc} / ${Object.keys(descs).length} 筆`);
