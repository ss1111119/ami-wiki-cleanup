import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

/**
 * Normalizes Amis text by converting to lowercase and removing diacritics/glottal stops
 * @param {string} text
 * @returns {string}
 */
export function normalizeText(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .replace(/[\^\u2019\u02bc\u0027\u2018]/g, '') // Remove ^ and glottal stops/quotes
    .trim();
}

// Dictionary store: key is normalized word
const dictionary = {};
const corpus = [];

// Helper to add/merge definitions into dictionary
function addWordDefinition({ word, dialect, category, level, chinese, remarks, examples = [] }) {
  const cleanWord = word.trim().replace(/\s+/g, ' ');
  if (!cleanWord) return;

  const norm = normalizeText(cleanWord);
  if (!dictionary[norm]) {
    dictionary[norm] = {
      word: cleanWord,
      normalized: norm,
      definitions: [],
      examples: []
    };
  }

  // Update base word if the new spelling is cleaner (e.g. no accents in one version)
  // but keep the one with accents as preferred spelling if it has it
  if (cleanWord.includes('^') && !dictionary[norm].word.includes('^')) {
    dictionary[norm].word = cleanWord;
  }

  // Check if definition already exists
  const existingDef = dictionary[norm].definitions.find(
    d => d.dialect === dialect && d.chinese === chinese
  );

  if (!existingDef) {
    dictionary[norm].definitions.push({
      dialect,
      category: category || '其他',
      level: level || '未知',
      chinese,
      remarks: remarks || ''
    });
  } else {
    // Merge category, level or remarks if existing is empty
    if (!existingDef.category || existingDef.category === '其他') existingDef.category = category;
    if (!existingDef.level || existingDef.level === '未知') existingDef.level = level;
    if (remarks && !existingDef.remarks.includes(remarks)) {
      existingDef.remarks = existingDef.remarks ? `${existingDef.remarks}；${remarks}` : remarks;
    }
  }

  // Add examples if any
  for (const ex of examples) {
    if (!ex.amis || !ex.chinese) continue;
    const isDup = dictionary[norm].examples.some(
      e => normalizeText(e.amis) === normalizeText(ex.amis)
    );
    if (!isDup) {
      dictionary[norm].examples.push({
        amis: ex.amis.trim(),
        chinese: ex.chinese.trim()
      });
    }
  }
}

// --- Parse CSV: klokah-wordlist.csv ---
function parseCSV(filePath) {
  console.log(`Parsing CSV: ${filePath}`);
  const csvText = readFileSync(filePath, 'utf8');
  const lines = csvText.split(/\r?\n/);
  
  // Headers: 方言,類別,級別,中文,阿美語,備註
  let parsedCount = 0;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    if (parts.length < 5) continue;

    const dialect = parts[0].trim();
    const category = parts[1].trim();
    const level = parts[2].trim();
    const chinese = parts[3].trim();
    const rawWord = parts[4].trim();
    const remarks = parts.slice(5).join(',').trim();

    // The word field can contain slashes like "polo’/mo^tep"
    const subWords = rawWord.split(/[/\uff0f]/);
    for (const sw of subWords) {
      if (!sw.trim()) continue;
      addWordDefinition({
        word: sw.trim(),
        dialect,
        category,
        level,
        chinese,
        remarks
      });
      parsedCount++;
    }
  }
  console.log(`✓ Parsed ${parsedCount} CSV word records.`);
}

