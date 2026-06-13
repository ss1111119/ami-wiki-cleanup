import fs from 'fs';

const pages = JSON.parse(fs.readFileSync('all-pages.json', 'utf8'));

// Same stripping logic as the browser JS
const stripRe = /[一-鿿＀-￯（）()【】]+/g;

// If stripping changes the title → JS would generate wrong URL → need hardcode
function needsHardcode(title) {
  const stripped = title.replace(stripRe, '').trim();
  return stripped !== title;
}

function wikiUrl(title) {
  return 'https://ami.wikipedia.org/wiki/' + encodeURI(title.replace(/ /g, '_'));
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function makeTag(title) {
  if (needsHardcode(title)) {
    return `<span class="tag"><a href="${wikiUrl(title)}" target="_blank" rel="noopener">${escHtml(title)}</a></span>`;
  }
  return `<span class="tag">${escHtml(title)}</span>`;
}

function tagCloud(items) {
  return '      ' + items.map(makeTag).join('');
}

// --- Categorization ---
const kawakawasan = [], fonga = [], presidents_us = [], presidents_tw = [],
      villages = [], kimad = [], other = [];

const usPresidents = new Set([
  'George Washington','John Adams','Thomas Jefferson','James Madison','James Monroe',
  'John Quincy Adams','Andrew Jackson','Andrew jackson','Martin Van Buren',
  'William Henry Harrison','John Tyler','James K. Polk','Zachary Taylor',
  'Millard Filmore','Franklin Pierce','James Buchanan','Abraham Lincoln',
  'Aparaham Linken','Aparaham. Linken','Andrew Johnson','Ulysses S. Grant',
  'Rutherford B. Hayes','James A. Garfield','Chester A. Arthur','Chester A Arthur',
  'Chester Arthur','Grover Cleveland','Benjamin Harrison','William McKinley',
  'Theodore Roosevelt','William Howard Taft','Woodrow Wilson','Warren G. Harding',
  'Calvin Coolidge','Herbert Hoover','Franklin D. Roosevelt','Harry S. Truman',
  'Dwight D. Eisenhower','John F. Kennedy','Lyndon B. Johnson','Richard Nixon',
  'Gerald Ford','Jimmy Carter','Ronald Reagan','George H. W. Bush','Bill Clinton',
  'George W. Bush','Barack Obama','Donald Trump','Joe Biden',
  'Booker Taliaferro Washington',
]);

const twPresidents = new Set([
  'Tsai Ing-wen','Cay Ing-wen','Lay Cingte','Ma Ying-jeou',
  'Lai Cingte congtong','Lay cingte congtong papelo i patirengan',
  'Cay Ing-wen 2024 pafilongan a sowal',
  '520 Lay cingte congtong papelo i patirengan',
  'Caayto ko mamiliyaw ci demak ko 228 a likisi.-Lai Cingte congtong',
  'Lai Qingde congtong papelo i mihecaan no pikowan',
  '2024 a miheca mamalacongtong no Cung-huwa-min-ku',
  'Ciyaw Anang Taywan Yancumincu',
]);

const countryPatterns = [
  /^Afghanistan$/, /^Albania$/, /^Algeria$/, /^Andorra$/, /^Angola$/,
  /^Antika ato Paputa$/, /^Antikuwa ato Papota$/, /^Antigua and barbuda$/i,
  /^Argentina$/, /^Armenia$/, /^Arminiya$/, /^Arpaniya$/, /^Australia$/,
  /^Austria$/, /^Awtili$/, /^Azerbaijan$/, /^Bahamas$/, /^Bahrain$/,
  /^Bangladesh$/, /^Barbados$/, /^Belarus$/, /^Belguim$/, /^Belize$/,
  /^B[eé]nin$/, /^Bhutan$/, /^Bolivia$/, /^Bosnia and herzegovina$/i,
  /^Botswana$/, /^Brazil$/, /^Brunei$/, /^Bulgaria$/, /^Burkina faso$/i,
  /^Burma$/, /^Burundi$/, /^Cambodia$/, /^Conbodia$/, /^Cameron$/,
  /^Cameroon$/, /^Canada$/, /^Cape Town$/, /^Central African Republic$/i,
  /^Chad$/, /^Chile$/, /^China$/, /^Columbia$/, /^Commonwealth of Dominica$/,
  /^Congo/i, /^Congko/i, /^Costa Rica$/i, /^Costa riga$/i,
  /^C[oô]te d/i, /^Croatia$/, /^Cuba$/, /^Cyprus$/, /^Czechia$/,
  /^Denmark$/, /^Dominica$/, /^Dominican republic$/i, /^Ecuador$/,
  /^El Salvador$/i, /^El salvador$/, /^Eritrea$/, /^Estonia$/,
  /^Ethiopia$/, /^Fiji$/, /^Finland$/, /^France$/, /^Gabon$/,
  /^Georgia$/, /^Germany$/, /^Ghana$/, /^Greece$/, /^Guatemala$/,
  /^Guinea/, /^Guyana$/, /^Haiti$/, /^Honduras$/, /^Hungary$/,
  /^Iceland$/, /^India$/, /^Indonesia$/, /^Iran$/, /^Iraq$/,
  /^Ireland$/, /^Israel$/, /^Italy$/, /^Jamaica$/, /^Japan$/,
  /^Jordan$/, /^Kazakhstan$/, /^Kenya$/, /^Kiribati$/, /^Kosovo$/,
  /^Kuwait$/, /^Kurgyzstan$/, /^Laos$/, /^Latvia$/, /^Lebanon$/,
  /^Lesotho$/, /^Liberia$/, /^Libya$/, /^Liechtenstein$/, /^Lithuania$/,
  /^Luxembourg$/, /^Macedonia$/, /^Madagascar$/, /^Malawi$/, /^Malaysia$/,
  /^Maldives$/, /^Mali$/, /^Malta$/, /^Marshall Islands$/i, /^Mauritus$/,
  /^Mexico$/, /^Micronesia$/, /^Moldova$/, /^Monaco$/, /^Mongolia$/,
  /^Montenegro$/, /^Morocco$/, /^Mozambique$/, /^Namibia$/, /^Nauru$/,
  /^Nepal$/, /^Netherlands$/, /^New Zealand$/i, /^Nicaragua$/,
  /^Niger$/, /^Nigeria$/, /^Norway$/, /^Oman$/, /^Pakistan$/,
  /^Palau$/, /^Panama$/, /^Papua New Guinea$/i, /^Paraguay$/, /^Peru$/,
  /^Philippines$/, /^Poland$/, /^Portugal$/, /^Qatar$/, /^Romania$/,
  /^Russia$/, /^Rwanda$/, /^Saint Lucia$/i, /^Saint Vincent/i,
  /^Samoa$/, /^San Marino$/i, /^Saudi Arabia$/i, /^Senegal$/,
  /^Serbia$/, /^Sierra Leone$/i, /^Singapore$/, /^Slovakia$/,
  /^Slovenia$/, /^Solomon Island$/, /^Somalia$/, /^South Africa$/i,
  /^South Sudan$/i, /^Spain$/, /^Sri Lanka$/i, /^Sudan$/, /^Suriname$/,
  /^Sweden$/, /^Switzerland$/, /^Syria$/, /^Taywan$/, /^Tajikistan$/,
  /^Tanzania$/, /^Thailand$/, /^Timor-Leste$/i, /^Togo$/, /^Tonga$/,
  /^Tunisia$/, /^Turkey$/, /^Turkmenistan$/, /^Tuvalu$/, /^Uganda$/,
  /^Ukraine$/, /^United Arab Emirates$/i, /^United Kingdom$/i,
  /^United States$/i, /^Uruguay$/, /^Uzbekistan$/, /^Vanuatu$/,
  /^Venezuela$/, /^Vietnam$/, /^Yemen$/, /^Zambia$/, /^Zimbabwa$/,
  /^Korea/i, /^Cung-huwa-min-ku$/, /^Amilika$/, /^Arkansas$/,
  /^California$/, /^Arciliya$/, /^Ankora$/, /^Aljungic$/, /^Afohan$/,
  /^Amis\.Pangc/i,
];

function isCountry(t) { return countryPatterns.some(p => p.test(t)); }

const villageSet = new Set([
  'Tafalong','Makotaay','Natauran','Ciwkangan','Kiwit','Falangaw',
  'Hualien','Atolan','Chenggong','Changbin','Ciwidian','Ciwidiyan',
  'Beinan','Daren','Dawu','Chunri','Chishang','Lidaw',
  'Bakung a niyaru\'','Ciyaw Anang Paterungan a niyaru\'','Ciyaw-i-pu',
  'Cengel','Siwkolan',
]);

function isVillage(t) {
  return villageSet.has(t) || /niyar[ou]['']/i.test(t);
}

for (const title of pages) {
  if (/^Kawakawasan ratoh/i.test(title)) {
    kawakawasan.push(title);
  } else if (usPresidents.has(title)) {
    presidents_us.push(title);
  } else if (twPresidents.has(title)) {
    presidents_tw.push(title);
  } else if (isCountry(title)) {
    fonga.push(title);
  } else if (isVillage(title)) {
    villages.push(title);
  } else if (/^[a-z''‘’]/.test(title)) {
    kimad.push(title);
  } else {
    other.push(title);
  }
}

const sections = { kawakawasan, fonga, presidents_us, presidents_tw, villages, kimad, other };
fs.writeFileSync('scripts/full-index-data.json', JSON.stringify(sections, null, 2), 'utf8');

console.log('=== 分類結果 ===');
for (const [k,v] of Object.entries(sections)) console.log(`${k}: ${v.length}`);
console.log(`合計: ${pages.length}`);

// Count how many need hardcoded links
const needHard = pages.filter(needsHardcode);
console.log(`\n需要硬連結: ${needHard.length} 筆`);
needHard.slice(0,10).forEach(p => console.log(' ', JSON.stringify(p)));
