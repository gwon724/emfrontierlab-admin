// AI 진단 로직

export interface ClientData {
  niceScore?: number;
  nice_score?: number;
  annualRevenue?: number;
  annual_revenue?: number;
  debt: number;
  hasTechnology?: boolean;
  has_technology?: boolean;
  name?: string;
  age?: number;
  gender?: string;
  kcb_score?: number;
}

export interface DiagnosisResult {
  sohoGrade: string;
  recommendedFunds: string[];
  maxLoanLimit: number;  // 최대 대출 한도 추가
  details: string;
}

// SOHO 등급 계산 (AI 로직)
export function calculateSOHOGrade(client: ClientData): string {
  let score = 0;
  
  const niceScore = client.niceScore || client.nice_score || 0;
  const annualRevenue = client.annualRevenue || client.annual_revenue || 0;
  const debt = client.debt || 0;
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
  const debtRatio = annualRevenue > 0 ? (debt / annualRevenue) * 100 : 100;
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
  const annualRevenue = client.annualRevenue || client.annual_revenue || 0;
  const debt = client.debt || 0;
  const hasTechnology = client.hasTechnology ?? client.has_technology ?? false;
  
  // 기본 한도 (등급별)
  let baseLimit = 0;
  switch (sohoGrade) {
    case 'S': baseLimit = 1000000000; break; // 10억
    case 'A': baseLimit = 700000000; break;  // 7억
    case 'B': baseLimit = 500000000; break;  // 5억
    case 'C': baseLimit = 300000000; break;  // 3억
    case 'D': baseLimit = 100000000; break;  // 1억
    default: baseLimit = 50000000; break;    // 5천만
  }
  
  // 매출액 기반 한도 (연매출의 50%)
  const revenueBasedLimit = annualRevenue * 0.5;
  
  // 부채 감안 한도 (총 부채가 연매출의 80% 이하일 때만 전액 제공)
  const debtRatio = annualRevenue > 0 ? (debt / annualRevenue) * 100 : 100;
  let debtAdjustment = 1.0;
  if (debtRatio > 150) debtAdjustment = 0.3;      // 부채비율 150% 초과 시 30%만
  else if (debtRatio > 100) debtAdjustment = 0.5; // 100~150% 시 50%
  else if (debtRatio > 80) debtAdjustment = 0.7;  // 80~100% 시 70%
  else if (debtRatio > 50) debtAdjustment = 0.9;  // 50~80% 시 90%
  
  // 신용점수 보정
  let creditAdjustment = 1.0;
  if (niceScore >= 900) creditAdjustment = 1.2;       // 우수 +20%
  else if (niceScore >= 850) creditAdjustment = 1.1;  // 양호 +10%
  else if (niceScore >= 800) creditAdjustment = 1.0;  // 보통 그대로
  else if (niceScore >= 750) creditAdjustment = 0.9;  // 주의 -10%
  else if (niceScore >= 700) creditAdjustment = 0.8;  // 낮음 -20%
  else creditAdjustment = 0.6;                         // 매우 낮음 -40%
  
  // 기술력 보정 (+10%)
  const techAdjustment = hasTechnology ? 1.1 : 1.0;
  
  // 최종 한도 계산 (기본 한도와 매출 기반 한도 중 큰 값 선택)
  let finalLimit = Math.max(baseLimit, revenueBasedLimit);
  
  // 각종 보정 적용
  finalLimit = finalLimit * debtAdjustment * creditAdjustment * techAdjustment;
  
  // 최소 한도 5천만원, 최대 한도 50억원
  finalLimit = Math.max(50000000, Math.min(5000000000, finalLimit));
  
  // 백만원 단위로 반올림
  return Math.round(finalLimit / 1000000) * 1000000;
}

// 정책자금 추천 (AI 로직)
export function recommendPolicyFunds(client: ClientData, sohoGrade: string): string[] {
  const funds: string[] = [];
  
  const niceScore = client.niceScore || client.nice_score || 0;
  const hasTechnology = client.hasTechnology ?? client.has_technology ?? false;
  
  // 1. 소상공인진흥공단 - 취약소상공인상품 (NICE 859점 이하)
  if (niceScore <= 859) {
    funds.push('소상공인진흥공단 - 취약소상공인상품');
  }
  
  // 2. 중소벤처진흥공단
  funds.push('중소벤처진흥공단');
  
  // 3. 신용보증재단
  funds.push('신용보증재단');
  
  // 4. 신용보증기금
  funds.push('신용보증기금');
  
  // 5. 기술보증기금 (기술력 보유시에만)
  if (hasTechnology) {
    funds.push('기술보증기금');
  }
  
  return funds;
}

// 전체 AI 진단 실행
export function performAIDiagnosis(client: ClientData): DiagnosisResult {
  const sohoGrade = calculateSOHOGrade(client);
  const recommendedFunds = recommendPolicyFunds(client, sohoGrade);
  const maxLoanLimit = calculateMaxLoanLimit(client, sohoGrade);
  
  const niceScore = client.niceScore || client.nice_score || 0;
  const annualRevenue = client.annualRevenue || client.annual_revenue || 0;
  const debt = client.debt || 0;
  const hasTechnology = client.hasTechnology ?? client.has_technology ?? false;
  
  let details = `SOHO 등급: ${sohoGrade}등급\n\n`;
  details += `분석 결과:\n`;
  details += `- 신용점수(NICE): ${niceScore}점\n`;
  details += `- 연매출액: ${annualRevenue.toLocaleString()}원\n`;
  details += `- 부채: ${debt.toLocaleString()}원\n`;
  details += `- 기술력 보유: ${hasTechnology ? '예' : '아니오'}\n\n`;
  details += `💰 최대 대출 가능 한도: ${maxLoanLimit.toLocaleString()}원\n\n`;
  details += `추천 정책자금: ${recommendedFunds.length}개\n`;
  details += recommendedFunds.map((f, i) => `${i + 1}. ${f}`).join('\n');
  
  return {
    sohoGrade,
    recommendedFunds,
    maxLoanLimit,
    details
  };
}
