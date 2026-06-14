import fs from 'fs';

const pages = JSON.parse(fs.readFileSync('all-pages.json', 'utf8'));
const data  = JSON.parse(fs.readFileSync('scripts/full-index-data.json', 'utf8'));
const descs = JSON.parse(fs.readFileSync('scripts/wiki-descriptions.json', 'utf8'));

// Same stripping logic as the browser JS
const stripRe = /[一-鿿＀-￯（）()【】]+/g;
// If stripping changes the title → JS would build wrong URL → hardcode instead
function needsHardcode(title) {
  return title.replace(stripRe, '').trim() !== title;
}
function wikiUrl(title) {
  return 'https://ami.wikipedia.org/wiki/' + encodeURI(title.replace(/ /g, '_'));
}
function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function makeTag(title) {
  const desc = descs[title] || '';
  const display = desc ? `${escHtml(title)} ${escHtml(desc)}` : escHtml(title);
  const dt = ` data-title="${escHtml(title)}"`;
  if (needsHardcode(title)) {
    const url = wikiUrl(title);
    return `<span class="tag"${dt}><a href="${url}" target="_blank" rel="noopener">${display}</a></span>`;
  }
  return `<span class="tag"${dt}>${display}</span>`;
}
function tagCloud(items) {
  return '      ' + items.map(makeTag).join('');
}

// Group "other" by first letter
const byLetter = {};
for (const title of data.other.sort((a,b)=>a.localeCompare(b,'en',{sensitivity:'base'}))) {
  const first = title[0].toUpperCase().replace(/[^A-Z0-9']/,'#');
  const key = /[A-Z]/.test(first) ? first : '#';
  if (!byLetter[key]) byLetter[key] = [];
  byLetter[key].push(title);
}

// Build the full "完整索引" section HTML
const letters = Object.keys(byLetter).sort();
const letterSections = letters.map(letter => {
  const items = byLetter[letter];
  return `    <details>
      <summary>${letter}（${items.length} 筆）</summary>
      <div class="tag-cloud" style="margin-top:10px">
${tagCloud(items)}
      </div>
    </details>`;
}).join('\n');

const fullSection = `
  <!-- ===== 完整索引 ===== -->
  <div class="card" id="full-index">
    <div class="card-header">
      <div>
        <h2>完整索引 — 全部條目</h2>
        <div class="ami">所有 ${pages.length} 篇條目依字母分組</div>
      </div>
      <span class="count-badge">${pages.length} 筆</span>
    </div>
    <p class="desc">以下按字母展開，點標題可展開該群組。</p>

    <div class="sub">
      <h3>Kawakawasan ratoh 傳統故事（${data.kawakawasan.length} 筆）</h3>
      <div class="tag-cloud">
${tagCloud(data.kawakawasan)}
      </div>
    </div>

    <div class="sub">
      <h3>Fonga 國家（${data.fonga.length} 筆）</h3>
      <div class="tag-cloud">
${tagCloud(data.fonga.sort())}
      </div>
    </div>

    <div class="sub">
      <h3>美國總統（${data.presidents_us.length} 筆）</h3>
      <div class="tag-cloud">
${tagCloud(data.presidents_us.sort())}
      </div>
    </div>

    <div class="sub">
      <h3>臺灣相關人物（${data.presidents_tw.length} 筆）</h3>
      <div class="tag-cloud">
${tagCloud(data.presidents_tw.sort())}
      </div>
    </div>

    <div class="sub">
      <h3>Niyaro' 部落（${data.villages.length} 筆）</h3>
      <div class="tag-cloud">
${tagCloud(data.villages.sort())}
      </div>
    </div>

    <div class="sub">
      <h3>Kimad 詞彙（${data.kimad.length} 筆）</h3>
      <div class="tag-cloud">
${tagCloud(data.kimad.sort())}
      </div>
    </div>

    <div class="sub">
      <h3>其他（${data.other.length} 筆）</h3>
${letterSections}
    </div>
  </div>
`;

// Inject before </main>
let html = fs.readFileSync('categories/index.html', 'utf8');

// Remove ALL old full-index sections (everything from the marker to </main>)
html = html.replace(/\n  <!-- ===== 完整索引 ===== -->[\s\S]*?(?=<\/main>)/g, '\n');

// Inject before </main>
html = html.replace('</main>', fullSection + '\n</main>');

fs.writeFileSync('categories/index.html', html, 'utf8');
console.log('✓ 注入完整索引到 categories/index.html');
console.log(`  Kawakawasan: ${data.kawakawasan.length}`);
console.log(`  Fonga: ${data.fonga.length}`);
console.log(`  US Presidents: ${data.presidents_us.length}`);
console.log(`  TW-related: ${data.presidents_tw.length}`);
console.log(`  Villages: ${data.villages.length}`);
console.log(`  Kimad: ${data.kimad.length}`);
console.log(`  Other: ${data.other.length}`);
console.log(`  Total: ${pages.length}`);
