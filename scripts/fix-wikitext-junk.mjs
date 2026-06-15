import fs from 'fs';
const d = JSON.parse(fs.readFileSync('scripts/wiki-descriptions.json', 'utf8'));

const fixes = {
  'Haiti': '海地',
  'Hungary': '匈牙利',
  'Russia': '俄羅斯聯邦',
  'Guyana': '蓋亞那',
  'Iceland': '冰島',
  'Costa Rica': '哥斯大黎加',
  'New zealand': '紐西蘭',
  'Rwanda': '盧安達',
};

for (const [k, v] of Object.entries(fixes)) {
  if (k in d) {
    console.log(k, ': [' + d[k].slice(0, 40) + '] ->', v);
    d[k] = v;
  } else {
    console.log('NOT FOUND:', k);
  }
}

fs.writeFileSync('scripts/wiki-descriptions.json', JSON.stringify(d, null, 2), 'utf8');
console.log('\n有說明：', Object.values(d).filter(v => v).length, '筆');
