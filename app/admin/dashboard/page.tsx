'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrPassword, setQrPassword] = useState('');
  const [scannedData, setScannedData] = useState<any>(null);
  const [statusUpdate, setStatusUpdate] = useState({
    status: '접수대기',
    notes: ''
  });

  useEffect(() => {
    fetchData();
    // 5초마다 자동 새로고침 (실시간 반영)
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setData(data);
      } else {
        localStorage.removeItem('adminToken');
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedClient) return;

    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch('/api/admin/update-status', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId: selectedClient.id,
          status: statusUpdate.status,
          notes: statusUpdate.notes
        })
      });

      if (res.ok) {
        alert('진행상황이 업데이트되었습니다.');
        setShowStatusModal(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('업데이트 중 오류가 발생했습니다.');
    }
  };

  const handleQRScan = async () => {
    // 실제 QR 스캔은 html5-qrcode 라이브러리를 사용해야 하지만,
    // 여기서는 간단히 수동 입력으로 테스트
    if (!scannedData || !qrPassword) {
      alert('QR 데이터와 비밀번호를 입력해주세요.');
      return;
    }

    try {
      const res = await fetch('/api/qr/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          qrData: scannedData,
          password: qrPassword
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert('QR 스캔 성공!');
        setSelectedClient(data.client);
        setShowQRScanner(false);
        setQrPassword('');
        setScannedData(null);
      } else {
        alert(data.error || 'QR 스캔에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error scanning QR:', error);
      alert('QR 스캔 중 오류가 발생했습니다.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    router.push('/admin/login');
  };

  // 상태 직접 변경 (Notion 스타일)
  const handleQuickStatusChange = async (clientId: number, currentStatus: string) => {
    const statusList = ['접수대기', '접수완료', '진행중', '진행완료', '집행완료', '보완', '반려'];
    const currentIndex = statusList.indexOf(currentStatus || '접수대기');
    const nextStatus = statusList[(currentIndex + 1) % statusList.length];
    
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch('/api/admin/update-status', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId,
          status: nextStatus,
          notes: ''
        })
      });

      if (res.ok) {
        fetchData(); // 즉시 새로고침
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-600">로딩 중...</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const filteredClients = data.clients.filter((client: any) =>
    client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gray-900 text-white py-4 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">EMFRONTIER LAB 관리자</h1>
            <p className="text-sm text-gray-300">정책자금 관리 시스템</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowQRScanner(true)}
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              QR 스캔
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          {Object.entries(data.statusCounts).map(([status, count]) => (
            <div key={status} className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-sm font-medium text-gray-600">{status}</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{count as number}</div>
            </div>
          ))}
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름 또는 이메일로 검색..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <button
              onClick={fetchData}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              새로고침
            </button>
          </div>
        </div>

        {/* 클라이언트 목록 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">
              접수대기 ({filteredClients.length})
            </h2>
            <p className="text-sm text-gray-600 mt-1">아직 심사를 진행하지 않은 신청입니다.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이름
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이메일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SOHO등급
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NICE점수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    선택 정책자금
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    가입일
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      아직 신청한 회원이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client: any) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {client.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {client.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-semibold">
                          {client.soho_grade}등급
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {client.nice_score}점
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {client.policy_funds && client.policy_funds.length > 0 ? (
                          <div className="space-y-1">
                            {client.policy_funds.map((fund: string, idx: number) => (
                              <div key={idx} className="text-xs bg-blue-50 px-2 py-1 rounded border border-blue-200">
                                {fund}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">미선택</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleQuickStatusChange(client.id, client.application_status)}
                          className={`px-3 py-2 rounded text-xs font-semibold cursor-pointer hover:shadow-lg transition-all transform hover:scale-105 ${
                            client.application_status === '접수대기' ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' :
                            client.application_status === '접수완료' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                            client.application_status === '진행중' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                            client.application_status === '진행완료' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                            client.application_status === '집행완료' ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' :
                            client.application_status === '보완' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' :
                            client.application_status === '반려' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                            'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                          title="클릭하여 다음 단계로 이동"
                        >
                          {client.application_status || '접수대기'} →
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(client.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedClient(client);
                            setStatusUpdate({
                              status: client.application_status || '접수대기',
                              notes: ''
                            });
                            setShowStatusModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          상태변경
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 상태 업데이트 모달 */}
      {showStatusModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              진행상황 업데이트
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {selectedClient.name}님의 진행상황을 변경합니다
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상태 선택
                </label>
                <select
                  value={statusUpdate.status}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="접수대기">접수대기</option>
                  <option value="접수완료">접수완료</option>
                  <option value="진행중">진행중</option>
                  <option value="진행완료">진행완료</option>
                  <option value="집행완료">집행완료</option>
                  <option value="보완">보완</option>
                  <option value="반려">반려</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  메모 (선택사항)
                </label>
                <textarea
                  value={statusUpdate.notes}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={3}
                  placeholder="추가 메모를 입력하세요..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowStatusModal(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUpdateStatus}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                업데이트
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR 스캐너 모달 */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              QR 코드 스캔
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              클라이언트의 QR 코드를 스캔하거나 데이터를 입력하세요
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  QR 데이터
                </label>
                <textarea
                  value={scannedData || ''}
                  onChange={(e) => setScannedData(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={3}
                  placeholder='{"clientId":1,"email":"test@example.com","requirePassword":true}'
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호 (0504)
                </label>
                <input
                  type="password"
                  value={qrPassword}
                  onChange={(e) => setQrPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0504"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowQRScanner(false);
                  setQrPassword('');
                  setScannedData(null);
                }}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleQRScan}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="text-center text-gray-500 text-sm py-6">
        Copyright © 2026 EMFRONTIER Operating Company, LLC. All Rights Reserved
      </footer>
    </div>
  );
}
