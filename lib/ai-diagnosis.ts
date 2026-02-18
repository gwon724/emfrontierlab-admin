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
  employeeCount?: number;
  employee_count?: number;
  debtPolicyFund?: number;
  debt_policy_fund?: number;
  debtCreditLoan?: number;
  debt_credit_loan?: number;
  debtSecondaryLoan?: number;
  debt_secondary_loan?: number;
  debtCardLoan?: number;
  debt_card_loan?: number;
}

// 개별 조건 체크 결과
export interface FundCondition {
  label: string;       // 조건명
  required: string;    // 요구 조건 설명
  actual: string;      // 실제 값
  passed: boolean;     // 충족 여부
}

// 정책자금 추천 결과 (조건 상세 포함)
export interface PolicyFundResult {
  name: string;
  category: string;
  max_amount: number;
  interest_rate: string;
  requirements: string;
  conditions: FundCondition[];   // 조건 체크 목록
  eligible: boolean;             // 전체 통과 여부
  passCount: number;             // 충족 조건 수
  totalCount: number;            // 전체 조건 수
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
  recommendedFunds: PolicyFundResult[];
  maxLoanLimit: number;
  details: string;
}

// ═══════════════════════════════════════════════════════
// 정책자금 정의 (조건 체크 함수 포함)
// ═══════════════════════════════════════════════════════
type FundDef = {
  category: string;
  max_amount: number;
  interest_rate: string;
  requirements: string;
  checkConditions: (c: ClientData) => FundCondition[];
};

