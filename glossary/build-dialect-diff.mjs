import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Simple CSV parser
function parseCSV(content) {
  const lines = [];
  let currentLine = [];
  let currentField = '';
  let inQuotes = false;
  
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    if (char === '"') {
      if (inQuotes && normalized[i + 1] === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentLine.push(currentField);
      currentField = '';
    } else if (char === '\n' && !inQuotes) {
      currentLine.push(currentField);
      lines.push(currentLine);
      currentLine = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }
  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField);
    lines.push(currentLine);
  }
  return lines;
}

export function parseAndCompareWordList(csvContent) {
  const rows = parseCSV(csvContent).filter(row => row.length > 0 && row[0].trim());
  if (rows.length === 0) {
    return { diffs: [], stats: {} };
  }

  const header = rows[0];
  const dataRows = rows.slice(1);

  const coast = [];
  const xiu = [];

  for (const row of dataRows) {
    const dialect = row[0].trim();
    const item = {
      category: row[1]?.trim() || '',
      level: row[2]?.trim() || '',
      chinese: row[3]?.trim() || '',
      amis: row[4]?.trim() || '',
      note: row[5]?.trim() || ''
    };
    if (dialect === '海岸') {
      coast.push(item);
    } else if (dialect === '秀姑巒') {
      xiu.push(item);
    }
  }

  const diffs = [];
  let differentCount = 0;

  // Pair Coast and Xiuguluan by Chinese word and category
  const xiuMap = new Map();
  for (const item of xiu) {
    const key = `${item.category}_${item.chinese}`;
    xiuMap.set(key, item);
  }

  for (const cItem of coast) {
    const key = `${cItem.category}_${cItem.chinese}`;
    const xItem = xiuMap.get(key);
    if (!xItem) continue;

    const cAmis = cItem.amis.toLowerCase().trim();
    const xAmis = xItem.amis.toLowerCase().trim();
    
    let type = 'other';
    const cat = cItem.category;
    if (cat === '02代名詞、指示詞') {
      if (/[這那此彼]/.test(cItem.chinese)) {
        type = '指示詞';
      } else {
        type = '代名詞';
      }
    } else if (cat === '33助動詞') {
      type = '助動詞';
    } else if (cat === '36助詞或其他' || cat === '35否定詞') {
      type = '助詞';
    }

    if (cAmis !== xAmis) {
      differentCount++;
      diffs.push({
        coast: cItem.amis,
        xiu: xItem.amis,
        chinese: cItem.chinese,
        category: cItem.category,
        type,
        level: cItem.level
      });
    }
  }

  const totalPaired = coast.length;
  const overallDiffRate = totalPaired > 0 ? differentCount / totalPaired : 0;

  const typeStats = {
    '代名詞': { total: 0, diff: 0 },
    '指示詞': { total: 0, diff: 0 },
    '助動詞': { total: 0, diff: 0 },
    '助詞': { total: 0, diff: 0 },
    'other': { total: 0, diff: 0 }
  };

  for (const cItem of coast) {
    const key = `${cItem.category}_${cItem.chinese}`;
    const xItem = xiuMap.get(key);
    if (!xItem) continue;

    let type = 'other';
    const cat = cItem.category;
    if (cat === '02代名詞、指示詞') {
      if (/[這那此彼]/.test(cItem.chinese)) {
        type = '指示詞';
      } else {
        type = '代名詞';
      }
    } else if (cat === '33助動詞') {
      type = '助動詞';
    } else if (cat === '36助詞或其他' || cat === '35否定詞') {
      type = '助詞';
    }

    typeStats[type].total++;
    if (cItem.amis.toLowerCase().trim() !== xItem.amis.toLowerCase().trim()) {
      typeStats[type].diff++;
    }
  }

  const stats = {
    totalPaired,
    differentCount,
    overallDiffRate,
    typeStats
  };

  return { diffs, stats };
}

// Execution block if run directly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isMain = process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(__filename);

if (isMain) {
  try {
    const rootDir = path.resolve(__dirname, '..');
    const wordlistPath = path.join(rootDir, 'glossary', 'corpus', 'klokah-wordlist.csv');

    if (!fs.existsSync(wordlistPath)) {
      console.error(`Error: klokah-wordlist.csv not found at ${wordlistPath}`);
      process.exit(1);
    }

    const csvContent = fs.readFileSync(wordlistPath, 'utf8');
    const { diffs, stats } = parseAndCompareWordList(csvContent);

    console.log('\n--- Dialect Difference Mapping Statistics ---');
    console.log(`Total paired words compared: ${stats.totalPaired}`);
    console.log(`Spelling differences found:   ${stats.differentCount}`);
    console.log(`Overall difference rate:     ${(stats.overallDiffRate * 100).toFixed(2)}%`);

    console.log('\nDifferences by Functional Category:');
    Object.entries(stats.typeStats).forEach(([type, info]) => {
      const rate = info.total > 0 ? (info.diff / info.total * 100).toFixed(2) : 0;
      console.log(`  - ${type}: ${info.diff}/${info.total} (${rate}%)`);
    });

    const outputPath = path.join(rootDir, 'glossary', 'dialect-diff.json');
    console.log(`\nWriting mapping to: ${outputPath}...`);
    fs.writeFileSync(outputPath, JSON.stringify({ diffs, stats }, null, 2), 'utf8');
    console.log('✓ Success! dialect-diff.json written successfully.');

  } catch (error) {
    console.error('Error building dialect diff:', error);
    process.exit(1);
  }
}
