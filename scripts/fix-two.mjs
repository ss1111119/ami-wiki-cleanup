import fs from 'fs';
const d = JSON.parse(fs.readFileSync('scripts/wiki-descriptions.json', 'utf8'));
d['Pahakelong han i likisi ko kawasan ni Wufong'] = '吳鳳神話';
d["Pipaka'orad a lisin no 'Amis"] = '祈雨祭';
fs.writeFileSync('scripts/wiki-descriptions.json', JSON.stringify(d, null, 2), 'utf8');
console.log('Fixed');