const FUND_DEFINITIONS: Record<string, FundDef> = {

  '소진공 취약소상공인자금': {
    category: '소진공',
    max_amount: 30000000,
    interest_rate: '2.0%',
    requirements: 'NICE 신용점수 839점 이하',
    checkConditions: (c) => {
      const nice = c.niceScore || c.nice_score || 0;
      return [
        { label: 'NICE 신용점수', required: '839점 이하', actual: `${nice}점`, passed: nice <= 839 && nice > 0 },
      ];
    }
  },

  '중진공 청년창업 지원금': {
    category: '중진공',
    max_amount: 100000000,
    interest_rate: '2.5%',
    requirements: '업력 3년 이내',
    checkConditions: (c) => {
      const yrs = c.businessYears ?? c.business_years ?? 0;
      const rev = c.annualRevenue || c.annual_revenue || 0;
      return [
        { label: '업력', required: '3년 이내', actual: `${yrs}년`, passed: yrs <= 3 },
        { label: '연매출', required: '제한 없음', actual: `${(rev/100000000).toFixed(1)}억`, passed: true },
      ];
    }
  },

  '중진공 혁신창업사업화자금': {
    category: '중진공',
    max_amount: 150000000,
    interest_rate: '2.3%',
    requirements: '업력 7년 이하, 기술력 보유',
    checkConditions: (c) => {
      const yrs = c.businessYears ?? c.business_years ?? 0;
      const tech = c.hasTechnology ?? c.has_technology ?? false;
      return [
        { label: '업력', required: '7년 이하', actual: `${yrs}년`, passed: yrs <= 7 },
        { label: '기술력 보유', required: '필요', actual: tech ? '보유' : '미보유', passed: tech },
      ];
    }
  },

  '중진공 신시장진출지원자금': {
    category: '중진공',
    max_amount: 120000000,
    interest_rate: '2.7%',
    requirements: '업력 무관, 매출 1억 이상',
    checkConditions: (c) => {
      const rev = c.annualRevenue || c.annual_revenue || 0;
      const debt = c.totalDebt || c.total_debt || c.debt || 0;
      const debtRatio = rev > 0 ? (debt / rev) * 100 : 999;
      return [
        { label: '연매출', required: '1억 이상', actual: `${(rev/100000000).toFixed(1)}억`, passed: rev >= 100000000 },
        { label: '부채비율', required: '150% 이하', actual: `${debtRatio.toFixed(0)}%`, passed: debtRatio <= 150 },
      ];
    }
  },

  '중진공 재도약지원자금': {
    category: '중진공',
    max_amount: 200000000,
    interest_rate: '2.8%',
    requirements: '업력 3년 이상, NICE 700점 이상',
    checkConditions: (c) => {
      const yrs = c.businessYears ?? c.business_years ?? 0;
      const nice = c.niceScore || c.nice_score || 0;
      const rev = c.annualRevenue || c.annual_revenue || 0;
      return [
        { label: '업력', required: '3년 이상', actual: `${yrs}년`, passed: yrs >= 3 },
        { label: 'NICE 신용점수', required: '700점 이상', actual: `${nice}점`, passed: nice >= 700 },
        { label: '연매출', required: '5천만 이상', actual: `${(rev/100000000).toFixed(1)}억`, passed: rev >= 50000000 },
      ];
    }
  },

  '중진공 제조현장스마트화자금': {
    category: '중진공',
    max_amount: 180000000,
    interest_rate: '2.4%',
    requirements: '업력 2년 이상, 기술력 보유',
    checkConditions: (c) => {
      const yrs = c.businessYears ?? c.business_years ?? 0;
      const tech = c.hasTechnology ?? c.has_technology ?? false;
      const rev = c.annualRevenue || c.annual_revenue || 0;
      return [
        { label: '업력', required: '2년 이상', actual: `${yrs}년`, passed: yrs >= 2 },
        { label: '기술력 보유', required: '필요', actual: tech ? '보유' : '미보유', passed: tech },
        { label: '연매출', required: '3천만 이상', actual: `${(rev/100000000).toFixed(1)}억`, passed: rev >= 30000000 },
      ];
    }
  },

  '소진공 일반경영안정자금': {
    category: '소진공',
    max_amount: 80000000,
    interest_rate: '2.5%',
    requirements: '업력 1년 이상, 매출 감소 등',
    checkConditions: (c) => {
      const yrs = c.businessYears ?? c.business_years ?? 0;
      const rev = c.annualRevenue || c.annual_revenue || 0;
      const debt = c.totalDebt || c.total_debt || c.debt || 0;
      const debtRatio = rev > 0 ? (debt / rev) * 100 : 999;
      return [
        { label: '업력', required: '1년 이상', actual: `${yrs}년`, passed: yrs >= 1 },
        { label: '연매출', required: '1억 이상', actual: `${(rev/100000000).toFixed(1)}억`, passed: rev >= 100000000 },
        { label: '부채비율', required: '200% 이하', actual: `${debtRatio.toFixed(0)}%`, passed: debtRatio <= 200 },
      ];
    }
  },

  '소진공 성장촉진자금': {
    category: '소진공',
    max_amount: 100000000,
    interest_rate: '2.6%',
    requirements: '업력 3년 이상, 매출 성장세',
    checkConditions: (c) => {
      const yrs = c.businessYears ?? c.business_years ?? 0;
      const rev = c.annualRevenue || c.annual_revenue || 0;
      const nice = c.niceScore || c.nice_score || 0;
      return [
        { label: '업력', required: '3년 이상', actual: `${yrs}년`, passed: yrs >= 3 },
        { label: '연매출', required: '1억 이상', actual: `${(rev/100000000).toFixed(1)}억`, passed: rev >= 100000000 },
        { label: 'NICE 신용점수', required: '650점 이상', actual: `${nice}점`, passed: nice >= 650 },
      ];
    }
  },

  '소진공 청년고용연계자금': {
    category: '소진공',
    max_amount: 90000000,
    interest_rate: '2.4%',
    requirements: '업력 1년 이상, 청년고용 의지',
    checkConditions: (c) => {
      const yrs = c.businessYears ?? c.business_years ?? 0;
      const emp = c.employeeCount ?? c.employee_count ?? 0;
      return [
        { label: '업력', required: '1년 이상', actual: `${yrs}년`, passed: yrs >= 1 },
        { label: '직원수', required: '1명 이상', actual: `${emp}명`, passed: emp >= 1 },
      ];
    }
  },

  '신용보증기금 신용보증서 (반보증)': {
    category: '신용보증',
    max_amount: 300000000,
    interest_rate: '3.0%',
    requirements: 'NICE 700점 이상, 매출 1억 이상',
    checkConditions: (c) => {
      const nice = c.niceScore || c.nice_score || 0;
      const kcb = c.kcbScore || c.kcb_score || 0;
      const rev = c.annualRevenue || c.annual_revenue || 0;
      const debt = c.totalDebt || c.total_debt || c.debt || 0;
      const debtRatio = rev > 0 ? (debt / rev) * 100 : 999;
      return [
        { label: 'NICE 신용점수', required: '700점 이상', actual: `${nice}점`, passed: nice >= 700 },
        { label: 'KCB 신용점수', required: '650점 이상', actual: kcb > 0 ? `${kcb}점` : '미입력', passed: kcb === 0 || kcb >= 650 },
        { label: '연매출', required: '1억 이상', actual: `${(rev/100000000).toFixed(1)}억`, passed: rev >= 100000000 },
        { label: '부채비율', required: '200% 이하', actual: `${debtRatio.toFixed(0)}%`, passed: debtRatio <= 200 },
      ];
    }
  },

  '신용보증기금 유망창업기업보증': {
    category: '신용보증',
    max_amount: 250000000,
    interest_rate: '2.9%',
    requirements: 'NICE 700점 이상, 업력 5년 이내',
    checkConditions: (c) => {
      const nice = c.niceScore || c.nice_score || 0;
      const yrs = c.businessYears ?? c.business_years ?? 0;
      const rev = c.annualRevenue || c.annual_revenue || 0;
      return [
        { label: 'NICE 신용점수', required: '700점 이상', actual: `${nice}점`, passed: nice >= 700 },
        { label: '업력', required: '5년 이내', actual: `${yrs}년`, passed: yrs <= 5 },
        { label: '연매출', required: '5천만 이상', actual: `${(rev/100000000).toFixed(1)}억`, passed: rev >= 50000000 },
      ];
    }
  },

  '기술보증기금 기술보증서': {
    category: '기술보증',
    max_amount: 400000000,
    interest_rate: '2.8%',
    requirements: '기술력 보유 필수',
    checkConditions: (c) => {
      const tech = c.hasTechnology ?? c.has_technology ?? false;
      const nice = c.niceScore || c.nice_score || 0;
      const rev = c.annualRevenue || c.annual_revenue || 0;
      return [
        { label: '기술력 보유', required: '필수', actual: tech ? '보유' : '미보유', passed: tech },
        { label: 'NICE 신용점수', required: '650점 이상', actual: `${nice}점`, passed: nice >= 650 },
        { label: '연매출', required: '3천만 이상', actual: `${(rev/100000000).toFixed(1)}억`, passed: rev >= 30000000 },
      ];
    }
  },

  '기술보증기금 벤처기업특례보증': {
    category: '기술보증',
    max_amount: 500000000,
    interest_rate: '2.5%',
    requirements: '기술력 보유, 업력 7년 이하',
    checkConditions: (c) => {
      const tech = c.hasTechnology ?? c.has_technology ?? false;
      const yrs = c.businessYears ?? c.business_years ?? 0;
      const nice = c.niceScore || c.nice_score || 0;
      const rev = c.annualRevenue || c.annual_revenue || 0;
      return [
        { label: '기술력 보유', required: '필수', actual: tech ? '보유' : '미보유', passed: tech },
        { label: '업력', required: '7년 이하', actual: `${yrs}년`, passed: yrs <= 7 },
        { label: 'NICE 신용점수', required: '700점 이상', actual: `${nice}점`, passed: nice >= 700 },
        { label: '연매출', required: '5천만 이상', actual: `${(rev/100000000).toFixed(1)}억`, passed: rev >= 50000000 },
      ];
    }
  },
};

