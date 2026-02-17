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
      annualRevenue: client.annual_revenue,
      totalDebt: client.debt,
      debtRatio: debtRatio,
      kcbScore: client.kcb_score,
      niceScore: client.nice_score,
      avgCreditScore: avgCreditScore.toFixed(0),
      creditLevel,
      sohoGrade,
      hasTechnology: client.has_technology,
    },
    
    creditAnalysis: {
      level: creditLevel,
      score: avgCreditScore.toFixed(0),
      summary: generateCreditSummary(avgCreditScore),
      strengths: getCreditStrengths(avgCreditScore, debtRatio),
      weaknesses: getCreditWeaknesses(avgCreditScore, debtRatio),
    },

    sohoAnalysis: {
      grade: sohoGrade,
      description: sohoAnalysis.description,
      characteristics: sohoAnalysis.characteristics,
      recommendations: sohoAnalysis.recommendations,
    },

    fundAnalysis: {
      recommendedFunds: fundAnalysis,
      totalRecommendations: fundAnalysis.length,
      appliedFunds: policyFunds.length,
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
      nextSteps: generateNextSteps(
        avgCreditScore,
        debtRatio,
        sohoGrade,
        policyFunds.length
      ),
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
