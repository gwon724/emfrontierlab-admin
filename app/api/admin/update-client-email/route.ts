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

    const { clientId, email } = await request.json();

    if (!clientId) {
      return NextResponse.json(
        { error: '클라이언트 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 이메일 유효성 검사
    if (!email) {
      return NextResponse.json(
        { error: '이메일은 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식이 아닙니다.' },
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

    // 이메일 중복 확인 (다른 클라이언트가 이미 사용 중인지)
    const existingClient = db.prepare('SELECT * FROM clients WHERE email = ? AND id != ?').get(email, clientId);
    if (existingClient) {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일입니다.' },
        { status: 409 }
      );
    }

    // 이메일 업데이트
    db.prepare(`
      UPDATE clients 
      SET email = ? 
      WHERE id = ?
    `).run(email, clientId);

    // 로그 기록 (선택사항)
    console.log(`[ADMIN] Client email updated - ClientID: ${clientId}, NewEmail: ${email}, Admin: ${payload.email}`);

    return NextResponse.json({
      success: true,
      message: '이메일이 변경되었습니다.'
    });

  } catch (error: any) {
    console.error('Update client email error:', error);
    return NextResponse.json(
      { error: '이메일 변경 중 오류가 발생했습니다: ' + error.message },
      { status: 500 }
    );
  }
}