// ═══════════════════════════════════════════════════════
// SOHO 등급 계산
// ═══════════════════════════════════════════════════════
export function calculateSOHOGrade(client: ClientData): string {
  let score = 0;
  const niceScore = client.niceScore || client.nice_score || 0;
  const annualRevenue = client.annualRevenue || client.annual_revenue || 0;
  const totalDebt = client.totalDebt || client.total_debt || client.debt || 0;
  const hasTechnology = client.hasTechnology ?? client.has_technology ?? false;
  const businessYears = client.businessYears ?? client.business_years ?? 0;
  const employeeCount = client.employeeCount ?? client.employee_count ?? 0;

  // 신용점수 (35점)
  if (niceScore >= 900) score += 35;
  else if (niceScore >= 850) score += 30;
  else if (niceScore >= 800) score += 25;
  else if (niceScore >= 750) score += 20;
  else if (niceScore >= 700) score += 15;
  else score += 8;

  // 매출액 (25점)
  if (annualRevenue >= 500000000) score += 25;
  else if (annualRevenue >= 300000000) score += 20;
  else if (annualRevenue >= 100000000) score += 15;
  else if (annualRevenue >= 50000000) score += 10;
  else score += 5;

  // 부채비율 (20점)
  const debtRatio = annualRevenue > 0 ? (totalDebt / annualRevenue) * 100 : 100;
  if (debtRatio < 30) score += 20;
  else if (debtRatio < 50) score += 16;
  else if (debtRatio < 70) score += 12;
  else if (debtRatio < 100) score += 8;
  else score += 3;

  // 업력 (10점)
  if (businessYears >= 10) score += 10;
  else if (businessYears >= 7) score += 8;
  else if (businessYears >= 5) score += 6;
  else if (businessYears >= 3) score += 4;
  else if (businessYears >= 1) score += 2;

  // 직원수 (5점)
  if (employeeCount >= 10) score += 5;
  else if (employeeCount >= 5) score += 4;
  else if (employeeCount >= 3) score += 3;
  else if (employeeCount >= 1) score += 2;

  // 기술력 (5점)
  if (hasTechnology) score += 5;

  if (score >= 80) return 'S';
  else if (score >= 65) return 'A';
  else if (score >= 50) return 'B';
  else if (score >= 35) return 'C';
  else return 'D';
}

