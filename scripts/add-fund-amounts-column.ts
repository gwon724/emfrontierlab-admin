#!/usr/bin/env node
/**
 * applications 테이블에 fund_amounts 컬럼 추가
 * 각 정책자금별 금액을 저장하기 위한 JSON 필드
 */

import Database from 'better-sqlite3';

const dbPath = '/home/user/shared-emfrontier.db';

function addFundAmountsColumn() {
  const db = new Database(dbPath);
  
  try {
    // fund_amounts 컬럼이 이미 있는지 확인
    const columns: any = db.prepare("PRAGMA table_info(applications)").all();
    const hasFundAmounts = columns.some((col: any) => col.name === 'fund_amounts');
    
    if (hasFundAmounts) {
      console.log('✅ fund_amounts 컬럼이 이미 존재합니다.');
      return true;
    }
    
    // fund_amounts 컬럼 추가
    db.prepare(`
      ALTER TABLE applications
      ADD COLUMN fund_amounts TEXT DEFAULT '{}'
    `).run();
    
    console.log('✅ fund_amounts 컬럼이 성공적으로 추가되었습니다!');
    console.log('\n💡 이제 각 정책자금별로 금액을 설정할 수 있습니다.');
    console.log('   예시: {"소상공인 정책자금": 50000000, "혁신창업 자금": 30000000}');
    
    return true;
  } catch (error: any) {
    console.error('❌ 오류 발생:', error.message);
    return false;
  } finally {
    db.close();
  }
}

addFundAmountsColumn();
