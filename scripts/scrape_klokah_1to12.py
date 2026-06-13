"""
Scrape Amis bilingual sentence pairs from klokah.tw levels 1-12.

Level ID ranges (from test.ipynb):
  1-9階:  S23 (秀姑巒) IDs = 24, 63, 102, 139, 177, 215, 253, 291, 329
          S24-S27 are S23+1, S23+2, S23+3, S23+4 (consecutive within level)
  10階:   789-831  (S23=811, S24=812, S25=813, S26=814, S27=815)
  11階:   880-923  (S23=903, S24=904, S25=905, S26=906, S27=907)
  12階:   969-1011 (S23=991, S24=992, S25=993, S26=994, S27=995)

S23 (秀姑巒) CSVs for levels 1-9 already exist in 十二階/.
S23 CSVs for levels 10-12 (811/903/991) also already exist.
All others are fetched from the web.

Output per level: data/<level>/klokah_ami.jsonl
"""
import csv
import json
import sys
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://ebook.alcd.center/learning?view=adm_learning&id={}"

SCRIPT_DIR = Path(__file__).parent
REPO_ROOT  = SCRIPT_DIR.parent
CSV_DIR    = REPO_ROOT / "200族語e樂園" / "十二階"   # existing S23 CSVs live here

# (level_number, dialect_label, lesson_id)
def build_level_entries():
    level_names_zh = {
        1: "一階", 2: "二階", 3: "三階", 4: "四階", 5: "五階",
        6: "六階", 7: "七階", 8: "八階", 9: "九階",
        10: "十階", 11: "十一階", 12: "十二階",
    }

    s23_ids_1to9  = [24, 63, 102, 139, 177, 215, 253, 291, 329]
    s23_ids_10to12 = [811, 903, 991]

    dialects = [
        ("S23-秀姑巒阿美語", 0),
        ("S24-南勢阿美語",   1),
        ("S25-海岸阿美語",   2),
        ("S26-馬蘭阿美語",   3),
        ("S27-恆春阿美語",   4),
    ]

    entries = []
    for level_num, s23_id in enumerate(s23_ids_1to9 + s23_ids_10to12, 1):
        for dialect, offset in dialects:
            lesson_id  = s23_id + offset
            level_label = level_names_zh[level_num]
            entries.append((level_num, level_label, dialect, lesson_id))

    return entries


def parse_csv_to_pairs(csv_path: Path) -> list[tuple[str, str]]:
    """CSV with Word/Pronunciation columns; Translation rows mark sentence ends."""
    pairs = []
    amis_parts = []
    with open(csv_path, encoding="utf-8", newline="") as f:
        reader = csv.reader(f)
        next(reader, None)  # skip header
        for row in reader:
            if len(row) < 2:
                continue
            word, pronunciation = row[0].strip(), row[1].strip()
            if word == "Translation":
                zh = pronunciation
                amis = " ".join(p for p in amis_parts if p not in (",", ".", "?", "!", "；", ";"))
                if amis and zh:
                    pairs.append((amis, zh))
                amis_parts = []
            else:
                if pronunciation:
                    amis_parts.append(pronunciation)
    return pairs


def fetch_html_pairs(lesson_id: int) -> list[tuple[str, str]]:
    """Fetch a lesson page and extract (amis, zh) sentence pairs."""
    url = BASE_URL.format(lesson_id)
    try:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"  ERROR {url}: {e}", file=sys.stderr)
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    pairs = []

    for lesson_num in range(1, 60):
        lesson_div = soup.find("div", id=f"lesson{lesson_num}")
        if not lesson_div:
            break

        a_title = lesson_div.find("div", class_="a-learn-title")
        c_title = lesson_div.find("div", class_="c-learn-title")
        if a_title and c_title:
            amis = a_title.get_text(strip=True)
            zh   = c_title.get_text(strip=True)
            if amis and zh:
                pairs.append((amis, zh))

        for item in lesson_div.find_all("div", class_="lesson-item"):
            amis_parts = []
            for tw in item.find_all("div", class_="textWord"):
                text_nodes = [c for c in tw.contents if isinstance(c, str)]
                if text_nodes:
                    w = text_nodes[-1].strip()
                    if w:
                        amis_parts.append(w)
            cwords = item.find("span", class_="cwords")
            if cwords:
                zh   = cwords.get_text(strip=True)
                amis = " ".join(p for p in amis_parts if p not in (",", ".", "?", "!", "；", ";"))
                if amis and zh:
                    pairs.append((amis, zh))

    return pairs


def main():
    entries = build_level_entries()
    total   = len(entries)

    # group by level for writing output files
    from collections import defaultdict
    level_data: dict[int, list[dict]] = defaultdict(list)

    for idx, (level_num, level_label, dialect, lesson_id) in enumerate(entries, 1):
        csv_path = CSV_DIR / f"{lesson_id}.csv"
        print(f"[{idx:>3}/{total}] {dialect} {level_label} (id={lesson_id})", end=" ... ", flush=True)

        if csv_path.exists():
            pairs = parse_csv_to_pairs(csv_path)
            print(f"CSV → {len(pairs)} pairs")
        else:
            pairs = fetch_html_pairs(lesson_id)
            print(f"Web → {len(pairs)} pairs")
            time.sleep(0.4)

        # e.g. "S23-秀姑巒阿美語" → "秀姑巒阿美語"
        dialect_name = dialect.split("-", 1)[1]
        for amis, zh in pairs:
            level_data[level_num].append({
                "instruction": f"請將以下阿美語翻譯成中文。注意：原文為{dialect_name}。",
                "input": amis, "output": zh,
            })
            level_data[level_num].append({
                "instruction": f"請將以下中文翻譯成阿美語。注意：翻譯以{dialect_name}為主。",
                "input": zh, "output": amis,
            })

    # write per-level JSONL files into ami-wikipedia-training/data/
    level_names_zh = {
        1: "一階", 2: "二階", 3: "三階", 4: "四階", 5: "五階",
        6: "六階", 7: "七階", 8: "八階", 9: "九階",
        10: "十階", 11: "十一階", 12: "十二階",
    }
    training_repo = REPO_ROOT.parent / "ami-wikipedia-training"

    print()
    for level_num in sorted(level_data):
        label    = level_names_zh[level_num]
        out_dir  = training_repo / "data" / f"族語e樂園{label}"
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / "klokah_ami.jsonl"
        with open(out_path, "w", encoding="utf-8") as f:
            for entry in level_data[level_num]:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        print(f"  {label}: {len(level_data[level_num])} entries → {out_path.name}")

    print(f"\nTotal entries: {sum(len(v) for v in level_data.values())}")


if __name__ == "__main__":
    main()
