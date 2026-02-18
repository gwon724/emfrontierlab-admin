#!/usr/bin/env node
/**
 * 실제 정책자금 데이터로 업데이트
 */

import Database from 'better-sqlite3';

const dbPath = '/home/user/shared-emfrontier.db';

function updatePolicyFunds() {
  const db = new Database(dbPath);
  
  try {
    console.log('🚀 정책자금 데이터 업데이트 중...\n');

    // 기존 데이터 삭제
    db.prepare('DELETE FROM policy_fund_details').run();
    console.log('✅ 기존 데이터 삭제 완료');

    // 실제 정책자금 데이터
    const realFunds = [
      // 중진공 리스트
      {
        fund_name: '청년창업 지원금',
        description: '청년 창업자를 위한 정책자금',
        max_amount: 200000000, // 제조업 최대 2억
        max_amount_retail: 100000000, // 도소매업 최대 1억
        interest_rate: 2.5,
        period_months: 60,
        eligibility: '청년 창업자, 제조업 최대 2억/도소매업 최대 1억',
        category: '중진공',
        grace_period_months: 0
      },
      {
        fund_name: '혁신창업사업화자금',
        description: '기술력 중심 심사, 창업기업 지원',
        max_amount: 1000000000, // 제조 10억
        max_amount_general: 500000000, // 일반 5억
        interest_rate: 2.5,
        period_months: 120,
        eligibility: '업력 7년 이내 창업기업',
        category: '중진공',
        grace_period_months: 36
      },
      {
        fund_name: '신시장진출지원자금',
        description: '수출 및 글로벌 진출 기업 지원',
        max_amount: 1000000000,
        interest_rate: 2.5,
        period_months: 60,
        eligibility: '수출·글로벌 진출 기업',
        category: '중진공',
        grace_period_months: 0
      },
      {
        fund_name: '재도약지원자금',
        description: '구조개선 및 회생 기업 지원',
        max_amount: 1000000000,
        interest_rate: 2.5,
        period_months: 60,
        eligibility: '구조개선·회생 기업',
        category: '중진공',
        grace_period_months: 0
      },
      {
        fund_name: '제조현장스마트화자금',
        description: '스마트공장 도입 기업 지원',
        max_amount: 1000000000,
        interest_rate: 2.5,
        period_months: 120,
        eligibility: '스마트공장 도입 기업',
        category: '중진공',
        grace_period_months: 0
      },
      
      // 소진공 리스트
      {
        fund_name: '일반경영안정자금',
        description: '소상공인 경영 안정 지원',
        max_amount: 70000000,
        interest_rate: 3.5,
        period_months: 60,
        eligibility: '소상공인',
        category: '소진공',
        grace_period_months: 24
      },
      {
        fund_name: '성장촉진자금',
        description: '업력 3년 이상 소상공인 성장 지원',
        max_amount: 100000000,
        interest_rate: 3.5,
        period_months: 60,
        eligibility: '업력 3년 이상 소상공인',
        category: '소진공',
        grace_period_months: 0
      },
      {
        fund_name: '청년고용연계자금',
        description: '청년 고용 사업장 우대금리 지원',
        max_amount: 70000000,
        interest_rate: 3.0,
        period_months: 60,
        eligibility: '청년 고용 사업장',
        category: '소진공',
        grace_period_months: 0
      },
      {
        fund_name: '재해소상공인지원자금',
        description: '재해 피해 소상공인 초저금리 지원',
        max_amount: 100000000,
        interest_rate: 1.5,
        period_months: 60,
        eligibility: '재해 피해 소상공인',
        category: '소진공',
        grace_period_months: 0
      },
      {
        fund_name: '취약소상공인자금',
        description: '신용점수 839점 이하 소상공인 지원',
        max_amount: 30000000,
        interest_rate: 4.5,
        period_months: 60,
        eligibility: '신용점수 839점 이하',
        category: '소진공',
        grace_period_months: 0
      },

      // 신용보증기금
      {
        fund_name: '신용보증서 (반보증)',
        description: '수억~수십억 대출 보증 지원 (재단 상품 가입 시 제외)',
        max_amount: 5000000000,
        interest_rate: 1.0,
        period_months: 60,
        eligibility: '일반 기업 (재단 상품 미가입)',
        category: '신용보증기금',
        grace_period_months: 0,
        guarantee_rate: '85~100%',
        guarantee_fee: '0.5~1.5%'
      },
      {
        fund_name: '유망창업기업보증',
        description: '기술·혁신 기업 대상 보증',
        max_amount: 500000000,
        interest_rate: 1.0,
        period_months: 60,
        eligibility: '기술·혁신 기업',
        category: '신용보증기금',
        grace_period_months: 0
      },

      // 기술보증기금
      {
        fund_name: '기술보증서',
        description: '기술기업 대상 보증서 발급',
        max_amount: 5000000000,
        interest_rate: 0.8,
        period_months: 60,
        eligibility: '기술기업 (기술 체크 필수)',
        category: '기술보증기금',
        grace_period_months: 0
      },
      {
        fund_name: '벤처기업특례보증',
        description: '벤처확인기업 보증료 우대',
        max_amount: 5000000000,
        interest_rate: 0.8,
        period_months: 60,
        eligibility: '벤처확인기업',
        category: '기술보증기금',
        grace_period_months: 0,
        guarantee_fee: '우대 적용'
      }
    ];

    const insertStmt = db.prepare(`
      INSERT INTO policy_fund_details (
        fund_name, description, max_amount, interest_rate, 
        period_months, eligibility, category
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const fund of realFunds) {
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

    console.log(`✅ ${realFunds.length}개의 실제 정책자금 데이터 추가 완료\n`);
    
    // 추가된 자금 목록 출력
    console.log('📋 추가된 정책자금 목록:\n');
    realFunds.forEach((fund, idx) => {
      console.log(`${idx + 1}. [${fund.category}] ${fund.fund_name}`);
      console.log(`   - 한도: ${(fund.max_amount / 100000000).toFixed(1)}억원`);
      console.log(`   - 금리: ${fund.interest_rate}%`);
      console.log(`   - 기간: ${fund.period_months}개월`);
      console.log('');
    });

    return true;
  } catch (error: any) {
    console.error('❌ 오류 발생:', error.message);
    return false;
  } finally {
    db.close();
  }
}

updatePolicyFunds();
