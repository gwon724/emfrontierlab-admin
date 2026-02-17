import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getDatabase } from '@/lib/db';
import { calculateMaxLoanLimit, calculateSOHOGrade } from '@/lib/ai-diagnosis';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: '인증 토큰이 없습니다.' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload || payload.type !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const { clientId } = await request.json();

    if (!clientId) {
      return NextResponse.json(
        { error: '클라이언트 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    
    // 클라이언트 정보 조회
    const client: any = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
    
    if (!client) {
      return NextResponse.json(
        { error: '클라이언트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // SOHO 등급 계산
    const sohoGrade = calculateSOHOGrade({
      nice_score: client.nice_score,
      annual_revenue: client.annual_revenue,
      debt: client.debt,
      has_technology: client.has_technology === 1
    });

    // 최대 대출 한도 계산
    const maxLoanLimit = calculateMaxLoanLimit({
      nice_score: client.nice_score,
      annual_revenue: client.annual_revenue,
      debt: client.debt,
      has_technology: client.has_technology === 1
    }, sohoGrade);

    // 정책자금별 세부 한도 정보
    const fundLimits = await calculateFundSpecificLimits(client, sohoGrade, maxLoanLimit);

    return NextResponse.json({
      success: true,
      clientId: client.id,
      clientName: client.name,
      sohoGrade,
      maxLoanLimit,
      fundLimits,
      clientInfo: {
        niceScore: client.nice_score,
        annualRevenue: client.annual_revenue,
        debt: client.debt,
        hasTechnology: client.has_technology === 1
      }
    });
  } catch (error) {
    console.error('한도 조회 오류:', error);
    return NextResponse.json(
      { error: '한도 조회 실패' },
      { status: 500 }
    );
  }
}

// 정책자금별 세부 한도 계산
async function calculateFundSpecificLimits(client: any, sohoGrade: string, maxLimit: number) {
  const db = getDatabase();
  
  // 모든 정책자금 조회
  const funds: any[] = db.prepare('SELECT * FROM policy_fund_details').all();
  
  const fundLimits = funds.map(fund => {
    let adjustedLimit = Math.min(maxLimit, fund.max_amount); // DB에 원 단위로 저장됨
    
    // 자금별 추가 조건 적용
    if (fund.fund_name.includes('청년')) {
      // 청년 자금은 나이 제한
      if (client.age > 39) {
        adjustedLimit = 0;
      }
    }
    
    if (fund.fund_name.includes('기술') || fund.fund_name.includes('벤처')) {
      // 기술 관련 자금은 기술력 필수
      if (!client.has_technology) {
        adjustedLimit = adjustedLimit * 0.5; // 50% 감액
      }
    }
    
    if (fund.fund_name.includes('취약')) {
      // 취약소상공인 자금은 신용점수 제한
      if (client.nice_score > 839) {
        adjustedLimit = 0;
      }
    }
    
    return {
      fundName: fund.fund_name,
      category: fund.category,
      maxLimit: adjustedLimit,
      interestRate: fund.interest_rate,
      repaymentPeriod: fund.period_months,
      eligibility: fund.eligibility,
      isEligible: adjustedLimit > 0
    };
  });
  
  return fundLimits.filter(f => f.isEligible);
}
