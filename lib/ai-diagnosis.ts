// AI 진단 로직

export interface ClientData {
  niceScore?: number;
  nice_score?: number;
  kcbScore?: number;
  kcb_score?: number;
  annualRevenue?: number;
  annual_revenue?: number;
  totalDebt?: number;
  total_debt?: number;
  debt?: number;
  hasTechnology?: boolean;
  has_technology?: boolean;
  name?: string;
  age?: number;
  gender?: string;
  businessYears?: number;
  business_years?: number;
  debtPolicyFund?: number;
  debt_policy_fund?: number;
  debtCreditLoan?: number;
  debt_credit_loan?: number;
  debtSecondaryLoan?: number;
  debt_secondary_loan?: number;
  debtCardLoan?: number;
  debt_card_loan?: number;
}

export interface PolicyFund {
  name: string;
  category: string;
  max_amount: number;
  interest_rate: string;
  requirements: string;
}

export interface DiagnosisResult {
  sohoGrade: string;
  recommendedFunds: PolicyFund[];
  maxLoanLimit: number;
  details: string;
}

// 정책자금 상세 정보
const POLICY_FUNDS_DETAILS: { [key: string]: Omit<PolicyFund, 'name'> } = {
  '소진공 취약소상공인자금': {
    category: '소진공',
    max_amount: 70000000,
    interest_rate: '2.0%',
    requirements: 'NICE 신용점수 839점 이하'
  },
  '중진공 청년창업 지원금': {
    category: '중진공',
    max_amount: 100000000,
    interest_rate: '2.5%',
    requirements: '개업일 3년 이내'
  },
  '중진공 혁신창업사업화자금': {
    category: '중진공',
    max_amount: 150000000,
    interest_rate: '2.3%',
    requirements: '사업 연차 7년 이하, 기술력 보유'
  },
  '중진공 신시장진출지원자금': {
    category: '중진공',
    max_amount: 120000000,
    interest_rate: '2.7%',
    requirements: '업력 무관'
  },
  '중진공 재도약지원자금': {
    category: '중진공',
    max_amount: 200000000,
    interest_rate: '2.8%',
    requirements: '사업 연차 3년 이상, NICE 신용점수 700점 이상'
  },
  '중진공 제조현장스마트화자금': {
    category: '중진공',
    max_amount: 180000000,
    interest_rate: '2.4%',
    requirements: '사업 연차 2년 이상, 기술력 보유'
  },
  '소진공 일반경영안정자금': {
    category: '소진공',
    max_amount: 80000000,
    interest_rate: '2.5%',
    requirements: '사업 연차 1년 이상'
  },
  '소진공 성장촉진자금': {
    category: '소진공',
    max_amount: 100000000,
    interest_rate: '2.6%',
    requirements: '사업 연차 3년 이상'
  },
  '소진공 청년고용연계자금': {
    category: '소진공',
    max_amount: 90000000,
    interest_rate: '2.4%',
    requirements: '사업 연차 1년 이상'
  },
  '소진공 재해소상공인지원자금': {
    category: '소진공',
    max_amount: 50000000,
    interest_rate: '1.5%',
    requirements: '업력 무관, 재해 발생 시'
  },
  '신용보증기금 신용보증서 (반보증)': {
    category: '신용보증',
    max_amount: 300000000,
    interest_rate: '3.0%',
    requirements: 'NICE 신용점수 700점 이상'
  },
  '신용보증기금 유망창업기업보증': {
    category: '신용보증',
    max_amount: 250000000,
    interest_rate: '2.9%',
    requirements: 'NICE 신용점수 700점 이상'
  },
  '기술보증기금 기술보증서': {
    category: '기술보증',
    max_amount: 400000000,
    interest_rate: '2.8%',
    requirements: '기술력 보유'
  },
  '기술보증기금 벤처기업특례보증': {
    category: '기술보증',
    max_amount: 500000000,
    interest_rate: '2.5%',
    requirements: '기술력 보유'
  }
};

