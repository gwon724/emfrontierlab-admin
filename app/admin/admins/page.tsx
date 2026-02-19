'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AdminUser {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  created_at: string;
}

export default function AdminsPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentAdminId, setCurrentAdminId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    // 현재 로그인 관리자 정보
    try {
      const raw = localStorage.getItem('adminData');
      if (raw) {
        const data = JSON.parse(raw);
        setCurrentAdminId(data.id ?? null);
      }
    } catch {}

    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) { router.push('/admin/login'); return; }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/admins', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setAdmins(data.admins || []);
      } else {
        setError(data.error || '목록을 불러오지 못했습니다.');
      }
    } catch {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (admin: AdminUser) => {
    if (confirmDeleteId !== admin.id) {
      setConfirmDeleteId(admin.id);
      return;
    }

    const token = localStorage.getItem('adminToken');
    setDeletingId(admin.id);
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/admin/admins?id=${admin.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setAdmins(prev => prev.filter(a => a.id !== admin.id));
      } else {
        alert(data.error || '삭제 실패');
      }
    } catch {
      alert('서버 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (str: string) => {
    if (!str) return '-';
    try {
      return new Date(str).toLocaleDateString('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return str; }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <div className="bg-gray-900 text-white py-4 px-6 shadow-lg">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="px-3 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              ← 대시보드
            </Link>
            <div>
              <h1 className="text-xl font-bold">관리자 명단</h1>
              <p className="text-xs text-gray-400">등록된 관리자 계정 관리</p>
            </div>
          </div>
          <Link
            href="/admin/register"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            새 관리자 등록
          </Link>
        </div>
      </div>

      {/* 본문 */}
      <div className="max-w-5xl mx-auto p-6">
        {/* 통계 배너 */}
        <div className="bg-white rounded-xl shadow p-5 mb-6 flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">등록된 관리자</p>
            <p className="text-3xl font-bold text-gray-900">{loading ? '...' : admins.length}<span className="text-base font-normal text-gray-500 ml-1">명</span></p>
          </div>
          <div className="ml-auto text-xs text-gray-400 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 max-w-xs">
            <p className="font-semibold text-yellow-800 mb-1">⚠️ 주의</p>
            <p className="text-yellow-700">자기 자신은 삭제할 수 없습니다. 삭제된 계정은 복구가 불가능합니다.</p>
          </div>
        </div>

        {/* 오류 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-300 text-red-700 rounded-lg text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* 테이블 */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-bold text-gray-800">관리자 목록</h2>
            <button
              onClick={fetchAdmins}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              새로고침
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-300 border-t-indigo-600 rounded-full mx-auto mb-3"></div>
              불러오는 중...
            </div>
          ) : admins.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              등록된 관리자가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="px-6 py-3 text-left font-semibold">ID</th>
                    <th className="px-6 py-3 text-left font-semibold">이름</th>
                    <th className="px-6 py-3 text-left font-semibold">이메일</th>
                    <th className="px-6 py-3 text-left font-semibold">연락처</th>
                    <th className="px-6 py-3 text-left font-semibold">등록일</th>
                    <th className="px-6 py-3 text-center font-semibold">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {admins.map(admin => {
                    const isMe = admin.id === currentAdminId;
                    const isConfirming = confirmDeleteId === admin.id;
                    const isDeleting = deletingId === admin.id;
                    return (
                      <tr
                        key={admin.id}
                        className={`hover:bg-gray-50 transition-colors ${isMe ? 'bg-indigo-50' : ''}`}
                      >
                        <td className="px-6 py-4 text-gray-400 font-mono text-xs">#{admin.id}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${isMe ? 'bg-indigo-500' : 'bg-gray-500'}`}>
                              {admin.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{admin.name}</p>
                              {isMe && (
                                <span className="text-[10px] bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 font-semibold">나</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{admin.email}</td>
                        <td className="px-6 py-4 text-gray-600">{admin.phone || <span className="text-gray-300">-</span>}</td>
                        <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(admin.created_at)}</td>
                        <td className="px-6 py-4 text-center">
                          {isMe ? (
                            <span className="text-xs text-gray-400 italic">삭제 불가</span>
                          ) : isDeleting ? (
                            <span className="text-xs text-gray-400">삭제 중...</span>
                          ) : isConfirming ? (
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-xs text-red-600 font-medium">정말 삭제?</span>
                              <button
                                onClick={() => handleDelete(admin)}
                                className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 font-semibold"
                              >
                                삭제
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300"
                              >
                                취소
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleDelete(admin)}
                              className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 text-xs rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors font-medium"
                            >
                              🗑️ 삭제
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 안내 */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <p className="font-semibold mb-1">💡 관리자 계정 안내</p>
          <ul className="space-y-1 text-xs text-blue-700 list-disc list-inside">
            <li>새 관리자 등록 시 인증번호 <strong>018181</strong>이 필요합니다.</li>
            <li>삭제 버튼을 한 번 클릭하면 확인 버튼이 나타납니다. 두 번 클릭해야 최종 삭제됩니다.</li>
            <li>현재 로그인된 계정(나)은 삭제할 수 없습니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
