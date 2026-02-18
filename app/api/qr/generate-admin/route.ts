import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'emfrontier-secret-key-2026';
const QR_SECRET = process.env.QR_SECRET || 'emfrontier-qr-secret-2026';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: '인증 토큰이 없습니다.' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload || payload.type !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const { clientId } = await request.json();

    if (!clientId) {
      return NextResponse.json(
        { error: '클라이언트 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // QR 코드용 암호화된 토큰 생성 (관리자 전용 스캔)
    const qrToken = jwt.sign(
      {
        clientId,
        type: 'admin-qr',
        timestamp: Date.now()
      },
      QR_SECRET,
      { expiresIn: '30d' } // QR 코드 유효기간 30일
    );

    // QR 데이터 생성
    const qrData = JSON.stringify({
      token: qrToken,
      clientId,
      issuer: 'EMFRONTIER_ADMIN'
    });

    // QR 코드 이미지 생성
    const qrCodeUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return NextResponse.json({
      success: true,
      qrCodeUrl,
      token: qrToken
    });
  } catch (error) {
    console.error('QR 코드 생성 오류:', error);
    return NextResponse.json(
      { error: 'QR 코드 생성 실패' },
      { status: 500 }
    );
  }
}
