#!/usr/bin/env node
/**
 * 데이터베이스 초기화 스크립트
 * 
 * 사용법:
 * npx tsx scripts/init-database.ts
 */

import { initDatabase } from '@/lib/db';

console.log('🚀 데이터베이스 초기화 중...\n');

try {
  initDatabase();
  console.log('\n✅ 데이터베이스가 성공적으로 초기화되었습니다!');
  console.log('\n📋 기본 관리자 계정:');
  console.log('  📧 이메일: admin@emfrontier.com');
  console.log('  🔑 비밀번호: admin123');
} catch (error: any) {
  console.error('❌ 오류 발생:', error.message);
  process.exit(1);
}