// ═══════════════════════════════════════════════════════
// 최대 대출 한도 계산
// ═══════════════════════════════════════════════════════
export function calculateMaxLoanLimit(client: ClientData, sohoGrade: string): number {
  const niceScore = client.niceScore || client.nice_score || 0;
  const kcbScore = client.kcbScore || client.kcb_score || 0;
  const annualRevenue = client.annualRevenue || client.annual_revenue || 0;
  const totalDebt = client.totalDebt || client.total_debt || client.debt || 0;
  const hasTechnology = client.hasTechnology ?? client.has_technology ?? false;
  const businessYears = client.businessYears ?? client.business_years ?? 0;

  const avgCreditScore = kcbScore > 0 ? (niceScore + kcbScore) / 2 : niceScore;

  let creditBasedLimit = 0;
  if (avgCreditScore >= 900) creditBasedLimit = 500000000;
  else if (avgCreditScore >= 850) creditBasedLimit = 400000000;
  else if (avgCreditScore >= 800) creditBasedLimit = 300000000;
  else if (avgCreditScore >= 750) creditBasedLimit = 200000000;
  else if (avgCreditScore >= 700) creditBasedLimit = 150000000;
  else if (avgCreditScore >= 650) creditBasedLimit = 100000000;
  else creditBasedLimit = 50000000;

  let revenueMultiplier = 0.4;
  if (avgCreditScore >= 850) revenueMultiplier = 0.6;
  else if (avgCreditScore >= 800) revenueMultiplier = 0.55;
  else if (avgCreditScore >= 750) revenueMultiplier = 0.5;
  else if (avgCreditScore >= 700) revenueMultiplier = 0.45;
  const revenueBasedLimit = annualRevenue * revenueMultiplier;

  const debtRatio = annualRevenue > 0 ? (totalDebt / annualRevenue) * 100 : 200;
  let debtAdjustment = 1.0;
  if (debtRatio >= 200) debtAdjustment = 0.2;
  else if (debtRatio >= 150) debtAdjustment = 0.4;
  else if (debtRatio >= 120) debtAdjustment = 0.6;
  else if (debtRatio >= 100) debtAdjustment = 0.7;
  else if (debtRatio >= 80) debtAdjustment = 0.8;
  else if (debtRatio >= 60) debtAdjustment = 0.9;
  else debtAdjustment = 1.1;

  let businessYearsBonus = 1.0;
  if (businessYears >= 10) businessYearsBonus = 1.15;
  else if (businessYears >= 7) businessYearsBonus = 1.1;
  else if (businessYears >= 5) businessYearsBonus = 1.05;
  else if (businessYears >= 3) businessYearsBonus = 1.0;
  else if (businessYears >= 1) businessYearsBonus = 0.9;
  else businessYearsBonus = 0.8;

  const techBonus = hasTechnology ? 1.15 : 1.0;

  let gradeWeight = 1.0;
  switch (sohoGrade) {
    case 'S': gradeWeight = 1.3; break;
    case 'A': gradeWeight = 1.2; break;
    case 'B': gradeWeight = 1.1; break;
    case 'C': gradeWeight = 1.0; break;
    case 'D': gradeWeight = 0.85; break;
    default: gradeWeight = 0.7;
  }

  let baseLimit = Math.max(creditBasedLimit, revenueBasedLimit);
  let finalLimit = baseLimit * debtAdjustment * businessYearsBonus * techBonus * gradeWeight;
  finalLimit = Math.max(30000000, Math.min(1000000000, finalLimit));
  finalLimit = Math.round(finalLimit / 10000000) * 10000000;
  return finalLimit;
}

