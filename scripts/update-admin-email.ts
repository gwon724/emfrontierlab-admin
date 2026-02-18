#!/usr/bin/env node
/**
 * 관리자 이메일 변경 스크립트
 * 
 * 사용법:
 * npx tsx scripts/update-admin-email.ts <기존이메일> <새이메일>
 */

import Database from 'better-sqlite3';

const dbPath = '/home/user/shared-emfrontier.db';

function updateAdminEmail(oldEmail: string, newEmail: string) {
  const db = new Database(dbPath);
  
  try {
    // 기존 관리자 확인
    const admin: any = db.prepare('SELECT * FROM admins WHERE email = ?').get(oldEmail);
    
    if (!admin) {
      console.error(`❌ 오류: '${oldEmail}' 이메일을 가진 관리자를 찾을 수 없습니다.`);
      return false;
    }

    // 새 이메일 중복 확인
    const existingNewEmail: any = db.prepare('SELECT * FROM admins WHERE email = ?').get(newEmail);
    
    if (existingNewEmail) {
      console.error(`❌ 오류: '${newEmail}' 이메일이 이미 사용 중입니다.`);
      return false;
    }

    // 이메일 업데이트
    db.prepare('UPDATE admins SET email = ? WHERE email = ?').run(newEmail, oldEmail);
    
    console.log('✅ 이메일이 성공적으로 변경되었습니다!');
    console.log(`\n📧 기존 이메일: ${oldEmail}`);
    console.log(`📧 새 이메일: ${newEmail}`);
    console.log(`👤 이름: ${admin.name}`);
    console.log(`\n🔑 비밀번호는 변경되지 않았습니다.`);
    
    return true;
  } catch (error: any) {
    console.error('❌ 오류 발생:', error.message);
    return false;
  } finally {
    db.close();
  }
}

// CLI 실행
const args = process.argv.slice(2);
const oldEmail = args[0];
const newEmail = args[1];

if (!oldEmail || !newEmail) {
  console.log('❌ 사용법: npx tsx scripts/update-admin-email.ts <기존이메일> <새이메일>');
  console.log('예시: npx tsx scripts/update-admin-email.ts admin@emfrontier.com son713119@naver.com');
  process.exit(1);
}

updateAdminEmail(oldEmail, newEmail);
