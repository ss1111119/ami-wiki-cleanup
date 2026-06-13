import fs from 'fs';
const html = fs.readFileSync('categories/index.html', 'utf8');
const m = html.match(/href="(https:\/\/ami\.wikipedia\.org\/wiki\/Kawakawasan[^"]+)"/);
if (m) {
  const url = m[1];
  console.log('URL:', url);
  const apos = [...url].filter(c => c.charCodeAt(0) === 0x27 || c.charCodeAt(0) === 0x2019);
  console.log('apostrophe codes:', apos.map(c => c.charCodeAt(0).toString(16)));
  console.log('encodeURI:', encodeURI(url));
}
