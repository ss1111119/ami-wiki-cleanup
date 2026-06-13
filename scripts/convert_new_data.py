"""
Convert all 族語e樂園 source files to alpaca-format JSONL for training.
Outputs new entries only (deduplicates against existing train_data.jsonl).

Usage:
    python scripts/convert_new_data.py

Output: scripts/new_data.jsonl (new entries only)
"""
import os
import json
import sys
import glob
import csv
import openpyxl

sys.stdout.reconfigure(encoding="utf-8")

# ── paths ─────────────────────────────────────────────────────────────────────
WIKI_ROOT    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ELEYUAN      = os.path.join(WIKI_ROOT, "200族語e樂園")
EXISTING_JSONL = os.path.join(WIKI_ROOT, "..", "ami-wikipedia-training", "train_data.jsonl")
OUTPUT_PATH  = os.path.join(os.path.dirname(os.path.abspath(__file__)), "new_data.jsonl")

# ── dialect from filename ─────────────────────────────────────────────────────
DIALECT_NAMES = {
    "1": "南勢", "2": "秀姑巒", "3": "海岸", "4": "馬蘭", "5": "恆春",
}

def dialect_from_path(filepath):
    name = os.path.basename(filepath)
    prefix = name.split("_")[0]
    return DIALECT_NAMES.get(prefix, "南勢")

def make_instruction(dialect):
    return (
        f"請將以下中文句子翻譯成阿美語。"
        f"注意：翻譯以{dialect}阿美語為主，"
        f"數字、年份、面積等請統一使用阿拉伯數字表示，並維持語序正確。"
    )

# ── load existing pairs for dedup ─────────────────────────────────────────────
def load_existing():
    seen = set()
    path = os.path.normpath(EXISTING_JSONL)
    if not os.path.exists(path):
        print(f"[warn] existing jsonl not found at {path}, dedup skipped")
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

# ── helpers ───────────────────────────────────────────────────────────────────
def read_xlsx(path):
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    wb.close()
    if not rows:
        return [], []
    headers = [str(h).strip() if h is not None else "" for h in rows[0]]
    return headers, rows[1:]

