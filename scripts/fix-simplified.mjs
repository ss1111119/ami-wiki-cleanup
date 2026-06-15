import fs from 'fs';
const d = JSON.parse(fs.readFileSync('scripts/wiki-descriptions.json', 'utf8'));

const fixes = {
  "'afar": '真蝦下目',
  "'alapit": '筷子',
  'Kafos': '蝦',
  'Posi': '貓',
  'Naniwac': '綠豆',
  'Rakorako': '樹蛙屬',
  'Jamaica': '牙買加',
  'Chad': '乍得',
  'Gabon': '加蓬',
  'Dafdaf': '平原',
  'Codad': '圖書',
  'Parok': '棉花',
  'Lopas': '桃子',
  'Tokayto': '城市',
  'Otofay': '摩托車',
};

for (const [k, v] of Object.entries(fixes)) {
  console.log(k, ':', d[k], '->', v);
  d[k] = v;
}

fs.writeFileSync('scripts/wiki-descriptions.json', JSON.stringify(d, null, 2), 'utf8');
const withDesc = Object.values(d).filter(v => v).length;
console.log('有說明:', withDesc, '筆');
