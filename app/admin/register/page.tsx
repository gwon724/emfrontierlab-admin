'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminRegister() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [authCodeInput, setAuthCodeInput] = useState('');
  const [authCodeVerified, setAuthCodeVerified] = useState(false);
  const [authCodeError, setAuthCodeError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 인증번호 확인
  const handleVerifyAuthCode = () => {
    setAuthCodeError('');
    if (!authCodeInput.trim()) {
      setAuthCodeError('인증번호를 입력해주세요.');
      return;
    }
    if (authCodeInput.trim() === '018181') {
      setAuthCodeVerified(true);
      setAuthCodeError('');
    } else {
      setAuthCodeVerified(false);
      setAuthCodeError('인증번호가 올바르지 않습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // 인증코드 확인
    if (!authCodeVerified) {
      setError('관리자 인증번호를 먼저 확인해주세요.');
      return;
    }

    // 이름 검증
    if (!formData.name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    // 연락처 검증
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    if (!formData.phone || !phoneRegex.test(formData.phone.replace(/-/g, ''))) {
      setError('올바른 전화번호 형식으로 입력해주세요. (예: 010-1234-5678)');
      return;
    }

    // 이메일 검증
    if (!formData.email || !formData.email.includes('@')) {
      setError('올바른 이메일을 입력해주세요.');
      return;
    }

    // 비밀번호 검증 (길이만)
    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone,
          email: formData.email,
          password: formData.password,
          authCode: authCodeInput.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('관리자 계정이 생성되었습니다. 로그인 페이지로 이동합니다.');
        setTimeout(() => router.push('/admin/login'), 1800);
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 py-12 px-4">
      <div className="w-full max-w-md">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">EMFRONTIER LAB</h1>
          <p className="text-lg text-gray-300 font-semibold">관리자 회원가입</p>
          <p className="text-sm text-gray-400 mt-1">관리자 인증번호가 있어야 가입 가능합니다</p>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-8">
          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-300 text-red-700 rounded-lg text-sm">
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="mb-5 p-4 bg-green-50 border border-green-300 text-green-700 rounded-lg text-sm font-semibold">
              ✅ {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 이름 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-transparent outline-none transition"
                placeholder="홍길동"
                required
              />
            </div>

            {/* 연락처 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                연락처 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-transparent outline-none transition"
                placeholder="010-1234-5678"
                required
              />
              <p className="text-xs text-gray-500 mt-1">서류 작성 시 담당자 연락처로 자동 기입됩니다</p>
            </div>

            {/* 이메일 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-transparent outline-none transition"
                placeholder="admin@example.com"
                required
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                비밀번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-transparent outline-none transition"
                placeholder="비밀번호 (최소 6자)"
                required
              />
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                비밀번호 확인 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-transparent outline-none transition"
                placeholder="비밀번호 재입력"
                required
              />
            </div>

            {/* ── 관리자 인증번호 구분선 ── */}
            <div className="border-t border-dashed border-gray-200 pt-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                관리자 인증번호 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={authCodeInput}
                  onChange={e => { setAuthCodeInput(e.target.value); setAuthCodeVerified(false); setAuthCodeError(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleVerifyAuthCode(); } }}
                  className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                    authCodeVerified
                      ? 'border-green-400 focus:ring-green-500 bg-green-50'
                      : authCodeError
                        ? 'border-red-400 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-gray-700'
                  }`}
                  placeholder="인증번호 6자리 입력"
                  maxLength={10}
                />
                <button
                  type="button"
                  onClick={handleVerifyAuthCode}
                  className={`px-4 py-3 rounded-lg font-semibold text-sm transition-colors whitespace-nowrap ${
                    authCodeVerified
                      ? 'bg-green-500 text-white cursor-default'
                      : 'bg-gray-800 text-white hover:bg-gray-900'
                  }`}
                >
                  {authCodeVerified ? '✅ 확인됨' : '확인'}
                </button>
              </div>
              {authCodeError && (
                <p className="text-xs text-red-600 mt-1.5 font-medium">⚠️ {authCodeError}</p>
              )}
              {authCodeVerified && (
                <p className="text-xs text-green-600 mt-1.5 font-medium">✅ 인증번호가 확인되었습니다.</p>
              )}
              <p className="text-xs text-gray-400 mt-1.5">관리자에게 발급받은 인증번호를 입력하세요.</p>
            </div>

            <div className="pt-2 flex gap-3">
              <Link
                href="/admin/login"
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-center text-sm"
              >
                ← 로그인으로
              </Link>
              <button
                type="submit"
                disabled={loading || !authCodeVerified}
                className="flex-1 bg-gray-800 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-900 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
              >
                {loading ? '가입 중...' : '관리자 등록'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <footer className="mt-8 text-center text-gray-400 text-sm px-4">
        Copyright © 2026 EMFRONTIER Operating Company, LLC. All Rights Reserved
      </footer>
    </div>
  );
}
