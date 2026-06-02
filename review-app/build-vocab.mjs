// 從中央詞庫 glossary/terms.json 生成：
//   1. 校對平台（Firestore）各條目的 vocab
//   2. glossary/glossary.md（人類可讀詞表）
// 用法：node build-vocab.mjs            → 生成 md 並推送 Firestore
//       node build-vocab.mjs --no-push  → 只生成 md，不碰 Firestore
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const { terms } = JSON.parse(readFileSync(join(root, 'glossary', 'terms.json'), 'utf8'));
const noPush = process.argv.includes('--no-push');

// 把一筆詞庫資料對應成校對平台 vocab 欄位（兩方言相同時共用 ami / gloss）
const toVocabRow = t => ({
  zh: t.zh,
  ami_coast: t.ami || '—',
  dict_coast: t.gloss || '—',
  ami_xiuguluan: t.ami_xiuguluan ?? t.ami ?? '—',
  dict_xiuguluan: t.gloss_xiuguluan ?? t.gloss ?? '—',
  status: t.status || 'warn',
  note: t.note || '',
});

// 哪些條目要產生 vocab（依 term.articles）
const articleIds = [...new Set(terms.flatMap(t => t.articles || []))];

// --- 1. 生成 glossary.md ---
const esc = s => String(s ?? '').replace(/\|/g, '\\|');
let md = `# 阿美語詞庫（自動生成）\n\n`;
md += `> ⚠️ 請勿手改本檔。改 \`glossary/terms.json\` 後執行 \`review-app/build-vocab.mjs\` 重新生成。\n`;
md += `> 產生日期：${new Date().toISOString().slice(0, 10)}　／　共 ${terms.length} 詞\n\n`;
md += `狀態：✅ ok 正確　⚠️ warn 偏差待確認　❌ err 不對　▫️ missing 未收錄\n\n`;
md += `| 中文 | 阿美語 | 變體 | 定義 | 狀態 | 來源 | 備註 | 用於條目 |\n`;
md += `|------|--------|------|------|------|------|------|----------|\n`;
for (const t of terms) {
  md += `| ${esc(t.zh)} | ${esc(t.ami)} | ${esc((t.variants || []).join(', '))} | ${esc(t.gloss)} | ${esc(t.status)} | ${esc(t.source)} | ${esc(t.note)} | ${esc((t.articles || []).join(', '))} |\n`;
}
const withEx = terms.filter(t => (t.examples || []).length);
if (withEx.length) {
  md += `\n## 例句（語料／字典佐證）\n\n`;
  for (const t of withEx) {
    md += `**${t.zh}（${t.ami}）**\n`;
    for (const e of t.examples) md += `- ${esc(e.ami)} — ${esc(e.zh)}\n`;
    md += `\n`;
  }
}
writeFileSync(join(root, 'glossary', 'glossary.md'), md);
console.log(`✓ 生成 glossary/glossary.md（${terms.length} 詞）`);

// --- 2. 推送 Firestore ---
if (noPush) { console.log('（--no-push：略過 Firestore）'); process.exit(0); }
const { initializeApp } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
initializeApp({ projectId: 'ami-wiki-review' });
const db = getFirestore();
for (const articleId of articleIds) {
  const vocab = terms.filter(t => (t.articles || []).includes(articleId)).map(toVocabRow);
  await db.collection('translations').doc(articleId).update({ vocab });
  console.log(`✓ Firestore：${articleId} vocab（${vocab.length} 詞）`);
}
process.exit(0);
