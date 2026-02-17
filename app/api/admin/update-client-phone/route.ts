import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, getDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload || payload.type !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 });
    }

    const { clientId, phone } = await request.json();

    if (!clientId) {
      return NextResponse.json(
        { error: '클라이언트 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 전화번호 유효성 검사
    if (!phone) {
      return NextResponse.json(
        { error: '전화번호는 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    if (!phoneRegex.test(phone.replace(/-/g, ''))) {
      return NextResponse.json(
        { error: '올바른 전화번호 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    initDatabase();
    const db = getDatabase();

    // 클라이언트 존재 확인
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
    if (!client) {
      return NextResponse.json(
        { error: '클라이언트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 전화번호 업데이트
    db.prepare(`
      UPDATE clients 
      SET phone = ? 
      WHERE id = ?
    `).run(phone, clientId);

    return NextResponse.json({
      success: true,
      message: '전화번호가 변경되었습니다.'
    });

  } catch (error: any) {
    console.error('Update client phone error:', error);
    return NextResponse.json(
      { error: '전화번호 변경 중 오류가 발생했습니다: ' + error.message },
      { status: 500 }
    );
  }
}
