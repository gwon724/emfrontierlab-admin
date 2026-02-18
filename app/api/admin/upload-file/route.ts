import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getDatabase } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const clientId = formData.get('clientId') as string;

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다' }, { status: 400 });
    }

    if (!clientId) {
      return NextResponse.json({ error: '클라이언트 ID가 필요합니다' }, { status: 400 });
    }

    // 파일 저장 경로 설정
    const uploadsDir = join(process.cwd(), 'uploads', 'client-documents', clientId);
    
    // 디렉토리가 없으면 생성
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // 파일명 생성 (타임스탬프 + 원본 파일명)
    const timestamp = new Date().getTime();
    const originalName = file.name;
    const fileName = `${timestamp}_${originalName}`;
    const filePath = join(uploadsDir, fileName);

    // 파일 저장
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // 데이터베이스에 파일 정보 저장
    const db = getDatabase();
    
    // client_documents 테이블이 없으면 생성
    db.exec(`
      CREATE TABLE IF NOT EXISTS client_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        file_name TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        file_type TEXT,
        uploaded_by INTEGER NOT NULL,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES admins(id)
      )
    `);

    const stmt = db.prepare(`
      INSERT INTO client_documents (client_id, file_name, original_name, file_path, file_size, file_type, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      parseInt(clientId),
      fileName,
      originalName,
      filePath,
      file.size,
      file.type,
      decoded.id
    );

    return NextResponse.json({
      success: true,
      message: '파일이 업로드되었습니다',
      file: {
        id: result.lastInsertRowid,
        fileName,
        originalName,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    return NextResponse.json(
      { error: '파일 업로드 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 파일 목록 조회
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
    const clientId = url.searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: '클라이언트 ID가 필요합니다' }, { status: 400 });
    }

    const db = getDatabase();
    
    // 테이블이 없으면 빈 배열 반환
    const tableExists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='client_documents'"
    ).get();

    if (!tableExists) {
      return NextResponse.json({ files: [] });
    }

    const files = db.prepare(`
      SELECT 
        id,
        file_name as fileName,
        original_name as originalName,
        file_size as fileSize,
        file_type as fileType,
        uploaded_at as uploadedAt
      FROM client_documents
      WHERE client_id = ?
      ORDER BY uploaded_at DESC
    `).all(parseInt(clientId));

    return NextResponse.json({ files });
  } catch (error) {
    console.error('파일 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '파일 목록 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
