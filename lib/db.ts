import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

// 공통 DB 경로 사용 (절대 경로)
const dbPath = '/home/user/shared-emfrontier.db';
let db: Database.Database | null = null;

export function getDatabase() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

// 데이터베이스 초기화
export function initDatabase() {
  const database = getDatabase();

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

  // 기존 테이블에 phone 컬럼 추가 (마이그레이션)
  try {
    database.exec(`ALTER TABLE clients ADD COLUMN phone TEXT`);
  } catch (e) {
    // 컬럼이 이미 존재하면 무시
  }

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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )
  `);

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

  // 기본 어드민 계정 생성
  const adminPassword = bcrypt.hashSync('admin123', 10);
  
  const existingAdmin = database.prepare('SELECT * FROM admins WHERE email = ?').get('admin@emfrontier.com');
  if (!existingAdmin) {
    database.prepare('INSERT INTO admins (email, password, name) VALUES (?, ?, ?)').run(
      'admin@emfrontier.com',
      adminPassword,
      '관리자'
    );
  }

  console.log('✅ Database initialized successfully');
}

export default getDatabase;
