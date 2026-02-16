import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-4xl mx-auto text-center space-y-8 p-8">
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-white mb-4">EMFRONTIER LAB</h1>
            <p className="text-2xl text-blue-400 font-semibold">관리자 포털</p>
            <p className="text-lg text-gray-300 mt-2">정책자금 관리 시스템</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">관리자 기능</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div className="text-3xl mb-2">📊</div>
                <h3 className="font-bold text-gray-800 mb-2">대시보드</h3>
                <p className="text-sm text-gray-600">
                  전체 신청 현황과 상태별 통계를 한눈에 확인할 수 있습니다.
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <div className="text-3xl mb-2">👥</div>
                <h3 className="font-bold text-gray-800 mb-2">회원 관리</h3>
                <p className="text-sm text-gray-600">
                  모든 클라이언트의 정보와 신청 내역을 관리합니다.
                </p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                <div className="text-3xl mb-2">✏️</div>
                <h3 className="font-bold text-gray-800 mb-2">진행상황 관리</h3>
                <p className="text-sm text-gray-600">
                  각 클라이언트의 진행상황을 실시간으로 업데이트합니다.
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                <div className="text-3xl mb-2">📱</div>
                <h3 className="font-bold text-gray-800 mb-2">QR 스캔</h3>
                <p className="text-sm text-gray-600">
                  클라이언트의 QR 코드를 스캔하여 정보를 확인합니다.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-2xl shadow-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">진행상황 관리</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <div className="font-bold mb-1">접수대기</div>
                <div className="text-xs">신규 신청</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <div className="font-bold mb-1">접수완료</div>
                <div className="text-xs">접수 확인</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <div className="font-bold mb-1">진행중</div>
                <div className="text-xs">심사 진행</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <div className="font-bold mb-1">진행완료</div>
                <div className="text-xs">심사 완료</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <div className="font-bold mb-1">집행완료</div>
                <div className="text-xs">자금 집행</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <div className="font-bold mb-1">보완</div>
                <div className="text-xs">서류 보완</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <div className="font-bold mb-1">반려</div>
                <div className="text-xs">신청 반려</div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center mt-8">
            <Link 
              href="/admin/login"
              className="px-8 py-4 bg-white text-gray-900 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
            >
              관리자 로그인
            </Link>
          </div>

          <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4 mt-6">
            <p className="text-xs text-gray-400 mb-2">
              <strong className="text-white">관리자 문의</strong>
            </p>
            <p className="text-xs text-gray-400">
              연락처: 010-8178-4281<br/>
              담당자: 권권권
            </p>
          </div>
        </div>
      </div>
      
      <footer className="py-6 text-center text-gray-400 text-sm px-4">
        Copyright © 2026 EMFRONTIER Operating Company, LLC. All Rights Reserved
      </footer>
    </div>
  );
}
