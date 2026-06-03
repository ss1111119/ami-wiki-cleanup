import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Tokenizer for Amis and Chinese
export function tokenize(text) {
  if (!text) return [];
  const rawWords = text.split(/\s+/);
  return rawWords
    .map(w => {
      // Strip leading and trailing punctuation, keeping letters, numbers, Han characters, apostrophes, hyphens, circumflexes
      return w.replace(/^[^a-zA-Z0-9\u4e00-\u9fa5'ʼ^-]+|[^a-zA-Z0-9\u4e00-\u9fa5'ʼ^-]+$/g, "");
    })
    .filter(Boolean);
}

// 2. LCS Word Diff Algorithm
export function diffArrays(oldArr, newArr) {
  const m = oldArr.length;
  const n = newArr.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldArr[i - 1] === newArr[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let i = m;
  let j = n;
  const steps = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldArr[i - 1] === newArr[j - 1]) {
      steps.unshift({ type: 'equal', value: oldArr[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      steps.unshift({ type: 'added', value: newArr[j - 1] });
      j--;
    } else {
      steps.unshift({ type: 'removed', value: oldArr[i - 1] });
      i--;
    }
  }

  return steps;
}

// 3. Extract term/avoid candidates from diff steps
export function diffSentences(baseline, reviewed) {
  const oldWords = tokenize(baseline);
  const newWords = tokenize(reviewed);
  const steps = diffArrays(oldWords, newWords);

  const candidates = [];
  let i = 0;
  
  while (i < steps.length) {
    if (steps[i].type === 'equal') {
      i++;
      continue;
    }

    const removed = [];
    while (i < steps.length && steps[i].type === 'removed') {
      removed.push(steps[i].value);
      i++;
    }

    const added = [];
    while (i < steps.length && steps[i].type === 'added') {
      added.push(steps[i].value);
      i++;
    }

    if (removed.length > 0 || added.length > 0) {
      const from = removed.join(' ');
      const to = added.join(' ');
      
      let type = 'term';
      if (from && !to) {
        type = 'avoid';
      }
      
      candidates.push({
        type,
        from: from || null,
        to: to || null
      });
    }
  }
  return candidates;
}

// 4. Execution logic if run directly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isMain = process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(__filename);

if (isMain) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node glossary/extract-from-edits.mjs <articleId>');
    process.exit(1);
  }

  const articleId = args[0];

  const run = async () => {
    try {
      // Dynamic import firebase-admin
      const { initializeApp } = await import('firebase-admin/app');
      const { getFirestore } = await import('firebase-admin/firestore');
      
      initializeApp({ projectId: 'ami-wiki-review' });
      const db = getFirestore();

      console.log(`Fetching article: ${articleId}...`);
      const articleRef = db.collection('translations').doc(articleId);
      const articleSnap = await articleRef.get();

      if (!articleSnap.exists) {
        console.error(`Error: Article "${articleId}" not found in Firestore.`);
        process.exit(1);
      }

      console.log(`Fetching sections for article: ${articleId}...`);
      const sectionsSnap = await articleRef.collection('sections').orderBy('order').get();

      const candidates = [];

      sectionsSnap.forEach(doc => {
        const data = doc.data();
        const sectionId = doc.id;

        if (!data.ami_baseline) {
          console.warn(`[Warning] Skipping section "${sectionId}" ("${data.title}") because ami_baseline is missing.`);
          return;
        }

        const baseline = data.ami_baseline;
        const reviewed = data.ami_reviewed || '';

        console.log(`Diffing section: ${sectionId}...`);
        const diffs = diffSentences(baseline, reviewed);

        for (const diff of diffs) {
          candidates.push({
            type: diff.type,
            zh: data.zh_text || '',
            from: diff.from,
            to: diff.to,
            sectionId
          });
        }
      });

      const rootDir = path.resolve(__dirname, '..');
      const outputPath = path.join(rootDir, 'glossary', 'edit-candidates.json');
      
      fs.writeFileSync(outputPath, JSON.stringify(candidates, null, 2), 'utf8');
      console.log(`✓ Success! Extracted ${candidates.length} candidates.`);
      console.log(`Saved to: ${outputPath}`);

    } catch (err) {
      console.error('Error running extract-from-edits:', err);
      process.exit(1);
    }
  };

  run();
}