def read_csv_file(path):
    with open(path, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    headers = list(rows[0].keys()) if rows else []
    return headers, rows

def cell(val):
    return str(val).strip() if val is not None else ""

def find_col(headers, candidates):
    """Return index of first matching candidate header (case-insensitive)."""
    lower = [h.lower() for h in headers]
    for c in candidates:
        if c.lower() in lower:
            return lower.index(c.lower())
    return None

# ── per-source converters ─────────────────────────────────────────────────────

def convert_3col_xlsx(path, dialect):
    """標題 | 族語 | 中文  →  pairs"""
    headers, rows = read_xlsx(path)
    ami_i = find_col(headers, ["族語", "族语"])
    zh_i  = find_col(headers, ["中文"])
    if ami_i is None or zh_i is None:
        print(f"  [skip] unrecognised columns in {os.path.basename(path)}: {headers}")
        return []
    pairs = []
    for row in rows:
        ami = cell(row[ami_i])
        zh  = cell(row[zh_i])
        if ami and zh:
            pairs.append((zh, ami))
    return pairs

def convert_4col_xlsx(path, dialect):
    """來源 | 課程 | 族語 | 中文  →  pairs (xlsx variant)"""
    headers, rows = read_xlsx(path)
    ami_i = find_col(headers, ["族語", "族语", "ab"])
    zh_i  = find_col(headers, ["中文", "ch"])
    if ami_i is None or zh_i is None:
        print(f"  [skip] unrecognised columns in {os.path.basename(path)}: {headers}")
        return []
    pairs = []
    for row in rows:
        ami = cell(row[ami_i])
        zh  = cell(row[zh_i])
        if ami and zh:
            pairs.append((zh, ami))
    return pairs

def convert_4col_csv(path, dialect):
    """來源 | 課程 | 族語 | 中文  →  pairs (csv variant)"""
    headers, rows = read_csv_file(path)
    ami_key = next((k for k in headers if k.strip() in ("族語", "族语")), None)
    zh_key  = next((k for k in headers if k.strip() == "中文"), None)
    if ami_key is None or zh_key is None:
        print(f"  [skip] unrecognised columns in {os.path.basename(path)}: {headers}")
        return []
    pairs = []
    for row in rows:
        ami = row[ami_key].strip()
        zh  = row[zh_key].strip()
        if ami and zh:
            pairs.append((zh, ami))
    return pairs

def convert_dialogue_xlsx(path, dialect):
    """阿美语对话 | 中文对话  →  pairs"""
    headers, rows = read_xlsx(path)
    ami_i = find_col(headers, ["阿美语对话", "阿美語對話"])
    zh_i  = find_col(headers, ["中文对话", "中文對話"])
    if ami_i is None or zh_i is None:
        print(f"  [skip] unrecognised columns in {os.path.basename(path)}: {headers}")
        return []
    pairs = []
    for row in rows:
        ami = cell(row[ami_i])
        zh  = cell(row[zh_i])
        if ami and zh:
            pairs.append((zh, ami))
    return pairs

def convert_vocab_xlsx(path, dialect):
    """單詞(Amis) | 釋義(Chinese)  →  pairs"""
    headers, rows = read_xlsx(path)
    ami_i = find_col(headers, ["單詞", "单词"])
    zh_i  = find_col(headers, ["釋義", "释义"])
    if ami_i is None or zh_i is None:
        print(f"  [skip] unrecognised columns in {os.path.basename(path)}: {headers}")
        return []
    pairs = []
    for row in rows:
        ami = cell(row[ami_i])
        zh  = cell(row[zh_i])
        if ami and zh:
            pairs.append((zh, ami))
    return pairs

# ── source registry ───────────────────────────────────────────────────────────

# Only files 1-5 are Amis dialects. 6+ are Tayal, Bunun, Paiwan, etc.
AMI_GLOB = "[1-5]_*阿美語*.xlsx"
AMI_GLOB_CSV = "[1-5]_*阿美語*.csv"

SOURCES = [
    # (glob_pattern,                                  converter_fn)
    (f"生活會話篇/{AMI_GLOB}",                         convert_dialogue_xlsx),
    (f"圖畫故事篇/{AMI_GLOB}",                         convert_3col_xlsx),
    (f"歌謠篇/{AMI_GLOB}",                             convert_3col_xlsx),
    (f"閱讀書寫篇/整句/{AMI_GLOB}",                    convert_3col_xlsx),
    ("教學模組/1_南勢阿美語.xlsx",                     convert_3col_xlsx),
    ("教學模組/1_南勢阿美語_初級.xlsx",                convert_3col_xlsx),
    ("教學模組/1_南勢阿美語_中級.xlsx",                convert_3col_xlsx),
    ("教學模組/1_南勢阿美語_中高級.xlsx",              convert_4col_xlsx),
    (f"文化篇/{AMI_GLOB_CSV}",                         convert_4col_csv),
    (f"情境族語/課文/{AMI_GLOB_CSV}",                  convert_4col_csv),
    (f"族語短文/課文/{AMI_GLOB}",                      convert_4col_xlsx),
    (f"閱讀文本/{AMI_GLOB}",                           convert_4col_xlsx),
    (f"wawa點點樂/單詞/{AMI_GLOB}",                    convert_vocab_xlsx),
]

# ── main ─────────────────────────────────────────────────────────────────────
def main():
    seen  = load_existing()
    added = 0
    skipped_dup = 0
    skipped_empty = 0
    source_counts = {}

    out = open(OUTPUT_PATH, "w", encoding="utf-8")

    for pattern, converter in SOURCES:
        full_pattern = os.path.join(ELEYUAN, pattern)
        files = sorted(glob.glob(full_pattern))
        if not files:
            print(f"[warn] no files for pattern: {pattern}")
            continue

        for filepath in files:
            dialect = dialect_from_path(filepath)
            instruction = make_instruction(dialect)

            try:
                pairs = converter(filepath, dialect)
            except Exception as e:
                print(f"  [error] {os.path.basename(filepath)}: {e}")
                continue

            src_key = pattern.split("/")[0]
            new_here = 0
            for zh, ami in pairs:
                if not zh or not ami:
                    skipped_empty += 1
                    continue
                # skip citation/metadata lines
                if zh.startswith("原文出處") or zh.startswith("出處") or zh.startswith("資料來源"):
                    skipped_empty += 1
                    continue
                key = (zh, ami)
                if key in seen:
                    skipped_dup += 1
                    continue
                seen.add(key)
                entry = {"instruction": instruction, "input": zh, "output": ami}
                out.write(json.dumps(entry, ensure_ascii=False) + "\n")
                added += 1
                new_here += 1

            print(f"  {os.path.basename(filepath):40s}  dialect={dialect:5s}  +{new_here}")
            source_counts[src_key] = source_counts.get(src_key, 0) + new_here

    out.close()

    print()
    print("=" * 55)
    print(f"Total new entries written : {added}")
    print(f"Duplicates skipped        : {skipped_dup}")
    print(f"Empty pairs skipped       : {skipped_empty}")
    print()
    print("Breakdown by source:")
    for src, count in sorted(source_counts.items(), key=lambda x: -x[1]):
        print(f"  {src:30s}  {count}")
    print(f"\nOutput → {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
