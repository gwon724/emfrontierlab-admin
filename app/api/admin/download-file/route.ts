import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getDatabase } from '@/lib/db';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export async function GET(request: NextRequest) {
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

    const url = new URL(request.url);
    const fileId = url.searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ error: '파일 ID가 필요합니다' }, { status: 400 });
    }

    const db = getDatabase();
    
    // 파일 정보 조회
    const file: any = db.prepare(`
      SELECT 
        file_path as filePath,
        original_name as originalName,
        file_type as fileType
      FROM client_documents
      WHERE id = ?
    `).get(fileId);

    if (!file) {
      return NextResponse.json({ error: '파일을 찾을 수 없습니다' }, { status: 404 });
    }

    // 파일 존재 여부 확인
    if (!existsSync(file.filePath)) {
      return NextResponse.json({ error: '파일이 삭제되었거나 존재하지 않습니다' }, { status: 404 });
    }

    // 파일 읽기
    const fileBuffer = await readFile(file.filePath);

    // 파일 다운로드 응답 생성
    const headers = new Headers();
    headers.set('Content-Type', file.fileType || 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    headers.set('Content-Length', fileBuffer.length.toString());

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('파일 다운로드 오류:', error);
    return NextResponse.json(
      { error: '파일 다운로드 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
