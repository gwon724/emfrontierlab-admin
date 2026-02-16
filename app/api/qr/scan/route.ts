import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, getDatabase } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrData } = body;

    // QR 데이터 파싱
    const data = JSON.parse(qrData);

    initDatabase();
    const db = getDatabase();

    // 클라이언트 정보 조회
    const client: any = db.prepare('SELECT * FROM clients WHERE id = ?').get(data.clientId);
    
    if (!client) {
      return NextResponse.json({ error: '클라이언트를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 진행 상황 조회
    const application: any = db.prepare('SELECT * FROM applications WHERE client_id = ? ORDER BY created_at DESC LIMIT 1').get(client.id);
    
    // AI 진단 결과 조회
    const diagnosis: any = db.prepare('SELECT * FROM ai_diagnosis WHERE client_id = ? ORDER BY created_at DESC LIMIT 1').get(client.id);

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
        kcb_score: client.kcb_score,
        nice_score: client.nice_score,
        has_technology: client.has_technology === 1,
        soho_grade: client.soho_grade,
      },
      application: application ? {
        id: application.id,
        status: application.status,
        policy_funds: application.policy_funds ? JSON.parse(application.policy_funds) : [],
        notes: application.notes,
      } : null,
      diagnosis: diagnosis ? {
        soho_grade: diagnosis.soho_grade,
        recommended_funds: JSON.parse(diagnosis.recommended_funds),
        diagnosis_details: diagnosis.diagnosis_details,
      } : null,
    });

  } catch (error: any) {
    console.error('QR Scan error:', error);
    return NextResponse.json(
      { error: 'QR 코드 검증 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
