#!/usr/bin/env node
/**
 * 관리자 계정 삭제 스크립트
 * 
 * 사용법:
 * npx tsx scripts/delete-admin.ts <이메일>
 */

import Database from 'better-sqlite3';

const dbPath = '/home/user/shared-emfrontier.db';

function deleteAdmin(email: string) {
  const db = new Database(dbPath);
  
  try {
    // 관리자 존재 확인
    const admin: any = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
    
    if (!admin) {
      console.error(`❌ 오류: '${email}' 이메일을 가진 관리자를 찾을 수 없습니다.`);
      return false;
    }

    // 관리자 삭제
    db.prepare('DELETE FROM admins WHERE email = ?').run(email);
    
    console.log('✅ 관리자가 성공적으로 삭제되었습니다!');
    console.log(`\n📧 이메일: ${email}`);
    console.log(`👤 이름: ${admin.name}`);
    
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
const email = args[0];

if (!email) {
  console.log('❌ 사용법: npx tsx scripts/delete-admin.ts <이메일>');
  console.log('예시: npx tsx scripts/delete-admin.ts admin@emfrontier.com');
  process.exit(1);
}

deleteAdmin(email);
