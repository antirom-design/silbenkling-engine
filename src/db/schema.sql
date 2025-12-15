-- Entries table
CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('doc', 'qa', 'fact', 'task', 'link', 'event')),
  content TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  context TEXT DEFAULT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  read_permissions TEXT NOT NULL DEFAULT '[]',
  write_permissions TEXT NOT NULL DEFAULT '[]',
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_entries_topic ON entries(topic);
CREATE INDEX IF NOT EXISTS idx_entries_type ON entries(type);
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at);

-- Events table (append-only)
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN (
    'entry_added',
    'entry_updated',
    'question_asked',
    'question_answered',
    'question_unanswered',
    'qa_confirmed',
    'access_denied'
  )),
  timestamp TEXT NOT NULL,
  actor TEXT NOT NULL,
  topic TEXT NOT NULL,
  entry_id TEXT,
  payload TEXT DEFAULT NULL,
  FOREIGN KEY(entry_id) REFERENCES entries(id)
);

CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_topic ON events(topic);
CREATE INDEX IF NOT EXISTS idx_events_actor ON events(actor);
