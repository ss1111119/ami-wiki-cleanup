import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to calculate cosine similarity
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Export search function for tests
export function searchInCorpus(query, corpus, index, options = {}) {
  const k = options.k || 5;
  const dialect = options.dialect;
  const grammar = options.grammar;

  // 1. Filter the corpus based on dialect and grammar first
  let filtered = corpus;
  if (dialect) {
    filtered = filtered.filter(r => r.dialect === dialect);
  }
  if (grammar) {
    filtered = filtered.filter(r => r.grammar_cat === grammar);
  }

  if (filtered.length === 0) {
    return { degraded: true, results: [] };
  }

  // 2. Vector search if index and queryEmbedding are provided
  if (index && index.embeddings && options.queryEmbedding) {
    const results = [];
    for (let i = 0; i < filtered.length; i++) {
      const rec = filtered[i];
      const origIdx = corpus.indexOf(rec);
      if (origIdx === -1 || !index.embeddings[origIdx]) continue;
      
      const emb = index.embeddings[origIdx];
      let score = cosineSimilarity(emb, options.queryEmbedding);
      
      // Boost Coast Amis ('海岸')
      if (rec.dialect === '海岸') {
        score *= 1.1;
      }
      results.push({ record: rec, score });
    }
    results.sort((a, b) => b.score - a.score);
    return { degraded: false, results: results.slice(0, k) };
  }

  // 3. Fallback: TF-IDF char-level keyword search (degraded)
  const queryChars = Array.from(query.replace(/\s+/g, ''));
  if (queryChars.length === 0) {
    return { degraded: true, results: [] };
  }

  // Build character frequencies across the filtered corpus to calculate IDF
  const df = {};
  for (const rec of filtered) {
    const charsInDoc = new Set(Array.from(rec.chinese));
    for (const char of charsInDoc) {
      df[char] = (df[char] || 0) + 1;
    }
  }

  const N = filtered.length;
  const idf = {};
  for (const char of queryChars) {
    const docFreq = df[char] || 0;
    // Standard IDF with smoothing
    idf[char] = Math.log(1 + (N - docFreq + 0.5) / (docFreq + 0.5));
  }

  const scoredResults = [];
  for (const rec of filtered) {
    const text = rec.chinese;
    let score = 0;
    
    for (const char of queryChars) {
      if (text.includes(char)) {
        score += idf[char];
      }
    }

    if (score > 0) {
      // Boost Coast Amis
      if (rec.dialect === '海岸') {
        score *= 1.1;
      }
      scoredResults.push({ record: rec, score });
    }
  }

  scoredResults.sort((a, b) => b.score - a.score);
  return { degraded: true, results: scoredResults.slice(0, k) };
}

// execution logic if run directly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isMain = process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(__filename);

if (isMain) {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log('Usage: node glossary/search-corpus.mjs "<query>" [--k <number>] [--dialect <dialect>] [--grammar <grammar>]');
    process.exit(0);
  }

  const query = args[0];
  let k = 5;
  let dialect = null;
  let grammar = null;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--k' && args[i + 1]) {
      k = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--dialect' && args[i + 1]) {
      dialect = args[i + 1];
      i++;
    } else if (args[i] === '--grammar' && args[i + 1]) {
      grammar = args[i + 1];
      i++;
    }
  }

  try {
    const rootDir = path.resolve(__dirname, '..');
    const corpusPath = path.join(rootDir, 'glossary', 'parallel-corpus.json');
    const indexPath = path.join(rootDir, 'glossary', 'parallel-corpus.index.json');

    if (!fs.existsSync(corpusPath)) {
      console.error(`Error: parallel-corpus.json not found at ${corpusPath}. Please run "node glossary/build-corpus.mjs" first.`);
      process.exit(1);
    }

    const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));
    let index = null;
    if (fs.existsSync(indexPath)) {
      index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    }

    const searchResult = searchInCorpus(query, corpus, index, { k, dialect, grammar });

    console.log(`\nQuery: "${query}"`);
    console.log(`Status: ${searchResult.degraded ? 'DEGRADED (Keyword Search)' : 'OK (Semantic Search)'}`);
    console.log(`Results found: ${searchResult.results.length}\n`);

    searchResult.results.forEach((res, index) => {
      console.log(`[${index + 1}] Score: ${res.score.toFixed(4)}`);
      console.log(`    Amis:    ${res.record.amis}`);
      console.log(`    Chinese: ${res.record.chinese}`);
      console.log(`    Info:    Dialect: ${res.record.dialect} | Source: ${res.record.source} | License: ${res.record.license}`);
      if (res.record.grammar_cat) {
        console.log(`             Grammar Category: ${res.record.grammar_cat} | Level: ${res.record.level}`);
      }
      console.log();
    });

  } catch (err) {
    console.error('Error performing search:', err);
    process.exit(1);
  }
}
