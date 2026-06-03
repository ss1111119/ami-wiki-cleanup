import assert from 'assert';
import { applyGlossary } from './apply-glossary.mjs';

console.log('Running apply-glossary unit tests...');

const mockGlossary = {
  terms: [
    { zh: '政府', ami: 'seyfo', note: '統一用 seyfo', by: 'teacher', date: '2026-06-03' }
  ],
  avoid: [
    { ami: 'ceng fo', reason: '政府改用 seyfo', use: 'seyfo' },
    { ami: 'langdaway', reason: '綠蛇/青竹絲,勿用於『綠化』', use: 'makofakof' }
  ],
  rules: []
};

// 1. Test avoid term tagging
console.log('Testing avoid term tagging...');
const input1 = 'o langdaway ko maro’ay itini.';
const res1 = applyGlossary(input1, mockGlossary);
console.log('Processed:', res1.processed);
console.log('Applied:', res1.applied);

assert.ok(res1.processed.includes('langdaway [AVOID: 綠蛇/青竹絲,勿用於『綠化』; SUGGEST: makofakof]'));
assert.strictEqual(res1.applied.length, 2);

// 2. Test term translation replacement
console.log('Testing term translation replacement...');
const input2 = '這是政府的政策。';
const res2 = applyGlossary(input2, mockGlossary);
console.log('Processed:', res2.processed);
console.log('Applied:', res2.applied);

assert.ok(res2.processed.includes('seyfo'));
assert.strictEqual(res2.applied.length, 1);

// 3. Test grammar rule checks (VSO and Case Markers)
console.log('Testing grammar rule checks...');
const input3 = 'mafolaw to no Ingko ko Singkapol';
const res3 = applyGlossary(input3, mockGlossary);
console.log('Processed:', res3.processed);
console.log('Applied:', res3.applied);

// The original text should be unchanged
assert.strictEqual(res3.processed, input3);
// Should output VSO and Case markers checks
assert.ok(res3.applied.some(x => x.includes('[格位標記]')));
assert.ok(res3.applied.some(x => x.includes('[語序]')));

console.log('✓ All apply-glossary unit tests passed!');