// --- Parse MD Vocab Table: klokah-cu-amis-vocab.md & klokah-readingtext-vocab.md ---
function parseMDVocab(filePath) {
  console.log(`Parsing MD Vocab: ${filePath}`);
  const mdText = readFileSync(filePath, 'utf8');
  const lines = mdText.split(/\r?\n/);

  let currentDialect = '未知';
  let currentCategory = '其他';
  let tableStarted = false;
  let parsedCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect dialect section
    const dialectMatch = trimmed.match(/^#\s*([^（\s]+)阿美語/);
    if (dialectMatch) {
      currentDialect = dialectMatch[1].trim(); // "海岸" or "秀姑巒"
      continue;
    } else if (trimmed.match(/^#\s*(海岸阿美語|秀姑巒阿美語)/)) {
      currentDialect = trimmed.includes('海岸') ? '海岸' : '秀姑巒';
      continue;
    }

    // Detect category section
    const categoryMatch = trimmed.match(/^##\s*\d+\.\s*.*類別：([^）]+)）/);
    if (categoryMatch) {
      currentCategory = categoryMatch[1].trim();
      continue;
    }

    // Detect table headers or separators
    if (trimmed.startsWith('|') && (trimmed.includes('阿美語') || trimmed.includes('---'))) {
      tableStarted = true;
      continue;
    }

    if (tableStarted && trimmed.startsWith('|')) {
      const parts = trimmed.split('|').map(p => p.trim());
      // Format: | 阿美語 | 中文 | 例句(阿) | 例句(中) |
      // parts[0] is empty, parts[1] is Amis, parts[2] is Chinese, parts[3] is Example Amis, parts[4] is Example Chinese
      if (parts.length >= 5) {
        const word = parts[1];
        const chinese = parts[2];
        const exAmis = parts[3];
        const exZh = parts[4];

        if (word && chinese && word !== '阿美語') {
          const examples = (exAmis && exZh) ? [{ amis: exAmis, chinese: exZh }] : [];
          addWordDefinition({
            word,
            dialect: currentDialect,
            category: currentCategory,
            level: '未知',
            chinese,
            remarks: '',
            examples
          });
          parsedCount++;
        }
      }
    } else {
      tableStarted = false;
    }
  }
  console.log(`✓ Parsed ${parsedCount} MD table entries.`);
}

// --- Parse Corpus: news-ilrdf-2021-2022.md & news-ilrdf-2021-2022-b.md ---
function parseCorpus(filePath) {
  console.log(`Parsing Corpus: ${filePath}`);
  const text = readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#') && !l.startsWith('>'));
  
  let pairCount = 0;
  for (let i = 0; i < lines.length - 1; ) {
    const lineA = lines[i];
    const lineB = lines[i + 1];
    const isChineseA = /[\u4e00-\u9fa5]/.test(lineA);
    const isChineseB = /[\u4e00-\u9fa5]/.test(lineB);

    if (!isChineseA && isChineseB) {
      corpus.push({
        amis: lineA,
        chinese: lineB
      });
      pairCount++;
      i += 2;
    } else {
      i++;
    }
  }
  console.log(`✓ Parsed ${pairCount} parallel news corpus sentence pairs.`);
}

// --- Run Generation ---
function generate() {
  // 1. Parse wordlists
  parseCSV(join(root, 'glossary', 'corpus', 'klokah-wordlist.csv'));
  parseMDVocab(join(root, 'glossary', 'corpus', 'klokah-cu-amis-vocab.md'));
  parseMDVocab(join(root, 'glossary', 'corpus', 'klokah-readingtext-vocab.md'));

  // 2. Parse parallel corpus
  parseCorpus(join(root, 'glossary', 'corpus', 'news-ilrdf-2021-2022.md'));
  parseCorpus(join(root, 'glossary', 'corpus', 'news-ilrdf-2021-2022-b.md'));

  // Convert dictionary object to array
  const dictArray = Object.values(dictionary);

  // Consolidated database structure
  const database = {
    dictionary: dictArray,
    corpus: corpus
  };

  // 對外只部署字典(老師端不需要語料庫);語料另存為參考檔,不放進 public。
  const outputPath = join(root, 'review-app', 'public', 'dict-database.json');
  writeFileSync(outputPath, JSON.stringify({ dictionary: dictArray }, null, 2), 'utf8');

  const corpusRefPath = join(root, 'review-app', 'corpus-reference.json');
  writeFileSync(corpusRefPath, JSON.stringify({ corpus }, null, 2), 'utf8');

  console.log(`\n============================================================`);
  console.log(`✓ Database compiled successfully!`);
  console.log(`Output (deployed, dict only): ${outputPath}`);
  console.log(`Corpus reference (not deployed): ${corpusRefPath}`);
  console.log(`Total Dictionary Words: ${dictArray.length}`);
  console.log(`Total Corpus Sentences: ${corpus.length}`);
  console.log(`============================================================\n`);

  // --- Sanity checks ---
  console.log('Running sanity checks on generated data...');
  // 1. Find cecay
  const cecayEntry = database.dictionary.find(d => d.normalized === 'cecay');
  if (!cecayEntry) {
    throw new Error('Sanity Check Failed: "cecay" was not found in dictionary!');
  }
  console.log(`- Found "cecay" with ${cecayEntry.definitions.length} definitions:`, JSON.stringify(cecayEntry.definitions));

  // 2. Find tosa^
  const tosaEntry = database.dictionary.find(d => d.normalized === 'tosa');
  if (!tosaEntry) {
    throw new Error('Sanity Check Failed: "tosa^" was not found in dictionary under "tosa" normalized key!');
  }
  console.log(`- Found "tosa" under normalized key: word is "${tosaEntry.word}"`);

  // 3. Corpus check
  if (database.corpus.length === 0) {
    throw new Error('Sanity Check Failed: Corpus array is empty!');
  }
  const bidenMatch = database.corpus.find(c => c.amis.includes('Biden') || c.chinese.includes('拜登'));
  if (!bidenMatch) {
    throw new Error('Sanity Check Failed: Did not find any Biden news segment in corpus!');
  }
  console.log(`- Found Biden corpus entry: "${bidenMatch.amis.substring(0, 40)}..."`);
  console.log('✓ All sanity checks passed.');
}

// Run self test first
const testCases = [
  { input: 'tosa^', expected: 'tosa' },
  { input: 'polo’', expected: 'polo' },
  { input: 'poloʼ', expected: 'polo' },
  { input: 'POLO\'', expected: 'polo' },
  { input: 'cecay', expected: 'cecay' },
];

for (const tc of testCases) {
  const actual = normalizeText(tc.input);
  if (actual !== tc.expected) {
    throw new Error(`Self-test failed for input "${tc.input}": expected "${tc.expected}", got "${actual}"`);
  }
}

generate();
