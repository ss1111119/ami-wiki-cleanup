"""
Scrape Amis bilingual sentence pairs from klokah.tw levels 10-12.

Level ID ranges (from test.ipynb):
  10階: 789-831
  11階: 880-923
  12階: 969-1011

Amis dialect IDs:
  S23 秀姑巒阿美語: 811, 903, 991  (CSVs already exist)
  S24 南勢阿美語:   812, 904, 992
  S25 海岸阿美語:   813, 905, 993
  S26 馬蘭阿美語:   814, 906, 994
  S27 恆春阿美語:   815, 907, 995

Output: 200族語e樂園/十二階/klokah_ami_10to12.jsonl
"""
import csv
import json
import sys
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://ebook.alcd.center/learning?view=adm_learning&id={}"

AMIS_IDS = {
    "S23-秀姑巒阿美語": [811, 903, 991],
    "S24-南勢阿美語":   [812, 904, 992],
    "S25-海岸阿美語":   [813, 905, 993],
    "S26-馬蘭阿美語":   [814, 906, 994],
    "S27-恆春阿美語":   [815, 907, 995],
}

LEVEL_NAMES = {
    811: "十階", 812: "十階", 813: "十階", 814: "十階", 815: "十階",
    903: "十一階", 904: "十一階", 905: "十一階", 906: "十一階", 907: "十一階",
    991: "十二階", 992: "十二階", 993: "十二階", 994: "十二階", 995: "十二階",
}

SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent / "200族語e樂園" / "十二階"
OUTPUT_JSONL = DATA_DIR / "klokah_ami_10to12.jsonl"


def parse_csv_to_pairs(csv_path: Path) -> list[tuple[str, str]]:
    """
    Parse a CSV file with Word/Pronunciation columns + Translation rows
    into (amis_sentence, zh_sentence) pairs.
    """
    pairs = []
    current_amis_parts = []

    with open(csv_path, encoding="utf-8", newline="") as f:
        reader = csv.reader(f)
        header = next(reader, None)  # skip header
        for row in reader:
            if len(row) < 2:
                continue
            word, pronunciation = row[0].strip(), row[1].strip()
            if word == "Translation":
                # pronunciation column holds the full Chinese sentence
                zh = pronunciation
                amis = " ".join(p for p in current_amis_parts if p and p not in (",", ".", "?", "!", "；"))
                if amis and zh:
                    pairs.append((amis, zh))
                current_amis_parts = []
            else:
                if pronunciation:
                    current_amis_parts.append(pronunciation)

    return pairs


def fetch_html_pairs(lesson_id: int) -> list[tuple[str, str]]:
    """
    Fetch a klokah lesson page and extract (amis_sentence, zh_sentence) pairs.

    HTML structure (from test.ipynb analysis):
      div#lesson{N}
        div.a-learn-title  -> Amis title sentence
        div.c-learn-title  -> Chinese title sentence
        div.lesson-item (0..N)
          div.textWord (per word)
            span.cword  -> Chinese word
            [text node] -> Amis word
          span.cwords   -> Full Chinese sentence
    """
    url = BASE_URL.format(lesson_id)
    try:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"  ERROR fetching {url}: {e}", file=sys.stderr)
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    pairs = []

    for lesson_num in range(1, 50):  # lesson1 … lesson49
        lesson_div = soup.find("div", id=f"lesson{lesson_num}")
        if not lesson_div:
            break

        # Title sentence pair
        a_title = lesson_div.find("div", class_="a-learn-title")
        c_title = lesson_div.find("div", class_="c-learn-title")
        if a_title and c_title:
            amis = a_title.get_text(strip=True)
            zh = c_title.get_text(strip=True)
            if amis and zh:
                pairs.append((amis, zh))

        # Per-sentence items
        for item in lesson_div.find_all("div", class_="lesson-item"):
            amis_parts = []
            for tw in item.find_all("div", class_="textWord"):
                # Amis word is the last text node in textWord
                parts = [c for c in tw.contents if isinstance(c, str)]
                if parts:
                    amis_word = parts[-1].strip()
                    if amis_word:
                        amis_parts.append(amis_word)

            cwords = item.find("span", class_="cwords")
            if cwords:
                zh = cwords.get_text(strip=True)
                amis = " ".join(p for p in amis_parts if p not in (",", ".", "?", "!", "；"))
                if amis and zh:
                    pairs.append((amis, zh))

    return pairs


def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    all_pairs = []
    total_ids = sum(len(ids) for ids in AMIS_IDS.values())
    done = 0

    for dialect, ids in AMIS_IDS.items():
        for lesson_id in ids:
            level = LEVEL_NAMES[lesson_id]
            csv_path = DATA_DIR / f"{lesson_id}.csv"
            done += 1
            print(f"[{done}/{total_ids}] {dialect} {level} (id={lesson_id})", end=" ... ")

            if csv_path.exists():
                pairs = parse_csv_to_pairs(csv_path)
                print(f"CSV → {len(pairs)} pairs")
            else:
                pairs = fetch_html_pairs(lesson_id)
                print(f"Web → {len(pairs)} pairs")
                time.sleep(0.5)  # be polite

            for amis, zh in pairs:
                all_pairs.append({
                    "instruction": "請將以下阿美語翻譯成中文。",
                    "input": amis,
                    "output": zh,
                    "source": f"klokah-{level}-{dialect}",
                })
                all_pairs.append({
                    "instruction": "請將以下中文翻譯成阿美語。",
                    "input": zh,
                    "output": amis,
                    "source": f"klokah-{level}-{dialect}",
                })

    with open(OUTPUT_JSONL, "w", encoding="utf-8") as f:
        for entry in all_pairs:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    print(f"\n✓ Wrote {len(all_pairs)} entries ({len(all_pairs)//2} sentence pairs) → {OUTPUT_JSONL}")


if __name__ == "__main__":
    main()
