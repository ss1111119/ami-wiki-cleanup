import assert from 'assert';
import { diffSentences } from './extract-from-edits.mjs';

console.log('Running extract-from-edits unit tests...');

// 1. Test basic replacement
const b1 = 'o Singkapolu hananay a kitakit, o Singkapolo hananay';
const r1 = 'o Singkapolu hananay a kitakit, o hananay';
const res1 = diffSentences(b1, r1);

// Should find that 'Singkapolo' was removed and not replaced directly by anything in place
// Or if it was deleted, it's a deletion candidate.
console.log('Diff result 1:', res1);
assert.ok(res1.length > 0);
assert.ok(res1.some(c => c.from === 'Singkapolo' && !c.to));

// 2. Test word substitution
const b2 = 'ceng fo ko mikowanay';
const r2 = 'seyfo ko mikowanay';
const res2 = diffSentences(b2, r2);
console.log('Diff result 2:', res2);
assert.ok(res2.length > 0);
assert.ok(res2.some(c => c.from === 'ceng fo' && c.to === 'seyfo'));

console.log('✓ All extract-from-edits unit tests passed!');
