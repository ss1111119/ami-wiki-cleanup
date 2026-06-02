import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

initializeApp({ projectId: 'ami-wiki-review' });
const auth = getAuth();

// 列出所有使用者，找老師帳號
const result = await auth.listUsers();
console.log('目前帳號：');
result.users.forEach(u => console.log(` - ${u.email} (uid: ${u.uid})`));

// 請在下方填入老師的 email 和新密碼
const teacherEmail = '';  // ← 填入老師 email
const newPassword = '';   // ← 填入新密碼

if (teacherEmail && newPassword) {
  const user = await auth.getUserByEmail(teacherEmail);
  await auth.updateUser(user.uid, { password: newPassword });
  console.log(`\n✓ 已重設 ${teacherEmail} 的密碼`);
} else {
  console.log('\n請填入 teacherEmail 和 newPassword 後再執行');
}
process.exit(0);
