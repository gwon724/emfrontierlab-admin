import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, getDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    initDatabase();
    const db = getDatabase();

    // 모든 정책자금 상세 정보 조회
    const funds = db.prepare(`
      SELECT * FROM policy_fund_details
      ORDER BY category, fund_name
    `).all();

    return NextResponse.json({
      success: true,
      funds
    });

  } catch (error: any) {
    console.error('Get policy funds error:', error);
    return NextResponse.json(
      { error: '데이터를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