// SOHO 등급 계산 (AI 로직)
export function calculateSOHOGrade(client: ClientData): string {
  let score = 0;
  
  const niceScore = client.niceScore || client.nice_score || 0;
  const annualRevenue = client.annualRevenue || client.annual_revenue || 0;
  const totalDebt = client.totalDebt || client.total_debt || client.debt || 0;
  const hasTechnology = client.hasTechnology ?? client.has_technology ?? false;
  
  // 신용점수 (40점)
  if (niceScore >= 900) score += 40;
  else if (niceScore >= 850) score += 35;
  else if (niceScore >= 800) score += 30;
  else if (niceScore >= 750) score += 25;
  else if (niceScore >= 700) score += 20;
  else score += 10;
  
  // 매출액 (30점)
  if (annualRevenue >= 500000000) score += 30;
  else if (annualRevenue >= 300000000) score += 25;
  else if (annualRevenue >= 100000000) score += 20;
  else if (annualRevenue >= 50000000) score += 15;
  else score += 10;
  
  // 부채비율 (20점)
  const debtRatio = annualRevenue > 0 ? (totalDebt / annualRevenue) * 100 : 100;
  if (debtRatio < 30) score += 20;
  else if (debtRatio < 50) score += 15;
  else if (debtRatio < 70) score += 10;
  else score += 5;
  
  // 기술력 보유 (10점)
  if (hasTechnology) score += 10;
  
  // 등급 산정
  if (score >= 85) return 'S';
  else if (score >= 70) return 'A';
  else if (score >= 55) return 'B';
  else if (score >= 40) return 'C';
  else return 'D';
}

