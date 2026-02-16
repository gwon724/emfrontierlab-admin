import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, getDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: '인증 토큰이 없습니다.' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.type !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    initDatabase();
    const db = getDatabase();

    // 모든 클라이언트 조회
    const clients = db.prepare(`
      SELECT 
        c.*,
        a.status as application_status,
        a.id as application_id,
        a.policy_funds as policy_funds
      FROM clients c
      LEFT JOIN applications a ON c.id = a.client_id
      ORDER BY c.created_at DESC
    `).all();

    // policy_funds JSON 파싱
    const parsedClients = (clients as any[]).map((client: any) => ({
      ...client,
      policy_funds: client.policy_funds ? JSON.parse(client.policy_funds) : []
    }));

    // 상태별 카운트
    const statusCounts = {
      접수대기: 0,
      접수완료: 0,
      진행중: 0,
      진행완료: 0,
      집행완료: 0,
      보완: 0,
      반려: 0
    };

    parsedClients.forEach((client: any) => {
      if (client.application_status && statusCounts.hasOwnProperty(client.application_status)) {
        statusCounts[client.application_status as keyof typeof statusCounts]++;
      }
    });

    return NextResponse.json({
      clients: parsedClients,
      statusCounts,
      totalClients: parsedClients.length
    });

  } catch (error: any) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json(
      { error: '데이터를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
