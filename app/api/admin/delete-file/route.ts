import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getDatabase } from '@/lib/db';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';

export async function DELETE(request: NextRequest) {
  try {
    // 관리자 인증
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);

    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
    }

    const { fileId } = await request.json();

    if (!fileId) {
      return NextResponse.json({ error: '파일 ID가 필요합니다' }, { status: 400 });
    }

    const db = getDatabase();

    // 파일 정보 조회
    const file = db.prepare(`
      SELECT file_path FROM client_documents WHERE id = ?
    `).get(fileId);

    if (!file) {
      return NextResponse.json({ error: '파일을 찾을 수 없습니다' }, { status: 404 });
    }

    // 파일 시스템에서 삭제
    if (existsSync(file.file_path)) {
      try {
        await unlink(file.file_path);
      } catch (err) {
        console.error('파일 삭제 오류:', err);
      }
    }

    // 데이터베이스에서 삭제
    db.prepare(`DELETE FROM client_documents WHERE id = ?`).run(fileId);

    return NextResponse.json({
      success: true,
      message: '파일이 삭제되었습니다'
    });
  } catch (error) {
    console.error('파일 삭제 오류:', error);
    return NextResponse.json(
      { error: '파일 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
