import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'ami-wiki-review' });
const db = getFirestore();

const batch2 = [
  {
    id: 'geography',
    order: 4,
    title: '地理（Katatelekan）',
    zh_text: '新加坡共有大小島嶼63個，主島新加坡島的面積佔90%以上。北部有新柔長堤，西部有第二通道，連接馬來西亞。地理最高點為武吉知馬。新加坡很多國土都是填海產生。新加坡地處熱帶，長年氣候炎熱潮濕，年平均溫度在24至34攝氏度之間。境內共有300多座公園及4個自然保護區，有「花園城市」之稱。',
    ami_ai: "tolo poloʼ ira ko tolo poloʼ ko polong no tataʼakay a kanatal no sinkapol, o kakahad no kanatal no singkapol i, maedeng tosa poloʼ ira to ko lima poloʼ. i kaʼamis ira ko singkociw, i pasaetip ira ko sakatosa a lalan, malacecay to malasiya. o satakaraway a lalan i, o okitema, adihayay ko masadakay no riyar a sotaʼ. i tini i sinkapol i faedetay a pala, halafinay ko romiʼad faedetay ko hekal, malacecacay ko faedet no romiʼamiʼad tangasa i pifotingan. i lalomaʼ no kitakit i, tolo soʼot ira ko tolo a soʼot a soʼelinay a kongyen, ira ko sepat a pala a misimaw to padadengay a padadengayan, ira ko cecay a ngangan, o hanahanaan a niyaroʼ hananay.",
    ami_reviewed: '',
    comments: '',
  },
  {
    id: 'politics',
    order: 5,
    title: '政治（Mikowan）',
    zh_text: '新加坡實行議會制政府，為代議民主制。總統由直接民選產生，為國家元首，任期六年。國會議員選舉產生，任期五年，總理為政府首腦，由國會多數黨產生。自建國後，人民行動黨一直是唯一的執政黨。新加坡工人黨是國會中的最大在野黨。',
    ami_ai: "misatapang ko singkapol a mikayki to ceng fo, patodong to demak no tamdamdaw. o sowal no singkapol i, tangsol sa a mapiliʼ ko cong tong, o malatomokay no kitakit, enem a mihecaan ko romiʼad. masadak ko singkapot no kokay, lima a miheca ko romiad, o fongoh no ceng fo ko cong ko cong ko cang cang, masadak ko cong cong ko cong cong, nano patireng to ko ko ko cong cong i, deng o cecay to ko mikowanay a kingkapol. o sakakaay no kokay a yan cong ko cong.",
    ami_reviewed: '',
    comments: '',
  },
  {
    id: 'economy',
    order: 6,
    title: '經濟（Pinangan）',
    zh_text: '新加坡擁有高度發達的市場經濟，得益於優越的地理位置、先進的基礎設施和廉潔高效的政府。新加坡是全球重要的金融、貿易及物流中心，也是全球三大石油煉化中心之一。電子產業是製造業支柱，新加坡是全球半導體製造重鎮。自獨立以來，新加坡被譽為「亞洲四小龍」之一，擁有高人均收入和完善的社會保障。',
    ami_ai: "adihay ko macakatay a ʼorip no pasafaco no singkapol, o tadafangcalay a pala, o kafanaʼan no misangaʼan a misangaʼ ato maʼoripay a ceng fo. o tadamaanay a pifacoan, patiyamay ato maamaan ko singkapol i polong no hekal, o cecay no tolo tataʼakay a pifacaʼan a pifalican a ceng fo i polong nonini a hekal. o satoko no misangaay ko misangaʼay, o pangkiw no misangaan a niyaroʼ no polong no kitakit ko singkapolo. nano nika tomireng to, o cecacecay no \"Aciyo a selal\" hananay ko singkapolong, ira ko ʼaca no tamdaw ato fangcalay a misimaw to sakaʼorip no niyaroʼ.",
    ami_reviewed: '',
    comments: '',
  }
];

const articleRef = db.collection('translations').doc('Singapore');

// 更新 section_count
await articleRef.update({ section_count: 6 });

for (const section of batch2) {
  const { id, ...data } = section;
  await articleRef.collection('sections').doc(id).set(data);
  console.log(`✓ 段落：${section.title}`);
}

console.log('\n第二批匯入完成！');
process.exit(0);
