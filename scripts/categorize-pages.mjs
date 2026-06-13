import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pages = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'all-pages.json'), 'utf8'));

// 已知名單
const knownPresidents = new Set([
  'George Washington','John Adams','Thomas Jefferson','James Madison','James Monroe',
  'John Quincy Adams','Andrew Jackson','Martin Van Buren','William Henry Harrison',
  'John Tyler','James K. Polk','Zachary Taylor','Millard Fillmore','Franklin Pierce',
  'James Buchanan','Abraham Lincoln','Andrew Johnson','Ulysses S. Grant',
  'Rutherford B. Hayes','James A. Garfield','Chester A. Arthur','Grover Cleveland',
  'Benjamin Harrison','William McKinley','Theodore Roosevelt','William Howard Taft',
  'Woodrow Wilson','Warren G. Harding','Calvin Coolidge','Herbert Hoover',
  'Franklin D. Roosevelt','Harry S. Truman','Dwight D. Eisenhower','John F. Kennedy',
  'Lyndon B. Johnson','Richard Nixon','Gerald Ford','Jimmy Carter','Ronald Reagan',
  'George H. W. Bush','Bill Clinton','George W. Bush','Barack Obama',
  'Donald Trump','Joe Biden',
]);

const knownTwPresidents = new Set([
  'Tsai Ing-wen','Lai Cingte congtong','Ma Ying-jeou','Chen Shui-bian',
  'Lee Teng-hui','Chiang Ching-kuo','Chiang Kai-shek',
]);

const knownVillages = new Set([
  'Tafalong','Fata\'an','Makotaay','Cepo\'','Natauran','Ciwkangan','Kiwit',
  'Falangaw','Adolan','Hualien','Lidaw','Sakul','Makay','Takoban',
  'Atolan','Taitung','Taidong','Chenggong','Changbin','Fengbin',
  'Haiduan','Dawu','Taimali','Beinan','Jinfeng','Nataoran',
  'Cengal','Pokpok','Ciwidian','Karowa','Siwkolan',
]);

const results = {
  kawakawasan: [],
  fonga: [],
  presidents_us: [],
  presidents_tw: [],
  tamdaw_other: [],
  villages: [],
  kimad: [],
  other: [],
};

// 已知國名（英文）
const knownCountries = new Set([
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda',
  'Argentina','Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain',
  'Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia',
  'Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso',
  'Burundi','Cambodia','Cameroon','Canada','Cape Town','Central African Republic',
  'Chad','Chile','China','Colombia','Congo, Democratic Republic of the',
  'Congo, Republic of the','Costa Rica','Côte d\'Ivoire',"Cote d'Ivoire",
  'Croatia','Cuba','Cyprus','Czechia','Denmark','Djibouti','Dominica',
  'Dominican Republic','Ecuador','Egypt','El Salvador','Equatorial Guinea',
  'Eritrea','Estonia','Eswatini','Swaziland','Ethiopia','Fiji','Finland','France',
  'Gabon','Gambia','Georgia','Germany','Ghana','Greece','Guatemala','Guinea',
  'Guinea-Bissau','Guyana','Haiti','Honduras','Hong Kong','Hungary','Iceland',
  'India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan',
  'Jordan','Kazakhstan','Kenya','Kiribati','Kosovo','Kuwait','Kyrgyzstan','Laos',
  'Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania',
  'Luxembourg','Macau','Macedonia','Madagascar','Malawi','Malaysia','Maldives',
  'Mali','Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia',
  'Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Burma',
  'Myanmar','Namibia','Nauru','Nepal','Netherlands','New Zealand','Nicaragua',
  'Niger','Nigeria','Norway','Oman','Pakistan','Palau','Panama','Papua New Guinea',
  'Paraguay','Peru','Philippines','Poland','Portugal','Puerto Rico','Qatar',
  'Romania','Russia','Rwanda','Saint Lucia','Saint Vincent and the Grenadines',
  'Samoa','San Marino','Saudi Arabia','Senegal','Serbia','Sierra Leone','Singapore',
  'Slovakia','Slovenia','Solomon Islands','Somalia','South Africa','South Sudan',
  'Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria','Taiwan',
  'Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago',
  'Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine','United Arab Emirates',
  'United Kingdom','United States','Uruguay','Uzbekistan','Vanuatu','Venezuela',
  'Vietnam','Yemen','Zambia','Zimbabwe','Korea, north','Korea, south',
]);

// 部落關鍵詞
const villagePattern = /niyaro['']|niyaru['']|^(Tafalong|Fata'an|Makotaay|Cepo'|Natauran|Ciwkangan|Kiwit|Falangaw|Adolan|Atolan|Siwkolan|Karowa|Pokpok|Cengal|Taitung|Hualien|Fengbin|Changbin|Chenggong|Beinan|Jinfeng|Taimali|Haiduan|Dawu|Lidaw|Sakul|Makay|Takoban|Naruwan|Kacaw|Cepo)/i;

// 阿美族文化關鍵詞
const amisPattern = /Pangcah|'Amis|Ilisin|Kapolongan|Pisacepo|kawas|malikakaay/i;

// 分類邏輯
for (const title of pages) {
  if (/^Kawakawasan ratoh/i.test(title)) {
    results.kawakawasan.push(title);
  } else if (knownPresidents.has(title)) {
    results.presidents_us.push(title);
  } else if (knownTwPresidents.has(title)) {
    results.presidents_tw.push(title);
  } else if (knownCountries.has(title)) {
    results.fonga.push(title);
  } else if (villagePattern.test(title) || knownVillages.has(title)) {
    results.villages.push(title);
  } else if (/^[a-z'']/.test(title)) {
    results.kimad.push(title);
  } else {
    results.other.push(title);
  }
}

// 輸出報告
console.log('=== 分類結果 ===');
console.log(`傳統故事 Kawakawasan ratoh: ${results.kawakawasan.length} 筆`);
console.log(`美國總統: ${results.presidents_us.length} 筆`);
console.log(`臺灣總統: ${results.presidents_tw.length} 筆`);
console.log(`阿美族部落: ${results.villages.length} 筆`);
console.log(`英文條目（含國名）: ${results.fonga.length} 筆`);
console.log(`阿美語詞彙: ${results.kimad.length} 筆`);
console.log(`其他: ${results.other.length} 筆`);

fs.writeFileSync(
  path.join(__dirname, '..', 'categorized-pages.json'),
  JSON.stringify(results, null, 2), 'utf8'
);
console.log('\n✓ 已寫入 categorized-pages.json');
