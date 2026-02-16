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
  details += `추천 정책자금: ${recommendedFunds.length}개\n`;
  details += recommendedFunds.map((f, i) => `${i + 1}. ${f}`).join('\n');
  
  return {
    sohoGrade,
    recommendedFunds,
    details
  };
}
