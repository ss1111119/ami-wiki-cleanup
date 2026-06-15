/**
 * Very slow langlinks fetch for empty descriptions.
 * Batch=10, delay=2000ms, exponential backoff on 429.
 */
import fs from 'fs';

const descs = JSON.parse(fs.readFileSync('scripts/wiki-descriptions.json', 'utf8'));
const empty = Object.keys(descs).filter(k => !descs[k]);
console.log(`空白條目：${empty.length} 筆，慢速抓 zh langlinks...`);

const API = 'https://ami.wikipedia.org/w/api.php';
const BATCH = 10;
const DELAY_MS = 2000;

function toTraditional(s) {
  const map = {'属':'屬','国':'國','语':'語','来':'來','时':'時','长':'長','总':'總','统':'統','选':'選','举':'舉','联':'聯','华':'華','东':'東','亿':'億','岛':'島','湾':'灣','战':'戰','历':'歷','经':'經','济':'濟','业':'業','农':'農','产':'產','发':'發','电':'電','气':'氣','车':'車','铁':'鐵','银':'銀','观':'觀','设':'設','话':'話','书':'書','义':'義','边':'邊','们':'們','级':'級','种':'種','队':'隊','军':'軍','员':'員','会':'會','县':'縣','区':'區','乡':'鄉','镇':'鎮','学':'學','见':'見','证':'證','议':'議','认':'認','关':'關','对':'對','图':'圖','导':'導','问':'問','现':'現','组':'組','织':'織','传':'傳','动':'動','务':'務','专':'專','临':'臨','继':'繼','号':'號','层':'層','题':'題','报':'報','际':'際','环':'環','担':'擔','负':'負','权':'權','则':'則','实':'實','热':'熱','达':'達','带':'帶','给':'給','结':'結','维':'維','过':'過','进':'進','网':'網','应':'應','远':'遠','资':'資','态':'態','备':'備','单':'單','门':'門','间':'間','开':'開','风':'風','汉':'漢','丽':'麗','丰':'豐','势':'勢','贸':'貿','运':'運','这':'這','点':'點','节':'節','质':'質','术':'術','类':'類','费':'費','线':'線'};
  return s.split('').map(c => map[c] || c).join('');
}

const junk = new Set(['出生','死亡','是','概要','臺灣','台灣','重新導向','縮圖','歷史','國名','概略']);

const sleep = ms => new Promise(r => setTimeout(r, ms));
let updated = 0, total429 = 0, tries = 0;

for (let i = 0; i < empty.length; i += BATCH) {
  const batch = empty.slice(i, i + BATCH);
  const params = new URLSearchParams({
    action: 'query', prop: 'langlinks',
    lllang: 'zh', lllimit: '1',
    titles: batch.join('|'),
    format: 'json', origin: '*',
  });
  try {
    const res = await fetch(`${API}?${params}`);
    if (!res.ok) {
      if (res.status === 429) total429++;
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    for (const page of Object.values(data.query?.pages ?? {})) {
      const ll = page.langlinks?.[0]?.['*'];
      if (!ll) continue;
      const desc = toTraditional(ll.trim());
      if (desc && desc.length <= 20 && /[一-鿿]/.test(desc) && !junk.has(desc)) {
        descs[page.title] = desc;
        updated++;
        process.stdout.write(`\n  ✓ ${page.title} → ${desc}`);
      }
    }
    tries = 0;
    process.stdout.write(`\r  ${Math.min(i+BATCH,empty.length)}/${empty.length}  更新 ${updated} 筆  429次數: ${total429}   `);
    fs.writeFileSync('scripts/wiki-descriptions.json', JSON.stringify(descs, null, 2), 'utf8');
  } catch(e) {
    tries++;
    const wait = Math.min(8000 * tries, 60000);
    process.stdout.write(`\n  [429 #${total429}] 等 ${wait/1000}s...\n`);
    await sleep(wait);
    i -= BATCH;
    continue;
  }
  await sleep(DELAY_MS);
}

console.log(`\n✓ 完成`);
console.log(`  更新: ${updated} 筆`);
console.log(`  429次數: ${total429} 次`);
const withDesc = Object.values(descs).filter(v => v).length;
console.log(`  有說明：${withDesc} / ${Object.keys(descs).length} 筆`);