// 최대 대출 한도 계산 (AI 로직)
export function calculateMaxLoanLimit(client: ClientData, sohoGrade: string): number {
  const niceScore = client.niceScore || client.nice_score || 0;
  const kcbScore = client.kcbScore || client.kcb_score || 0;
  const annualRevenue = client.annualRevenue || client.annual_revenue || 0;
  const totalDebt = client.totalDebt || client.total_debt || client.debt || 0;
  const hasTechnology = client.hasTechnology ?? client.has_technology ?? false;
  const businessYears = client.businessYears ?? client.business_years ?? 0;
  
  // === 1단계: 기본 신용 한도 계산 (신용점수 기반) ===
  const avgCreditScore = kcbScore > 0 ? (niceScore + kcbScore) / 2 : niceScore;
  let creditBasedLimit = 0;
  
  if (avgCreditScore >= 900) creditBasedLimit = 500000000;      // 5억
  else if (avgCreditScore >= 850) creditBasedLimit = 400000000; // 4억
  else if (avgCreditScore >= 800) creditBasedLimit = 300000000; // 3억
  else if (avgCreditScore >= 750) creditBasedLimit = 200000000; // 2억
  else if (avgCreditScore >= 700) creditBasedLimit = 150000000; // 1.5억
  else if (avgCreditScore >= 650) creditBasedLimit = 100000000; // 1억
  else creditBasedLimit = 50000000;                              // 5천만원
  
  // === 2단계: 매출 기반 한도 계산 (연매출의 40-60% 차등 적용) ===
  let revenueMultiplier = 0.4; // 기본 40%
  
  if (avgCreditScore >= 850) revenueMultiplier = 0.6;       // 신용 우수: 60%
  else if (avgCreditScore >= 800) revenueMultiplier = 0.55; // 신용 양호: 55%
  else if (avgCreditScore >= 750) revenueMultiplier = 0.5;  // 신용 보통: 50%
  else if (avgCreditScore >= 700) revenueMultiplier = 0.45; // 신용 주의: 45%
  
  const revenueBasedLimit = annualRevenue * revenueMultiplier;
  
  // === 3단계: 부채비율 분석 및 한도 조정 ===
  const debtRatio = annualRevenue > 0 ? (totalDebt / annualRevenue) * 100 : 200;
  let debtAdjustment = 1.0;
  
  if (debtRatio >= 200) debtAdjustment = 0.2;       // 부채비율 200% 이상: 20%만
  else if (debtRatio >= 150) debtAdjustment = 0.4;  // 150-200%: 40%
  else if (debtRatio >= 120) debtAdjustment = 0.6;  // 120-150%: 60%
  else if (debtRatio >= 100) debtAdjustment = 0.7;  // 100-120%: 70%
  else if (debtRatio >= 80) debtAdjustment = 0.8;   // 80-100%: 80%
  else if (debtRatio >= 60) debtAdjustment = 0.9;   // 60-80%: 90%
  else if (debtRatio >= 40) debtAdjustment = 1.0;   // 40-60%: 100%
  else debtAdjustment = 1.1;                         // 40% 미만: 110% (부채 적음)
  
  // === 4단계: 업력 기반 보정 (사업 안정성) ===
  let businessYearsBonus = 1.0;
  
  if (businessYears >= 10) businessYearsBonus = 1.15;      // 10년 이상: +15%
  else if (businessYears >= 7) businessYearsBonus = 1.1;   // 7-10년: +10%
  else if (businessYears >= 5) businessYearsBonus = 1.05;  // 5-7년: +5%
  else if (businessYears >= 3) businessYearsBonus = 1.0;   // 3-5년: 기본
  else if (businessYears >= 1) businessYearsBonus = 0.9;   // 1-3년: -10%
  else businessYearsBonus = 0.8;                            // 1년 미만: -20%
  
  // === 5단계: 기술력 보정 ===
  const techBonus = hasTechnology ? 1.15 : 1.0; // 기술력 보유: +15%
  
  // === 6단계: SOHO 등급 가중치 ===
  let gradeWeight = 1.0;
  switch (sohoGrade) {
    case 'S': gradeWeight = 1.3; break;  // S등급: +30%
    case 'A': gradeWeight = 1.2; break;  // A등급: +20%
    case 'B': gradeWeight = 1.1; break;  // B등급: +10%
    case 'C': gradeWeight = 1.0; break;  // C등급: 기본
    case 'D': gradeWeight = 0.85; break; // D등급: -15%
    default: gradeWeight = 0.7; break;   // 기타: -30%
  }
  
  // === 7단계: 최종 한도 계산 ===
  // 신용 기반 한도와 매출 기반 한도 중 더 유리한 것 선택
  let baseLimit = Math.max(creditBasedLimit, revenueBasedLimit);
  
  // 모든 보정 계수 적용
  let finalLimit = baseLimit * debtAdjustment * businessYearsBonus * techBonus * gradeWeight;
  
  // === 8단계: 안전장치 및 반올림 ===
  // 최소 한도: 3천만원 (영세 사업자 고려)
  // 최대 한도: 10억원 (정책자금 현실성 고려)
  finalLimit = Math.max(30000000, Math.min(1000000000, finalLimit));
  
  // 천만원 단위로 반올림 (대출 한도는 보통 큰 단위로 제공)
  finalLimit = Math.round(finalLimit / 10000000) * 10000000;
  
  // 로그 출력 (디버깅용)
  console.log('=== AI 맞춤형 한도 계산 ===');
  console.log('평균 신용점수:', avgCreditScore);
  console.log('신용 기반 한도:', creditBasedLimit.toLocaleString());
  console.log('매출 기반 한도:', revenueBasedLimit.toLocaleString());
  console.log('부채비율:', debtRatio.toFixed(1) + '%', '/ 조정계수:', debtAdjustment);
  console.log('업력:', businessYears + '년', '/ 보너스:', businessYearsBonus);
  console.log('기술력:', hasTechnology ? '보유' : '미보유', '/ 보너스:', techBonus);
  console.log('SOHO 등급:', sohoGrade, '/ 가중치:', gradeWeight);
  console.log('최종 한도:', finalLimit.toLocaleString() + '원');
  
  return finalLimit;
}

