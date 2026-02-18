#!/usr/bin/env node
/**
 * 정책자금 상세 정보 테이블 및 파일 저장 테이블 추가
 */

import Database from 'better-sqlite3';

const dbPath = '/home/user/shared-emfrontier.db';

function addNewTables() {
  const db = new Database(dbPath);
  
  try {
    console.log('🚀 새 테이블 생성 중...\n');

    // 정책자금 상세 정보 테이블
    db.exec(`
      CREATE TABLE IF NOT EXISTS policy_fund_details (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fund_name TEXT NOT NULL UNIQUE,
        description TEXT,
        max_amount INTEGER,
        interest_rate REAL,
        period_months INTEGER,
        eligibility TEXT,
        category TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ policy_fund_details 테이블 생성 완료');

    // 클라이언트 파일 저장 테이블
    db.exec(`
      CREATE TABLE IF NOT EXISTS client_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        document_type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        file_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id)
      )
    `);
    console.log('✅ client_documents 테이블 생성 완료');

    // 샘플 정책자금 데이터 추가
    const sampleFunds = [
      {
        fund_name: '소상공인 정책자금',
        description: '소상공인 대상 운영자금 지원',
        max_amount: 70000000,
        interest_rate: 2.5,
        period_months: 60,
        eligibility: '소상공인, 연매출 10억 이하',
        category: '운영자금'
      },
      {
        fund_name: '혁신창업 자금',
        description: '혁신적인 창업 아이디어 실현 지원',
        max_amount: 100000000,
        interest_rate: 2.0,
        period_months: 84,
        eligibility: '창업 7년 이내, 기술력 보유',
        category: '창업자금'
      },
      {
        fund_name: '청년창업 지원금',
        description: '만 39세 이하 청년 창업 지원',
        max_amount: 50000000,
        interest_rate: 1.5,
        period_months: 60,
        eligibility: '만 39세 이하, 창업 3년 이내',
        category: '창업자금'
      },
      {
        fund_name: '기술혁신 자금',
        description: '기술 개발 및 사업화 지원',
        max_amount: 150000000,
        interest_rate: 2.3,
        period_months: 96,
        eligibility: '기술력 보유, 특허/인증 보유',
        category: '기술개발'
      },
      {
        fund_name: '시설개선 자금',
        description: '사업장 시설 개선 및 확장 지원',
        max_amount: 80000000,
        interest_rate: 2.8,
        period_months: 72,
        eligibility: '사업자등록 1년 이상',
        category: '시설자금'
      }
    ];

    const existingFunds: any = db.prepare('SELECT COUNT(*) as count FROM policy_fund_details').get();
    
    if (existingFunds.count === 0) {
      const insertStmt = db.prepare(`
        INSERT INTO policy_fund_details (fund_name, description, max_amount, interest_rate, period_months, eligibility, category)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const fund of sampleFunds) {
        insertStmt.run(
          fund.fund_name,
          fund.description,
          fund.max_amount,
          fund.interest_rate,
          fund.period_months,
          fund.eligibility,
          fund.category
        );
      }
      console.log('✅ 샘플 정책자금 데이터 추가 완료');
    } else {
      console.log('ℹ️  정책자금 데이터가 이미 존재합니다.');
    }

    console.log('\n✨ 모든 테이블이 성공적으로 생성되었습니다!');
    
    return true;
  } catch (error: any) {
    console.error('❌ 오류 발생:', error.message);
    return false;
  } finally {
    db.close();
  }
}

addNewTables();
