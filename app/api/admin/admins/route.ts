import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, getDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/admins  — 관리자 목록 조회
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: '인증 토큰이 없습니다.' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.type !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    initDatabase();
    const db = getDatabase();

    const admins = db
      .prepare('SELECT id, email, name, phone, created_at FROM admins ORDER BY created_at DESC')
      .all();

    return NextResponse.json({ success: true, admins });
  } catch (error: any) {
    console.error('GET admins error:', error);
    return NextResponse.json({ error: '목록 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// DELETE /api/admin/admins?id=xx  — 관리자 삭제
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: '인증 토큰이 없습니다.' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.type !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const targetId = Number(searchParams.get('id'));

    if (!targetId) {
      return NextResponse.json({ error: '삭제할 관리자 ID가 없습니다.' }, { status: 400 });
    }

    // 자기 자신은 삭제 불가
    if (targetId === payload.id) {
      return NextResponse.json({ error: '자기 자신은 삭제할 수 없습니다.' }, { status: 400 });
    }

    initDatabase();
    const db = getDatabase();

    const target = db.prepare('SELECT id, name FROM admins WHERE id = ?').get(targetId) as any;
    if (!target) {
      return NextResponse.json({ error: '해당 관리자를 찾을 수 없습니다.' }, { status: 404 });
    }

    db.prepare('DELETE FROM admins WHERE id = ?').run(targetId);

    return NextResponse.json({ success: true, message: `${target.name} 관리자가 삭제되었습니다.` });
  } catch (error: any) {
    console.error('DELETE admin error:', error);
    return NextResponse.json({ error: '삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
