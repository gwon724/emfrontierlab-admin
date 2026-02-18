import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * AI 분석 보고서 생성 API
 * POST /api/admin/generate-report
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 관리자 인증 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증 토큰이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (!payload || payload.type !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 2. 요청 데이터 파싱
    const body = await request.json();
    const { clientId } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: '클라이언트 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 3. 클라이언트 정보 조회
    const db = getDatabase();
    const client = db
      .prepare('SELECT * FROM clients WHERE id = ?')
      .get(clientId) as any;

    if (!client) {
      return NextResponse.json(
        { error: '클라이언트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 4. 최신 신청 정보 조회
    const application = db
      .prepare(
        'SELECT * FROM applications WHERE client_id = ? ORDER BY created_at DESC LIMIT 1'
      )
      .get(clientId) as any;

    // 5. AI 진단 정보 조회
    const diagnosis = db
      .prepare(
        'SELECT * FROM ai_diagnosis WHERE client_id = ? ORDER BY created_at DESC LIMIT 1'
      )
      .get(clientId) as any;

    // 6. 정책자금 파싱
    let policyFunds = [];
    let recommendedFunds = [];
    
    if (application?.policy_funds) {
      try {
        policyFunds = JSON.parse(application.policy_funds);
      } catch (e) {
        policyFunds = [];
      }
    }

    if (diagnosis?.recommended_funds) {
      try {
        recommendedFunds = JSON.parse(diagnosis.recommended_funds);
      } catch (e) {
        recommendedFunds = [];
      }
    }

    // 7. AI 분석 보고서 생성
    const report = generateAIReport(client, application, diagnosis, policyFunds, recommendedFunds);

    return NextResponse.json({
      success: true,
      report
    });

  } catch (error: any) {
    console.error('❌ 보고서 생성 오류:', error);
    return NextResponse.json(
      { error: '보고서 생성 중 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * AI 분석 보고서 생성 함수
 */
function generateAIReport(
  client: any,
  application: any,
  diagnosis: any,
  policyFunds: any[],
  recommendedFunds: any[]
) {
  // 신용점수 평가
  const avgCreditScore = ((client.kcb_score || 0) + (client.nice_score || 0)) / 2;
  const creditLevel = 
    avgCreditScore >= 900 ? '최우수' :
    avgCreditScore >= 800 ? '우수' :
    avgCreditScore >= 700 ? '양호' :
    avgCreditScore >= 600 ? '보통' : '개선 필요';

  // 부채 비율 계산
  const debtRatio = client.annual_revenue > 0 
    ? ((client.debt / client.annual_revenue) * 100).toFixed(1)
    : 'N/A';

  // 소호등급 분석
  const sohoGrade = client.soho_grade || diagnosis?.soho_grade || 'N/A';
  const sohoAnalysis = analyzeSohoGrade(sohoGrade);

  // 추천 정책자금 분석
  const fundAnalysis = analyzePolicyFunds(
    client,
    recommendedFunds,
    avgCreditScore,
    debtRatio
  );

  // 종합 평가
  const overallScore = calculateOverallScore(
    avgCreditScore,
    parseFloat(debtRatio as string),
    sohoGrade,
    client.has_technology
  );

  return {
    clientInfo: {
      name: client.name,
      age: client.age,
      gender: client.gender,
      annualRevenue: client.annual_revenue,
      totalDebt: client.debt,
      debtRatio: debtRatio,
      kcbScore: client.kcb_score,
      niceScore: client.nice_score,
      avgCreditScore: avgCreditScore.toFixed(0),
      creditLevel,
      sohoGrade,
      hasTechnology: client.has_technology,
      businessYears: client.business_years,
      email: client.email,
      phone: client.phone,
    },
    
    creditAnalysis: {
      level: creditLevel,
      score: avgCreditScore.toFixed(0),
      summary: generateCreditSummary(avgCreditScore),
      detailedAnalysis: generateDetailedCreditAnalysis(client, avgCreditScore),
      strengths: getCreditStrengths(avgCreditScore, debtRatio),
      weaknesses: getCreditWeaknesses(avgCreditScore, debtRatio),
      improvements: getCreditImprovements(avgCreditScore, debtRatio),
    },

    debtAnalysis: {
      totalDebt: client.debt,
      debtBreakdown: {
        policyFund: client.debt_policy_fund || 0,
        creditLoan: client.debt_credit_loan || 0,
        secondaryLoan: client.debt_secondary_loan || 0,
        cardLoan: client.debt_card_loan || 0,
      },
      debtRatio: debtRatio,
      debtManagementAdvice: generateDebtManagementAdvice(client.debt, client.annual_revenue, debtRatio),
    },

    sohoAnalysis: {
      grade: sohoGrade,
      description: sohoAnalysis.description,
      characteristics: sohoAnalysis.characteristics,
      recommendations: sohoAnalysis.recommendations,
      detailedAssessment: generateDetailedSohoAssessment(sohoGrade, client),
    },

    businessAnalysis: {
      annualRevenue: client.annual_revenue,
      businessYears: client.business_years,
      stabilityScore: calculateBusinessStability(client.annual_revenue, client.business_years, client.debt),
      growthPotential: assessGrowthPotential(client),
      industryComparison: generateIndustryComparison(client.annual_revenue, client.business_years),
    },

    fundAnalysis: {
      recommendedFunds: fundAnalysis,
      totalRecommendations: fundAnalysis.length,
      appliedFunds: policyFunds.length,
      detailedRecommendations: generateDetailedFundRecommendations(fundAnalysis, client),
    },

    riskAssessment: {
      overallRisk: calculateOverallRisk(avgCreditScore, debtRatio, client.business_years),
      riskFactors: identifyRiskFactors(client, avgCreditScore, debtRatio),
      mitigationStrategies: generateRiskMitigation(client, avgCreditScore, debtRatio),
    },

    overallAssessment: {
      score: overallScore,
      level: getOverallLevel(overallScore),
      summary: generateOverallSummary(
        client,
        avgCreditScore,
        debtRatio,
        sohoGrade,
        fundAnalysis.length
      ),
      detailedSummary: generateDetailedOverallSummary(client, avgCreditScore, debtRatio, sohoGrade),
      nextSteps: generateNextSteps(
        avgCreditScore,
        debtRatio,
        sohoGrade,
        policyFunds.length
      ),
      timelineRecommendations: generateTimelineRecommendations(client, avgCreditScore, debtRatio),
    },

    generatedAt: new Date().toISOString(),
  };
}

/**
 * 신용점수 요약 생성
 */
function generateCreditSummary(score: number): string {
  if (score >= 900) {
    return '신용등급이 최우수 수준으로, 대부분의 정책자금 및 금융상품 이용이 가능합니다. 낮은 금리로 대출을 받을 수 있는 조건을 갖추고 있습니다.';
  } else if (score >= 800) {
    return '신용등급이 우수하여 정책자금 신청 시 유리한 조건을 받을 수 있습니다. 대부분의 금융기관에서 긍정적으로 평가받을 수 있는 수준입니다.';
  } else if (score >= 700) {
    return '신용등급이 양호한 편이며, 정책자금 신청이 가능한 수준입니다. 일부 금융상품의 경우 조건부 승인이 가능합니다.';
  } else if (score >= 600) {
    return '신용등급이 보통 수준으로, 정책자금 신청 시 추가 서류나 보증이 필요할 수 있습니다. 신용 관리를 통해 점수 향상이 권장됩니다.';
  } else {
    return '신용등급 개선이 필요한 상태입니다. 정책자금 신청 전 신용점수 관리 및 부채 상환 계획 수립이 우선적으로 권장됩니다.';
  }
}

/**
 * 신용 강점 분석
 */
function getCreditStrengths(score: number, debtRatio: any): string[] {
  const strengths: string[] = [];
  
  if (score >= 800) {
    strengths.push('매우 높은 신용점수로 금융기관 신뢰도 우수');
  } else if (score >= 700) {
    strengths.push('양호한 신용점수로 정책자금 신청 가능');
  }
  
  if (typeof debtRatio === 'number' && debtRatio < 50) {
    strengths.push('건전한 부채비율로 상환능력 양호');
  }
  
  if (strengths.length === 0) {
    strengths.push('신용 이력 보유 (금융 거래 경험)');
  }
  
  return strengths;
}

/**
 * 신용 약점 분석
 */
function getCreditWeaknesses(score: number, debtRatio: any): string[] {
  const weaknesses: string[] = [];
  
  if (score < 700) {
    weaknesses.push('신용점수 개선 필요 (700점 이상 권장)');
  }
  
  if (typeof debtRatio === 'number' && debtRatio >= 80) {
    weaknesses.push('높은 부채비율로 상환 부담 존재');
  } else if (typeof debtRatio === 'number' && debtRatio >= 50) {
    weaknesses.push('부채비율 관리 필요');
  }
  
  if (weaknesses.length === 0) {
    weaknesses.push('특이사항 없음 (안정적인 신용 상태)');
  }
  
  return weaknesses;
}

/**
 * 소호등급 분석
 */
function analyzeSohoGrade(grade: string) {
  const gradeUpper = String(grade).toUpperCase();
  
  const gradeInfo: { [key: string]: any } = {
    'A': {
      description: '최우수 등급으로, 사업 안정성과 성장성이 매우 높은 수준입니다.',
      characteristics: [
        '높은 매출 안정성',
        '우수한 신용 이력',
        '낮은 부채 비율',
        '지속적인 사업 성장'
      ],
      recommendations: [
        '고액 정책자금 신청 가능',
        '우대 금리 혜택 기대',
        '신속한 심사 승인 가능'
      ]
    },
    'B': {
      description: '우수 등급으로, 사업이 안정적으로 운영되고 있습니다.',
      characteristics: [
        '안정적인 매출 구조',
        '양호한 신용 상태',
        '적정 부채 수준'
      ],
      recommendations: [
        '중대형 정책자금 신청 적합',
        '일반 금리 조건 적용',
        '표준 심사 절차 진행'
      ]
    },
    'C': {
      description: '보통 등급으로, 기본적인 사업 운영이 가능한 수준입니다.',
      characteristics: [
        '기본적인 매출 구조',
        '보통 수준의 신용',
        '부채 관리 필요'
      ],
      recommendations: [
        '소액 정책자금 신청 권장',
        '추가 서류 준비 필요',
        '신용보증 검토 권장'
      ]
    },
    'D': {
      description: '개선 필요 등급으로, 사업 체질 개선이 필요한 상태입니다.',
      characteristics: [
        '불안정한 매출',
        '신용 관리 필요',
        '높은 부채 비율'
      ],
      recommendations: [
        '소액 긴급자금 중심 신청',
        '보증인 또는 담보 필요 가능',
        '사업 개선 계획 수립 권장'
      ]
    },
  };

  return gradeInfo[gradeUpper] || {
    description: '등급 정보가 없습니다. AI 진단을 먼저 수행해주세요.',
    characteristics: ['정보 부족'],
    recommendations: ['AI 진단 실시 필요']
  };
}

/**
 * 정책자금 분석
 */
function analyzePolicyFunds(
  client: any,
  recommendedFunds: any[],
  avgCreditScore: number,
  debtRatio: any
): any[] {
  return recommendedFunds.map((fund: any) => {
    const fundName = typeof fund === 'string' ? fund : fund.name;
    
    return {
      name: fundName,
      category: typeof fund === 'object' ? fund.category : '정책자금',
      maxAmount: typeof fund === 'object' ? fund.max_amount : '상이',
      interestRate: typeof fund === 'object' ? fund.interest_rate : '상이',
      
      // AI 분석: 추천 이유
      recommendationReasons: generateRecommendationReasons(
        fundName,
        client,
        avgCreditScore,
        debtRatio
      ),
      
      // 적합도 점수 (0-100)
      suitabilityScore: calculateSuitability(
        fundName,
        client,
        avgCreditScore,
        debtRatio
      ),
      
      // 승인 가능성
      approvalProbability: getApprovalProbability(
        avgCreditScore,
        debtRatio,
        client.has_technology
      ),
    };
  });
}

/**
 * 추천 이유 생성 (AI 분석)
 */
function generateRecommendationReasons(
  fundName: string,
  client: any,
  creditScore: number,
  debtRatio: any
): string[] {
  const reasons: string[] = [];
  
  // 자금명 기반 분석
  if (fundName.includes('청년') || fundName.includes('창업')) {
    if (client.age <= 39) {
      reasons.push('✅ 청년 연령 요건 충족 (39세 이하)');
    }
    reasons.push('💡 창업 초기 기업에 적합한 지원 조건');
  }
  
  if (fundName.includes('기술') || fundName.includes('혁신')) {
    if (client.has_technology) {
      reasons.push('⭐ 기술기업 인증 보유로 우대 혜택 가능');
    }
    reasons.push('🔬 기술력 기반 성장 가능성 평가');
  }
  
  if (fundName.includes('소상공인') || fundName.includes('소진공')) {
    reasons.push('🏪 소상공인 대상 맞춤형 지원');
    reasons.push('📈 매출 규모에 적합한 지원 금액');
  }
  
  // 신용점수 기반 분석
  if (creditScore >= 700) {
    reasons.push(`💳 우수한 신용점수 (${creditScore.toFixed(0)}점)로 승인 가능성 높음`);
  }
  
  // 부채비율 기반 분석
  if (typeof debtRatio === 'number' && debtRatio < 50) {
    reasons.push(`💰 건전한 부채비율 (${debtRatio}%)로 상환능력 우수`);
  }
  
  // 매출 기반 분석
  if (client.annual_revenue >= 100000000) {
    reasons.push('📊 충분한 연매출로 안정적 운영 중');
  }
  
  // 기본 이유 추가
  if (reasons.length === 0) {
    reasons.push('📋 기본 자격 요건 충족');
    reasons.push('🎯 사업 성장 지원에 적합');
  }
  
  return reasons;
}

/**
 * 적합도 점수 계산
 */
function calculateSuitability(
  fundName: string,
  client: any,
  creditScore: number,
  debtRatio: any
): number {
  let score = 50; // 기본 점수
  
  // 신용점수 (+30점)
  if (creditScore >= 900) score += 30;
  else if (creditScore >= 800) score += 25;
  else if (creditScore >= 700) score += 20;
  else if (creditScore >= 600) score += 10;
  
  // 부채비율 (+20점)
  if (typeof debtRatio === 'number') {
    if (debtRatio < 30) score += 20;
    else if (debtRatio < 50) score += 15;
    else if (debtRatio < 70) score += 10;
    else if (debtRatio < 100) score += 5;
  }
  
  // 자금 특성 매칭 (+최대 15점)
  if (fundName.includes('청년') && client.age <= 39) score += 10;
  if (fundName.includes('기술') && client.has_technology) score += 10;
  if (fundName.includes('소상공인') && client.annual_revenue < 500000000) score += 5;
  
  return Math.min(100, Math.max(0, score));
}

/**
 * 승인 가능성
 */
function getApprovalProbability(
  creditScore: number,
  debtRatio: any,
  hasTechnology: boolean
): string {
  let probability = 50;
  
  if (creditScore >= 800) probability += 30;
  else if (creditScore >= 700) probability += 20;
  else if (creditScore >= 600) probability += 10;
  
  if (typeof debtRatio === 'number' && debtRatio < 50) probability += 20;
  
  if (hasTechnology) probability += 10;
  
  if (probability >= 80) return '높음 (80% 이상)';
  if (probability >= 60) return '보통 (60-79%)';
  return '낮음 (60% 미만)';
}

/**
 * 종합 점수 계산
 */
function calculateOverallScore(
  creditScore: number,
  debtRatio: number,
  sohoGrade: string,
  hasTechnology: boolean
): number {
  let score = 0;
  
  // 신용점수 (40점)
  score += (creditScore / 1000) * 40;
  
  // 부채비율 (30점)
  if (!isNaN(debtRatio)) {
    if (debtRatio < 30) score += 30;
    else if (debtRatio < 50) score += 25;
    else if (debtRatio < 70) score += 20;
    else if (debtRatio < 100) score += 10;
  }
  
  // 소호등급 (20점)
  const gradeScores: { [key: string]: number } = {
    'A': 20, 'B': 15, 'C': 10, 'D': 5
  };
  score += gradeScores[String(sohoGrade).toUpperCase()] || 0;
  
  // 기술기업 (10점)
  if (hasTechnology) score += 10;
  
  return Math.round(score);
}

/**
 * 종합 등급
 */
function getOverallLevel(score: number): string {
  if (score >= 85) return 'S (최우수)';
  if (score >= 70) return 'A (우수)';
  if (score >= 55) return 'B (양호)';
  if (score >= 40) return 'C (보통)';
  return 'D (개선필요)';
}

/**
 * 종합 평가 요약
 */
function generateOverallSummary(
  client: any,
  creditScore: number,
  debtRatio: any,
  sohoGrade: string,
  fundCount: number
): string {
  const name = client.name;
  const creditLevel = creditScore >= 800 ? '우수한' : creditScore >= 700 ? '양호한' : '보통 수준의';
  const debtLevel = typeof debtRatio === 'number' && debtRatio < 50 ? '건전한' : '관리가 필요한';
  
  return `${name}님은 ${creditLevel} 신용점수와 ${debtLevel} 부채비율을 보유하고 계십니다. ` +
    `소호등급 ${sohoGrade} 수준으로 평가되며, 현재 ${fundCount}개의 정책자금 추천이 가능합니다. ` +
    `${creditScore >= 700 ? '정책자금 신청에 유리한 조건을 갖추고 있습니다.' : '신용 관리를 통한 조건 개선이 권장됩니다.'}`;
}

/**
 * 다음 단계 제안
 */
function generateNextSteps(
  creditScore: number,
  debtRatio: any,
  sohoGrade: string,
  appliedCount: number
): string[] {
  const steps: string[] = [];
  
  if (appliedCount === 0) {
    steps.push('🎯 추천된 정책자금 중 적합한 상품을 선택하여 신청하세요');
  } else {
    steps.push('📋 신청한 정책자금의 심사 진행 상황을 확인하세요');
  }
  
  if (creditScore < 700) {
    steps.push('💳 신용점수 개선을 위한 연체 관리 및 신용카드 사용 최적화');
  }
  
  if (typeof debtRatio === 'number' && debtRatio >= 70) {
    steps.push('💰 부채 상환 계획 수립으로 부채비율 개선');
  }
  
  if (sohoGrade === 'C' || sohoGrade === 'D') {
    steps.push('📈 매출 증대 및 사업 안정화를 통한 소호등급 상향');
  }
  
  steps.push('📞 필요 시 관리자에게 상담 요청하여 맞춤형 조언 받기');
  
  return steps;
}

/**
 * 상세 신용 분석
 */
function generateDetailedCreditAnalysis(client: any, creditScore: number): string {
  const kcbDesc = client.kcb_score >= 900 ? '최우수' : client.kcb_score >= 800 ? '우수' : client.kcb_score >= 700 ? '양호' : '보통';
  const niceDesc = client.nice_score >= 900 ? '최우수' : client.nice_score >= 800 ? '우수' : client.nice_score >= 700 ? '양호' : '보통';
  
  return `KCB 신용점수 ${client.kcb_score}점(${kcbDesc}), NICE 신용점수 ${client.nice_score}점(${niceDesc})으로 평균 ${creditScore.toFixed(0)}점을 기록하고 있습니다. ` +
    `이는 대한민국 소상공인 평균 대비 ${creditScore >= 750 ? '높은' : creditScore >= 650 ? '평균적인' : '낮은'} 수준이며, ` +
    `${creditScore >= 800 ? '금융기관에서 우량 고객으로 분류될 가능성이 높습니다.' : creditScore >= 700 ? '일반적인 금융 거래에는 문제가 없으나, 대출 조건 개선의 여지가 있습니다.' : '신용 개선을 통해 더 나은 금융 조건을 받을 수 있습니다.'}`;
}

/**
 * 신용 개선 방안
 */
function getCreditImprovements(score: number, debtRatio: any): string[] {
  const improvements: string[] = [];
  
  if (score < 900) {
    improvements.push('💳 신용카드 사용액을 한도의 30% 이하로 유지하여 신용이용률 개선');
    improvements.push('📅 모든 금융 거래 내역의 연체 없이 정기 납부');
  }
  
  if (typeof debtRatio === 'number' && debtRatio >= 50) {
    improvements.push('💰 고금리 대출부터 우선 상환하여 이자 부담 감소');
    improvements.push('📊 부채 통합 대환 상품 검토로 금리 절감');
  }
  
  improvements.push('🔄 휴대폰 요금, 공과금 등 소액 결제도 정기적으로 납부하여 신용 이력 구축');
  improvements.push('📈 신용정보회사 앱을 통해 월 1회 이상 신용점수 모니터링');
  
  return improvements;
}

/**
 * 부채 관리 조언
 */
function generateDebtManagementAdvice(totalDebt: number, annualRevenue: number, debtRatio: any): string[] {
  const advice: string[] = [];
  
  if (typeof debtRatio === 'number') {
    if (debtRatio < 30) {
      advice.push('✅ 매우 건전한 부채 수준을 유지하고 있습니다. 현재 수준을 유지하며 사업 확장을 고려할 수 있습니다.');
    } else if (debtRatio < 50) {
      advice.push('✅ 적정한 부채 수준입니다. 추가 차입 시 상환 계획을 면밀히 검토하세요.');
    } else if (debtRatio < 80) {
      advice.push('⚠️ 부채비율이 다소 높습니다. 신규 차입보다는 기존 부채 상환에 집중하는 것이 권장됩니다.');
    } else {
      advice.push('🚨 부채비율이 높아 재무 건전성에 주의가 필요합니다. 부채 감축 계획 수립이 시급합니다.');
    }
  }
  
  advice.push('💡 정책자금은 일반 대출 대비 저금리이므로, 기존 고금리 대출을 대환하는 전략을 고려하세요.');
  advice.push('📊 월별 현금흐름을 분석하여 여유 자금으로 고금리 부채부터 우선 상환하세요.');
  advice.push('🔍 부채 종류별 금리와 만기를 정리하여 효율적인 상환 순서를 계획하세요.');
  
  return advice;
}

/**
 * 상세 소호등급 평가
 */
function generateDetailedSohoAssessment(grade: string, client: any): string {
  const gradeUpper = String(grade).toUpperCase();
  
  let assessment = `현재 소호등급 ${grade}는 `;
  
  switch(gradeUpper) {
    case 'A':
      assessment += '소상공인 중 상위 10% 이내에 해당하는 최우수 등급입니다. 매출 안정성, 신용도, 성장성 모든 면에서 우수한 평가를 받았습니다. 대부분의 정책자금 심사에서 우선 순위를 받을 수 있으며, 심사 기간도 단축될 가능성이 높습니다.';
      break;
    case 'B':
      assessment += '소상공인 중 상위 30% 이내의 우수 등급입니다. 안정적인 사업 운영이 인정되며, 일반 정책자금 신청 시 큰 어려움 없이 승인될 가능성이 높습니다. A등급 달성을 위해서는 매출 증대와 신용점수 향상이 필요합니다.';
      break;
    case 'C':
      assessment += '평균 수준의 등급으로, 기본적인 정책자금 지원 대상에 해당합니다. 소액 정책자금 중심으로 신청하되, 추가 서류나 보증이 요구될 수 있습니다. 부채비율 개선과 매출 증대를 통해 B등급 이상 달성이 가능합니다.';
      break;
    case 'D':
      assessment += '개선이 필요한 등급으로, 사업 안정화가 우선 과제입니다. 긴급 경영안정자금 등 소액 지원 중심으로 신청하되, 담보나 보증인이 필요할 수 있습니다. 재무 구조 개선과 신용 관리를 통한 등급 상향이 시급합니다.';
      break;
    default:
      assessment += '아직 평가되지 않았습니다. AI 진단을 통해 정확한 등급을 확인하시기 바랍니다.';
  }
  
  return assessment;
}

/**
 * 사업 안정성 점수
 */
function calculateBusinessStability(revenue: number, years: number, debt: number): number {
  let score = 50;
  
  // 연매출 기준 (+25점)
  if (revenue >= 1000000000) score += 25; // 10억 이상
  else if (revenue >= 500000000) score += 20; // 5억 이상
  else if (revenue >= 300000000) score += 15; // 3억 이상
  else if (revenue >= 100000000) score += 10; // 1억 이상
  else if (revenue >= 50000000) score += 5; // 5천만 이상
  
  // 업력 기준 (+15점)
  if (years >= 10) score += 15;
  else if (years >= 7) score += 12;
  else if (years >= 5) score += 10;
  else if (years >= 3) score += 7;
  else if (years >= 1) score += 3;
  
  // 부채 수준 (역산, +10점)
  const debtRatio = revenue > 0 ? (debt / revenue) * 100 : 100;
  if (debtRatio < 30) score += 10;
  else if (debtRatio < 50) score += 7;
  else if (debtRatio < 70) score += 4;
  
  return Math.min(100, score);
}

/**
 * 성장 잠재력 평가
 */
function assessGrowthPotential(client: any): string {
  const score = client.kcb_score || 0;
  const years = client.business_years || 0;
  const hasTech = client.has_technology;
  
  if (hasTech && score >= 800 && years >= 3) {
    return '매우 높음 - 기술력, 신용도, 업력 모두 우수하여 높은 성장 가능성이 예상됩니다.';
  } else if (score >= 750 && years >= 3) {
    return '높음 - 안정적인 신용도와 충분한 업력으로 성장 기반이 탄탄합니다.';
  } else if (years >= 2) {
    return '보통 - 기본적인 성장 기반을 갖추었으나, 신용 관리와 사업 확장 전략이 필요합니다.';
  } else {
    return '잠재적 - 초기 단계로 성장 가능성은 있으나, 안정화가 우선 필요합니다.';
  }
}

/**
 * 업계 비교
 */
function generateIndustryComparison(revenue: number, years: number): string {
  const avgRevenue = 150000000; // 소상공인 평균 연매출 가정치
  const comparison = revenue >= avgRevenue * 1.5 ? '평균 이상' : revenue >= avgRevenue ? '평균 수준' : '평균 이하';
  
  return `국내 소상공인 평균 연매출 ${(avgRevenue / 100000000).toFixed(1)}억원 대비 ${comparison}입니다. ` +
    `업력 ${years}년은 ${years >= 5 ? '안정적인' : years >= 3 ? '중기' : '초기'} 단계로 분류됩니다.`;
}

/**
 * 상세 정책자금 추천
 */
function generateDetailedFundRecommendations(fundAnalysis: any[], client: any): string {
  if (fundAnalysis.length === 0) {
    return 'AI 진단을 먼저 실시하여 맞춤형 정책자금 추천을 받으시기 바랍니다.';
  }
  
  const topFund = fundAnalysis[0];
  return `총 ${fundAnalysis.length}개의 정책자금이 추천되었으며, 그 중 "${topFund.name}"이(가) ` +
    `적합도 ${topFund.suitabilityScore}점으로 가장 높게 평가되었습니다. ` +
    `승인 가능성은 ${topFund.approvalProbability}로 예상되며, ` +
    `${client.has_technology ? '기술기업 인증을 활용한 우대 혜택' : '일반 지원 조건'}이 적용될 수 있습니다. ` +
    `각 정책자금의 세부 조건을 확인하신 후, 사업 계획에 가장 적합한 상품을 선택하시기 바랍니다.`;
}

/**
 * 전체 리스크 계산
 */
function calculateOverallRisk(creditScore: number, debtRatio: any, businessYears: number): string {
  let riskScore = 0;
  
  if (creditScore < 600) riskScore += 30;
  else if (creditScore < 700) riskScore += 20;
  else if (creditScore < 800) riskScore += 10;
  
  if (typeof debtRatio === 'number') {
    if (debtRatio >= 100) riskScore += 30;
    else if (debtRatio >= 70) riskScore += 20;
    else if (debtRatio >= 50) riskScore += 10;
  }
  
  if (businessYears < 1) riskScore += 20;
  else if (businessYears < 3) riskScore += 10;
  
  if (riskScore >= 50) return '높음 (High Risk)';
  if (riskScore >= 25) return '중간 (Medium Risk)';
  return '낮음 (Low Risk)';
}

/**
 * 리스크 요인 식별
 */
function identifyRiskFactors(client: any, creditScore: number, debtRatio: any): string[] {
  const risks: string[] = [];
  
  if (creditScore < 700) {
    risks.push('🔴 신용점수 미달: 700점 미만으로 일부 정책자금 심사에서 불리할 수 있음');
  }
  
  if (typeof debtRatio === 'number' && debtRatio >= 70) {
    risks.push('🔴 높은 부채비율: 상환 부담으로 인한 재무 건전성 악화 우려');
  }
  
  if (client.business_years < 1) {
    risks.push('🟡 짧은 업력: 사업 안정성 검증 기간 부족');
  }
  
  if (client.annual_revenue < 50000000) {
    risks.push('🟡 낮은 매출: 연매출 5천만원 미만으로 일부 정책자금 신청 제한 가능');
  }
  
  if (risks.length === 0) {
    risks.push('✅ 특별한 리스크 요인이 발견되지 않았습니다');
  }
  
  return risks;
}

/**
 * 리스크 완화 전략
 */
function generateRiskMitigation(client: any, creditScore: number, debtRatio: any): string[] {
  const strategies: string[] = [];
  
  if (creditScore < 700) {
    strategies.push('📈 신용점수 700점 이상 달성을 목표로 연체 없는 금융 거래 유지');
    strategies.push('💳 신용카드 사용액을 한도의 30% 이하로 관리');
  }
  
  if (typeof debtRatio === 'number' && debtRatio >= 70) {
    strategies.push('💰 고금리 대출부터 우선 상환하여 이자 부담 경감');
    strategies.push('🔄 정책자금으로 기존 대출 대환하여 금리 인하 효과 도모');
  }
  
  if (client.business_years < 3) {
    strategies.push('📊 안정적인 매출 관리를 통한 사업 지속성 입증');
    strategies.push('📁 재무제표 등 사업 실적 자료를 체계적으로 관리');
  }
  
  strategies.push('🎯 소액 정책자금부터 단계적으로 신청하여 성공 사례 축적');
  strategies.push('🤝 신용보증재단 등 보증기관 활용으로 심사 통과율 제고');
  
  return strategies;
}

/**
 * 상세 종합 평가
 */
function generateDetailedOverallSummary(client: any, creditScore: number, debtRatio: any, sohoGrade: string): string {
  return `${client.name}님은 업력 ${client.business_years}년, 연매출 ${(client.annual_revenue / 100000000).toFixed(1)}억원 규모의 ` +
    `${client.gender === '남성' ? '남성' : '여성'} 사업자(만 ${client.age}세)로, ` +
    `평균 신용점수 ${creditScore.toFixed(0)}점, 부채비율 ${debtRatio}%, 소호등급 ${sohoGrade}로 평가되었습니다. ` +
    `${client.has_technology ? '기술기업 인증을 보유하여 기술금융 지원 대상이며, ' : ''}` +
    `${creditScore >= 800 ? '우수한 신용도를 바탕으로 다양한 정책자금 신청이 가능합니다.' : creditScore >= 700 ? '일반적인 정책자금 신청 조건을 충족하고 있습니다.' : '신용 개선 후 정책자금 신청을 권장합니다.'} ` +
    `총부채 ${(client.debt / 100000000).toFixed(2)}억원 중 정책자금 ${(client.debt_policy_fund / 100000000).toFixed(2)}억원, ` +
    `신용대출 ${(client.debt_credit_loan / 100000000).toFixed(2)}억원, ` +
    `제2금융권 대출 ${(client.debt_secondary_loan / 100000000).toFixed(2)}억원, ` +
    `카드론 ${(client.debt_card_loan / 100000000).toFixed(2)}억원으로 구성되어 있습니다.`;
}

/**
 * 타임라인 추천
 */
function generateTimelineRecommendations(client: any, creditScore: number, debtRatio: any): string[] {
  const timeline: string[] = [];
  
  timeline.push('📅 즉시: 추천된 정책자금 목록 검토 및 우선순위 선정');
  
  if (creditScore < 700 || (typeof debtRatio === 'number' && debtRatio >= 70)) {
    timeline.push('📅 1개월 이내: 신용점수 향상 및 부채 감축 계획 수립 및 실행');
  }
  
  timeline.push('📅 1-2개월: 선정한 정책자금 신청 서류 준비 (사업계획서, 재무제표 등)');
  timeline.push('📅 2-3개월: 정책자금 신청 및 심사 진행 (추가 서류 요청 시 즉시 대응)');
  timeline.push('📅 3-4개월: 심사 결과 확인 및 승인 시 자금 집행 (미승인 시 사유 분석 및 재신청 준비)');
  timeline.push('📅 6개월 후: 정책자금 활용 실적 점검 및 추가 지원 프로그램 탐색');
  
  return timeline;
}
