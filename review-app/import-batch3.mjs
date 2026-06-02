import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'ami-wiki-review' });
const db = getFirestore();

const batch3 = [
  {
    id: 'transport',
    order: 7,
    title: '交通（Rakat）',
    zh_text: '新加坡交通便利，是世界連通性最強的國家之一，與全球600多個港口通航。新加坡擁有5個機場，樟宜機場是東南亞最繁忙的機場之一，也是袋鼠航線的重要中途站，被評為全球最舒適機場之一。新加坡港是全球最繁忙的港口之一，每年處理超過三千萬個貨櫃。',
    ami_ai: "mangaʼay ko rakat no singkapol, o tadacalowayay a kitakit no hekal a masasoʼopo, ato enem patek ira ko enem a patek no minato no hekal. limaay ko parakatay to hikoki no singkapolu, o saʼalomanay a parakat to hikoki i tong nan a kanatal, o tadamaanay a parakarakat to hikuki no pawci, o sakacaloway a parakat no hikoki no hekal saan ko singkapol. o satataʼangayay a minato no kitakit ko minato no singkapolo, to mihecahecaan mataʼelif ko tolo a patek a ʼofad ko parakat to kitakit.",
    ami_reviewed: '', comments: '',
  },
  {
    id: 'culture',
    order: 8,
    title: '文化（Kapolongan）',
    zh_text: '新加坡是多元種族、多元文化的國家，主要由華人、馬來人、印度人及其他族裔組成。官方語言有英語、華語、馬來語及坦米爾語四種。約五分之四的新加坡人居住在政府建造的組屋中。新加坡人口密度高，是全球人口密度第三高的國家，僅次於摩納哥和澳門。',
    ami_ai: "o kasasiromaroma no finacadan, kasasiromaroman no serangawan a kitakit ko sinkapol, o holam, malay, ingto ato romaroma a finacadan ko masangaʼay. o sowal no mikowanay ira ko no amilika a sowal, no holam a sowal ato no taywan a sowal sepat ko kasasiroma no sowal. maedeng lima no sasepat ko maroʼay i nipatirengan no ceng fo a lomaʼ no singkapol. ʼaloman ko tamdaw no sinkapol i, o sakatolo a ʼalomanay ko tamdaw a kitakit itini i hekal, deng o monako ato aw mon ko saikoray.",
    ami_reviewed: '', comments: '',
  },
  {
    id: 'food',
    order: 9,
    title: '飲食（Kakaenen）',
    zh_text: '新加坡飲食文化多元，融合馬來、中國、印度及西方飲食傳統。著名的本地食物包括海南雞飯、肉骨茶、叻沙、蝦麵、炒粿條、沙嗲、辣椒螃蟹及椰漿飯等。新加坡的小販中心是體驗在地飲食文化的重要場所，提供多種族的平價美食。',
    ami_ai: "adihay ko kasasiromaroma no serangawan no kakaenen no sinkapok, malacecay to no malay, ciwko, ingto ato no pasaetipay a kakaenen. o kafanaʼan no itiniay a kakaenan i, o hakhak no ʼayam, o ociya no ʼokak no titi, o saytaw, o towami, o ʼicep, o ʼoʼol, o ʼadiyam ato ʼicep. o piʼarawan no singkapok to kakaenen no tiniay a niyaroʼ, o kakaenen no ʼalomanay a finacadan ko matatodongay.",
    ami_reviewed: '', comments: '',
  },
  {
    id: 'education',
    order: 10,
    title: '教育（Sifanaʼ）',
    zh_text: '新加坡非常重視教育，教育部是僅次於國防部的第二大財政支出。新加坡採用英國式教育制度，以英語為主要教學語言。完成中小學後可選擇升讀初級學院或理工學院。新加坡國立大學與南洋理工大學是亞洲知名學府。新加坡每年吸引大量外國留學生，是亞洲重要的區域教育樞紐。',
    ami_ai: "tadamaanay ko piʼarawan no singkapol to sifanaʼ, o sakatosa aca a tadamaanay a payci no kitakit ko picodadan no singkapolan. o no ingko a sifanaʼ ko sapicodad no singkapolong, o no amilika a sowal ko saʼayaway a pasifanaʼ. maherek a mitilid, mangaʼay to macakat a mitilid i satapanganay a picodadan ano eca i ci ingkoan. o no singkapolis a kociway ato nan ci ingkoay a kociyaw o ci ingkof no ʼasia. mihalaka to ʼalomanay a micodaday no roma a kitakit ko singkapol, o tadamaanay itiniay i ʼasia a sifanaʼ.",
    ami_reviewed: '', comments: '',
  }
];

const articleRef = db.collection('translations').doc('Singapore');
await articleRef.update({ section_count: 10, status: 'in_review' });

for (const section of batch3) {
  const { id, ...data } = section;
  await articleRef.collection('sections').doc(id).set(data);
  console.log(`✓ 段落：${section.title}`);
}

console.log('\n第三批匯入完成！全部 10 段待校對。');
process.exit(0);
