#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
句法演練平台 (grmpts) 抓取腳本
來源：https://web.klokah.tw/grmpts/  族語E樂園
授權：CC BY-NC-SA 4.0 —— 可作翻譯/檢索範本與文法佐證，原句勿整段貼入維基百科。

資料結構：
  grmpts/json/{id}.json            方言(id)的句法練習索引，l1..l4(級別) × t1..t12(句法分類) → tid 陣列
  /text/read_embed.php?tid=&mode=1 每個 tid 回傳 14 句左右 read-sentence Ab(族語)/Ch(中文) 平行句
方言 id 與文化篇/cu_data 共用同一套編號（海岸=3，12 為空號）。

用法：
  python scrape_grmpts.py            # 預設只抓海岸阿美語 (id=3)
  python scrape_grmpts.py 3          # 指定單一方言
  python scrape_grmpts.py 1 2 3 4 5  # 多個（5 個阿美方言）
  python scrape_grmpts.py amis       # 5 個阿美方言捷徑
  python scrape_grmpts.py all        # 全 42 方言

輸出：與本腳本同目錄 {id}_{方言名}.csv
  欄位：方言, 級別, 句法分類, tid, 族語, 中文
  （同一 tid 若跨多個級別/分類，標籤以 / 串接）
"""
import sys, os, re, csv, time
from collections import OrderedDict
import requests
from bs4 import BeautifulSoup

BASE = "https://web.klokah.tw"
GRMPTS = BASE + "/grmpts"

# 方言編號（與文化篇/cu_data 一致；12 為空號，故略過）
DIALECTS = {
    1: "南勢阿美語", 2: "秀姑巒阿美語", 3: "海岸阿美語", 4: "馬蘭阿美語", 5: "恆春阿美語",
    6: "賽考利克泰雅語", 7: "澤敖利泰雅語", 8: "汶水泰雅語", 9: "萬大泰雅語", 10: "四季泰雅語",
    11: "宜蘭澤敖利泰雅語", 13: "賽夏語", 14: "邵語", 15: "都達賽德克語", 16: "德固達雅賽德克語",
    17: "德鹿谷賽德克語", 18: "卓群布農語", 19: "卡群布農語", 20: "丹群布農語", 21: "巒群布農語",
    22: "郡群布農語", 23: "東排灣語", 24: "北排灣語", 25: "中排灣語", 26: "南排灣語",
    27: "東魯凱語", 28: "霧台魯凱語", 29: "大武魯凱語", 30: "多納魯凱語", 31: "茂林魯凱語",
    32: "萬山魯凱語", 33: "太魯閣語", 34: "噶瑪蘭語", 35: "鄒語", 36: "卡那卡那富語",
    37: "拉阿魯哇語", 38: "南王卑南語", 39: "知本卑南語", 40: "西群卑南語", 41: "建和卑南語",
    42: "雅美語", 43: "撒奇萊雅語",
}
AMIS_IDS = [1, 2, 3, 4, 5]  # 阿美語五方言

# 級別與句法分類（順序見 grmpts/index.php 的「選擇句法類別」按鈕）
LEVELS = OrderedDict([("l1", "初級"), ("l2", "中級"), ("l3", "高級"), ("l4", "高階")])
LEVEL_ORDER = {k: i for i, k in enumerate(LEVELS)}
CATS = OrderedDict([
    ("t1", "名詞"), ("t2", "靜態動詞"), ("t3", "靜態動詞(完成式)"), ("t4", "動態動詞"),
    ("t5", "存在擁有"), ("t6", "焦點系統"), ("t7", "時間描述詞"), ("t8", "空間方位"),
    ("t9", "代名詞"), ("t10", "連動結構"), ("t11", "否定句"), ("t12", "疑問詞"),
])

CJK = re.compile(r"[一-鿿　-〿＀-￯]")  # 中文/全形標點
session = requests.Session()
session.headers.update({"User-Agent": "Mozilla/5.0 (corpus research; CC BY-NC-SA reference use)"})


def get_with_retry(url, tries=3, timeout=30):
    last = None
    for i in range(tries):
        try:
            r = session.get(url, timeout=timeout)
            r.raise_for_status()
            r.encoding = "utf-8"  # 站方未送 charset，強制 UTF-8 避免亂碼
            return r
        except Exception as e:
            last = e
            time.sleep(1.5 * (i + 1))
    raise last


def get_tid_index(lid):
    """回傳 OrderedDict: tid -> {'lv': set(level_name), 'cat': set(cat_name)}，保留首次出現順序。"""
    data = get_with_retry(f"{GRMPTS}/json/{lid}.json").json()
    idx = OrderedDict()
    for lkey, cats in data.items():
        lname = LEVELS.get(lkey, lkey)
        if not isinstance(cats, dict):
            continue
        for tkey, tids in cats.items():
            cname = CATS.get(tkey, tkey)
            for tid in (tids or []):
                tid = int(tid)
                if tid <= 0:
                    continue
                if tid not in idx:
                    idx[tid] = {"lv": set(), "cat": set(), "lkey": lkey}
                idx[tid]["lv"].add(lname)
                idx[tid]["cat"].add(cname)
    return idx


def fetch_pairs(tid):
    """抓 read_embed，解析 Ab(族語)/Ch(中文) 平行句。族語含尾隨中文，於首個中文字切除。"""
    r = get_with_retry(f"{BASE}/text/read_embed.php?tid={tid}&mode=1&num=1")
    soup = BeautifulSoup(r.text, "html.parser")
    abs_ = soup.select(".read-sentence.Ab")
    chs = soup.select(".read-sentence.Ch")
    out = []
    for a, c in zip(abs_, chs):
        t = re.sub(r"\s+", " ", a.get_text(" ", strip=True)).strip()
        m = CJK.search(t)
        amis = (t[:m.start()] if m else t).strip()
        zh = c.get_text(strip=True)
        if amis and zh:
            out.append((amis, zh))
    return out


def scrape_dialect(lid):
    name = DIALECTS[lid]
    print(f"[{lid} {name}] 取索引 json/{lid}.json …")
    idx = get_tid_index(lid)
    print(f"[{lid} {name}] {len(idx)} 個 tid，開始逐課抓…")
    rows = []
    for i, (tid, meta) in enumerate(idx.items(), 1):
        lv = "/".join(sorted(meta["lv"], key=lambda x: [v for k, v in LEVELS.items()].index(x)))
        cat = "/".join(sorted(meta["cat"], key=lambda x: [v for k, v in CATS.items()].index(x)))
        try:
            pairs = fetch_pairs(tid)
        except Exception as e:
            print(f"  ! tid {tid} 失敗：{e}")
            continue
        for amis, zh in pairs:
            rows.append([name, lv, cat, tid, amis, zh])
        if i % 20 == 0:
            print(f"  …{i}/{len(idx)}  累積 {len(rows)} 句")
        time.sleep(0.3)  # 禮貌延遲，勿壓垮對方伺服器
    return rows


def parse_args(argv):
    if not argv:
        return [3]
    if argv[0] == "all":
        return list(DIALECTS.keys())
    if argv[0] == "amis":
        return list(AMIS_IDS)
    ids = []
    for a in argv:
        try:
            ids.append(int(a))
        except ValueError:
            print(f"忽略非數字參數：{a}")
    return ids


def main():
    ids = parse_args(sys.argv[1:])
    outdir = os.path.dirname(os.path.abspath(__file__))
    for lid in ids:
        if lid not in DIALECTS:
            print(f"跳過未知/空號 id：{lid}")
            continue
        rows = scrape_dialect(lid)
        fn = os.path.join(outdir, f"{lid}_{DIALECTS[lid]}.csv")
        with open(fn, "w", newline="", encoding="utf-8-sig") as f:
            w = csv.writer(f)
            w.writerow(["方言", "級別", "句法分類", "tid", "族語", "中文"])
            w.writerows(rows)
        print(f"✓ {fn}  共 {len(rows)} 句\n")


if __name__ == "__main__":
    main()