// ═══════════════════════════════════════════════════════
// 정책자금 조건 체크 (노션 스타일 상세 결과 반환)
// ═══════════════════════════════════════════════════════
export function evaluatePolicyFunds(client: ClientData): PolicyFundResult[] {
  return Object.entries(FUND_DEFINITIONS).map(([name, def]) => {
    const conditions = def.checkConditions(client);
    const passCount = conditions.filter(c => c.passed).length;
    const eligible = conditions.every(c => c.passed);
    return {
      name,
      category: def.category,
      max_amount: def.max_amount,
      interest_rate: def.interest_rate,
      requirements: def.requirements,
      conditions,
      eligible,
      passCount,
      totalCount: conditions.length,
    };
  }).sort((a, b) => {
    // 충족 → 부분 충족 → 미충족 순 정렬
    if (a.eligible && !b.eligible) return -1;
    if (!a.eligible && b.eligible) return 1;
    return b.passCount / b.totalCount - a.passCount / a.totalCount;
  });
}

// ═══════════════════════════════════════════════════════
// 기업 집중 분석 결과
// ═══════════════════════════════════════════════════════
export interface CompanyAnalysis {
  revenueLevel: { grade: string; comment: string; score: number };
  debtLevel: { grade: string; comment: string; score: number; ratio: number };
  employeeLevel: { grade: string; comment: string; score: number };
  businessAgeLevel: { grade: string; comment: string; score: number };
  overallScore: number;
  overallGrade: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export function performCompanyAnalysis(client: ClientData): CompanyAnalysis {
  const rev = client.annualRevenue || client.annual_revenue || 0;
  const debt = client.totalDebt || client.total_debt || client.debt || 0;
  const emp = client.employeeCount ?? client.employee_count ?? 0;
  const yrs = client.businessYears ?? client.business_years ?? 0;
  const nice = client.niceScore || client.nice_score || 0;
  const tech = client.hasTechnology ?? client.has_technology ?? false;
  const debtRatio = rev > 0 ? (debt / rev) * 100 : 999;

  // ── 매출 분석 ──
  let revGrade = 'D'; let revScore = 0; let revComment = '';
  if (rev >= 1000000000) { revGrade = 'S'; revScore = 100; revComment = '매출 10억 이상 우수 기업'; }
  else if (rev >= 500000000) { revGrade = 'A'; revScore = 85; revComment = '매출 5억 이상 안정적 기업'; }
  else if (rev >= 300000000) { revGrade = 'B'; revScore = 70; revComment = '매출 3억 이상 성장 기업'; }
  else if (rev >= 100000000) { revGrade = 'C'; revScore = 55; revComment = '매출 1억 이상 소규모 기업'; }
  else if (rev >= 50000000) { revGrade = 'D'; revScore = 40; revComment = '매출 5천만 이상 초기 기업'; }
  else { revGrade = 'E'; revScore = 20; revComment = '매출 5천만 미만 영세 기업'; }

  // ── 부채 분석 ──
  let debtGrade = 'D'; let debtScore = 0; let debtComment = '';
  if (debtRatio <= 30) { debtGrade = 'S'; debtScore = 100; debtComment = '부채비율 30% 이하 매우 건전'; }
  else if (debtRatio <= 50) { debtGrade = 'A'; debtScore = 85; debtComment = '부채비율 50% 이하 건전한 재무구조'; }
  else if (debtRatio <= 80) { debtGrade = 'B'; debtScore = 70; debtComment = '부채비율 80% 이하 양호'; }
  else if (debtRatio <= 120) { debtGrade = 'C'; debtScore = 50; debtComment = '부채비율 120% 이하 주의 필요'; }
  else if (debtRatio <= 200) { debtGrade = 'D'; debtScore = 30; debtComment = '부채비율 200% 이하 위험 수준'; }
  else { debtGrade = 'E'; debtScore = 10; debtComment = '부채비율 200% 초과 매우 위험'; }

  // ── 직원수 분석 ──
  let empGrade = 'D'; let empScore = 0; let empComment = '';
  if (emp >= 20) { empGrade = 'S'; empScore = 100; empComment = '20명 이상 중소기업 규모'; }
  else if (emp >= 10) { empGrade = 'A'; empScore = 85; empComment = '10명 이상 성장형 소기업'; }
  else if (emp >= 5) { empGrade = 'B'; empScore = 70; empComment = '5명 이상 소규모 기업'; }
  else if (emp >= 3) { empGrade = 'C'; empScore = 50; empComment = '3명 이상 영세 기업'; }
  else if (emp >= 1) { empGrade = 'D'; empScore = 35; empComment = '1-2명 1인 창업 수준'; }
  else { empGrade = 'E'; empScore = 20; empComment = '직원 없음 (대표자 단독)'; }

  // ── 업력 분석 ──
  let ageGrade = 'D'; let ageScore = 0; let ageComment = '';
  if (yrs >= 10) { ageGrade = 'S'; ageScore = 100; ageComment = '10년 이상 검증된 안정 기업'; }
  else if (yrs >= 7) { ageGrade = 'A'; ageScore = 85; ageComment = '7년 이상 성숙기 진입 기업'; }
  else if (yrs >= 5) { ageGrade = 'B'; ageScore = 70; ageComment = '5년 이상 안정화 기업'; }
  else if (yrs >= 3) { ageGrade = 'C'; ageScore = 55; ageComment = '3년 이상 성장 중인 기업'; }
  else if (yrs >= 1) { ageGrade = 'D'; ageScore = 35; ageComment = '1-2년 초기 창업 기업'; }
  else { ageGrade = 'E'; ageScore = 15; ageComment = '1년 미만 신생 기업'; }

  const overallScore = Math.round((revScore * 0.35 + debtScore * 0.30 + empScore * 0.15 + ageScore * 0.20));
  let overallGrade = 'D';
  if (overallScore >= 85) overallGrade = 'S';
  else if (overallScore >= 70) overallGrade = 'A';
  else if (overallScore >= 55) overallGrade = 'B';
  else if (overallScore >= 40) overallGrade = 'C';
  else overallGrade = 'D';

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];

