import fs from 'fs';
const pages = JSON.parse(fs.readFileSync('all-pages.json', 'utf8'));
const entry = pages.find(p => p.includes('Mapohaway'));
console.log(JSON.stringify(entry));
const codes = [...entry].map(c => c.charCodeAt(0).toString(16).padStart(4, '0') + '(' + c + ')').join(' ');
console.log(codes);
// Generate proper URL
const url = 'https://ami.wikipedia.org/wiki/' + entry.replace(/ /g, '_');
console.log('\nURL (raw):', url);
console.log('URL (encodeURI):', encodeURI(url));
