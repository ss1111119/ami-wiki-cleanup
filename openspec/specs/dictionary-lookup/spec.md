# dictionary-lookup Specification

## Purpose

TBD - created by archiving change 'integrate-dictionary-search'. Update Purpose after archive.

## Requirements

### Requirement: dictionary-data-generation
The build system SHALL parse the CSV vocabulary dictionary file `glossary/corpus/klokah-wordlist.csv` and extract the following attributes: dialect (方言), category (類別), difficulty level (級別), Chinese definition (中文), Amis word (阿美語), and remarks (備註). It SHALL also parse vocabulary tables in `glossary/corpus/klokah-cu-amis-vocab.md` and `glossary/corpus/klokah-readingtext-vocab.md` to extract Amis words, Chinese definitions, and corresponding example sentences. All extracted items MUST be merged and compiled into a single JSON database file at `review-app/public/dict-database.json`.

#### Scenario: Parse and merge CSV and Markdown word lists
- **WHEN** the dictionary builder script `review-app/build-dict.mjs` is executed
- **THEN** it generates a unified JSON file containing all words mapped to their dialect, category, level, Chinese meaning, remarks, and examples if available.

##### Example: Output JSON schema for a word entry
- **GIVEN** a word entry from the source files
- **WHEN** compiled by the builder
- **THEN** it conforms to the structure:
  ```json
  {
    "word": "cecay",
    "normalized": "cecay",
    "definitions": [
      {
        "dialect": "海岸",
        "category": "01數字計量",
        "level": "初級",
        "chinese": "一",
        "remarks": "",
        "examples": []
      }
    ]
  }
  ```


<!-- @trace
source: integrate-dictionary-search
updated: 2026-06-02
code:
  - AGENTS.md
  - review-app/public/dict-database.json
  - .antigravitycli/49f8961b-d94f-421d-9367-55c5685cc444.json
  - .agents/skills/spectra-propose/SKILL.md
  - review-app/public/style.css
  - temp_proposal.md
  - .agents/skills/spectra-apply/SKILL.md
  - review-app/public/editor.html
  - .agents/skills/spectra-archive/SKILL.md
  - .agents/skills/spectra-drift/SKILL.md
  - .agents/skills/spectra-ask/SKILL.md
  - .agents/skills/spectra-commit/SKILL.md
  - .agents/skills/spectra-debug/SKILL.md
  - CLAUDE.md
  - .agents/skills/spectra-ingest/SKILL.md
  - .spectra.yaml
  - .agents/skills/spectra-audit/SKILL.md
  - review-app/build-dict.mjs
  - .agents/skills/spectra-discuss/SKILL.md
-->

---
### Requirement: word-query-and-matching
The dictionary lookup tool in the editor interface SHALL support searching by either Chinese definition or Amis word. Search matching MUST be case-insensitive and ignore special orthography markers (specifically circumflex `^`, glottal stop symbols `’`, `ʼ`, and `'`) during normalization to ensure robust matching.

#### Scenario: Case and diacritic insensitive matching
- **WHEN** the user inputs a query string into the search input
- **THEN** the system returns matching dictionary entries where the normalized query matches the normalized Amis word or Chinese definition.

##### Example: Diacritic insensitivity test cases
| Query | Word in DB | Match Status |
|---|---|---|
| "tosa" | "tosa^" | MATCH |
| "polo'" | "polo’" | MATCH |
| "POLO" | "polo’" | MATCH |
| "一" | "一" | MATCH |


<!-- @trace
source: integrate-dictionary-search
updated: 2026-06-02
code:
  - AGENTS.md
  - review-app/public/dict-database.json
  - .antigravitycli/49f8961b-d94f-421d-9367-55c5685cc444.json
  - .agents/skills/spectra-propose/SKILL.md
  - review-app/public/style.css
  - temp_proposal.md
  - .agents/skills/spectra-apply/SKILL.md
  - review-app/public/editor.html
  - .agents/skills/spectra-archive/SKILL.md
  - .agents/skills/spectra-drift/SKILL.md
  - .agents/skills/spectra-ask/SKILL.md
  - .agents/skills/spectra-commit/SKILL.md
  - .agents/skills/spectra-debug/SKILL.md
  - CLAUDE.md
  - .agents/skills/spectra-ingest/SKILL.md
  - .spectra.yaml
  - .agents/skills/spectra-audit/SKILL.md
  - review-app/build-dict.mjs
  - .agents/skills/spectra-discuss/SKILL.md
-->

---
### Requirement: query-results-rendering
The system SHALL render search results dynamically in a side panel of the editing interface. Each result MUST display the Amis word, dialect marker, category/level, Chinese definition, any remarks, and examples (with Amis sentence and Chinese translation side-by-side).

#### Scenario: Display dictionary result with examples
- **WHEN** a search returns matching dictionary entries
- **THEN** the side panel displays the list of matches with dialect tags and lists all available example sentences.

<!-- @trace
source: integrate-dictionary-search
updated: 2026-06-02
code:
  - AGENTS.md
  - review-app/public/dict-database.json
  - .antigravitycli/49f8961b-d94f-421d-9367-55c5685cc444.json
  - .agents/skills/spectra-propose/SKILL.md
  - review-app/public/style.css
  - temp_proposal.md
  - .agents/skills/spectra-apply/SKILL.md
  - review-app/public/editor.html
  - .agents/skills/spectra-archive/SKILL.md
  - .agents/skills/spectra-drift/SKILL.md
  - .agents/skills/spectra-ask/SKILL.md
  - .agents/skills/spectra-commit/SKILL.md
  - .agents/skills/spectra-debug/SKILL.md
  - CLAUDE.md
  - .agents/skills/spectra-ingest/SKILL.md
  - .spectra.yaml
  - .agents/skills/spectra-audit/SKILL.md
  - review-app/build-dict.mjs
  - .agents/skills/spectra-discuss/SKILL.md
-->