  if (revScore >= 70) strengths.push('매출 규모가 양호하여 정책자금 신청 가능성이 높습니다');
  else weaknesses.push('매출이 낮아 대출 한도에 제약이 있습니다');

  if (debtScore >= 70) strengths.push('부채비율이 건전하여 추가 차입 여력이 있습니다');
  else { weaknesses.push(`부채비율 ${debtRatio.toFixed(0)}%로 재무 부담이 높습니다`); suggestions.push('기존 고금리 부채를 저금리 정책자금으로 전환 검토 필요'); }

  if (ageScore >= 55) strengths.push(`업력 ${yrs}년으로 사업 안정성이 인정됩니다`);
  else { suggestions.push('업력이 짧아 청년창업 지원금 등 창업 초기 자금을 우선 검토하세요'); }

  if (tech) strengths.push('기술력 보유로 기술보증기금 등 고한도 자금 이용 가능');
  else suggestions.push('기술 인증(이노비즈, 메인비즈 등) 취득 시 이용 가능한 자금이 크게 늘어납니다');

  if (nice >= 750) strengths.push(`NICE ${nice}점으로 신용보증 자금 이용에 유리합니다`);
  else if (nice < 700) { weaknesses.push(`NICE ${nice}점으로 일부 자금 이용이 제한됩니다`); suggestions.push('신용점수 개선 후 재신청 시 더 많은 자금을 활용할 수 있습니다'); }

