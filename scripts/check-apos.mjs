import fs from 'fs';
const pages = JSON.parse(fs.readFileSync('all-pages.json', 'utf8'));
const check = pages.filter(p =>
  p.includes('sawa') || p.includes('lotong') || p.includes('apaay') ||
  p.includes('edo') || p.includes('Pangcah') || p.includes('eferay') || p.includes('lotok')
);
check.forEach(p => {
  const apos = [...p].filter(c => c.charCodeAt(0) === 0x27 || c.charCodeAt(0) === 0x2019 || c.charCodeAt(0) === 0x02BC);
  console.log(JSON.stringify(p) + ' apos: ' + apos.map(c => c.charCodeAt(0).toString(16)).join(','));
});
