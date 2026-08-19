import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

// Create new database/open existing doomscroll.db
const db = new Database('doomscroll.db');

// Directory of SQL file we read
const initSql = readFileSync(join(__dirname, 'init.sql'), 'utf8');

db.exec(initSql);

export default db;