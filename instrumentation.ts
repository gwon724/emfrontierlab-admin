/**
 * Next.js Instrumentation
 * 서버 시작 시 자동으로 실행되어 DB를 초기화합니다.
 * 
 * 참고: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getDatabase } = await import('./lib/db');
    try {
      getDatabase(); // 테이블 자동 생성 + 어드민 계정 확인
      console.log('🚀 Server started: DB initialized');
    } catch (error) {
      console.error('❌ DB initialization failed on server start:', error);
    }
  }
}
