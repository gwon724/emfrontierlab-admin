import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

// DB 경로: 환경변수로 오버라이드 가능, 기본값은 /home/user/shared-emfrontier.db
const dbPath = process.env.DB_PATH || '/home/user/shared-emfrontier.db';

let db: Database.Database | null = null;
let isInitialized = false; // 중복 초기화 방지 플래그

export function getDatabase() {
  if (!db) {
    // DB 디렉토리가 없으면 생성
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // DB 연결 시 테이블이 없으면 자동 생성
    if (!isInitialized) {
      _ensureTables(db);
      isInitialized = true;
    }
  }
  return db;
}

// 내부 테이블 생성 함수 (직접 호출 금지 - getDatabase() 통해서만 실행됨)
function _ensureTables(database: Database.Database) {
  // 클라이언트 사용자 테이블
  database.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      annual_revenue INTEGER NOT NULL,
      debt INTEGER NOT NULL,
      debt_policy_fund INTEGER DEFAULT 0,
      debt_credit_loan INTEGER DEFAULT 0,
      debt_secondary_loan INTEGER DEFAULT 0,
      debt_card_loan INTEGER DEFAULT 0,
      kcb_score INTEGER,
      nice_score INTEGER NOT NULL,
      has_technology INTEGER NOT NULL DEFAULT 0,
      soho_grade TEXT,
      agree_credit_check INTEGER NOT NULL DEFAULT 0,
      agree_privacy INTEGER NOT NULL DEFAULT 0,
      agree_confidentiality INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 마이그레이션: phone 컬럼
  try { database.exec(`ALTER TABLE clients ADD COLUMN phone TEXT`); } catch (e) {}
  // 마이그레이션: business_years 컬럼
  try { database.exec(`ALTER TABLE clients ADD COLUMN business_years INTEGER DEFAULT 0`); } catch (e) {}

  // 어드민 사용자 테이블
  database.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 진행상황 테이블
  database.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT '접수대기',
      policy_funds TEXT,
      notes TEXT,
      fund_amounts TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )
  `);

  // 마이그레이션: fund_amounts 컬럼
  try { database.exec(`ALTER TABLE applications ADD COLUMN fund_amounts TEXT DEFAULT '{}'`); } catch (e) {}

  // AI 진단 결과 테이블
  database.exec(`
    CREATE TABLE IF NOT EXISTS ai_diagnosis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      soho_grade TEXT NOT NULL,
      recommended_funds TEXT NOT NULL,
      diagnosis_details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )
  `);

  // 재무제표 데이터 테이블
  database.exec(`
    CREATE TABLE IF NOT EXISTS financial_statements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      year INTEGER NOT NULL,
      revenue REAL DEFAULT 0,
      operating_profit REAL DEFAULT 0,
      net_profit REAL DEFAULT 0,
      total_assets REAL DEFAULT 0,
      total_liabilities REAL DEFAULT 0,
      equity REAL DEFAULT 0,
      file_path TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )
  `);

  // 정책자금별 개별 진행상태 테이블
  database.exec(`
    CREATE TABLE IF NOT EXISTS fund_statuses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      fund_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT '접수대기',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      UNIQUE(client_id, fund_name)
    )
  `);

  // 재무제표 AI 분석 결과 테이블
  database.exec(`
    CREATE TABLE IF NOT EXISTS financial_analysis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      analysis_type TEXT DEFAULT 'financial_statement',
      soho_grade TEXT,
      max_loan_limit INTEGER DEFAULT 0,
      recommended_funds TEXT,
      financial_health_score INTEGER DEFAULT 0,
      growth_rate REAL DEFAULT 0,
      profitability_ratio REAL DEFAULT 0,
      stability_ratio REAL DEFAULT 0,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )
  `);

  // 기본 어드민 계정 생성 (없을 때만)
  const adminPassword = bcrypt.hashSync('skc07245', 10);
  const existingAdmin = database.prepare('SELECT id FROM admins WHERE email = ?').get('son713119@naver.com');
  if (!existingAdmin) {
    database.prepare('DELETE FROM admins WHERE email = ?').run('admin@emfrontier.com');
    database.prepare('INSERT OR IGNORE INTO admins (email, password, name) VALUES (?, ?, ?)').run(
      'son713119@naver.com',
      adminPassword,
      '관리자'
    );
  }

  console.log(`✅ Database ready: ${dbPath}`);
}

/**
 * @deprecated 각 API route에서 initDatabase()를 직접 호출할 필요 없음.
 * getDatabase() 호출 시 자동으로 테이블이 생성됩니다.
 * 하위 호환성을 위해 남겨둠.
 */
export function initDatabase() {
  getDatabase(); // getDatabase() 내부에서 자동 처리
}

export default getDatabase;
