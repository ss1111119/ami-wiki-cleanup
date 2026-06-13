"""
Convert amis-moedict SQL dump to alpaca-format JSONL training entries.

Extracts two types of data:
  1. examples table: content_zh (Chinese) + content_amis_raw (Amis) → translation pairs
  2. terms + descriptions: Amis word + Chinese definition → vocabulary pairs

Usage:
    python scripts/convert_moedict.py

Output: scripts/moedict_data.jsonl
"""
import os
import sys
import json
import re

sys.stdout.reconfigure(encoding="utf-8")

SQL_PATH    = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
              "amis-moedict-new-db-backup",
              "amis-moedict-mysql-20260603.sql",
              "amis-moedict-mysql-20260603.sql")
EXISTING    = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
              "..", "ami-wikipedia-training", "train_data.jsonl")
OUTPUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "moedict_data.jsonl")

# ── dialect lookup for learning word lists ────────────────────────────────────
DICT_DIALECT = {4: "秀姑巒", 5: "海岸", 6: "馬蘭", 7: "恆春", 8: "南勢"}

def make_instruction(dialect=None):
    if dialect:
        return (f"請將以下中文詞語翻譯成阿美語。"
                f"注意：翻譯以{dialect}阿美語為主，"
                f"數字、年份、面積等請統一使用阿拉伯數字表示，並維持語序正確。")
    return ("請將以下中文詞語翻譯成阿美語。"
            "注意：數字、年份、面積等請統一使用阿拉伯數字表示，並維持語序正確。")

# ── MySQL VALUES tokenizer ────────────────────────────────────────────────────
def parse_mysql_rows(values_str):
    """Parse MySQL VALUES string into list of row-tuples."""
    rows = []
    i = 0
    n = len(values_str)

    while i < n:
        if values_str[i] != '(':
            i += 1
            continue
        i += 1  # skip '('
        row = []
        while i < n:
            # skip leading whitespace/comma between fields
            while i < n and values_str[i] in (' ', '\t'):
                i += 1
            if i >= n:
                break
            c = values_str[i]
            if c == ')':
                i += 1
                break
            elif c == ',':
                i += 1
                continue
            elif c == "'":
                # string value
                i += 1
                buf = []
                while i < n:
                    ch = values_str[i]
                    if ch == '\\' and i + 1 < n:
                        nxt = values_str[i + 1]
                        if nxt == "'":
                            buf.append("'")
                        elif nxt == 'n':
                            buf.append('\n')
                        elif nxt == 'r':
                            buf.append('\r')
                        elif nxt == '\\':
                            buf.append('\\')
                        else:
                            buf.append(nxt)
                        i += 2
                    elif ch == "'":
                        i += 1
                        break
                    else:
                        buf.append(ch)
                        i += 1
                row.append(''.join(buf))
            elif values_str[i:i+4] == 'NULL':
                row.append(None)
                i += 4
            else:
                # number or bare word
                j = i
                while i < n and values_str[i] not in (',', ')'):
                    i += 1
                token = values_str[j:i].strip()
                row.append(token if token else None)
        rows.append(row)
        # skip comma between rows
        while i < n and values_str[i] in (',', ' ', '\n', '\r'):
            i += 1

    return rows

def extract_table(lines, table_name):
    """Find all INSERT INTO `table_name` lines and return parsed rows."""
    needle = f"INSERT INTO `{table_name}` VALUES "
    rows = []
    for line in lines:
        stripped = line.strip()
        if not stripped.startswith("INSERT INTO"):
            continue
        if f"`{table_name}`" not in stripped:
            continue
        idx = stripped.find(" VALUES ")
        if idx == -1:
            continue
        values_str = stripped[idx + 8:]
        if values_str.endswith(';'):
            values_str = values_str[:-1]
        rows.extend(parse_mysql_rows(values_str))
    return rows

# ── clean Amis text ───────────────────────────────────────────────────────────
_MARKER_RE = re.compile(r'[`~]')

def clean_amis(raw, fallback):
    """Return clean Amis text: prefer raw, clean markers from fallback."""
    if raw and raw.strip():
        return raw.strip()
    if fallback and fallback.strip():
        return _MARKER_RE.sub('', fallback).strip()
    return None

