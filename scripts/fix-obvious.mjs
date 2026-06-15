import fs from 'fs';
const d = JSON.parse(fs.readFileSync('scripts/wiki-descriptions.json', 'utf8'));

// Obviously missing ones we can fill in directly
const fixes = {
  'Adipangpang': '蝴蝶',      // same as 'adipangpang
  'Babuy': '豬',               // same as Fafoy
  'Cecay': '一',
  'Charles III': '查爾斯三世',
  'COVID-19': '新冠肺炎',
  'Cung-huwa-min-ku': '中華民國',
  'Ci Langasan': '奇拉阿山',  // same as Cilangasan
  'Cokap': '陀螺',
  'Damidam': '鼓',
  'Donald Trump': '唐納·川普',
  'Dwight D. Eisenhower': '德懷特·艾森豪',
  'Dwight D Eisenhower': '德懷特·艾森豪',
  'El Salvador': '薩爾瓦多',
  'Ekong': '山',
  'Fafaoy': '豬',
  'Amis.Pangach': '阿美族',
  'Australia': '澳大利亞',
  'Albania': '阿爾巴尼亞',
  'Algeria': '阿爾及利亞',
  'Armenia': '亞美尼亞',
  'Austria': '奧地利',
  'Canada': '加拿大',
  'Cameroon': '喀麥隆',
  'Central african republic': '中非共和國',
  'Dominica': '多米尼克',
  'Bénin': '貝南',
};

let count = 0;
for (const [k, v] of Object.entries(fixes)) {
  if (d.hasOwnProperty(k)) {
    console.log(k, '->', v);
    d[k] = v;
    count++;
  } else {
    console.log('NOT FOUND:', k);
  }
}

fs.writeFileSync('scripts/wiki-descriptions.json', JSON.stringify(d, null, 2), 'utf8');
console.log(`\n更新 ${count} 筆`);
const withDesc = Object.values(d).filter(v => v).length;
const empty = Object.keys(d).filter(k => !d[k]);
console.log(`有說明：${withDesc} 筆`);
console.log(`空白：${empty.length} 筆`);
