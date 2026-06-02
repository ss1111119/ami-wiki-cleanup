import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'ami-wiki-review' });
const db = getFirestore();

const vocab = [
  { zh: '新加坡',   ami_coast: 'singkapolu', dict_coast: '→ 應為 singkapol', ami_xiuguluan: 'singkapol', dict_xiuguluan: '新加坡', status: 'warn', note: '請統一用 singkapol' },
  { zh: '日本',     ami_coast: 'ripon',       dict_coast: '日本，日本國',     ami_xiuguluan: 'ripon',     dict_xiuguluan: '日本',   status: 'ok',   note: '' },
  { zh: '語言',     ami_coast: 'sowal',       dict_coast: '話，話語，語言',   ami_xiuguluan: 'sowal',     dict_xiuguluan: '語言',   status: 'ok',   note: '' },
  { zh: '歷史',     ami_coast: 'likisi',      dict_coast: '歷史〈日語借詞〉', ami_xiuguluan: 'likisi',    dict_xiuguluan: '歷史',   status: 'ok',   note: '' },
  { zh: '總統',     ami_coast: 'congtong',    dict_coast: '總統',            ami_xiuguluan: 'congtong',  dict_xiuguluan: '總統',   status: 'ok',   note: '' },
  { zh: '港口',     ami_coast: 'minato',      dict_coast: '港口，海港',       ami_xiuguluan: 'minato',    dict_xiuguluan: '港口',   status: 'ok',   note: '' },
  { zh: '機場',     ami_coast: 'hikoki',      dict_coast: '飛機（非機場）',   ami_xiuguluan: 'hikoki',    dict_xiuguluan: '飛機',   status: 'warn', note: 'hikoki 是飛機，機場說法請確認' },
  { zh: '氣候',     ami_coast: 'hekal',       dict_coast: '岸邊 ❌',          ami_xiuguluan: "romi'ad",   dict_xiuguluan: '白天、白晝', status: 'err', note: '兩者皆不準，請老師提供正確說法' },
  { zh: '地理',     ami_coast: 'katatelekan', dict_coast: '條約、規則 ❌',    ami_xiuguluan: "sakanga'ay no 'orip", dict_xiuguluan: '好的緣故＋生命', status: 'err', note: '請老師提供正確說法' },
  { zh: '經濟',     ami_coast: 'pinangan',    dict_coast: '習慣、癖性 ❌',    ami_xiuguluan: 'sakatayal no lalan', dict_xiuguluan: '工具＋道路', status: 'err', note: '請老師提供正確說法' },
  { zh: '交通',     ami_coast: 'rakat',       dict_coast: '步行、走路',       ami_xiuguluan: "sakafana' no sifo", dict_xiuguluan: '待確認', status: 'warn', note: '請老師確認正確說法' },
  { zh: '文化',     ami_coast: 'kapolongan',  dict_coast: '公共的、公有的',   ami_xiuguluan: '—',          dict_xiuguluan: '—',      status: 'warn', note: '請老師確認 kapolongan 是否可用' },
  { zh: '四小龍',   ami_coast: 'selal',       dict_coast: '同年、同輩份 ❌',  ami_xiuguluan: '—',          dict_xiuguluan: '—',      status: 'err',  note: '建議保留中文或老師另創說法' },
  { zh: '馬來西亞', ami_coast: 'malasiya',    dict_coast: '字典未收錄',       ami_xiuguluan: 'malasiya',  dict_xiuguluan: '字典未收錄', status: 'missing', note: '音譯' },
  { zh: '英國',     ami_coast: 'ingko',       dict_coast: '字典未收錄',       ami_xiuguluan: 'ingko',     dict_xiuguluan: '字典未收錄', status: 'missing', note: '音譯' },
  { zh: '政府',     ami_coast: 'cengfo',      dict_coast: '字典未收錄',       ami_xiuguluan: '—',          dict_xiuguluan: '—',      status: 'missing', note: '音譯' },
  { zh: '教育',     ami_coast: 'sifana',      dict_coast: '字典未收錄',       ami_xiuguluan: '—',          dict_xiuguluan: '—',      status: 'missing', note: '音譯' },
];

await db.collection('translations').doc('Singapore').update({ vocab });
console.log(`✓ 詞彙對照表已存入 Firestore（${vocab.length} 條）`);
process.exit(0);
