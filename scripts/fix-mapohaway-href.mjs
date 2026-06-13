import fs from 'fs';
const path = 'categories/index.html';
let html = fs.readFileSync(path, 'utf8');

// Fix the hardcoded Mapohaway href: replace straight apostrophe with curly apostrophe in the href
const before = `href="https://ami.wikipedia.org/wiki/Kawakawasan_ratoh:Mapohaway_a_masipolo'ay`;
const after  = `href="https://ami.wikipedia.org/wiki/Kawakawasan_ratoh:Mapohaway_a_masipolo’ay`;

if (!html.includes(before)) {
  console.log('Pattern not found — already fixed or different encoding');
} else {
  html = html.replace(before, after);
  fs.writeFileSync(path, html, 'utf8');
  console.log('Fixed: straight apostrophe → curly apostrophe in href');
}
