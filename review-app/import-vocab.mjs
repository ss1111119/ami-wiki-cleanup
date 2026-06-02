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
  { zh: '機場',     ami_coast: 'hikocyo',     dict_coast: '飛機場（日語借詞）', ami_xiuguluan: 'hikocyo',   dict_xiuguluan: '飛機場', status: 'ok',   note: '萌典 hikocyo＝飛機場（同義 pahikokian）；原 hikoki 是飛機，已更正' },
  { zh: '氣候',     ami_coast: 'hekal',       dict_coast: '岸邊 ❌',          ami_xiuguluan: "romi'ad",   dict_xiuguluan: '白天、白晝', status: 'err', note: '兩者皆不準，請老師提供正確說法' },
  { zh: '地理',     ami_coast: 'katatelekan', dict_coast: '條約、規則 ❌',    ami_xiuguluan: "sakanga'ay no 'orip", dict_xiuguluan: '好的緣故＋生命', status: 'err', note: '請老師提供正確說法' },
  { zh: '經濟',     ami_coast: 'kicay',       dict_coast: '經濟（日語借詞）',   ami_xiuguluan: 'kicay',     dict_xiuguluan: '經濟',   status: 'ok',   note: '萌典 kicay＝經濟（日語借詞，蔡中涵大辭典）；原 pinangan 是習慣/癖性，已更正' },
  { zh: '交通',     ami_coast: 'rakat',       dict_coast: '步行、走路',       ami_xiuguluan: "sakafana' no sifo", dict_xiuguluan: '待確認', status: 'warn', note: '請老師確認正確說法' },
  { zh: '文化',     ami_coast: 'punka',       dict_coast: '文化（蔡中涵大辭典）', ami_xiuguluan: 'punka',     dict_xiuguluan: '文化',   status: 'ok',   note: '萌典 punka＝文化（例：Citodongay to punka a lomaʼ＝文化部）；原 kapolongan 是公共的，已更正' },
  { zh: '四小龍',   ami_coast: 'selal',       dict_coast: '同年、同輩份 ❌',  ami_xiuguluan: '—',          dict_xiuguluan: '—',      status: 'err',  note: '建議保留中文或老師另創說法' },
  { zh: '馬來西亞', ami_coast: 'Malaysiya',   dict_coast: '馬來西亞（英語借詞）', ami_xiuguluan: 'Malaysiya', dict_xiuguluan: '馬來西亞', status: 'ok', note: '萌典有收錄 Malaysiya；原音譯 malasiya 已更正' },
  { zh: '英國',     ami_coast: 'Ingkolis',    dict_coast: '英國、英語（英語借詞）', ami_xiuguluan: 'Ingkolis', dict_xiuguluan: '英國、英語', status: 'ok', note: '萌典 Ingkolis＝英國/英語；亦可解決「英語」說法，原 ingko 已更正' },
  { zh: '政府',     ami_coast: 'syifu',       dict_coast: '政府',            ami_xiuguluan: 'syifu',     dict_xiuguluan: '政府',   status: 'ok',   note: '萌典 syifu＝政府（原民會線上辭典）；原音譯 cengfo 已更正' },
  { zh: '教育',     ami_coast: "pasifanaʼ",   dict_coast: '教育、教學',       ami_xiuguluan: "pasifanaʼ", dict_xiuguluan: '教育、教學', status: 'ok', note: '萌典 pasifanaʼ＝教育/教學（含秀姑巒方言）；原音譯 sifana 已更正' },
];

await db.collection('translations').doc('Singapore').update({ vocab });
console.log(`✓ 詞彙對照表已存入 Firestore（${vocab.length} 條）`);
process.exit(0);
