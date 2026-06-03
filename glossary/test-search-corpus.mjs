import assert from 'assert';
import { searchInCorpus } from './search-corpus.mjs';

console.log('Running search-corpus unit tests...');

// Mock corpus for testing
const mockCorpus = [
  { amis: 'hini katin.', chinese: '這是牛。', source: 'grmpts', license: 'CC-BY-NC-SA', dialect: '海岸', grammar_cat: '名詞', level: '初級' },
  { amis: 'hiza somay.', chinese: '那是熊。', source: 'grmpts', license: 'CC-BY-NC-SA', dialect: '海岸', grammar_cat: '名詞', level: '初級' },
  { amis: 'hini wacu.', chinese: '這是狗。', source: 'grmpts', license: 'CC-BY-NC-SA', dialect: '馬蘭', grammar_cat: '名詞', level: '初級' },
  { amis: 'maan ko demak?', chinese: '做什麼事？', source: 'moedict', license: 'CC0', dialect: '秀姑巒' },
  { amis: 'makomod ko omah.', chinese: '水田被承租耕種。', source: 'klokah-culture', license: 'CC-BY-NC-SA', dialect: '秀姑巒' }
];

// 1. Test basic search (keyword mode)
console.log('Testing basic search...');
const res1 = searchInCorpus('牛', mockCorpus, null, { k: 2 });
assert.strictEqual(res1.degraded, true);
assert.strictEqual(res1.results.length, 1);
assert.strictEqual(res1.results[0].record.amis, 'hini katin.');

// 2. Test dialect filter
console.log('Testing dialect filter...');
const res2 = searchInCorpus('這是', mockCorpus, null, { k: 5, dialect: '海岸' });
assert.ok(res2.results.every(r => r.record.dialect === '海岸'));
assert.strictEqual(res2.results.length, 2);

// 3. Test grammar filter
console.log('Testing grammar filter...');
const res3 = searchInCorpus('這是', mockCorpus, null, { k: 5, grammar: '名詞' });
assert.ok(res3.results.every(r => r.record.grammar_cat === '名詞'));

// 4. Test score sorting
console.log('Testing score sorting descending...');
const res4 = searchInCorpus('是', mockCorpus, null, { k: 5 });
let prevScore = Infinity;
for (const r of res4.results) {
  assert.ok(r.score <= prevScore);
  prevScore = r.score;
}

// 5. Test coast priority boost
console.log('Testing coast priority boost...');
// "這是狗" in 馬蘭, "這是牛" and "那是熊" in 海岸. Query "這是" matches "這是狗" and "這是牛" equally on keyword basis.
// But Coast Amis ('海岸') should get a priority boost.
const res5 = searchInCorpus('這是', mockCorpus, null, { k: 5 });
assert.strictEqual(res5.results[0].record.dialect, '海岸'); // Should be 'hini katin.' (海岸) instead of 'hini wacu.' (馬蘭) due to boost

console.log('✓ All search-corpus unit tests passed!');
