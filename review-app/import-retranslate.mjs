// 逐句重翻 + 數字修正後，回寫 Firestore（2026-06-02）
// 作法：以句號斷句逐句餵翻譯系統，解決長輸入漏句問題；數字依中文原文改阿拉伯數字。
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ projectId: 'ami-wiki-review' });
const db = getFirestore();

const sections = [
  {
    id: 'intro',
    ami_ai: `o singkapol hananay a kanatal, o singkapolo hananay, o ci lingacay hananay, itiniay i sawalian a kanatal a kitakit, itini i satimolan no tenok no tenok a kanatal ko satimolan, misimaw to satimolan a kasadakan no nanom hananay a riyar. o singkapopo hananay a kanatal 63 a kanatal ko masaʼopo, 735 a kongli ko kakahad no kanatal, nawhani takaraw ko kangdaway saka ira ko "Phanaan a niyaroʼ" hananay a fangcalay a ngangan. 1819 a mihecaan, patireng to ko ingko itini a maroʼ, sarakat sato a macakat ko kalodakatan a minato. saka 1965 a mihecaan, 8 a folad 9 a romiʼad patireng to ko kitakit. nano 1970 a mihecaan, macakat to ko ʼorip no Singkapol, o cecay no "Aciya sepatay a kangdaway" han, o tadamaanay a misasiraw, patiyamay, miʼacaay ato miʼacaan no kitakit. o kasasiromaroma no finacadan, kasasiromaroman no serangawan, kasasiroma no sowal a kitakit ko Singkapol.`,
    comments: `【逐句重翻＋數字修正 2026-06-02】數字改阿拉伯：63 島嶼、735（原文為「平方公里」，AI 只譯「公里 kongli」，需補「平方」）、1819、1965/8/9、1970。比舊版補回了長輸入時漏掉的「735 平方公里」「1965 獨立日」「煉油貿易金融中心」。用詞品質待老師確認。`,
  },
  {
    id: 'history1',
    ami_ai: `iraay to ko malayaay a tamdaw itini i Singkapol i saka 3 a soʼot, o saʼayaway a nitilidan a codad i, nanitiya i saka 3 a soʼotan a soʼelin ko sowal no mikowanay to kontay no lidaw no kanatal. 14 a soʼot ko mihecaan, pangangan han no Ming-caw ko Singkapol "tan-may-si" han, o tatodong o "Ciwidian" sanay. yo 1819 a mihecaan, macakat tayra i Singkapol ko kaysiya no ingko tung kosi no ingko, misatapang to mikowan tora pala. itiya i, 1824 a mihecaan, malacowacowaay no Ingko ko Singkapol. itiya i, 1867 a mihecaan, malatapang to no riyar, tangsol to a makowan no Ingko. 1942 a mihecaan 2 a folad 15 a romiʼad, maʼafas no ripon a mikowan to Singkapol, liyawen to a pangangan to "Sownan a kanatal". saka 1945 a mihecaan saka 9 a folad, awa ko laheci a mihakelong to sowal no Ripon, miliyaw ho mikowan to Singkapol ko Ingko.`,
    comments: `【逐句重翻＋數字修正 2026-06-02】數字改阿拉伯：3 世紀、14 世紀、1819、1824、1867、1942/2/15、1945/9。⚠️ AI 把「15 日」誤譯為「5 日(lima)」已更正為 15。已修正中文外洩：「sin cikaw / sinka坡」「Singkapod」→ Singkapol。「3 世紀」採序數寫法 saka 3。用詞待老師確認。`,
  },
  {
    id: 'history2',
    ami_ai: `1959 a mihecaan, malasaʼayaway a kitakit ko Singkapol, mala saʼayaway malatomokay a cungli ci li kwanyaw. itiya i, 1963 a mihecaan, malacecay to ko Singkapol a malacecay a malacefang no Malaya. nikaorira, tona caay ka tatodong ko pipakilac to salongoc no finacadan, caay ka lecad ko singkapol ato ceng fo. 1965 a mihecaan 8 a folad 9 a romiʼad, o malaisiya a koʼing ko mihaiay to 126 a kipo, awaay (0 a kipo) ko pacoliay, malaheci ko pilaplap to singkapol masadak nai kanatal, saka pacici sa ko singkapol a patireng to kitakit. toya mihecaan 9 a folad 21 a romiʼad micomod to holicko, 10 a folad micomod i ing lin han. 1967 a mihecaan 8 a folad 8 a romiʼad, itini i singkapol mapacafay, soʼelinay mapatireng ko liyon no kitakit no lidaw.`,
    comments: `【逐句重翻＋數字修正 2026-06-02】數字改阿拉伯：1959、1963、1965/8/9、126 票、0 票（AI 原以 awaay「無」表達，已標 0）、9/21、10 月、1967/8/8。李光耀＝ci li kwanyaw 音譯待確認。`,
  },
  {
    id: 'geography',
    ami_ai: `o polong no sinkapol o tataʼakay mamangay a kanatal i, 63, o satadamaanay a kanatal no sinkapolan i, mataʼelif ko 90%. i kaʼamis ira ko Singcohcoc, i kaetip ira ko saka 2 a lalan, malalitemoh to Malayacia. o satakaraway no sera i, ci Oci Kimah. adihay ko kanatal no sinkapol maemin matomes no riyar. o faedetay ko pala no sinkapol, halafinay ko romiʼad faedet ko romiad, o laʼed no mihecaan i, i laʼed 24 ko faedet. itini i lalomaʼ no kitakit, ira ko 300 ko kongyen ato 4 ko masimaway a pala, ira ko "Phanaan a niyaroʼ" hananay.`,
    comments: `【逐句重翻＋數字修正 2026-06-02】數字改阿拉伯：63 島嶼（AI 誤為 33）、90%（AI 誤為 55）、第 2 通道、24 度、300 公園、4 保護區。⚠️ 溫度「24 至 34℃」AI 只譯出 24，上限 34 漏譯需補。已移除 AI 亂碼「(e3e0e0e)」。`,
  },
  {
    id: 'politics',
    ami_ai: `misangaʼ to hoing ko singkapol to ceng fo, mipatado to demak no tamdamdaw. o cong tong hananay i, o paytemek no finawlan a masadak, o malatomokay no kitakit, 6 a mihecaan ko katayalan. masadak ko pilihay to kiing no kokwi, 5 a mihecaan ko katayalan, o congli ko malatomokay no ceng fo, masadak ko saʼalomanay a tang [黨] no kokwi. nano patireng to ko kitakit, deng o yin cong [人民行動黨] ko cecayay a mikowanay. o satadamaanay no kokay i lalomaʼ no kokay ko sin cikafolan matayal a finacadan.`,
    comments: `【逐句重翻＋數字修正 2026-06-02】任期改阿拉伯：6 年、5 年。⚠️ AI 瑕疵：第 3 句「黨」中文外洩（暫標 a tang [黨]）、第 4 句「yin cong cong cong cong」重複亂碼（人民行動黨，暫標 yin cong [人民行動黨]），黨名正確說法請老師補。`,
  },
  {
    id: 'economy',
    ami_ai: `tadacalowayay ko ʼorip no misyakayay i sinkapol, o tadafangcalay a kaitiraan no pala, o kacalowayay a patireng to paranaan no lomaʼ, ato fangcalay ko tayal no ceng fo. o tadamaanay a piʼacaan, patiyamay ato miʼacaan to maamaan i tini i hekal ko sinkapol, o cecay no 3 a tataʼakay a pisangaʼan to simal i hekal. o misangaʼay to tingnaw a patiyamay ko satokoay, o misangaay to misangaʼan a tokay ko singkapol i polong no hekal. nano katomirengan no tireng, o cecay no "Aciya sepatay a kangic" hananay ko Singkapol, ira ko tadamaanay a tamdaw a maemin ko lifon ato fangcalay ko pidipot no finacadan.`,
    comments: `【逐句重翻＋數字修正 2026-06-02】「三大」改 3。「亞洲四小龍」為固定名稱保留 sepatay（四）。⚠️ 此段譯為 "kangic"、前言譯為 "kangdaway"，兩處「小龍」不一致，請老師統一。`,
  },
  {
    id: 'transport',
    ami_ai: `mangaʼay ko rakat no Singkapol, o cecay no ciʼicelay a kitakit no hekal ko masasoʼopoay, ira ko 600 ko kasasoʼopoan to minato no hekal. ira ko 5 a pahikokian no sinkapol, o satataʼangay a pahikukian no tungnan a niyaroʼ ko pahikokiyan no ciw ciw, o tadamaanay a pahikolan no ciwciw, o sangaʼayay a pahikokan no hikokian no polong no hekal sa cingra. o satadamaanay a minato no hekal ko minato no sinkapol, to mihecahecaan mataʼelif ko 30,000,000 ko misangaʼan.`,
    comments: `【逐句重翻＋數字修正 2026-06-02】數字改阿拉伯：600 港口、5 機場、30,000,000（三千萬）貨櫃。樟宜機場＝ciw ciw 音譯、「貨櫃」用詞 misangaʼan 待老師確認。`,
  },
  {
    id: 'culture',
    ami_ai: `o kasasiromaroma no finacadan, kasasiromaroman no serangawan a kitakit ko sinkapol, o holam, malay, ingto ato romaroma a finacadan ko misaʼopoay. o sowal no mikowanay i, o no Padaka, o no Holam, o no Malaya ato no Tamil a sowal 4 ko kasasiromaroma. maedeng lima no sepatay ko tamdaw no Singkapol i nipatirengan no ceng fo a lomaʼ a maroʼ. tada katataʼak ko tamdaw no sinkapol, o saka 3 a katataʼakay ko tamdaw a kitakit tona hekal, deng o monaco ato aw mon ko dodo sanay.`,
    comments: `【逐句重翻＋數字修正 2026-06-02】「四種」改 4、「第三高」改 saka 3。⚠️「英語」AI 譯為「Padaka」疑誤，請確認正確說法。「五分之四」保留阿美語分數寫法 lima no sepat，是否改阿拉伯數字請老師決定。`,
  },
  {
    id: 'food',
    ami_ai: `adihay ko kasasiromaroma no kakaenen a serangawan no Singkapol, malacecay ko kakaenen no Ma-ray, Ciko, In-taw ato pasaetip. o tadamaanay a kakaenen no itiniay a finacadan i, o hakhak no ʼayam, o ociya no ʼokak no titi, o ʼoʼol, o ʼodong, o toron, o ʼicep, o ʼadiyam ato ʼicep. o tadamaanay a piʼarawan to pinangan no kakomaenan no itiniay a finacadan ko pipatiyamay i sinkapol, paʼacaen ko kakaenen no ʼalomanay a finacadan.`,
    comments: `【逐句重翻 2026-06-02】本段無數字。食物名稱（海南雞飯、肉骨茶、叻沙等）多為音譯／借詞，對應說法請老師確認。`,
  },
  {
    id: 'education',
    ami_ai: `tadamaan ko falocoʼ no singkapol to sapasifanaʼ, o saka 2 aca a tataʼakay a ʼaca no payso ko picodadan. o no ingko ko sapasifanaʼ no singko, o amilika ko saʼayaway a pasifanaʼ to sowal. maherek a mitilid to kociyaw i, mangaʼay to a macakat a mitilid i kociyaw. o kafanaʼan no Aciya a pitilidan a pitilidan ko no Singkapol ko-li-tay ato nan-yang-ki-ye-kay-ho-tay. to mihecahecaan masolot no roma a kitakit ko mitiliday no sinkapol, o tadamaanay a pasifanaʼan no Aciya a pala konini.`,
    comments: `【逐句重翻＋數字修正 2026-06-02】「第二大」改 saka 2。大學名（國立大學 ko-li-tay、南洋理工 nan-yang-...）為音譯，請老師確認。`,
  },
];

async function run() {
  const articleRef = db.collection('translations').doc('Singapore');
  for (const s of sections) {
    const { id, ...data } = s;
    await articleRef.collection('sections').doc(id).set(data, { merge: true });
    console.log(`  ✓ 更新段落：${id}`);
  }
  await articleRef.set({ last_modified: FieldValue.serverTimestamp() }, { merge: true });
  console.log(`\n✓ 完成：10 段已逐句重翻＋數字修正寫回 Firestore`);
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
