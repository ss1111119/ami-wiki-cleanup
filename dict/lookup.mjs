// 阿美語萌典本地查詢工具(正查 + 反查)
// 用法:
//   node lookup.mjs <阿美語詞>        正查:阿美語 -> 中文(容錯喉塞音/變音)
//   node lookup.mjs -r <中文關鍵字>   反查:中文 -> 阿美語候選詞
import { readFileSync } from 'fs';

const { entries, fwd } = JSON.parse(readFileSync(new URL('./amis-index.json', import.meta.url), 'utf8'));
const norm = s => (s || '').toString().toLowerCase().replace(/[\^’ʼ'‘]/g, '').trim();

const args = process.argv.slice(2);
const reverse = args[0] === '-r';
const q = reverse ? args.slice(1).join(' ') : args.join(' ');

if (!q) { console.log('用法: node lookup.mjs <阿美語詞>  |  node lookup.mjs -r <中文關鍵字>'); process.exit(1); }

if (reverse) {
  const hits = [];
  for (const e of entries) {
    if (e.defs.some(d => d.includes(q))) hits.push(e);
  }
  console.log(`反查「${q}」→ ${hits.length} 個候選詞`);
  for (const e of hits.slice(0, 40)) {
    console.log(`  ${e.w}${e.s ? ' (根:' + e.s + ')' : ''} → ${e.defs.join(' / ')}`);
  }
  if (hits.length > 40) console.log(`  …(僅顯示前 40)`);
} else {
  const k = norm(q);
  const recs = fwd[k] || [];
  console.log(`正查「${q}」(正規化:${k})→ ${recs.length} 筆`);
  for (const r of recs) console.log(`  ${r.w} → ${r.defs.join(' / ')}`);
}
