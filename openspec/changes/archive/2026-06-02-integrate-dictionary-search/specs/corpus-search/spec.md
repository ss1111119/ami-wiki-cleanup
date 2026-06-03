## ADDED Requirements

### Requirement: corpus-data-generation
The build system SHALL parse the Markdown files under `glossary/corpus/` starting with the prefix `news-ilrdf-` to extract parallel text segments (composed of an Amis language paragraph and its corresponding Chinese translation paragraph). All extracted parallel pairs MUST be compiled and stored inside the `review-app/public/dict-database.json` file in a dedicated corpus structure.

#### Scenario: Extract and format parallel news texts
- **WHEN** the dictionary builder script `review-app/build-dict.mjs` is executed
- **THEN** it parses the news Markdown files, extracts paragraph pairs, and saves them as objects with `amis` and `chinese` keys under a "corpus" array in the output JSON.

##### Example: Output JSON schema for a corpus entry
- **GIVEN** a paragraph pair from the source news file
- **WHEN** processed by the builder
- **THEN** it is saved as:
  ```json
  {
    "amis": "Ni Pasadak a Miketon ko Amirika to Safaw cecay a romi'ad...",
    "chinese": "美國正式發布公告10月11日為原住民族日"
  }
  ```

### Requirement: corpus-fulltext-search
The editor search interface SHALL allow the user to input a query to search across the compiled corpus. The system MUST return all parallel text segments where either the Amis paragraph or the Chinese translation matches the search query. The search match MUST be case-insensitive and ignore special orthography markers (specifically circumflex `^`, glottal stop symbols `’`, `ʼ`, and `'`) during normalization.

#### Scenario: Query matching in corpus text
- **WHEN** the user submits a search query
- **THEN** the system returns matching corpus sentence pairs.

##### Example: Match results for specific queries
| Query | Amis Text | Chinese Text | Match Status |
|---|---|---|---|
| "Biden" | "Ci Biden ko sa'ayaway..." | "拜登是第一位..." | MATCH |
| "biden" | "Ci Biden ko sa'ayaway..." | "拜登是第一位..." | MATCH |
| "美國" | "Ci Biden..." | "拜登是第一位...美國總統..." | MATCH |

### Requirement: corpus-results-rendering
The system SHALL render corpus search results in the search panel of the editing interface. Each matching item MUST display the Amis text and the aligned Chinese translation in a side-by-side or stacked layout that emphasizes readability.

#### Scenario: Render corpus results in search panel
- **WHEN** search results include matching corpus entries
- **THEN** the side panel lists them under a "Corpus Sentences" heading, clearly separating the Amis text from the Chinese text.

