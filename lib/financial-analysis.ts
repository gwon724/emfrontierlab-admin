// 재무제표 AI 분석 로직

export interface FinancialStatement {
  year: number;
  revenue: number;           // 매출액
  operatingProfit: number;   // 영업이익
  netProfit: number;         // 순이익
  totalAssets: number;       // 총자산
  totalLiabilities: number;  // 총부채
  equity: number;            // 자본
}

export interface FinancialAnalysisResult {
  sohoGrade: string;
  maxLoanLimit: number;
  recommendedFunds: any[];
  financialHealthScore: number;  // 재무건전성 점수 (0-100)
  growthRate: number;            // 성장률
  profitabilityRatio: number;    // 수익성 비율
  stabilityRatio: number;        // 안정성 비율
  details: string;
}

// 재무제표 기반 SOHO 등급 계산
export function calculateFinancialSOHOGrade(statements: FinancialStatement[]): string {
  if (statements.length === 0) return 'D';

  let totalScore = 0;
  const latestStatement = statements[statements.length - 1];
  
  // 1. 수익성 분석 (40점)
  const profitMargin = latestStatement.revenue > 0 
    ? (latestStatement.netProfit / latestStatement.revenue) * 100 
    : 0;
  
  if (profitMargin >= 15) totalScore += 40;
  else if (profitMargin >= 10) totalScore += 35;
  else if (profitMargin >= 7) totalScore += 30;
  else if (profitMargin >= 5) totalScore += 25;
  else if (profitMargin >= 3) totalScore += 20;
  else if (profitMargin >= 0) totalScore += 10;
  else totalScore += 0; // 적자
  
  // 2. 성장성 분석 (30점)
  if (statements.length >= 2) {
    const revenueGrowth = ((latestStatement.revenue - statements[0].revenue) / statements[0].revenue) * 100;
    
    if (revenueGrowth >= 30) totalScore += 30;
    else if (revenueGrowth >= 20) totalScore += 25;
    else if (revenueGrowth >= 10) totalScore += 20;
    else if (revenueGrowth >= 5) totalScore += 15;
    else if (revenueGrowth >= 0) totalScore += 10;
    else totalScore += 5; // 매출 감소
  } else {
    totalScore += 15; // 1년치만 있으면 중간 점수
  }
  
  // 3. 안정성 분석 (20점)
  const debtRatio = latestStatement.totalAssets > 0
    ? (latestStatement.totalLiabilities / latestStatement.totalAssets) * 100
    : 100;
  
  if (debtRatio < 30) totalScore += 20;
  else if (debtRatio < 50) totalScore += 17;
  else if (debtRatio < 70) totalScore += 14;
  else if (debtRatio < 100) totalScore += 10;
  else totalScore += 5;
  
  // 4. 규모 분석 (10점)
  if (latestStatement.revenue >= 1000000000) totalScore += 10;      // 10억 이상
  else if (latestStatement.revenue >= 500000000) totalScore += 8;   // 5억 이상
  else if (latestStatement.revenue >= 200000000) totalScore += 6;   // 2억 이상
  else if (latestStatement.revenue >= 100000000) totalScore += 4;   // 1억 이상
  else totalScore += 2;
  
  // 등급 산정
  if (totalScore >= 85) return 'S';
  else if (totalScore >= 70) return 'A';
  else if (totalScore >= 55) return 'B';
  else if (totalScore >= 40) return 'C';
  else return 'D';
}

