#!/usr/bin/env node
/**
 * 관리자 비밀번호 재설정 스크립트
 * 
 * 사용법:
 * npx tsx scripts/reset-admin-password.ts <이메일> <새비밀번호>
 * 
 * 예시:
 * npx tsx scripts/reset-admin-password.ts admin@emfrontier.com newpassword123
 */

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const dbPath = '/home/user/shared-emfrontier.db';

function resetAdminPassword(email: string, newPassword: string) {
  const db = new Database(dbPath);
  
  try {
    // 관리자 존재 확인
    const admin: any = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
    
    if (!admin) {
      console.error(`❌ 오류: '${email}' 이메일을 가진 관리자를 찾을 수 없습니다.`);
      console.log('\n📋 현재 등록된 관리자 목록:');
      const admins: any = db.prepare('SELECT id, email, name FROM admins').all();
      admins.forEach((a: any) => {
        console.log(`  - ${a.email} (${a.name})`);
      });
      return false;
    }

    // 새 비밀번호 해시화
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    
    // 비밀번호 업데이트
    db.prepare('UPDATE admins SET password = ? WHERE email = ?').run(hashedPassword, email);
    
    console.log('✅ 비밀번호가 성공적으로 재설정되었습니다!');
    console.log(`\n📧 이메일: ${email}`);
    console.log(`🔑 새 비밀번호: ${newPassword}`);
    console.log(`👤 이름: ${admin.name}`);
    
    return true;
  } catch (error: any) {
    console.error('❌ 오류 발생:', error.message);
    return false;
  } finally {
    db.close();
  }
}

function createNewAdmin(email: string, password: string, name: string) {
  const db = new Database(dbPath);
  
  try {
    // 이메일 중복 확인
    const existing: any = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
    
    if (existing) {
      console.error(`❌ 오류: '${email}' 이메일을 가진 관리자가 이미 존재합니다.`);
      return false;
    }

    // 비밀번호 해시화
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    // 새 관리자 생성
    db.prepare('INSERT INTO admins (email, password, name) VALUES (?, ?, ?)').run(
      email,
      hashedPassword,
      name
    );
    
    console.log('✅ 새 관리자가 성공적으로 생성되었습니다!');
    console.log(`\n📧 이메일: ${email}`);
    console.log(`🔑 비밀번호: ${password}`);
    console.log(`👤 이름: ${name}`);
    
    return true;
  } catch (error: any) {
    console.error('❌ 오류 발생:', error.message);
    return false;
  } finally {
    db.close();
  }
}

function listAdmins() {
  const db = new Database(dbPath);
  
  try {
    const admins: any = db.prepare('SELECT id, email, name, created_at FROM admins').all();
    
    if (admins.length === 0) {
      console.log('📋 등록된 관리자가 없습니다.');
      return;
    }
    
    console.log('📋 등록된 관리자 목록:\n');
    admins.forEach((admin: any) => {
      console.log(`  ID: ${admin.id}`);
      console.log(`  📧 이메일: ${admin.email}`);
      console.log(`  👤 이름: ${admin.name}`);
      console.log(`  📅 생성일: ${admin.created_at}`);
      console.log('  ---');
    });
  } catch (error: any) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    db.close();
  }
}

// CLI 실행
const args = process.argv.slice(2);
const command = args[0];

if (command === 'list' || command === '--list' || command === '-l') {
  listAdmins();
} else if (command === 'create' || command === '--create' || command === '-c') {
  const [_, email, password, name] = args;
  
  if (!email || !password || !name) {
    console.log('❌ 사용법: npx tsx scripts/reset-admin-password.ts create <이메일> <비밀번호> <이름>');
    console.log('예시: npx tsx scripts/reset-admin-password.ts create admin2@emfrontier.com password123 "관리자2"');
    process.exit(1);
  }
  
  createNewAdmin(email, password, name);
} else if (command === 'reset' || !command || args.length === 2) {
  let email: string, password: string;
  
  if (command === 'reset') {
    email = args[1];
    password = args[2];
  } else {
    email = args[0];
    password = args[1];
  }
  
  if (!email || !password) {
    console.log('❌ 사용법: npx tsx scripts/reset-admin-password.ts <이메일> <새비밀번호>');
    console.log('또는: npx tsx scripts/reset-admin-password.ts reset <이메일> <새비밀번호>');
    console.log('\n예시:');
    console.log('  비밀번호 재설정: npx tsx scripts/reset-admin-password.ts admin@emfrontier.com newpassword');
    console.log('  관리자 목록 보기: npx tsx scripts/reset-admin-password.ts list');
    console.log('  새 관리자 생성: npx tsx scripts/reset-admin-password.ts create admin2@emfrontier.com password123 "관리자2"');
    process.exit(1);
  }
  
  resetAdminPassword(email, password);
} else {
  console.log('❌ 알 수 없는 명령어입니다.');
  console.log('\n사용 가능한 명령어:');
  console.log('  비밀번호 재설정: npx tsx scripts/reset-admin-password.ts <이메일> <새비밀번호>');
  console.log('  관리자 목록 보기: npx tsx scripts/reset-admin-password.ts list');
  console.log('  새 관리자 생성: npx tsx scripts/reset-admin-password.ts create <이메일> <비밀번호> <이름>');
  process.exit(1);
}
