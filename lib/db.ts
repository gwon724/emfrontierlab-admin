import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.join(process.cwd(), 'emfrontier.db');
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
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      annual_revenue INTEGER NOT NULL,
      debt INTEGER NOT NULL,
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
