"""
Convert dict-amis-safolu.json to alpaca-format JSONL training entries.

Extracts:
  1. Vocabulary pairs: Amis title + Chinese definition
  2. Example sentence pairs: Amis sentence + Chinese translation

Output: scripts/safolu_data.jsonl
"""
import os, json, re, sys

sys.stdout.reconfigure(encoding="utf-8")

DICT_PATH   = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
              "dict", "dict-amis-safolu.json")
EXISTING    = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
              "..", "ami-wikipedia-training", "train_data.jsonl")
OUTPUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "safolu_data.jsonl")

ANN_RE = re.compile("￹(.*?)￺￻(.*)", re.DOTALL)

VOCAB_INST = "請將以下中文詞語翻譯成阿美語。注意：翻譯以秀姑巒阿美語為主。"
SENT_INST  = "請將以下阿美語句子翻譯成中文。注意：原文為秀姑巒阿美語。"
SENT_REV   = "請將以下中文句子翻譯成阿美語。注意：翻譯以秀姑巒阿美語為主。"

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
    print(f"[info] loaded {len(seen):,} existing pairs for dedup")
    return seen

def main():
    data = json.load(open(DICT_PATH, encoding="utf-8"))
    seen = load_existing()
    out  = open(OUTPUT_PATH, "w", encoding="utf-8")

    added_vocab = 0
    added_sent  = 0
    skipped_dup = 0
    skipped_bad = 0

    def write(zh, amis, instruction, rev_instruction=None):
        nonlocal added_vocab, added_sent, skipped_dup, skipped_bad
        zh   = zh.strip()
        amis = amis.strip()
        if not zh or not amis:
            skipped_bad += 1
            return
        if any("一" <= c <= "鿿" for c in amis):
            skipped_bad += 1
            return
        # zh -> amis
        key = (zh, amis)
        if key not in seen:
            seen.add(key)
            out.write(json.dumps({"instruction": instruction, "input": zh, "output": amis},
                                 ensure_ascii=False) + "\n")
            if rev_instruction:
                added_sent += 1
            else:
                added_vocab += 1
        else:
            skipped_dup += 1
        # amis -> zh (reverse)
        rev_key = (amis, zh)
        if rev_key not in seen:
            seen.add(rev_key)
            rev_inst = rev_instruction or "請將以下阿美語詞語翻譯成中文。"
            out.write(json.dumps({"instruction": rev_inst, "input": amis, "output": zh},
                                 ensure_ascii=False) + "\n")

    for entry in data:
        title = entry.get("title", "").strip()
        for het in entry.get("heteronyms", []):
            for defn in het.get("definitions", []):
                zh_def = defn.get("def", "").strip()
                if title and zh_def:
                    write(zh_def, title, VOCAB_INST)
                for ex in defn.get("example", []):
                    m = ANN_RE.search(ex)
                    if m:
                        amis = re.sub(r"[`~]", "", m.group(1)).strip()
                        zh   = m.group(2).strip()
                        if amis and zh:
                            write(zh, amis, SENT_REV, SENT_INST)

    out.close()
    print()
    print("=" * 50)
    print(f"Vocab pairs added : {added_vocab:,}")
    print(f"Sentence pairs    : {added_sent:,}")
    print(f"Duplicates skipped: {skipped_dup:,}")
    print(f"Bad/empty skipped : {skipped_bad:,}")
    print(f"\nOutput -> {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
