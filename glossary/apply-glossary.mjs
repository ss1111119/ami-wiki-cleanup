import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export function applyGlossary(text, glossary) {
  const applied = [];
  let processed = text;

  // 1. Process avoid list (Amis text)
  if (glossary.avoid) {
    for (const item of glossary.avoid) {
      // Avoid matches should be case-insensitive and match word boundaries or simple substrings
      // Note: we can use a RegExp. But since Amis text may have apostrophes, we should handle word boundaries carefully.
      // E.g., \b is not fully reliable with non-ASCII or apostrophes, but for langdaway it works.
      // Let's use custom boundary check or regex:
      const escaped = item.ami.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
      
      if (regex.test(processed)) {
        processed = processed.replace(regex, (match) => {
          return `${match} [AVOID: ${item.reason}; SUGGEST: ${item.use}]`;
        });
        applied.push(`Avoided term "${item.ami}" marked (Reason: ${item.reason}, Suggestion: ${item.use})`);
      }
    }
  }

  // 2. Process terms list (Chinese to Amis replacement, or checking variants)
  if (glossary.terms) {
    for (const term of glossary.terms) {
      // Replace Chinese terms with Amis
      if (processed.includes(term.zh)) {
        processed = processed.replaceAll(term.zh, `${term.ami} (Confirmed term for "${term.zh}")`);
        applied.push(`Chinese term "${term.zh}" replaced with "${term.ami}"`);
      }
    }
  }

  // 3. Grammar rule checks (Case markers, VSO order, and numbers)
  // Check case markers: ko, to, no
  const detectedMarkers = [];
  if (/\bko\b/i.test(text)) detectedMarkers.push('ko');
  if (/\bto\b/i.test(text)) detectedMarkers.push('to');
  if (/\bno\b/i.test(text)) detectedMarkers.push('no');

  if (detectedMarkers.length > 0) {
    const listStr = detectedMarkers.join('、');
    applied.push(`[格位標記] 偵測到格位標記: ${detectedMarkers.join(', ')}。請確認: ko 是否正確標記主語、no 是否標記屬格/施事者、to 是否標記受詞/斜格。`);
  }

  // Check VSO word order: if first word is a verb/predicate
  const words = text.split(/\s+/).map(w => w.replace(/^[^a-zA-Z0-9\u4e00-\u9fa5'ʼ^-]+|[^a-zA-Z0-9\u4e00-\u9fa5'ʼ^-]+$/g, "")).filter(Boolean);
  if (words.length > 0) {
    const firstWord = words[0].toLowerCase();
    // A predicate in Amis often starts with ma, mi, m-, pa, ka, caay, cowa, aka, or is 'ira'
    if (firstWord.startsWith('mi') || firstWord.startsWith('ma') || firstWord.startsWith('pa') || firstWord.startsWith('ka') || 
        firstWord === 'ira' || firstWord === 'cowa' || firstWord === 'caay' || firstWord === 'aka' || firstWord.startsWith('m-')) {
      applied.push(`[語序] 偵測到疑似句首謂語 "${words[0]}"。請確認其謂語在前 (VSO) 的結構是否合宜。`);
    }
  }

  // Check number representation
  const numberWords = ['cecay', 'tosa', 'tolo', 'sepat', 'lima', 'enem', 'pito', 'falo', 'siwa', 'polo', 'moetep'];
  const detectedNumWords = [];
  for (const num of numberWords) {
    const regex = new RegExp(`\\b${num}\\b`, 'i');
    if (regex.test(text)) {
      detectedNumWords.push(num);
    }
  }
  if (detectedNumWords.length > 0) {
    applied.push(`[數字規範] 偵測到拼音數字: ${detectedNumWords.join(', ')}。請確認是否需轉換為阿拉伯數字（如 10 ko mihecaan）。`);
  }

  // 4. 殘留中文標記檢查（「查無標中文」規則之發布守門）
  // 偵測 【...】 形式的中文佔位標記；發布前必須由老師填譯清除。
  const placeholders = [...processed.matchAll(/【[^】]*】/g)].map((m) => m[0]);

  return { processed, applied, placeholders };
}

// Execution block if run directly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isMain = process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(__filename);

if (isMain) {
  const args = process.argv.slice(2);
  const publishCheck = args.includes('--publish-check');
  const positional = args.filter((a) => !a.startsWith('--'));
  if (positional.length === 0) {
    console.log('Usage: node glossary/apply-glossary.mjs "<text_or_filepath>" [--publish-check]');
    console.log('  --publish-check: 若殘留【中文標記】則以非 0 結束（發布守門）');
    process.exit(0);
  }

  let input = positional[0];
  // Check if it is a file path
  if (fs.existsSync(input)) {
    input = fs.readFileSync(input, 'utf8');
  }

  try {
    const rootDir = path.resolve(__dirname, '..');
    const glossaryPath = path.join(rootDir, 'glossary', 'teacher-confirmed.json');

    if (!fs.existsSync(glossaryPath)) {
      console.error(`Error: teacher-confirmed.json not found at ${glossaryPath}`);
      process.exit(1);
    }

    const glossary = JSON.parse(fs.readFileSync(glossaryPath, 'utf8'));
    const result = applyGlossary(input, glossary);

    console.log('\n--- Processed Text ---');
    console.log(result.processed);

    console.log('\n--- Applied Checklist ---');
    if (result.applied.length === 0) {
      console.log('  No glossary terms or avoided words were matched.');
    } else {
      result.applied.forEach(item => {
        console.log(`  ✓ ${item}`);
      });
    }

    // 殘留中文標記檢查（發布守門）
    console.log('\n--- 殘留中文標記檢查（查無標中文）---');
    if (result.placeholders.length === 0) {
      console.log('  ✓ 無殘留【中文標記】，符合發布條件。');
    } else {
      console.log(`  ⚠️ 殘留 ${result.placeholders.length} 個中文標記，發布前須由老師填譯清除：`);
      result.placeholders.forEach((p) => console.log(`     ${p}`));
      if (publishCheck) {
        console.log('  ✗ --publish-check：因殘留中文標記，判定「不可發布」。');
        process.exit(2);
      }
    }
    console.log();

  } catch (err) {
    console.error('Error applying glossary:', err);
    process.exit(1);
  }
}
