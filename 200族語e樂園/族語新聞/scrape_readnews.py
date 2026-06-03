#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
族語新聞 (readnews) 抓取腳本
來源：https://web.klokah.tw/readnews/  族語E樂園（內容轉載自原住民族新聞台 news.ipcf.org.tw）
授權：⚠️ 非 CC。klokah 依著作權法第 52、65 條「合理使用」轉載。
      僅可作研究 / 翻譯校對 / grep 真實用法之參考，切勿轉載或貼入維基百科。

資料結構（單一端點即含全部，免再打 read.php）：
  readnews/php/getNews.php?d={did}&t=&p={page}  →  JSON {"last":..,"data":[{...}]}
  每筆：id, time(日期), did, dch(方言名), titleCh(中文標題), titleAb(族語標題), stc(族語全文)
  注意：stc 為「單語族語」內文，僅標題為族語↔中文平行；內文無逐句中文。
        stc 結尾常附中文出處引用（原民族新聞台、記者、合理使用聲明）。
  分頁：逐頁抓到 data 為空即止（last 欄位語義不可靠）。
方言 id 與文化篇/grmpts 共用同一套編號（海岸=3，12 為空號）。

用法：
  python scrape_readnews.py            # 預設只抓海岸阿美語 (id=3)
  python scrape_readnews.py amis       # 阿美五方言 (1-5)
  python scrape_readnews.py all        # 全 42 方言
  python scrape_readnews.py 2 3        # 指定方言

輸出：與本腳本同目錄 {id}_{方言名}.csv
  欄位：方言, 日期, news_id, 標題族語, 標題中文, 族語內文, 出處
"""
import sys, os, re, csv, time
import requests

BASE = "https://web.klokah.tw/readnews"

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
AMIS_IDS = [1, 2, 3, 4, 5]
MAX_PAGE = 100  # 安全上限

URL_RE = re.compile(r"https?://[^\s，。）)]+")

session = requests.Session()
session.headers.update({"User-Agent": "Mozilla/5.0 (corpus research; fair-use reference only)"})


def get_with_retry(url, tries=3, timeout=30):
    last = None
    for i in range(tries):
        try:
            r = session.get(url, timeout=timeout)
            r.raise_for_status()
            r.encoding = "utf-8"
            return r
        except Exception as e:
            last = e
            time.sleep(1.5 * (i + 1))
    raise last


def extract_source(stc):
    """取 stc 結尾的出處網址（若有）。"""
    m = URL_RE.search(stc)
    return m.group(0) if m else ""


def scrape_dialect(lid):
    name = DIALECTS[lid]
    rows = []
    seen = set()
    print(f"[{lid} {name}] 逐頁抓 getNews …")
    for page in range(1, MAX_PAGE + 1):
        url = f"{BASE}/php/getNews.php?d={lid}&t=&p={page}"
        try:
            data = get_with_retry(url).json().get("data", [])
        except Exception as e:
            print(f"  ! 第 {page} 頁失敗：{e}")
            break
        if not data:
            break
        for it in data:
            nid = it.get("id")
            if nid in seen:
                continue
            seen.add(nid)
            stc = (it.get("stc") or "").strip()
            rows.append([
                it.get("dch") or name,
                it.get("time", ""),
                nid,
                (it.get("titleAb") or "").strip(),
                (it.get("titleCh") or "").strip(),
                stc,
                extract_source(stc),
            ])
        print(f"  …第 {page} 頁 +{len(data)} 篇（累積 {len(rows)}）")
        time.sleep(0.3)
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
            w.writerow(["方言", "日期", "news_id", "標題族語", "標題中文", "族語內文", "出處"])
            w.writerows(rows)
        print(f"✓ {fn}  共 {len(rows)} 篇\n")


if __name__ == "__main__":
    main()
