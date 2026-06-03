import assert from 'assert';
import { cleanAmisText, parseMoeDictExample, getDialectFromFilename, parseCSV } from './build-corpus.mjs';

console.log('Running build-corpus unit tests...');

// 1. Test cleanAmisText
console.log('Testing cleanAmisText...');
assert.strictEqual(cleanAmisText('Na masolinga’'), 'Na masolinga’');
assert.strictEqual(cleanAmisText('hini katin.這是牛。'), 'hini katin.');
assert.strictEqual(cleanAmisText('"hiza somay."'), 'hiza somay.');
assert.strictEqual(cleanAmisText("'hiza somay.'"), 'hiza somay.');
assert.strictEqual(cleanAmisText('  katin.  '), 'katin.');

// 2. Test parseMoeDictExample
console.log('Testing parseMoeDictExample...');
const ex1 = parseMoeDictExample('\ufff9`o~ `ci~`pida~`ay~ `a~ `tamdaw~\ufffaa rich person\ufffb有錢人，富裕的人');
assert.deepStrictEqual(ex1, {
  amis: 'o cipidaay a tamdaw',
  chinese: '有錢人，富裕的人'
});

const ex2 = parseMoeDictExample('\ufff9`Mapereday~ `ko~ `paenan~.\ufffa\ufffb地板塌陷下去了。');
assert.deepStrictEqual(ex2, {
  amis: 'Mapereday ko paenan.',
  chinese: '地板塌陷下去了。'
});

// 3. Test getDialectFromFilename
console.log('Testing getDialectFromFilename...');
assert.strictEqual(getDialectFromFilename('3_海岸阿美語.csv'), '海岸');
assert.strictEqual(getDialectFromFilename('2_秀姑巒阿美語.csv'), '秀姑巒');
assert.strictEqual(getDialectFromFilename('5_恆春阿美語.csv'), '恆春');

// 4. Test parseCSV
console.log('Testing parseCSV...');
const csvData = `方言,級別,句法分類,tid,族語,中文
海岸阿美語,初級,名詞,3371,hini katin.,這是牛。
海岸阿美語,初級,名詞,3371,"hini ""inoka"" a ngabas.",這是大魚的嘴巴。
海岸阿美語,初級,名詞,3371,"hini a wacu, a pusi.",這是狗，與貓。`;

const parsed = parseCSV(csvData);
assert.strictEqual(parsed.length, 4);
assert.strictEqual(parsed[1][4], 'hini katin.');
assert.strictEqual(parsed[1][5], '這是牛。');
assert.strictEqual(parsed[2][4], 'hini "inoka" a ngabas.');
assert.strictEqual(parsed[3][4], 'hini a wacu, a pusi.');

console.log('✓ All unit tests passed!');
