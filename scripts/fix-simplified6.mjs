import fs from 'fs';
const d = JSON.parse(fs.readFileSync('scripts/wiki-descriptions.json', 'utf8'));

const fixes = {
  'Donald Tusk': '唐納德·圖斯克',
  'Karol Nawrocki': '卡羅爾·納夫羅茨基',
  'Gjorge Ivanov': '格奧爾蓋·伊萬諾夫',
  'Jigme Khesar Namgyel Wangchuck': '吉格梅·凱薩爾·納姆耶爾·旺楚克',
  'John Magufuli': '約翰·馬古富利',
  'Juan Orlando Hernández': '胡安·奧蘭多·埃爾南德斯',
  'Omar al-Bashir': '奧馬爾·巴希爾',
  'Paul Biya': '保羅·比亞',
  'Rodrigo Duterte': '羅德里戈·杜特爾特',
  'Salman of Saudi Arabia': '薩勒曼·本·阿卜杜勒-阿齊茲·阿勒沙特',
  'Uhuru Kenyatta': '烏胡魯·肯雅塔',
  'Hashim Thaçi': '哈希姆·薩奇',
  'Faustin-Archange Touadéra': '福斯坦-阿爾尚熱·圖瓦德拉',
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
console.log(`\n有說明：${Object.values(d).filter(v => v).length} 筆`);