// 정책자금 추천 (AI 로직 - 업력 기반 필터링)
export function recommendPolicyFunds(client: ClientData, sohoGrade: string): PolicyFund[] {
  const fundNames: string[] = [];
  
  const niceScore = client.niceScore || client.nice_score || 0;
  const hasTechnology = client.hasTechnology ?? client.has_technology ?? false;
  const businessYears = client.businessYears ?? client.business_years ?? 0;
  
  // 1. 소상공인진흥공단 - 취약소상공인상품 (NICE 839점 이하)
  if (niceScore <= 839) {
    fundNames.push('소진공 취약소상공인자금');
  }
  
  // 2. 청년창업 지원금 (개업일 3년 이내)
  if (businessYears <= 3) {
    fundNames.push('중진공 청년창업 지원금');
  }
  
  // 3. 혁신창업사업화자금 (업력 7년 이하, 기술력 보유)
  if (businessYears <= 7 && hasTechnology) {
    fundNames.push('중진공 혁신창업사업화자금');
  }
  
  // 4. 신시장진출지원자금 (업력 무관)
  fundNames.push('중진공 신시장진출지원자금');
  
  // 5. 재도약지원자금 (업력 3년 이상, 신용점수 700 이상)
  if (businessYears >= 3 && niceScore >= 700) {
    fundNames.push('중진공 재도약지원자금');
  }
  
  // 6. 제조현장스마트화자금 (업력 2년 이상, 기술력 보유)
  if (businessYears >= 2 && hasTechnology) {
    fundNames.push('중진공 제조현장스마트화자금');
  }
  
  // 7. 일반경영안정자금 (업력 1년 이상)
  if (businessYears >= 1) {
    fundNames.push('소진공 일반경영안정자금');
  }
  
  // 8. 성장촉진자금 (업력 3년 이상)
  if (businessYears >= 3) {
    fundNames.push('소진공 성장촉진자금');
  }
  
  // 9. 청년고용연계자금 (업력 1년 이상)
  if (businessYears >= 1) {
    fundNames.push('소진공 청년고용연계자금');
  }
  
  // 10. 재해소상공인지원자금 (업력 무관, 재해 시)
  fundNames.push('소진공 재해소상공인지원자금');
  
  // 11. 신용보증기금 (업력 무관, 신용점수 700 이상)
  if (niceScore >= 700) {
    fundNames.push('신용보증기금 신용보증서 (반보증)');
    fundNames.push('신용보증기금 유망창업기업보증');
  }
  
  // 12. 기술보증기금 (기술력 보유)
  if (hasTechnology) {
    fundNames.push('기술보증기금 기술보증서');
    fundNames.push('기술보증기금 벤처기업특례보증');
  }
  
  // 상세 정보와 함께 반환
  return fundNames.map(name => ({
    name,
    ...POLICY_FUNDS_DETAILS[name]
  }));
}

// 전체 AI 진단 실행
export function performAIDiagnosis(client: ClientData): DiagnosisResult {
  const sohoGrade = calculateSOHOGrade(client);
  const recommendedFunds = recommendPolicyFunds(client, sohoGrade);
  const maxLoanLimit = calculateMaxLoanLimit(client, sohoGrade);
  
  const niceScore = client.niceScore || client.nice_score || 0;
  const kcbScore = client.kcbScore || client.kcb_score || 0;
  const annualRevenue = client.annualRevenue || client.annual_revenue || 0;
  const totalDebt = client.totalDebt || client.total_debt || client.debt || 0;
  const hasTechnology = client.hasTechnology ?? client.has_technology ?? false;
  const businessYears = client.businessYears ?? client.business_years ?? 0;
  
  let details = `SOHO 등급: ${sohoGrade}등급\n\n`;
  details += `분석 결과:\n`;
  details += `- 신용점수: KCB ${kcbScore}점, NICE ${niceScore}점\n`;
  details += `- 사업 연차: ${businessYears}년\n`;
  details += `- 연매출액: ${annualRevenue.toLocaleString()}원\n`;
  details += `- 총부채: ${totalDebt.toLocaleString()}원\n`;
  details += `- 기술력 보유: ${hasTechnology ? '예' : '아니오'}\n\n`;
  details += `💰 최대 대출 가능 한도: ${maxLoanLimit.toLocaleString()}원\n\n`;
  details += `추천 정책자금: ${recommendedFunds.length}개\n`;
  details += recommendedFunds.map((f, i) => `${i + 1}. ${f.name} (${f.category}, 최대 ${f.max_amount.toLocaleString()}원)`).join('\n');
  
  return {
    sohoGrade,
    recommendedFunds,
    maxLoanLimit,
    details
  };
}
