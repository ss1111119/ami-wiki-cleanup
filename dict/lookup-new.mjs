// 新版萌典查詢工具(查 amis-moedict-new-db-backup 的 SQLite,11 部辭典 / 10.5 萬詞 / 8.3 萬例句)
// 用法:
//   node dict/lookup-new.mjs <阿美語>        正查:阿美語 → 中文(容錯喉塞音;含各辭典釋義與例句)
//   node dict/lookup-new.mjs -r <中文關鍵字>  反查:中文 → 阿美語候選詞
import { DatabaseSync } from 'node:sqlite';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dir = dirname(fileURLToPath(import.meta.url));
// 優先用最新的 SQLite
const candidates = ['amis-moedict-202512.sqlite3', 'amis-moedict-202511.sqlite3']
  .map((f) => join(__dir, '..', 'amis-moedict-new-db-backup', f));
const dbPath = candidates.find((p) => existsSync(p));
if (!dbPath) { console.error('找不到新版萌典 SQLite 備份'); process.exit(1); }

const db = new DatabaseSync(dbPath, { readOnly: true });
const norm = (s) => (s || '').toString().toLowerCase().replace(/[ʼ'`^’‘]/g, '').trim();
// 在 SQL 端把 lower_name 的喉塞音也去掉以做容錯比對
const STRIP = "replace(replace(replace(replace(lower_name,'''',''),'^',''),'ʼ',''),'`','')";

const args = process.argv.slice(2);
const reverse = args[0] === '-r';
const q = reverse ? args.slice(1).join(' ') : args.join(' ');
if (!q) { console.log('用法: node dict/lookup-new.mjs <阿美語>  |  -r <中文>'); process.exit(1); }

const cleanAmis = (s) => (s || '').replace(/[`~]/g, '');

if (reverse) {
  const rows = db.prepare(`
    SELECT t.name AS amis, di.name AS dict, d.content_zh AS zh
    FROM descriptions d
    JOIN terms t ON t.id = d.term_id
    JOIN dictionaries di ON di.id = t.dictionary_id
    WHERE d.content_zh LIKE ? AND t.name <> ''
    LIMIT 60
  `).all(`%${q}%`);
  console.log(`反查「${q}」→ ${rows.length} 筆(新版萌典 11 部辭典)`);
  const seen = new Set();
  for (const r of rows) {
    const key = r.amis + '|' + r.zh;
    if (seen.has(key)) continue; seen.add(key);
    console.log(`  ${cleanAmis(r.amis).padEnd(18)} ${r.zh}   〔${r.dict}〕`);
  }
} else {
  const k = norm(q);
  const rows = db.prepare(`
    SELECT t.id, t.name AS amis, di.name AS dict, d.content_zh AS zh
    FROM terms t
    JOIN descriptions d ON d.term_id = t.id
    JOIN dictionaries di ON di.id = t.dictionary_id
    WHERE ${STRIP} = ?
    LIMIT 30
  `).all(k);
  console.log(`正查「${q}」(正規化:${k})→ ${rows.length} 筆`);
  for (const r of rows) console.log(`  ${cleanAmis(r.amis)} → ${r.zh}   〔${r.dict}〕`);
  // 附例句(取前 3)
  const ex = db.prepare(`
    SELECT e.content_amis AS amis, e.content_zh AS zh
    FROM examples e JOIN descriptions d ON d.id = e.description_id JOIN terms t ON t.id = d.term_id
    WHERE ${STRIP} = ? AND e.content_amis <> '' AND e.content_zh <> ''
    LIMIT 3
  `).all(k);
  if (ex.length) { console.log('  ── 例句 ──'); for (const e of ex) console.log(`    ${cleanAmis(e.amis)} | ${e.zh}`); }
}
db.close();