# ── load existing pairs ───────────────────────────────────────────────────────
def load_existing():
    seen = set()
    path = os.path.normpath(EXISTING)
    if not os.path.exists(path):
        print(f"[warn] existing jsonl not found at {path}")
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
    print(f"[info] loaded {len(seen)} existing pairs for dedup")
    return seen

# ── main ──────────────────────────────────────────────────────────────────────
def main():
    print("Reading SQL file...")
    with open(SQL_PATH, encoding="utf-8") as fh:
        lines = fh.readlines()
    print(f"  {len(lines):,} lines read")

    # ── parse tables ─────────────────────────────────────────────────────────
    print("Parsing examples table...")
    ex_rows = extract_table(lines, "examples")
    print(f"  {len(ex_rows):,} rows")

    print("Parsing terms table...")
    term_rows = extract_table(lines, "terms")
    print(f"  {len(term_rows):,} rows")

    print("Parsing descriptions table...")
    desc_rows = extract_table(lines, "descriptions")
    print(f"  {len(desc_rows):,} rows")

    # ── build lookup: term_id → (amis_name, dictionary_id) ───────────────────
    # terms columns: id(0), dictionary_id(1), stem_id(2), name(3), ...
    term_lookup = {}   # id → (name, dictionary_id)
    for row in term_rows:
        if len(row) < 4:
            continue
        tid   = row[0]
        dictid = int(row[1]) if row[1] and row[1].isdigit() else None
        name  = row[3]
        if tid and name:
            term_lookup[tid] = (name, dictid)

    # ── dedup ─────────────────────────────────────────────────────────────────
    seen = load_existing()
    out = open(OUTPUT_PATH, "w", encoding="utf-8")
    added = 0
    skipped_dup = 0
    skipped_empty = 0

    def write_entry(zh, ami, dialect=None):
        nonlocal added, skipped_dup, skipped_empty
        zh  = zh.strip() if zh else ""
        ami = ami.strip() if ami else ""
        if not zh or not ami:
            skipped_empty += 1
            return
        # skip if output contains CJK (bad/mixed entry) or fullwidth semicolons
        if any('一' <= c <= '鿿' for c in ami) or '；' in ami:
            skipped_empty += 1
            return
        key = (zh, ami)
        if key in seen:
            skipped_dup += 1
            return
        seen.add(key)
        entry = {"instruction": make_instruction(dialect), "input": zh, "output": ami}
        out.write(json.dumps(entry, ensure_ascii=False) + "\n")
        added += 1

    # ── 1. examples: content_zh + content_amis_raw ────────────────────────────
    # columns: id(0), description_id(1), content_zh(2), created_at(3),
    #          updated_at(4), content_amis(5), content_en(6), content_fr(7),
    #          customized_text(8), content_amis_raw(9)
    print("Processing examples...")
    ex_added = 0
    for row in ex_rows:
        if len(row) < 6:
            continue
        zh      = row[2]
        ami_raw = row[9] if len(row) > 9 else None
        ami_src = row[5]
        ami     = clean_amis(ami_raw, ami_src)
        if zh and ami:
            before = added
            write_entry(zh, ami)
            ex_added += (added - before)
    print(f"  +{ex_added} from examples")

    # ── 2. vocab: term name (Amis) + description content_zh (Chinese) ─────────
    # descriptions columns: id(0), term_id(1), created_at(2), updated_at(3),
    #   description_type(4), glossary_serial(5), glossary_level(6),
    #   customized_text(7), content_zh(8), content_en(9), content_fr(10)
    print("Processing vocab (terms + descriptions)...")
    vocab_added = 0
    for row in desc_rows:
        if len(row) < 9:
            continue
        term_id = row[1]
        zh      = row[8]
        if not zh or not term_id:
            continue
        info = term_lookup.get(term_id)
        if not info:
            continue
        ami_name, dictid = info
        dialect = DICT_DIALECT.get(dictid)   # None for non-dialect-specific dicts
        before = added
        write_entry(zh, ami_name, dialect)
        vocab_added += (added - before)
    print(f"  +{vocab_added} from vocab")

    out.close()

    print()
    print("=" * 50)
    print(f"Total new entries : {added}")
    print(f"Duplicates skipped: {skipped_dup}")
    print(f"Empty/bad skipped : {skipped_empty}")
    print(f"\nOutput → {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
