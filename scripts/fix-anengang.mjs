import fs from 'fs';
const d = JSON.parse(fs.readFileSync('scripts/wiki-descriptions.json', 'utf8'));

// U+0027 straight apostrophe version
d["'Anengang"] = '椅';
// U+2019 curly apostrophe version
d["’anengang"] = '椅';

fs.writeFileSync('scripts/wiki-descriptions.json', JSON.stringify(d, null, 2), 'utf8');
console.log('Done:', Object.values(d).filter(v => v).length, '筆');
