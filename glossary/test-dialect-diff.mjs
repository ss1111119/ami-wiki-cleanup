import assert from 'assert';
import { parseAndCompareWordList } from './build-dialect-diff.mjs';

console.log('Running build-dialect-diff unit tests...');

// Mock CSV content for testing
const mockCSV = `方言,類別,級別,中文,阿美語,備註
海岸,01數字計量,初級,二,tosa,
海岸,02代名詞、指示詞,初級,他,cingra,
海岸,33助動詞,初級,能夠,mangaʼay,
海岸,36助詞或其他,初級,因為,nawhan,
秀姑巒,01數字計量,初級,二,tosa^,
秀姑巒,02代名詞、指示詞,初級,他,ciira,
秀姑巒,33助動詞,初級,能夠,maedeng,
秀姑巒,36助詞或其他,初級,因為,nawhani,`;

const result = parseAndCompareWordList(mockCSV);

// Check that it returned the paired words and stats
assert.ok(result.diffs);
assert.ok(result.stats);

// The differences list should contain cingra->ciira, manga'ay->maedeng, nawhan->nawhani, tosa->tosa^
assert.strictEqual(result.diffs.length, 4);

const pronounDiff = result.diffs.find(d => d.chinese === '他');
assert.ok(pronounDiff);
assert.strictEqual(pronounDiff.coast, 'cingra');
assert.strictEqual(pronounDiff.xiu, 'ciira');
assert.strictEqual(pronounDiff.type, '代名詞');

const auxDiff = result.diffs.find(d => d.chinese === '能夠');
assert.ok(auxDiff);
assert.strictEqual(auxDiff.type, '助動詞');

console.log('✓ All build-dialect-diff unit tests passed!');