  if (emp >= 5) strengths.push(`직원 ${emp}명으로 고용 규모가 양호합니다`);

  const summary = `연매출 ${(rev/100000000).toFixed(1)}억, 부채비율 ${debtRatio === 999 ? 'N/A' : debtRatio.toFixed(0)+'%'}, 업력 ${yrs}년, 직원 ${emp}명 기준 종합 분석 결과 ${overallGrade}등급 기업입니다. ${overallScore >= 70 ? '정책자금 활용 가능성이 높습니다.' : overallScore >= 50 ? '조건부 정책자금 이용이 가능합니다.' : '재무구조 개선 후 정책자금 신청을 권장합니다.'}`;

  return {
    revenueLevel: { grade: revGrade, comment: revComment, score: revScore },
    debtLevel: { grade: debtGrade, comment: debtComment, score: debtScore, ratio: debtRatio === 999 ? 0 : debtRatio },
    employeeLevel: { grade: empGrade, comment: empComment, score: empScore },
    businessAgeLevel: { grade: ageGrade, comment: ageComment, score: ageScore },
    overallScore,
    overallGrade,
    summary,
    strengths,
    weaknesses,
    suggestions,
  };
}

// 기존 호환용
export function recommendPolicyFunds(client: ClientData, sohoGrade: string): PolicyFund[] {
  return evaluatePolicyFunds(client)
    .filter(f => f.eligible)
    .map(({ name, category, max_amount, interest_rate, requirements }) => ({
      name, category, max_amount, interest_rate, requirements
    }));
}

export function performAIDiagnosis(client: ClientData): DiagnosisResult {
  const sohoGrade = calculateSOHOGrade(client);
  const allFunds = evaluatePolicyFunds(client);
  const recommendedFunds = allFunds;
  const maxLoanLimit = calculateMaxLoanLimit(client, sohoGrade);

  const niceScore = client.niceScore || client.nice_score || 0;
  const kcbScore = client.kcbScore || client.kcb_score || 0;
  const annualRevenue = client.annualRevenue || client.annual_revenue || 0;
  const totalDebt = client.totalDebt || client.total_debt || client.debt || 0;
  const hasTechnology = client.hasTechnology ?? client.has_technology ?? false;
  const businessYears = client.businessYears ?? client.business_years ?? 0;

  let details = `SOHO 등급: ${sohoGrade}등급\n\n분석 결과:\n`;
  details += `- 신용점수: KCB ${kcbScore}점, NICE ${niceScore}점\n`;
  details += `- 사업 연차: ${businessYears}년\n`;
  details += `- 연매출액: ${annualRevenue.toLocaleString()}원\n`;
  details += `- 총부채: ${totalDebt.toLocaleString()}원\n`;
  details += `- 기술력 보유: ${hasTechnology ? '예' : '아니오'}\n\n`;
  details += `💰 최대 대출 가능 한도: ${maxLoanLimit.toLocaleString()}원\n\n`;
  const eligible = allFunds.filter(f => f.eligible);
  details += `추천 정책자금: ${eligible.length}개\n`;
  details += eligible.map((f, i) => `${i + 1}. ${f.name} (${f.category}, 최대 ${f.max_amount.toLocaleString()}원)`).join('\n');

  return { sohoGrade, recommendedFunds, maxLoanLimit, details };
}
