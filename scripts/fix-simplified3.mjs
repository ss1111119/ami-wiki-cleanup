import fs from 'fs';
const d = JSON.parse(fs.readFileSync('scripts/wiki-descriptions.json', 'utf8'));

const fixes = {
  'Filip Vujanović': '菲利普·武亞諾維奇',
  'George Washington': '喬治·華盛頓',
  'Igor Dodon': '伊戈爾·多東',
  'Jimmy Morales': '吉米·莫拉萊斯',
  'Kersti Kaljulaid': '克爾斯季·卡柳萊德',
  'Klaus Iohannis': '克勞斯·約翰尼斯',
  'Madagascar': '馬達加斯加',
  'Marie-Louise Coleiro Preca': '瑪麗-路易絲·科萊羅·普雷卡',
  'Miloš Zeman': '米洛什·澤曼',
  'New Zealand': '紐西蘭',
  'Pitaw': '鋤頭',
  'Raúl Castro': '勞爾·卡斯特羅',
  'Sabah Al-Ahmad Al-Jaber Al-Sabah': '薩巴赫·艾哈邁德·賈比爾·薩巴赫',
  'Tabaré Vázquez': '塔瓦雷·巴斯克斯',
  'Taur Matan Ruak': '陶爾·馬坦·魯阿克',
  'Vajiralongkorn': '瑪哈·哇集拉隆功',
  'Yoweri Museveni': '約韋里·穆塞韋尼',
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
