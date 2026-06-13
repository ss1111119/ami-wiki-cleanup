"""
Extract 吳明義阿美族語辭典 from SQLite and convert to alpaca JSONL.

Sources:
  - Vocab pairs: term.name (Amis) <-> description.content_zh (Chinese)
  - Sentence pairs: example.content_amis_raw <-> example.content_zh

Dialect codes (from dictionary legend):
  N=北部阿美語, Sn=秀姑巒阿美語, S=南部阿美語, T=太巴塱語,
  F=馬太鞍語, E=東海岸語, Fw=馬蘭語, Fn=池上語, G=通用,
  K=奇美語, Kn=七腳川語, Mk=真柄語, Mw=成功地區語, Tr=都歷語, Pr=三仙語
  Z=撒奇拉亞借詞 (not Amis dialect — treated as general)
"""
import sqlite3, json, re, os, sys
sys.stdout.reconfigure(encoding="utf-8")

DB_PATH     = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
              "amis-moedict-new-db-backup", "amis-moedict-202512.sqlite3")
TRAIN_PATH  = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
              "..", "ami-wikipedia-training", "train_data.jsonl")
OUTPUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "wumingyi_data.jsonl")

DICT_ID = 11  # 吳明義阿美族語辭典

DIALECT_NAMES = {
    "N":  "北部阿美語",
    "Sn": "秀姑巒阿美語",
    "S":  "南部阿美語",
    "T":  "太巴塱語",
    "F":  "馬太鞍語",
    "E":  "東海岸語",
    "Fw": "馬蘭語",
    "Fn": "池上語",
    "K":  "奇美語",
    "Kn": "七腳川語",
    "Mk": "真柄語",
    "Mw": "成功地區語",
    "Tr": "都歷語",
    "Pr": "三仙語",
}

# Codes that are NOT dialect labels (borrowings, jargon, ritual)
NON_DIALECT = {"Z", "J", "En", "M", "T-A", "BIT", "G",
               "R-E", "R-F", "R-G", "R-N", "R-T",
               "En-J", "En-T", "J-T", "Ge", "MI", "IM", "HL", "FL", "FS"}


def parse_dialect(customized_text):
    """Return Chinese dialect name or None (= general)."""
    if not customized_text:
        return None
    m = re.search(r"term_source:\s*(.+)", customized_text)
    if not m:
        return None
    raw = m.group(1).strip().strip('"')
    # Multiple dialects (e.g. N|Sn) → treat as general
    codes = [c.strip() for c in raw.split("|")]
    if len(codes) > 1:
        return None
    code = codes[0]
    return DIALECT_NAMES.get(code)  # None if not a known dialect


def make_instructions(dialect, kind):
    """Return (zh_to_amis_inst, amis_to_zh_inst)."""
    num_note = "數字、年份、面積等請統一使用阿拉伯數字表示，並維持語序正確。"
    if kind == "vocab":
        if dialect:
            zh2a = f"請將以下中文詞語翻譯成阿美語。注意：翻譯以{dialect}為主，{num_note}"
        else:
            zh2a = f"請將以下中文詞語翻譯成阿美語。注意：{num_note}"
        a2zh = "請將以下阿美語詞語翻譯成中文。"
    else:  # sentence
        if dialect:
            zh2a = f"請將以下中文句子翻譯成阿美語。注意：翻譯以{dialect}為主，{num_note}"
        else:
            zh2a = f"請將以下中文句子翻譯成阿美語。注意：翻譯以通用阿美語為主，{num_note}"
        if dialect:
            a2zh = f"請將以下阿美語句子翻譯成中文。注意：原文為{dialect}。"
        else:
            a2zh = "請將以下阿美語句子翻譯成中文。"
    return zh2a, a2zh


def has_cjk(t):
    return any("一" <= c <= "鿿" for c in t)