// 재무제표 기반 최대 한도 계산
export function calculateFinancialLoanLimit(
  statements: FinancialStatement[], 
  sohoGrade: string
): number {
  if (statements.length === 0) return 0;

  const latestStatement = statements[statements.length - 1];
  
  // === 1단계: 매출 기반 기본 한도 ===
  let revenueBasedLimit = latestStatement.revenue * 0.5; // 매출의 50%
  
  // === 2단계: 수익성 보정 ===
  const netProfitMargin = latestStatement.revenue > 0
    ? (latestStatement.netProfit / latestStatement.revenue) * 100
    : 0;
  
  let profitabilityMultiplier = 1.0;
  if (netProfitMargin >= 15) profitabilityMultiplier = 1.3;
  else if (netProfitMargin >= 10) profitabilityMultiplier = 1.2;
  else if (netProfitMargin >= 7) profitabilityMultiplier = 1.15;
  else if (netProfitMargin >= 5) profitabilityMultiplier = 1.1;
  else if (netProfitMargin >= 3) profitabilityMultiplier = 1.0;
  else if (netProfitMargin >= 0) profitabilityMultiplier = 0.9;
  else profitabilityMultiplier = 0.7; // 적자
  
  // === 3단계: 부채비율 보정 ===
  const debtRatio = latestStatement.totalAssets > 0
    ? (latestStatement.totalLiabilities / latestStatement.totalAssets) * 100
    : 100;
  
  let debtMultiplier = 1.0;
  if (debtRatio < 30) debtMultiplier = 1.2;
  else if (debtRatio < 50) debtMultiplier = 1.1;
  else if (debtRatio < 70) debtMultiplier = 1.0;
  else if (debtRatio < 100) debtMultiplier = 0.8;
  else debtMultiplier = 0.5;
  
  // === 4단계: 성장성 보정 ===
  let growthMultiplier = 1.0;
  if (statements.length >= 2) {
    const revenueGrowth = ((latestStatement.revenue - statements[0].revenue) / statements[0].revenue) * 100;
    
    if (revenueGrowth >= 30) growthMultiplier = 1.2;
    else if (revenueGrowth >= 20) growthMultiplier = 1.15;
    else if (revenueGrowth >= 10) growthMultiplier = 1.1;
    else if (revenueGrowth >= 0) growthMultiplier = 1.0;
    else growthMultiplier = 0.9; // 매출 감소
  }
  
  // === 5단계: SOHO 등급 가중치 ===
  let gradeWeight = 1.0;
  switch (sohoGrade) {
    case 'S': gradeWeight = 1.4; break;
    case 'A': gradeWeight = 1.3; break;
    case 'B': gradeWeight = 1.2; break;
    case 'C': gradeWeight = 1.0; break;
    case 'D': gradeWeight = 0.8; break;
    default: gradeWeight = 0.7; break;
  }
  
  // === 6단계: 최종 한도 계산 ===
  let finalLimit = revenueBasedLimit 
    * profitabilityMultiplier 
    * debtMultiplier 
    * growthMultiplier 
    * gradeWeight;
  
  // === 7단계: 안전장치 ===
  // 최소: 5천만원, 최대: 20억원 (재무제표 있는 기업은 더 큰 한도 가능)
  finalLimit = Math.max(50000000, Math.min(2000000000, finalLimit));
  
  // 천만원 단위로 반올림
  finalLimit = Math.round(finalLimit / 10000000) * 10000000;
  
  console.log('=== 재무제표 기반 한도 계산 ===');
  console.log('최근 매출:', latestStatement.revenue.toLocaleString());
  console.log('순이익률:', netProfitMargin.toFixed(2) + '%');
  console.log('부채비율:', debtRatio.toFixed(2) + '%');
  console.log('수익성 보정:', profitabilityMultiplier);
  console.log('부채 보정:', debtMultiplier);
  console.log('성장성 보정:', growthMultiplier);
  console.log('등급 가중치:', gradeWeight);
  console.log('최종 한도:', finalLimit.toLocaleString() + '원');
  
  return finalLimit;
}

// 재무제표 기반 정책자금 추천
export function recommendFinancialPolicyFunds(
  statements: FinancialStatement[],
  sohoGrade: string
): any[] {
  if (statements.length === 0) return [];

  const latestStatement = statements[statements.length - 1];
  const funds: any[] = [];
  
  const netProfitMargin = latestStatement.revenue > 0
    ? (latestStatement.netProfit / latestStatement.revenue) * 100
    : 0;
  
  // 성장성 높은 기업
  if (statements.length >= 2) {
    const revenueGrowth = ((latestStatement.revenue - statements[0].revenue) / statements[0].revenue) * 100;
    
    if (revenueGrowth >= 10) {
      funds.push({
        name: '중진공 성장기반자금',
        category: '중진공',
        max_amount: 300000000,
        interest_rate: '2.3%',
        requirements: '최근 3년 평균 매출 성장률 10% 이상'
      });
    }
  }
  
  // 수익성 우수 기업
  if (netProfitMargin >= 7) {
    funds.push({
      name: '신용보증기금 우량기업보증',
      category: '신용보증',
      max_amount: 500000000,
      interest_rate: '2.5%',
      requirements: '순이익률 7% 이상'
    });
  }
  
  // 안정성 우수 기업
  const debtRatio = latestStatement.totalAssets > 0
    ? (latestStatement.totalLiabilities / latestStatement.totalAssets) * 100
    : 100;
  
  if (debtRatio < 50) {
    funds.push({
      name: '기술보증기금 우량기업특례보증',
      category: '기술보증',
      max_amount: 600000000,
      interest_rate: '2.2%',
      requirements: '부채비율 50% 미만'
    });
  }
  
  // 규모 있는 기업
  if (latestStatement.revenue >= 500000000) {
    funds.push({
      name: '중진공 해외진출기업자금',
      category: '중진공',
      max_amount: 400000000,
      interest_rate: '2.4%',
      requirements: '연매출 5억원 이상'
    });
  }
  
  // 기본 지원 자금
  funds.push({
    name: '중진공 일반경영안정자금',
    category: '중진공',
    max_amount: 200000000,
    interest_rate: '2.8%',
    requirements: '재무제표 제출 가능 기업'
  });
  
  funds.push({
    name: '소진공 성장촉진자금',
    category: '소진공',
    max_amount: 150000000,
    interest_rate: '2.7%',
    requirements: '사업자등록 3년 이상'
  });
  
  return funds;
}

