import fs from 'fs';
const d = JSON.parse(fs.readFileSync('scripts/wiki-descriptions.json', 'utf8'));

const fixes = {
  'Finland': '芬蘭',
  'Horacio Cartes': '奧拉西奧·卡特斯',
  'Indonesia': '印度尼西亞',
  'Kamiron': '喀麥隆',
  'Khalifa bin Zayed Al Nahyan': '哈利法·本·扎耶德·阿勒納哈揚',
  'Luis Guillermo Solís': '路易斯·吉列爾莫·索利斯',
  'Mata': '眼睛',
  'Mexico': '墨西哥',
  'Petro Poroshenko': '彼得羅·波羅申科',
  'Pusi': '貓屬',
  'Riri\'': '蝗群',
  'Salvador Sánchez Cerén': '薩爾瓦多·桑切斯·塞倫',
  'Shavkat Mirziyoyev': '沙夫卡特·米爾濟約耶夫',
  'Vladimir Putin': '弗拉基米爾·普京',
  'Volodymyr Zelensky': '弗拉基米爾·澤連斯基',
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
