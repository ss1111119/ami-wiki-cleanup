import json
import os
import sys

def main():
    # Paths relative to the project root
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    corpus_path = os.path.join(project_root, "glossary", "parallel-corpus.json")
    output_path = os.path.join(project_root, "train_data.jsonl")

    if not os.path.exists(corpus_path):
        print(f"Error: Could not find parallel corpus at {corpus_path}")
        sys.exit(1)

    print("Reading parallel-corpus.json...")
    with open(corpus_path, "r", encoding="utf-8") as f:
        corpus = json.load(f)

    print(f"Loaded {len(corpus)} items. Starting formatting...")
    
    train_data = []
    for index, item in enumerate(corpus):
        zh = item.get("chinese", "").strip()
        ami = item.get("amis", "").strip()
        dialect = item.get("dialect", "海岸")
        
        if zh and ami:
            # Construct standard instruction prompt
            prompt = f"請將以下中文句子翻譯成阿美語。注意：翻譯以{dialect}阿美語為主，數字、年份、面積等請統一使用阿拉伯數字表示，並維持語序正確。"
            
            # Format as alpaca format (instruction/input/output)
            train_data.append({
                "instruction": prompt,
                "input": zh,
                "output": ami
            })

    print(f"Writing {len(train_data)} formatted dataset to {output_path}...")
    with open(output_path, "w", encoding="utf-8") as f:
        for entry in train_data:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    print("[OK] Dataset preparation complete!")

if __name__ == "__main__":
    main()
