import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, getDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: '클라이언트 ID가 필요합니다.' }, { status: 400 });
    }

    initDatabase();
    const db = getDatabase();

    // 클라이언트 정보 조회
    const client: any = db.prepare(`
      SELECT 
        c.*
      FROM clients c
      WHERE c.id = ?
    `).get(clientId);

    if (!client) {
      return NextResponse.json({ error: '클라이언트를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 최신 신청 정보 조회
    const application: any = db.prepare(`
      SELECT * FROM applications
      WHERE client_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(clientId);

    // AI 진단 정보 조회
    const diagnosis: any = db.prepare(`
      SELECT * FROM ai_diagnosis
      WHERE client_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(clientId);

    // policy_funds와 fund_amounts JSON 파싱
    let policyFunds = [];
    let fundAmounts = {};
    
    if (application) {
      policyFunds = application.policy_funds ? JSON.parse(application.policy_funds) : [];
      fundAmounts = application.fund_amounts ? JSON.parse(application.fund_amounts) : {};
    }

    // AI 진단 정보 파싱
    let recommendedFunds = [];
    if (diagnosis && diagnosis.recommended_funds) {
      try {
        recommendedFunds = JSON.parse(diagnosis.recommended_funds);
      } catch (e) {
        recommendedFunds = [];
      }
    }

    return NextResponse.json({
      success: true,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        age: client.age,
        gender: client.gender,
        annual_revenue: client.annual_revenue,
        debt: client.debt,
        debt_policy_fund: client.debt_policy_fund || 0,
        debt_credit_loan: client.debt_credit_loan || 0,
        debt_secondary_loan: client.debt_secondary_loan || 0,
        debt_card_loan: client.debt_card_loan || 0,
        kcb_score: client.kcb_score,
        nice_score: client.nice_score,
        has_technology: client.has_technology,
        soho_grade: client.soho_grade || diagnosis?.soho_grade || 'N/A',
        application_status: application?.status || '미신청',
        policy_funds: policyFunds,
        fund_amounts: fundAmounts,
        recommended_funds: recommendedFunds,
        notes: application?.notes || '',
        created_at: client.created_at
      }
    });

  } catch (error: any) {
    console.error('Share link data error:', error);
    return NextResponse.json(
      { error: '데이터를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