// 재무건전성 점수 계산 (0-100점)
export function calculateFinancialHealthScore(statements: FinancialStatement[]): number {
  if (statements.length === 0) return 0;

  const latestStatement = statements[statements.length - 1];
  let score = 0;
  
  // 수익성 (40점)
  const netProfitMargin = latestStatement.revenue > 0
    ? (latestStatement.netProfit / latestStatement.revenue) * 100
    : 0;
  
  if (netProfitMargin >= 15) score += 40;
  else if (netProfitMargin >= 10) score += 35;
  else if (netProfitMargin >= 5) score += 25;
  else if (netProfitMargin >= 0) score += 15;
  else score += 5;
  
  // 안정성 (30점)
  const debtRatio = latestStatement.totalAssets > 0
    ? (latestStatement.totalLiabilities / latestStatement.totalAssets) * 100
    : 100;
  
  if (debtRatio < 30) score += 30;
  else if (debtRatio < 50) score += 25;
  else if (debtRatio < 70) score += 20;
  else if (debtRatio < 100) score += 10;
  else score += 5;
  
  // 성장성 (30점)
  if (statements.length >= 2) {
    const revenueGrowth = ((latestStatement.revenue - statements[0].revenue) / statements[0].revenue) * 100;
    
    if (revenueGrowth >= 30) score += 30;
    else if (revenueGrowth >= 20) score += 25;
    else if (revenueGrowth >= 10) score += 20;
    else if (revenueGrowth >= 0) score += 15;
    else score += 5;
  } else {
    score += 15;
  }
  
  return Math.min(100, score);
}

// 전체 재무제표 AI 분석 실행
export function performFinancialAnalysis(statements: FinancialStatement[]): FinancialAnalysisResult {
  const sohoGrade = calculateFinancialSOHOGrade(statements);
  const maxLoanLimit = calculateFinancialLoanLimit(statements, sohoGrade);
  const recommendedFunds = recommendFinancialPolicyFunds(statements, sohoGrade);
  const financialHealthScore = calculateFinancialHealthScore(statements);
  
  const latestStatement = statements[statements.length - 1];
  
  // 성장률 계산
  const growthRate = statements.length >= 2
    ? ((latestStatement.revenue - statements[0].revenue) / statements[0].revenue) * 100
    : 0;
  
  // 수익성 비율
  const profitabilityRatio = latestStatement.revenue > 0
    ? (latestStatement.netProfit / latestStatement.revenue) * 100
    : 0;
  
  // 안정성 비율 (자본비율)
  const stabilityRatio = latestStatement.totalAssets > 0
    ? (latestStatement.equity / latestStatement.totalAssets) * 100
    : 0;
  
  let details = `재무제표 AI 분석 결과\n\n`;
  details += `SOHO 등급: ${sohoGrade}등급\n\n`;
  details += `=== 재무 현황 ===\n`;
  details += `- 최근 매출: ${latestStatement.revenue.toLocaleString()}원\n`;
  details += `- 영업이익: ${latestStatement.operatingProfit.toLocaleString()}원\n`;
  details += `- 순이익: ${latestStatement.netProfit.toLocaleString()}원\n`;
  details += `- 총자산: ${latestStatement.totalAssets.toLocaleString()}원\n`;
  details += `- 총부채: ${latestStatement.totalLiabilities.toLocaleString()}원\n`;
  details += `- 자본: ${latestStatement.equity.toLocaleString()}원\n\n`;
  
  details += `=== 재무 지표 ===\n`;
  details += `- 재무건전성 점수: ${financialHealthScore}점/100점\n`;
  details += `- 매출 성장률: ${growthRate.toFixed(2)}%\n`;
  details += `- 순이익률: ${profitabilityRatio.toFixed(2)}%\n`;
  details += `- 자본비율: ${stabilityRatio.toFixed(2)}%\n\n`;
  
  details += `💰 최대 대출 가능 한도: ${maxLoanLimit.toLocaleString()}원\n\n`;
  details += `추천 정책자금: ${recommendedFunds.length}개\n`;
  details += recommendedFunds.map((f, i) => 
    `${i + 1}. ${f.name} (${f.category}, 최대 ${f.max_amount.toLocaleString()}원)`
  ).join('\n');
  
  return {
    sohoGrade,
    maxLoanLimit,
    recommendedFunds,
    financialHealthScore,
    growthRate,
    profitabilityRatio,
    stabilityRatio,
    details
  };
}
