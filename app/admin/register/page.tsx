'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminRegister() {
  const [form, setForm] = useState({ name: '', email: '', password: '', passwordConfirm: '', inviteCode: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (form.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          inviteCode: form.inviteCode,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('관리자 계정이 생성되었습니다. 로그인 페이지로 이동합니다...');
        setTimeout(() => router.push('/admin/login'), 2000);
      } else {
        setError(data.error || '회원가입에 실패했습니다.');
      }
    } catch (err) {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="w-full max-w-md px-4">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">EMFRONTIER LAB</h1>
          <p className="text-lg text-gray-300 font-semibold">관리자 회원가입</p>
          <p className="text-sm text-gray-400 mt-1">인증코드가 있는 관리자만 가입 가능합니다</p>
        </div>

        <div className="bg-white rounded-lg shadow-2xl p-8">
          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          {/* 성공 메시지 */}
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent outline-none"
                placeholder="이름을 입력하세요"
                required
              />
            </div>

            {/* 이메일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent outline-none"
                placeholder="admin@emfrontier.com"
                required
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent outline-none pr-12"
                  placeholder="6자 이상 입력하세요"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                >
                  {showPassword ? '숨기기' : '보기'}
                </button>
              </div>
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호 확인</label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="passwordConfirm"
                value={form.passwordConfirm}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent outline-none"
                placeholder="비밀번호를 다시 입력하세요"
                required
              />
            </div>

            {/* 인증코드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                관리자 인증코드
                <span className="ml-1 text-xs text-red-500">*필수</span>
              </label>
              <input
                type="password"
                name="inviteCode"
                value={form.inviteCode}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent outline-none"
                placeholder="인증코드를 입력하세요"
                required
              />
              <p className="mt-1 text-xs text-gray-400">관리자 인증코드는 운영팀에 문의하세요.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed mt-2"
            >
              {loading ? '가입 중...' : '관리자 계정 생성'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/admin/login" className="text-sm text-blue-600 hover:text-blue-700 underline">
              ← 로그인으로 돌아가기
            </Link>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-4 text-center text-gray-400 text-sm px-4">
        Copyright © 2026 EMFRONTIER Operating Company, LLC. All Rights Reserved
      </footer>
    </div>
  );
}
