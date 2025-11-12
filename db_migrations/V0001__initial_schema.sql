CREATE TABLE IF NOT EXISTS experts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  access_code VARCHAR(100) NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL DEFAULT 'expert',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  participant_name VARCHAR(255) NOT NULL,
  team_name VARCHAR(255),
  category VARCHAR(100),
  submission_type VARCHAR(20) NOT NULL CHECK (submission_type IN ('video', 'essay')),
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  video_url TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ratings (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submissions(id),
  expert_id INTEGER NOT NULL REFERENCES experts(id),
  informativeness INTEGER CHECK (informativeness >= 0 AND informativeness <= 7),
  uniqueness INTEGER CHECK (uniqueness >= 0 AND uniqueness <= 7),
  theme_compliance INTEGER CHECK (theme_compliance >= 0 AND theme_compliance <= 5),
  regulation_compliance INTEGER CHECK (regulation_compliance >= 0 AND regulation_compliance <= 5),
  total_score INTEGER GENERATED ALWAYS AS (informativeness + uniqueness + theme_compliance + regulation_compliance) STORED,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(submission_id, expert_id)
);

INSERT INTO experts (name, access_code, role) VALUES
  ('Администратор', 'admin2024', 'admin')
ON CONFLICT (access_code) DO NOTHING;