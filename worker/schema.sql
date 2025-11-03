-- Create table for CV generation requests
CREATE TABLE IF NOT EXISTS cv_requests (
  id TEXT PRIMARY KEY,
  request_data TEXT NOT NULL,
  html_url TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  markdown_url TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_created_at ON cv_requests(created_at DESC);

-- Create table for vectorized CV content (metadata)
CREATE TABLE IF NOT EXISTS cv_vectors (
  id TEXT PRIMARY KEY,
  cv_request_id TEXT NOT NULL,
  content_chunk TEXT NOT NULL,
  vector_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (cv_request_id) REFERENCES cv_requests(id)
);

CREATE INDEX IF NOT EXISTS idx_cv_request_id ON cv_vectors(cv_request_id);
