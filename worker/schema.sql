-- D1 Schema for URL Shortener

CREATE TABLE IF NOT EXISTS links (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    target_url TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER,
    is_active INTEGER DEFAULT 1,
    password_hash TEXT,
    created_by TEXT, -- Optional API key or user ID
    clicks INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_links_slug ON links(slug);
CREATE INDEX IF NOT EXISTS idx_links_target ON links(target_url);

CREATE TABLE IF NOT EXISTS analytics (
    id TEXT PRIMARY KEY,
    link_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    country TEXT,
    device_type TEXT,
    referrer TEXT,
    ua_hash TEXT,
    FOREIGN KEY(link_id) REFERENCES links(id)
);

CREATE INDEX IF NOT EXISTS idx_analytics_link_id ON analytics(link_id);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics(timestamp);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    api_key_hash TEXT UNIQUE NOT NULL,
    created_at INTEGER NOT NULL,
    role TEXT DEFAULT 'user'
);

CREATE TABLE IF NOT EXISTS abuse_reports (
    id TEXT PRIMARY KEY,
    target_url TEXT NOT NULL,
    reported_at INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS idx_abuse_target ON abuse_reports(target_url);

CREATE TABLE IF NOT EXISTS rate_limits (
    ip_hash TEXT PRIMARY KEY,
    window_start INTEGER NOT NULL,
    request_count INTEGER DEFAULT 0
);
