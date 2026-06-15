import fs from 'fs';
const d = JSON.parse(fs.readFileSync('scripts/wiki-descriptions.json', 'utf8'));

const s2t = {
  '刚': '剛', '镰': '鐮', '葱': '蔥', '穆': '穆', '杜': '杜', '尔': '爾',
  '尔': '爾', '约': '約', '曼': '曼', '埃': '埃', '努': '努', '尔': '爾',
  '努': '努', '尔': '爾', '德': '德', '萨': '薩', '维': '維', '亚': '亞',
  '普': '普', '拉': '拉', '纳': '納', '布': '布', '慕': '慕', '克': '克',
  '吉': '吉', '鲁': '魯', '文': '文', '里': '裡', '夫': '夫', '林': '林',
  '萨': '薩', '尔': '爾', '瓦': '瓦', '基': '基', '马': '馬', '亚': '亞',
  '尔': '爾', '迪': '迪', '特': '特', '药': '藥', '物': '物', '乌': '烏',
  '拉': '拉', '圭': '圭', '习': '習', '近': '近', '平': '平',
  '番': '番', '茄': '茄', '根': '根',
};

// Specific fixes for known simplified entries
const fixes = {
  "Congo, democratic republic of the": '剛果民主共和國',
  'Felipe VI': '費利佩六世',
  'Idriss Déby': '伊德里斯·代比',
  'Incay': '蕹菜',
  'Kakawit': '鐮刀',
  'Kenaw': '蔥',
  'Linay': '傘',
  'Mahamadou Issoufou': '穆罕默杜·伊素福',
  'Michelle Bachelet': '蜜雪兒·巴舍萊',
  'Mohamed Ould Abdel Aziz': '穆罕默德·烏爾德·阿卜杜勒-阿齊茲',
  'O matakaway a cecay rocok': '失竊的一代',
  'Pahko^': '過溝菜蕨',
  'Payayoka': '西番蓮',
  'Pranab Mukherjee': '普拉納布·慕克吉',
  'Reuven Rivlin': '魯文·里夫林',
  'Salva Kiir Mayardit': '薩爾瓦·基爾·馬亞爾迪特',
  'Sapaiyo': '藥物',
  'Tomato': '番茄',
  'Tapangan': '根',
  'Uruguay': '烏拉圭',
  'Xi Jinping': '習近平',
  'Juan Manuel Santos': '胡安·曼努埃爾·桑托斯',
};

for (const [k, v] of Object.entries(fixes)) {
  if (d.hasOwnProperty(k) && d[k] !== v) {
    console.log(k, ':', d[k], '->', v);
    d[k] = v;
  }
}

fs.writeFileSync('scripts/wiki-descriptions.json', JSON.stringify(d, null, 2), 'utf8');
const withDesc = Object.values(d).filter(v => v).length;
console.log('有說明:', withDesc, '筆');
