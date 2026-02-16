// AI 진단 로직

export interface ClientData {
  name: string;
  age: number;
  gender: string;
  annual_revenue: number;
  debt: number;
  kcb_score?: number;
  nice_score: number;
  has_technology: boolean;
}

export interface DiagnosisResult {
  soho_grade: string;
  recommended_funds: string[];
  diagnosis_details: string;
}

// SOHO 등급 계산 (AI 로직)
export function calculateSOHOGrade(client: ClientData): string {
  let score = 0;
  
  // 신용점수 (40점)
  if (client.nice_score >= 900) score += 40;
  else if (client.nice_score >= 850) score += 35;
  else if (client.nice_score >= 800) score += 30;
  else if (client.nice_score >= 750) score += 25;
  else if (client.nice_score >= 700) score += 20;
  else score += 10;
  
  // 매출액 (30점)
  if (client.annual_revenue >= 500000000) score += 30;
  else if (client.annual_revenue >= 300000000) score += 25;
  else if (client.annual_revenue >= 100000000) score += 20;
  else if (client.annual_revenue >= 50000000) score += 15;
  else score += 10;
  
  // 부채비율 (20점)
  const debtRatio = client.annual_revenue > 0 ? (client.debt / client.annual_revenue) * 100 : 100;
  if (debtRatio < 30) score += 20;
  else if (debtRatio < 50) score += 15;
  else if (debtRatio < 70) score += 10;
  else score += 5;
  
  // 기술력 보유 (10점)
  if (client.has_technology) score += 10;
  
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
  
  // 1. 소상공인진흥공단 - 취약소상공인상품 (NICE 859점 이하)
  if (client.nice_score <= 859) {
    funds.push('소상공인진흥공단 - 취약소상공인상품');
  }
  
  // 2. 중소벤처진흥공단
  funds.push('중소벤처진흥공단');
  
  // 3. 신용보증재단
  funds.push('신용보증재단');
  
  // 4. 신용보증기금
  funds.push('신용보증기금');
  
  // 5. 기술보증기금 (기술력 보유시에만)
  if (client.has_technology) {
    funds.push('기술보증기금');
  }
  
  return funds;
}

// 전체 AI 진단 실행
export function performAIDiagnosis(client: ClientData): DiagnosisResult {
  const soho_grade = calculateSOHOGrade(client);
  const recommended_funds = recommendPolicyFunds(client, soho_grade);
  
  let diagnosis_details = `SOHO 등급: ${soho_grade}등급\n\n`;
  diagnosis_details += `분석 결과:\n`;
  diagnosis_details += `- 신용점수(NICE): ${client.nice_score}점\n`;
  diagnosis_details += `- 연매출액: ${client.annual_revenue.toLocaleString()}원\n`;
  diagnosis_details += `- 부채: ${client.debt.toLocaleString()}원\n`;
  diagnosis_details += `- 기술력 보유: ${client.has_technology ? '예' : '아니오'}\n\n`;
  diagnosis_details += `추천 정책자금: ${recommended_funds.length}개\n`;
  diagnosis_details += recommended_funds.map((f, i) => `${i + 1}. ${f}`).join('\n');
  
  return {
    soho_grade,
    recommended_funds,
    diagnosis_details
  };
}
