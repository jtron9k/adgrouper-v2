import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type { ApiKeyType } from './api-keys';

// ---------------------------------------------------------------------------
// Row types (mirror the Supabase row shapes for drop-in compatibility)
// ---------------------------------------------------------------------------

export interface RunRow {
  id: string;
  user_id: string;
  user_email: string;
  campaign_name: string;
  campaign_goal: string | null;
  stage: 'submitted' | 'results';
  created_at: string;
  updated_at: string;
}

export interface SnapshotRow {
  id: string;
  run_id: string;
  stage: string;
  data: string; // raw JSON string; callers parse with JSON.parse()
  created_at: string;
}

// ---------------------------------------------------------------------------
// Singleton connection
// ---------------------------------------------------------------------------

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  const dbDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'adgrouper.db');
  _db = new Database(dbPath);

  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  initSchema(_db);
  seedApprovedEmails(_db);
  return _db;
}

// ---------------------------------------------------------------------------
// Schema initialization (idempotent — safe to run on every startup)
// ---------------------------------------------------------------------------

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS approved_emails (
      email TEXT PRIMARY KEY NOT NULL,
      role  TEXT NOT NULL DEFAULT 'user'
    );

    CREATE TABLE IF NOT EXISTS runs (
      id            TEXT PRIMARY KEY NOT NULL,
      user_id       TEXT NOT NULL,
      user_email    TEXT NOT NULL,
      campaign_name TEXT NOT NULL,
      campaign_goal TEXT,
      stage         TEXT NOT NULL DEFAULT 'submitted',
      created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS snapshots (
      id         TEXT PRIMARY KEY NOT NULL,
      run_id     TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
      stage      TEXT NOT NULL,
      data       TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      key_type   TEXT PRIMARY KEY NOT NULL,
      key_value  TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS default_prompts (
      prompt_type TEXT PRIMARY KEY NOT NULL,
      prompt_text TEXT NOT NULL,
      updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE INDEX IF NOT EXISTS idx_runs_created_at  ON runs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_snapshots_run_id ON snapshots(run_id);
  `);

  // Migration: add role column to existing approved_emails tables
  const cols = db.prepare("PRAGMA table_info(approved_emails)").all() as { name: string }[];
  if (!cols.some(c => c.name === 'role')) {
    db.exec("ALTER TABLE approved_emails ADD COLUMN role TEXT NOT NULL DEFAULT 'user'");
  }
}

// ---------------------------------------------------------------------------
// Seed approved_emails from APPROVED_EMAILS env var (idempotent)
// ---------------------------------------------------------------------------

function seedApprovedEmails(db: Database.Database): void {
  const raw = process.env.APPROVED_EMAILS;
  if (!raw) return;

  const insert = db.prepare(
    'INSERT OR IGNORE INTO approved_emails (email, role) VALUES (?, ?)'
  );
  const insertMany = db.transaction((emails: string[]) => {
    emails.forEach((email, i) => insert.run(email, i === 0 ? 'admin' : 'user'));
  });

  const emails = raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  insertMany(emails);
}

// ---------------------------------------------------------------------------
// approved_emails helpers
// ---------------------------------------------------------------------------

export function isEmailApproved(email: string): boolean {
  const db = getDb();
  const row = db.prepare('SELECT email FROM approved_emails WHERE email = ?').get(email);
  return row !== undefined;
}

export function getApprovedEmailCount(): number {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM approved_emails').get() as { count: number };
  return row.count;
}

export function addApprovedEmail(email: string, role: 'admin' | 'user' = 'user'): void {
  const db = getDb();
  db.prepare('INSERT OR IGNORE INTO approved_emails (email, role) VALUES (?, ?)').run(email.trim().toLowerCase(), role);
}

export function getUserRole(email: string): 'admin' | 'user' {
  const db = getDb();
  const row = db.prepare('SELECT role FROM approved_emails WHERE email = ?').get(email.trim().toLowerCase()) as
    | { role: string }
    | undefined;
  return (row?.role as 'admin' | 'user') ?? 'user';
}

export function setUserRole(email: string, role: 'admin' | 'user'): void {
  const db = getDb();
  db.prepare('UPDATE approved_emails SET role = ? WHERE email = ?').run(role, email.trim().toLowerCase());
}

export function getAllApprovedEmails(): Array<{ email: string; role: string }> {
  const db = getDb();
  return db.prepare('SELECT email, role FROM approved_emails ORDER BY email').all() as Array<{
    email: string;
    role: string;
  }>;
}

export function removeApprovedEmail(email: string): void {
  const db = getDb();
  db.prepare('DELETE FROM approved_emails WHERE email = ?').run(email.trim().toLowerCase());
}

// ---------------------------------------------------------------------------
// api_keys helpers
// ---------------------------------------------------------------------------

export function getApiKeyFromDb(keyType: ApiKeyType): string | null {
  const db = getDb();
  const row = db.prepare('SELECT key_value FROM api_keys WHERE key_type = ?').get(keyType) as
    | { key_value: string }
    | undefined;
  return row?.key_value ?? null;
}

export function upsertApiKey(keyType: ApiKeyType, value: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT OR REPLACE INTO api_keys (key_type, key_value, updated_at) VALUES (?, ?, ?)'
  ).run(keyType, value, now);
}

// ---------------------------------------------------------------------------
// runs helpers
// ---------------------------------------------------------------------------

export interface RunWithSnapshots extends RunRow {
  snapshots: Pick<SnapshotRow, 'id' | 'stage' | 'created_at'>[];
}

export interface RunWithFullSnapshots extends RunRow {
  snapshots: SnapshotRow[];
}

export function getAllRuns(): RunWithSnapshots[] {
  const db = getDb();
  const runs = db.prepare('SELECT * FROM runs ORDER BY created_at DESC').all() as RunRow[];

  return runs.map((run) => {
    const snapshots = db
      .prepare(
        'SELECT id, stage, created_at FROM snapshots WHERE run_id = ? ORDER BY created_at ASC'
      )
      .all(run.id) as Pick<SnapshotRow, 'id' | 'stage' | 'created_at'>[];
    return { ...run, snapshots };
  });
}

export function getRunsByUserId(userId: string): RunWithSnapshots[] {
  const db = getDb();
  const runs = db
    .prepare('SELECT * FROM runs WHERE user_id = ? ORDER BY created_at DESC')
    .all(userId) as RunRow[];

  return runs.map((run) => {
    const snapshots = db
      .prepare(
        'SELECT id, stage, created_at FROM snapshots WHERE run_id = ? ORDER BY created_at ASC'
      )
      .all(run.id) as Pick<SnapshotRow, 'id' | 'stage' | 'created_at'>[];
    return { ...run, snapshots };
  });
}

export function getRunById(id: string): RunWithFullSnapshots | null {
  const db = getDb();
  const run = db.prepare('SELECT * FROM runs WHERE id = ?').get(id) as RunRow | undefined;
  if (!run) return null;

  const snapshots = db
    .prepare('SELECT * FROM snapshots WHERE run_id = ? ORDER BY created_at ASC')
    .all(id) as SnapshotRow[];

  return { ...run, snapshots };
}

export function createRun(params: {
  userId: string;
  userEmail: string;
  campaignName: string;
  campaignGoal: string;
  stage: 'submitted' | 'results';
  data: unknown;
}): RunRow {
  const db = getDb();
  const runId = crypto.randomUUID();
  const snapshotId = crypto.randomUUID();
  const now = new Date().toISOString();

  const insertBoth = db.transaction(() => {
    db.prepare(
      `INSERT INTO runs (id, user_id, user_email, campaign_name, campaign_goal, stage, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      runId,
      params.userId,
      params.userEmail,
      params.campaignName,
      params.campaignGoal,
      params.stage,
      now,
      now
    );

    db.prepare(
      `INSERT INTO snapshots (id, run_id, stage, data, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(snapshotId, runId, params.stage, JSON.stringify(params.data), now);
  });

  insertBoth();

  return db.prepare('SELECT * FROM runs WHERE id = ?').get(runId) as RunRow;
}

export function updateRunStage(id: string, stage: 'submitted' | 'results'): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare('UPDATE runs SET stage = ?, updated_at = ? WHERE id = ?').run(stage, now, id);
}

export function addSnapshot(params: { runId: string; stage: string; data: unknown }): void {
  const db = getDb();
  const snapshotId = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO snapshots (id, run_id, stage, data, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(snapshotId, params.runId, params.stage, JSON.stringify(params.data), now);
}

export function deleteRun(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM runs WHERE id = ?').run(id);
}

// ---------------------------------------------------------------------------
// default_prompts helpers
// ---------------------------------------------------------------------------

export function getDefaultPrompt(promptType: string): string | null {
  const db = getDb();
  const row = db.prepare('SELECT prompt_text FROM default_prompts WHERE prompt_type = ?').get(promptType) as
    | { prompt_text: string }
    | undefined;
  return row?.prompt_text ?? null;
}

export function setDefaultPrompt(promptType: string, text: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT OR REPLACE INTO default_prompts (prompt_type, prompt_text, updated_at) VALUES (?, ?, ?)'
  ).run(promptType, text, now);
}

export function getAllStoredDefaultPrompts(): Array<{ prompt_type: string; prompt_text: string }> {
  const db = getDb();
  return db.prepare('SELECT prompt_type, prompt_text FROM default_prompts').all() as Array<{
    prompt_type: string;
    prompt_text: string;
  }>;
}
