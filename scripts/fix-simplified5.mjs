import fs from 'fs';
const d = JSON.parse(fs.readFileSync('scripts/wiki-descriptions.json', 'utf8'));

const fixes = {
  'Grover Cleveland': '格羅弗·克利夫蘭',
  'Joe Biden': '喬·拜登',
  'Qaboos bin Said al Said': '卡布斯·本·賽義德·阿勒賽義德',
  'Recep Tayyip Erdoğan': '雷傑普·塔伊普·埃爾多安',
  'Saint Vincent and the Grenadines': '聖文森特和格林納丁斯',
  'Sauli Niinistö': '紹利·尼尼斯托',
  'Sawalakay a lakaw': '放射性廢料',
  'Teodoro Obiang Nguema Mbasogo': '特奧多羅·奧比昂·恩圭馬·姆巴索戈',
  'Tony Tan': '陳慶炎',
  'Trần Đại Quang': '陳大光',
  'Tsakhiagiin Elbegdorj': '查希亞·額勒貝格道爾吉',
  'Md. Abdul Hamid': '阿卜杜勒·哈米德',
};

for (const [k, v] of Object.entries(fixes)) {
  if (k in d) {
    console.log(k, ':', d[k], '->', v);
    d[k] = v;
  } else {
    console.log('NOT FOUND:', k);
  }
}

fs.writeFileSync('scripts/wiki-descriptions.json', JSON.stringify(d, null, 2), 'utf8');
const withDesc = Object.values(d).filter(v => v).length;
console.log(`\n有說明：${withDesc} / ${Object.keys(d).length} 筆`);