def clean_zh(t):
    """Strip cross-reference notation like 'adiyam =(S)小辣椒。"""
    t = t.strip()
    # Remove leading Amis word + = pattern
    t = re.sub(r"^[a-zA-Z'`^~\-\d]+\s*=\s*\([A-Za-z]+\)\s*", "", t)
    return t.strip()


def load_existing():
    seen = set()
    path = os.path.normpath(TRAIN_PATH)
    if not os.path.exists(path):
        print(f"[warn] train_data.jsonl not found at {path}")
        return seen
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                seen.add((obj.get("input", "").strip(), obj.get("output", "").strip()))
            except json.JSONDecodeError:
                pass
    print(f"[info] loaded {len(seen):,} existing pairs for dedup")
    return seen


def main():
    conn = sqlite3.connect(DB_PATH)
    cur  = conn.cursor()
    seen = load_existing()
    out  = open(OUTPUT_PATH, "w", encoding="utf-8")

    vocab_added = sent_added = skipped_dup = skipped_bad = 0

    def write_pair(zh, amis, zh2a_inst, a2zh_inst):
        nonlocal vocab_added, sent_added, skipped_dup, skipped_bad
        zh   = zh.strip()
        amis = amis.strip()
        if not zh or not amis:
            skipped_bad += 1; return
        if not has_cjk(zh):
            skipped_bad += 1; return
        if has_cjk(amis):
            skipped_bad += 1; return

        wrote = False
        key_fwd = (zh, amis)
        if key_fwd not in seen:
            seen.add(key_fwd)
            out.write(json.dumps({"instruction": zh2a_inst, "input": zh, "output": amis},
                                 ensure_ascii=False) + "\n")
            wrote = True
        else:
            skipped_dup += 1

        key_rev = (amis, zh)
        if key_rev not in seen:
            seen.add(key_rev)
            out.write(json.dumps({"instruction": a2zh_inst, "input": amis, "output": zh},
                                 ensure_ascii=False) + "\n")
            if wrote:
                if "句子" in zh2a_inst:
                    sent_added += 1
                else:
                    vocab_added += 1
        else:
            skipped_dup += 1

    # ── Vocab pairs ────────────────────────────────────────────────────────────
    cur.execute("""
        SELECT t.name, t.customized_text, d.content_zh
        FROM terms t
        JOIN descriptions d ON d.term_id = t.id
        WHERE t.dictionary_id = ?
          AND d.content_zh IS NOT NULL
    """, (DICT_ID,))
    for amis_term, ctext, zh_def in cur.fetchall():
        zh_def = clean_zh(zh_def)
        if not zh_def:
            continue
        dialect = parse_dialect(ctext)
        zh2a, a2zh = make_instructions(dialect, "vocab")
        write_pair(zh_def, amis_term, zh2a, a2zh)

    # ── Sentence pairs ─────────────────────────────────────────────────────────
    cur.execute("""
        SELECT t.customized_text, e.content_amis_raw, e.content_zh
        FROM examples e
        JOIN descriptions d ON e.description_id = d.id
        JOIN terms t ON d.term_id = t.id
        WHERE t.dictionary_id = ?
          AND e.content_amis_raw IS NOT NULL
          AND e.content_zh IS NOT NULL
    """, (DICT_ID,))
    for ctext, amis_raw, zh_sent in cur.fetchall():
        dialect = parse_dialect(ctext)
        zh2a, a2zh = make_instructions(dialect, "sentence")
        write_pair(zh_sent, amis_raw, zh2a, a2zh)

    out.close()
    conn.close()

    total = vocab_added + sent_added
    print(f"\n{'='*50}")
    print(f"Vocab pairs added   : {vocab_added:,}")
    print(f"Sentence pairs added: {sent_added:,}")
    print(f"Duplicates skipped  : {skipped_dup:,}")
    print(f"Bad/empty skipped   : {skipped_bad:,}")
    print(f"\nTotal new entries   : {total*2:,}  ({total:,} pairs × 2 directions)")
    print(f"Output -> {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
