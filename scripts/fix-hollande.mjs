import fs from 'fs';
const d = JSON.parse(fs.readFileSync('scripts/wiki-descriptions.json', 'utf8'));

const fixes = {
  'François Hollande': '弗朗索瓦·奧朗德',
  'Frank-Walter Steinmeier': '法蘭克-瓦爾特·施泰因邁爾',
  'Franklin Pierce': '富蘭克林·皮爾斯',
  'Franklin D. Roosevelt': '富蘭克林·羅斯福',
  'Franklin D Roosevelt': '富蘭克林·羅斯福',
  'Franklin Roosevelt': '富蘭克林·羅斯福',
};

for (const [k, v] of Object.entries(fixes)) {
  if (k in d) {
    console.log(k, '->', v);
    d[k] = v;
  } else {
    console.log('NOT FOUND:', k);
  }
}

fs.writeFileSync('scripts/wiki-descriptions.json', JSON.stringify(d, null, 2), 'utf8');
const withDesc = Object.values(d).filter(v => v).length;
console.log(`\n有說明：${withDesc} / ${Object.keys(d).length} 筆`);
