import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Core utility functions
export function cleanAmisText(text) {
  if (!text) return "";
  let clean = text.trim();
  // Truncate at first Chinese character (Han Ideographs)
  const match = clean.match(/[\u4e00-\u9fa5\u3400-\u4dbf\uf900-\ufaff]/);
  if (match) {
    clean = clean.substring(0, match.index).trim();
  }
  // Remove enclosing quotes
  if (clean.startsWith('"') && clean.endsWith('"')) {
    clean = clean.substring(1, clean.length - 1).trim();
  }
  if (clean.startsWith("'") && clean.endsWith("'")) {
    clean = clean.substring(1, clean.length - 1).trim();
  }
  return clean;
}

export function parseMoeDictExample(exampleStr) {
  if (!exampleStr) return null;
  // Format: \ufff9Amis\ufffaEnglish\ufffbChinese or \ufff9Amis\ufffa\ufffbChinese
  let cleanStr = exampleStr.replace(/^\ufff9/, "");
  let indexA = cleanStr.indexOf('\ufffa');
  let indexB = cleanStr.indexOf('\ufffb');
  if (indexA === -1 && indexB === -1) {
    return null;
  }
  let amis = "";
  let chinese = "";
  if (indexA !== -1) {
    amis = cleanStr.substring(0, indexA);
    if (indexB !== -1 && indexB > indexA) {
      chinese = cleanStr.substring(indexB + 1);
    } else {
      chinese = cleanStr.substring(indexA + 1);
    }
  } else {
    amis = cleanStr.substring(0, indexB);
    chinese = cleanStr.substring(indexB + 1);
  }
  
  // Clean backticks and tildes
  amis = amis.replace(/[`~]/g, "").trim();
  chinese = chinese.trim();
  
  return { amis, chinese };
}

export function getDialectFromFilename(filename) {
  const base = path.basename(filename);
  if (base.startsWith('1_') || base.includes("南勢")) return "南勢";
  if (base.startsWith('2_') || base.includes("秀姑巒")) return "秀姑巒";
  if (base.startsWith('3_') || base.includes("海岸")) return "海岸";
  if (base.startsWith('4_') || base.includes("馬蘭")) return "馬蘭";
  if (base.startsWith('5_') || base.includes("恆春")) return "恆春";
  return null;
}

export function parseCSV(content) {
  const lines = [];
  let currentLine = [];
  let currentField = '';
  let inQuotes = false;
  
  // Normalize newlines
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    if (char === '"') {
      if (inQuotes && normalized[i + 1] === '"') {
        currentField += '"';
        i++; // skip next quote
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

// 2. CSV Column Helper
function findColumnIndices(headerRow, type) {
  let amisIdx = -1;
  let chineseIdx = -1;
  let levelIdx = -1;
  let grammarIdx = -1;

  for (let i = 0; i < headerRow.length; i++) {
    const col = headerRow[i].trim().toLowerCase();
    if (type === 'readnews-title') {
      if (col.includes('標題') && col.includes('族')) {
        amisIdx = i;
      }
      if (col.includes('標題') && col.includes('中')) {
        chineseIdx = i;
      }
    } else {
      if (col.includes('族') || col === 'amis') {
        amisIdx = i;
      }
      if (col.includes('中') || col === 'chinese' || col === 'zh') {
        chineseIdx = i;
      }
    }
    if (col.includes('級') || col.includes('level')) {
      levelIdx = i;
    }
    if (col.includes('句法') || col.includes('grammar')) {
      grammarIdx = i;
    }
  }

  // Fallbacks
  if (amisIdx === -1) {
    if (type === 'grmpts' || type === 'klokah-culture') amisIdx = 4;
    else if (type === 'klokah-situational' || type === 'klokah-shortread') amisIdx = 2;
    else if (type === 'readnews-title') amisIdx = 3;
  }
  if (chineseIdx === -1) {
    if (type === 'grmpts' || type === 'klokah-culture') chineseIdx = 5;
    else if (type === 'klokah-situational' || type === 'klokah-shortread') chineseIdx = 3;
    else if (type === 'readnews-title') chineseIdx = 4;
  }
  if (levelIdx === -1 && type === 'grmpts') levelIdx = 1;
  if (grammarIdx === -1 && type === 'grmpts') grammarIdx = 2;

  return { amisIdx, chineseIdx, levelIdx, grammarIdx };
}

// 3. Execution logic if run directly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isMain = process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(__filename);

if (isMain) {
  try {
    const rootDir = path.resolve(__dirname, '..');
    const corpus = [];

    // Stats trackers
    const statsBySource = {};
    const statsByDialect = {};

    function addRecord(record) {
      if (!record.amis || !record.chinese) return;
      
      corpus.push(record);

      // Increment stats
      statsBySource[record.source] = (statsBySource[record.source] || 0) + 1;
      statsByDialect[record.dialect] = (statsByDialect[record.dialect] || 0) + 1;
    }

    // A. Parse local klokah CSVs
    const csvSources = [
      {
        dir: path.join(rootDir, '200族語e樂園', '句法演練'),
        source: 'grmpts',
        license: 'CC-BY-NC-SA'
      },
      {
        dir: path.join(rootDir, '200族語e樂園', '文化篇'),
        source: 'klokah-culture',
        license: 'CC-BY-NC-SA'
      },
      {
        dir: path.join(rootDir, '200族語e樂園', '情境族語', '課文'),
        source: 'klokah-situational',
        license: 'CC-BY-NC-SA'
      },
      {
        dir: path.join(rootDir, '200族語e樂園', '族語短文', '課文'),
        source: 'klokah-shortread',
        license: 'CC-BY-NC-SA'
      },
      {
        dir: path.join(rootDir, '200族語e樂園', '族語新聞'),
        source: 'readnews-title',
        license: 'CC-BY-NC-SA' // Wait, the summary mapping says: "readnews / news -> fair-use"
        // Let's use 'fair-use' for readnews-title!
      }
    ];

    for (const src of csvSources) {
      if (!fs.existsSync(src.dir)) {
        console.warn(`[Warning] Directory not found: ${src.dir}`);
        continue;
      }

      // Read files starting with 1-5 and ending with .csv
      const files = fs.readdirSync(src.dir).filter(f => /^[1-5]_.*\.csv$/.test(f));
      
      for (const file of files) {
        const filePath = path.join(src.dir, file);
        const dialect = getDialectFromFilename(file);
        if (!dialect) continue;

        const content = fs.readFileSync(filePath, 'utf8');
        const rows = parseCSV(content);
        if (rows.length === 0) continue;

        const headers = rows[0];
        const { amisIdx, chineseIdx, levelIdx, grammarIdx } = findColumnIndices(headers, src.source);

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length <= Math.max(amisIdx, chineseIdx)) continue;

          const rawAmis = row[amisIdx];
          const rawChinese = row[chineseIdx];

          const amis = cleanAmisText(rawAmis);
          const chinese = (rawChinese || '').trim();

          if (!amis || !chinese) continue;

          const license = src.source === 'readnews-title' ? 'fair-use' : src.license;
          const record = {
            amis,
            chinese,
            source: src.source,
            license,
            dialect
          };

          if (src.source === 'grmpts') {
            if (levelIdx !== -1 && row[levelIdx]) {
              record.level = row[levelIdx].trim();
            }
            if (grammarIdx !== -1 && row[grammarIdx]) {
              record.grammar_cat = row[grammarIdx].trim();
            }
          }

          addRecord(record);
        }
      }
    }

    // B. Parse news md
    const corpusDir = path.join(rootDir, 'glossary', 'corpus');
    if (fs.existsSync(corpusDir)) {
      const mdFiles = fs.readdirSync(corpusDir).filter(f => f.startsWith('news-ilrdf-') && f.endsWith('.md'));
      for (const file of mdFiles) {
        const filePath = path.join(corpusDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Parse alternating lines
        const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
        let expectedAmis = null;

        for (let line of lines) {
          line = line.trim();
          if (!line || line.startsWith('#') || line.startsWith('>') || line.startsWith('---')) {
            continue;
          }

          if (expectedAmis === null) {
            expectedAmis = line;
          } else {
            const amis = cleanAmisText(expectedAmis);
            const chinese = line;
            if (amis && chinese) {
              addRecord({
                amis,
                chinese,
                source: 'news',
                license: 'fair-use',
                dialect: '秀姑巒'
              });
            }
            expectedAmis = null;
          }
        }
      }
    }

    // C. Parse Moedict JSON
    const dictDir = path.join(rootDir, 'dict');
    const moedictFiles = ['dict-amis-safolu.json', 'dict-amis.json'];
    for (const filename of moedictFiles) {
      const filePath = path.join(dictDir, filename);
      if (fs.existsSync(filePath)) {
        console.log(`Parsing dictionary file: ${filename}...`);
        const entries = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        for (const entry of entries) {
          if (!entry.heteronyms) continue;
          for (const het of entry.heteronyms) {
            if (!het.definitions) continue;
            for (const def of het.definitions) {
              if (!def.example) continue;
              for (const ex of def.example) {
                const parsed = parseMoeDictExample(ex);
                if (parsed && parsed.amis && parsed.chinese) {
                  addRecord({
                    amis: parsed.amis,
                    chinese: parsed.chinese,
                    source: 'moedict',
                    license: 'CC0',
                    dialect: '秀姑巒'
                  });
                }
              }
            }
          }
        }
      }
    }

    // D. Validation
    console.log('\n--- Corpus Statistics ---');
    console.log(`Total records aggregated: ${corpus.length}`);
    
    console.log('\nBy Source:');
    Object.entries(statsBySource).forEach(([k, v]) => {
      console.log(`  - ${k}: ${v}`);
    });

    console.log('\nBy Dialect:');
    Object.entries(statsByDialect).forEach(([k, v]) => {
      console.log(`  - ${k}: ${v}`);
    });

    // Check constraints
    if (corpus.length < 30000) {
      throw new Error(`Validation failed: Total records (${corpus.length}) is less than 30,000.`);
    }

    // 海岸阿美語真實乾淨數量約 1638(文化篇/情境/短文/族語新聞);
    // 原門檻 3500 是基於誤抓的 grmpts 海岸(實為賽夏語,已隔離),故下修。
    // 待找到 grmpts 海岸阿美語的正確 did 重抓後可再調高。
    const coastAmisCount = statsByDialect['海岸'] || 0;
    if (coastAmisCount < 1500) {
      throw new Error(`Validation failed: Coast Amis records (${coastAmisCount}) is less than 1,500.`);
    }

    // Check for empty licenses or dialects
    const invalidRecord = corpus.find(r => !r.license || !r.dialect || !r.amis || !r.chinese);
    if (invalidRecord) {
      throw new Error(`Validation failed: Found record with empty fields: ${JSON.stringify(invalidRecord)}`);
    }

    // Save to glossary/parallel-corpus.json
    const outputPath = path.join(rootDir, 'glossary', 'parallel-corpus.json');
    console.log(`\nWriting to output file: ${outputPath}...`);
    fs.writeFileSync(outputPath, JSON.stringify(corpus, null, 2), 'utf8');
    console.log('✓ Success! parallel-corpus.json written successfully.');

  } catch (error) {
    console.error('Error building corpus:', error);
    process.exit(1);
  }
}
