import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// 使用 Application Default Credentials（firebase CLI 登入）
initializeApp({ projectId: 'ami-wiki-review' });
const db = getFirestore();

const translations = [
  {
    id: 'Singapore',
    ami_title: 'Singapore',
    zh_title: '新加坡',
    ami_wiki_url: 'https://ami.wikipedia.org/wiki/Singapore',
    zh_source_url: 'https://zh.wikipedia.org/wiki/新加坡',
    status: 'pending',
    section_count: 3,
    created_at: new Date(),
    last_modified: new Date(),
    sections: [
      {
        id: 'intro',
        order: 1,
        title: '前言（Takaray Sowal）',
        zh_text: '新加坡共和國，通稱新加坡，雅稱獅城，是位於東南亞的島國，位於中南半島最南端，扼守麻六甲海峽最南端的出口。由新加坡島等63個島嶼組成，面積為735平方公里，因綠化程度高而有「花園城市」之美稱。1819年，英國在此建立殖民地，逐漸發展成繁榮的轉口港。1965年8月9日正式獨立建國。1970年代以來，新加坡經濟迅速發展，被譽為「亞洲四小龍」之一，是全球重要的煉油、貿易、物流及金融中心。新加坡是一個多元種族、多元文化、多語言的國家。',
        ami_ai: 'o singkapolu hananay a kanatal, o singkapol hananay, o singakapolu hananay, safaw enem poloʼ ira ko lima a kanatal hananay, itini i nowalian a kanatal a kanatal. itini i satimol no ceng nan han a kanatal ko kanatal, misimaw to enemay a kanatal no kanatal. o singkapulu hananay a kasafinawlan masangaʼ ko tolo poloʼ ira ku tolo a kanatal masangaʼ, o kakahaday ko kakahaday a niyaroʼ, saka ira ko "pakohanaan" hananay a niyaroʼ. i ʼayaw no moetep ira ko falo a poloʼ iraay ko cecay a mihecaan, itini a mipatireng ko ingko a kitakit, matongal ko nikacakat a macakat a macaloh ko kanatal. nai safaw siwa poloʼ ira to ko pito poloʼ a miheca, o cecay no safaw a kanatal to ko singkapolo, o tadamaanay a kasasiromaroma a finacadan, kasasiromaromaroma no serangawan ato sowal a kitakit ko singkapulu.',
        ami_reviewed: '',
        comments: '',
      },
      {
        id: 'history1',
        order: 2,
        title: '歷史前半（古代至二戰）',
        zh_text: '新加坡在3世紀已有馬來人居住，最早的文獻記載源自3世紀東吳將領康泰所著的《吳時外國傳》。14世紀，明朝把新加坡稱作「淡馬錫」，意為「水鎮」。1819年，英國東印度公司的萊佛士登陸新加坡，開始管轄該地區。1824年，新加坡正式成為英國殖民地。1867年升格為海峽殖民地，受英國直接統治。1942年2月15日，日本佔據並統治新加坡，將之更名為「昭南島」。1945年9月，日本宣布無條件投降，英國重新管轄新加坡。',
        ami_ai: 'i sakatolo poloʼ ira ko sepat poloʼ ira to ko sepat ko tamdaw no malay ko maroʼay i sinkapol, o saʼayaway a nitilidan a tilid i, nanitiya i sakatulu poloʼ iraay ko sepat polo ira ko sepat a soʼot ko nipiʼorong no lidaw a miʼorong a miʼangʼang to no kitakit no kontay. i sakasepat poloʼ ira kora sepatay poloʼ ira ira ko sepat ko sepat a poloʼ a mihecaan, o no singkapol ko mipanganganay to sinkapol no sinkapol a niyaroʼ, o sowal no ingko to no ingko a kaysiya i lalomaʼ no lalifesiw no sinkapolo a niyaroʼ. i sakat poloʼ ira tosa poloʼ ira sepat poloʼ ila ko sepat a miheca, o no ingko ko miʼanganganay to no singkapolo. i sakatosa poloʼ ira a mihecan tosa a folad ira ko lima a romiʼad, o ripon ko miʼafasay a mikowan to sinkapolo, o "sinapol" hananay ko pipangangan. i sakasafaw siwa a mihecas no miheca ko siwa a folad, awaay a mihecal ko sowal no ripon a miheciw, o misangaʼang ko no ingkoway a mikowanan a mikowang a mikowad a mikoway to no singkowan.',
        ami_reviewed: '',
        comments: '',
      },
      {
        id: 'history2',
        order: 3,
        title: '歷史後半（獨立建國）',
        zh_text: '1959年，新加坡取得自治邦的地位，李光耀成為首任總理。1963年，新加坡加入馬來西亞聯邦。但因種族權利分配問題，新加坡與聯邦政府產生矛盾。1965年8月9日，馬來西亞國會以126票贊成、0票反對，通過將新加坡驅逐出聯邦，使新加坡被迫獨立建國。同年9月21日加入聯合國，10月加入英聯邦。1967年8月8日，在新加坡的協助下，東南亞國家聯盟正式成立。',
        ami_ai: 'lima soʼot lima poloʼ ira ko lima a mihecaan, malasaʼayaway a kanatal ko sinkapol, malacongco ko li hwayaw. cecay soʼot siwa soʼot tolo poloʼ ira ku tolo a miheca, mikapot ko sinkapolu to mala malasiyaay a kanatal. nika pakayni to pipalilam to kalodemak no finacadan, masadak ko sinkapolo ato sinkapol a ceng fo. cecay poloʼ iraay a mihecan lima poloʼ ila ko lima a folad siwa a romiʼad, o malasiyaay ho a kanatal i tosa soʼot ira ko tosa a poloʼ ira a kipo ko mihaiay, awaay ko kipo ko pacoliay, malaheci a milaplaplap to sinkapol masadak ko singkapol a kanatal, saka pacici sa a patireng ko sinkapulu a kanatal a kitakit. tona mihecaan to siwa a folad tosa poloʼ ira cecay a romiad mihakelong to malacecay to malacefangay a kanatan a kanatal malacefang. cecay a mihecal ira ko safaw a folad falo a romiʼ. moetep ira ko cecay a folad ira ko falo a remiʼad, itini i sinkapol no sinkapol malacecay a kanatal no sinkapolo a kanatal mapatireng ko kanatal.',
        ami_reviewed: '',
        comments: '',
      }
    ]
  }
];

async function importData() {
  console.log('開始匯入資料...');
  for (const article of translations) {
    const { sections, ...articleData } = article;
    const articleRef = db.collection('translations').doc(article.id);
    await articleRef.set(articleData);
    console.log(`✓ 條目建立：${article.id}`);

    for (const section of sections) {
      const { id, ...sectionData } = section;
      await articleRef.collection('sections').doc(id).set(sectionData);
      console.log(`  ✓ 段落：${section.title}`);
    }
  }
  console.log('\n匯入完成！');
  process.exit(0);
}

importData().catch(e => { console.error(e); process.exit(1); });
