DROP TABLE IF EXISTS website_records;
DROP TABLE IF EXISTS access_records;
DROP INDEX IF EXISTS idx_domain;
DROP INDEX IF EXISTS idx_website_id;

CREATE TABLE website_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT NOT NULL,
  create_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE access_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  website_id INTEGER NOT NULL,
  url_path TEXT NOT NULL,
  referrer_url TEXT,
  visitor_ip TEXT NOT NULL,
  create_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (website_id) REFERENCES website_records(id)
);

CREATE INDEX idx_domain ON website_records (domain);
CREATE INDEX idx_website_id ON access_records (website_id);