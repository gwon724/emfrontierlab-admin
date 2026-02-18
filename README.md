# EMFRONTIER LAB - 관리자 사이트

정책자금 관리를 위한 관리자 전용 웹사이트입니다.

## 🚀 실행 방법

```bash
npm install
npm run dev
```

서버가 http://localhost:3001 에서 실행됩니다.

## 📱 주요 기능

- **관리자 로그인**
  - 보안 인증 기반 접근 제어
  
- **전체 신청 현황 대시보드**
  - 실시간 통계 (5초 자동 새로고침)
  - 상태별 신청 건수 표시
  
- **회원 관리**
  - 회원 정보 상세 보기
  - 선택한 정책자금 확인
  - 이름/이메일 검색 기능
  
- **Notion 스타일 상태 관리**
  - 상태 클릭으로 즉시 다음 단계로 이동
  - 7단계: 접수대기 → 집행완료
  - 시각적 피드백 및 색상 코드
  
- **📷 QR 코드 스캔 (카메라)**
  - **실시간 카메라 스캔**: html5-qrcode 라이브러리 사용
  - **자동 카메라 시작**: 모달 열면 자동으로 카메라 활성화
  - **수동 입력 옵션**: 카메라 사용 불가 시 JSON 직접 입력
  - **비밀번호 불필요**: 간편한 스캔 프로세스

## 🔑 관리자 계정

- 이메일: admin@emfrontier.com
- 비밀번호: admin123

### 관리자 계정 관리

**관리자 목록 보기**
```bash
npm run admin:list
```

**비밀번호 재설정**
```bash
npm run admin:reset <이메일> <새비밀번호>

# 예시
npm run admin:reset admin@emfrontier.com newpassword123
```

**새 관리자 생성**
```bash
npm run admin:create <이메일> <비밀번호> <이름>

# 예시
npm run admin:create admin2@emfrontier.com password123 "관리자2"
```

**데이터베이스 초기화**
```bash
npm run db:init
```

## 🏗️ 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (공유 DB 사용)
- **Authentication**: JWT
- **QR Scanner**: html5-qrcode

## 📂 프로젝트 구조

```
admin-site/
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   ├── login/         # 관리자 로그인
│   │   │   ├── dashboard/     # 대시보드 데이터
│   │   │   └── update-status/ # 상태 업데이트
│   │   └── qr/
│   │       └── scan/          # QR 코드 스캔
│   └── admin/
│       ├── login/             # 로그인 페이지
│       └── dashboard/         # 대시보드 페이지
├── lib/
│   ├── db.ts                  # 데이터베이스 연결
│   ├── auth.ts                # JWT 인증
│   └── ai-diagnosis.ts        # AI 진단 로직
└── shared-emfrontier.db       # 공유 데이터베이스
```

## 🔗 관련 리포지토리

- **클라이언트 사이트**: [emfrontierlab](https://github.com/gwon724/emfrontierlab)
- **공유 데이터베이스**: `/home/user/shared-emfrontier.db`

## ✨ 최근 업데이트

### QR 스캐너 카메라 기능 (2026-02-16)
- 실시간 카메라 스캔 기능 추가
- 모달 열면 자동으로 카메라 시작
- 비밀번호 제거로 간편한 스캔
- 수동 입력 옵션 제공

---

Copyright © 2026 EMFRONTIER Operating Company, LLC. All Rights Reserved
