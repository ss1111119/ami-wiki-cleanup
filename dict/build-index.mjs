// 由 g0v amis-moedict CC0 整合檔建立正查/反查索引(秀姑巒為主,通用版補充)
import { readFileSync, writeFileSync } from 'fs';

const clean = s => (s || '')
  .replace(/[￹￺￻`~]/g, '')   // 去除 moedict 標記
  .replace(/\*/g, '')
  .trim();

// 阿美語正規化:小寫、去喉塞音/變音
const norm = s => (s || '').toString().toLowerCase().replace(/[\^’ʼ'‘]/g, '').trim();

function loadEntries(path, chineseOnly) {
  const arr = JSON.parse(readFileSync(path, 'utf8'));
  const out = [];
  for (const e of arr) {
    const w = e.title;
    if (!w) continue;
    const defs = [];
    for (const h of (e.heteronyms || [])) {
      for (const d of (h.definitions || [])) {
        let def = clean(d.def);
        if (chineseOnly) {
          // dict-amis.json 的 def 是「英文￻中文」,取 ￻ 之後;這裡已 clean 掉標記,改抓中文段
          const raw = d.def || '';
          const idx = raw.indexOf('￻');
          if (idx >= 0) def = clean(raw.slice(idx + 1));
        }
        if (def) defs.push(def);
      }
    }
    if (defs.length) out.push({ w, s: e.stem || '', defs });
  }
  return out;
}

const safolu = loadEntries('./dict-amis-safolu.json', false);
const general = loadEntries('./dict-amis.json', true);

// 合併:以詞為鍵,defs 去重
const map = new Map();
for (const list of [safolu, general]) {
  for (const { w, s, defs } of list) {
    const key = w;
    if (!map.has(key)) map.set(key, { w, s, defs: [] });
    const rec = map.get(key);
    for (const d of defs) if (!rec.defs.includes(d)) rec.defs.push(d);
    if (!rec.s && s) rec.s = s;
  }
}

const entries = [...map.values()];
// 正查索引:正規化詞 -> [defs](容錯)
const fwd = {};
for (const { w, defs } of entries) {
  const k = norm(w);
  if (!fwd[k]) fwd[k] = [];
  fwd[k].push({ w, defs });
}

writeFileSync('./amis-index.json', JSON.stringify({ entries, fwd }, null, 0), 'utf8');
console.log('詞條總數(合併後):', entries.length);
console.log('正規化索引鍵數:', Object.keys(fwd).length);
console.log('索引檔: dict/amis-index.json');
