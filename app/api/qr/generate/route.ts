import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: '인증 토큰이 없습니다.' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.type !== 'client') {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    // QR 코드에 담을 데이터
    const qrData = JSON.stringify({
      clientId: payload.id,
      email: payload.email
    });

    // QR 코드 생성
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return NextResponse.json({
      qrCode: qrCodeDataURL,
      clientId: payload.id
    });

  } catch (error: any) {
    console.error('QR Code generation error:', error);
    return NextResponse.json(
      { error: 'QR 코드 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
