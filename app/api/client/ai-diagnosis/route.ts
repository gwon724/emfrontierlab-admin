import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, getDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { performAIDiagnosis } from '@/lib/ai-diagnosis';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: '인증 토큰이 없습니다.' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    initDatabase();
    const db = getDatabase();

    let clientData: any;
    let clientId: number;

    // 관리자가 클라이언트 데이터를 직접 제공하는 경우
    if (payload.type === 'admin') {
      const body = await request.json();
      if (!body.clientData) {
        return NextResponse.json({ error: '클라이언트 데이터가 필요합니다.' }, { status: 400 });
      }
      
      clientData = {
        niceScore: body.clientData.nice_score || 0,
        kcbScore: body.clientData.kcb_score || 0,
        annualRevenue: body.clientData.annual_revenue || 0,
        totalDebt: body.clientData.total_debt || 0,
        debtPolicyFund: body.clientData.debt_policy_fund || 0,
        debtCreditLoan: body.clientData.debt_credit_loan || 0,
        debtSecondaryLoan: body.clientData.debt_secondary_loan || 0,
        debtCardLoan: body.clientData.debt_card_loan || 0,
        hasTechnology: body.clientData.has_technology || false,
        businessYears: body.clientData.business_years || 0
      };
      
      // clientId는 body에서 가져오거나 생략
      clientId = body.clientId || 0;
    } 
    // 클라이언트가 직접 요청하는 경우
    else if (payload.type === 'client') {
      clientId = payload.id;
      
      // 클라이언트 정보 조회
      const client: any = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
      
      if (!client) {
        return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
      }

      clientData = {
        niceScore: client.nice_score || 0,
        kcbScore: client.kcb_score || 0,
        annualRevenue: client.annual_revenue || 0,
        totalDebt: client.total_debt || 0,
        debtPolicyFund: client.debt_policy_fund || 0,
        debtCreditLoan: client.debt_credit_loan || 0,
        debtSecondaryLoan: client.debt_secondary_loan || 0,
        debtCardLoan: client.debt_card_loan || 0,
        hasTechnology: client.has_technology === 1,
        businessYears: client.business_years || 0
      };
    } else {
      return NextResponse.json({ error: '잘못된 토큰 타입입니다.' }, { status: 403 });
    }

    // AI 진단 수행
    const diagnosis = performAIDiagnosis(clientData);

    // AI 진단 결과 저장 (clientId가 있는 경우에만)
    if (clientId > 0) {
      db.prepare(`
        INSERT OR REPLACE INTO ai_diagnosis 
        (client_id, soho_grade, recommended_funds, diagnosis_details)
        VALUES (?, ?, ?, ?)
      `).run(
        clientId,
        diagnosis.sohoGrade,
        JSON.stringify(diagnosis.recommendedFunds),
        diagnosis.details
      );
    }

    return NextResponse.json({
      success: true,
      soho_grade: diagnosis.sohoGrade,
      recommended_funds: diagnosis.recommendedFunds,
      max_loan_limit: diagnosis.maxLoanLimit,
      diagnosis_details: diagnosis.details
    });

  } catch (error: any) {
    console.error('AI Diagnosis error:', error);
    return NextResponse.json(
      { error: 'AI 진단 중 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}

