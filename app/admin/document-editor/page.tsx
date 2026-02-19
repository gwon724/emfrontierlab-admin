'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function DocumentEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');
  const clientName = searchParams.get('clientName');

  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [qrLoading, setQrLoading] = useState(true);

  // 로그인된 관리자 정보
  const [adminName, setAdminName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');

  useEffect(() => {
    if (!clientId) {
      alert('클라이언트 정보가 없습니다.');
      router.back();
      return;
    }

    // 로그인된 관리자 정보 불러오기
    try {
      const adminDataRaw = localStorage.getItem('adminData');
      if (adminDataRaw) {
        const adminData = JSON.parse(adminDataRaw);
        setAdminName(adminData.name || '');
        setAdminPhone(adminData.phone || '');
      }
    } catch (e) {
      // 무시
    }

    // QR 코드 생성 (clientId 기반)
    generateClientQR();
    setLoading(false);
  }, [clientId]);

  const generateClientQR = async () => {
    setQrLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/qr/generate-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ clientId: Number(clientId) }),
      });

      if (res.ok) {
        const data = await res.json();
        // generate-admin returns qrCodeUrl
        setQrCode(data.qrCodeUrl || data.qrCode || '');
      }
    } catch (error) {
      console.error('QR 생성 오류:', error);
    } finally {
      setQrLoading(false);
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem('adminToken');

    try {
      const res = await fetch('/api/admin/save-document', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          title: title || `${clientName} 문서`,
          content,
          documentType: 'general',
        }),
      });

      if (res.ok) {
        alert('문서가 저장되었습니다.');
      } else {
        alert('저장 실패');
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    window.print();
  };

  /* ── QR 코드 블록 (항상 렌더링 – 로딩 중이면 스켈레톤) ── */
  const QRBlock = () => (
    <div className="absolute top-6 right-6 print:top-8 print:right-8 z-10">
      <div className="bg-white p-2 border-2 border-gray-300 rounded-xl shadow-sm flex flex-col items-center" style={{ minWidth: 100 }}>
        {qrLoading ? (
          <div className="w-24 h-24 bg-gray-100 animate-pulse rounded flex items-center justify-center">
            <span className="text-[10px] text-gray-400">생성 중...</span>
          </div>
        ) : qrCode ? (
          <img src={qrCode} alt="Client QR Code" className="w-24 h-24" />
        ) : (
          <div className="w-24 h-24 bg-gray-100 flex items-center justify-center rounded">
            <span className="text-[10px] text-gray-400">QR 없음</span>
          </div>
        )}
        <p className="text-[10px] text-center text-gray-500 mt-1 leading-tight font-medium">
          {clientName || 'CLIENT'}<br />
          <span className="text-gray-400">EMFRONTIER</span>
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* 로딩 중에도 QR은 이미 생성 요청 중 */}
        <div className="max-w-[21cm] mx-auto my-8">
          <div className="bg-white shadow-lg relative min-h-[29.7cm] p-10">
            <QRBlock />
            <div className="flex items-center justify-center h-64">
              <div className="text-xl text-gray-400">문서 로딩 중...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 - 인쇄 시 숨김 */}
      <div className="print:hidden bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                ← 돌아가기
              </button>
              <h1 className="text-xl font-bold text-gray-800">
                문서 작성 — {clientName || '클라이언트'}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* 담당자 정보 미리보기 */}
              {(adminName || adminPhone) && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-xs text-blue-600 font-medium">담당자:</span>
                  <span className="text-xs text-blue-800 font-semibold">{adminName}</span>
                  {adminPhone && (
                    <>
                      <span className="text-blue-300">|</span>
                      <span className="text-xs text-blue-800">{adminPhone}</span>
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  💾 저장
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                >
                  🖨️ 인쇄
                </button>
                <button
                  onClick={handleExportPDF}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                >
                  📄 PDF 저장
                </button>
              </div>
            </div>
          </div>

          {/* 제목 입력 */}
          <div className="mt-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="문서 제목 입력..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* 문서 영역 (A4) */}
      <div className="max-w-[21cm] mx-auto my-8 print:my-0 print:max-w-full">
        <div className="bg-white shadow-lg print:shadow-none relative min-h-[29.7cm] p-10 print:p-12">

          {/* ── QR 코드: 우측 상단 고정 (항상 렌더링) ── */}
          <QRBlock />

          {/* ── 문서 제목 영역 (QR 공간 확보를 위해 오른쪽 여백) ── */}
          <div className="mb-8 print:mb-10 pr-36">
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
              {title || '문서 제목'}
            </h1>
            <div className="text-center text-sm text-gray-500">
              클라이언트: {clientName}
            </div>
            <div className="text-center text-xs text-gray-400 mt-1">
              작성일: {new Date().toLocaleDateString('ko-KR')}
            </div>
          </div>

          {/* ── 본문 에디터 영역 ── */}
          <div className="prose max-w-none">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`여기에 내용을 입력하세요...

예시:
1. 정책자금 신청 내역
2. 심사 결과
3. 필요 서류
4. 기타 사항

자유롭게 작성하시면 됩니다.`}
              className="w-full min-h-[500px] print:min-h-0 border-none focus:outline-none resize-none font-sans text-base leading-relaxed"
              style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                lineHeight: '1.8',
              }}
            />
          </div>

          {/* ── 서명 / 담당자 영역 ── */}
          <div className="mt-16 print:mt-24 flex justify-between items-end border-t pt-6">
            {/* 담당자 정보 — 로그인된 관리자 자동 기입 */}
            <div className="text-sm text-gray-700 space-y-1.5">
              <p className="font-semibold text-gray-800 mb-2">담당자 정보</p>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-14 flex-shrink-0">담당자</span>
                {adminName ? (
                  <span className="font-semibold text-gray-900 border-b border-gray-400 min-w-[120px] pb-0.5">
                    {adminName}
                  </span>
                ) : (
                  <span className="border-b border-gray-400 min-w-[120px] pb-0.5 text-gray-400 italic">
                    _________________
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-14 flex-shrink-0">연락처</span>
                {adminPhone ? (
                  <span className="font-semibold text-gray-900 border-b border-gray-400 min-w-[120px] pb-0.5">
                    {adminPhone}
                  </span>
                ) : (
                  <span className="border-b border-gray-400 min-w-[120px] pb-0.5 text-gray-400 italic">
                    _________________
                  </span>
                )}
              </div>
            </div>

            {/* 회사 정보 */}
            <div className="text-right">
              <p className="text-lg font-bold mb-1 text-gray-900">EMFRONTIER LAB</p>
              <p className="text-sm text-gray-500">정책자금 관리 시스템</p>
            </div>
          </div>

        </div>
      </div>

      {/* 인쇄 스타일 */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          textarea {
            border: none !important;
            outline: none !important;
            resize: none !important;
            overflow: hidden !important;
            white-space: pre-wrap !important;
          }
        }
      `}</style>
    </div>
  );
}
