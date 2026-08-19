-- One row/user session
CREATE TABLE IF NOT EXISTS guest_sessions (
  -- Primary key of session, incremented unique integer
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  -- Unique must-have token, identifies current session
  guest_token TEXT UNIQUE NOT NULL,
  -- Timestamp of session creation
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
  -- Default to created_at timestamp on creation, updated on user actions
  last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
  -- Default active session to be used immediately
  status TEXT DEFAULT 'active'
);

-- One row/logged usage entry
CREATE TABLE IF NOT EXISTS usage_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guest_session_id INTEGER NOT NULL,
  -- Social media platform
  platform_name TEXT NOT NULL,
  -- Minutes spent on platform, 0-1440 min (0-24hrs)
  minutes_spent INTEGER NOT NULL CHECK(minutes_spent BETWEEN 0 AND 1440),
  -- YYYY-MM-DD of log
  logged_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- ID must match existing row in guest sessions table
  FOREIGN KEY(guest_session_id) REFERENCES guest_sessions(id)
);

-- One goal/users session
CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guest_session_id INTEGER NOT NULL UNIQUE,
  -- Daily user-set goal 0-1440 min (0-24hrs)
  daily_limit_minutes INTEGER NOT NULL CHECK(daily_limit_minutes BETWEEN 0 AND 1440),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- ID must match existing row in guest sessions table
  FOREIGN KEY(guest_session_id) REFERENCES guest_sessions(id)
);