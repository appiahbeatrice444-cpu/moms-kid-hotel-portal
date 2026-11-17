const test = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { migrateSystemPreferences, migrateUserRoles } = require("./database");

test("legacy account roles migrate without breaking sessions or audit references", () => {
  const database = new DatabaseSync(":memory:");
  database.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'user', 'master-view', 'manager')),
      totp_secret TEXT,
      created_at TEXT NOT NULL DEFAULT '2026-01-01T00:00:00.000Z'
    );
    CREATE TABLE sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER REFERENCES users(id));
    CREATE TABLE audit_events (id INTEGER PRIMARY KEY, actor_user_id INTEGER REFERENCES users(id));
    INSERT INTO users (id, email, password_salt, password_hash, role) VALUES
      (1, 'admin@example.test', 'salt', 'hash', 'admin'),
      (2, 'old-user@example.test', 'salt', 'hash', 'user'),
      (3, 'old-view@example.test', 'salt', 'hash', 'master-view'),
      (4, 'manager@example.test', 'salt', 'hash', 'manager');
    INSERT INTO sessions (token_hash, user_id) VALUES ('session', 1);
    INSERT INTO audit_events (id, actor_user_id) VALUES (1, 1);
  `);

  try {
    migrateUserRoles(database);
    const accounts = database.prepare("SELECT id, role FROM users ORDER BY id").all();
    assert.deepEqual(accounts.map(({ role }) => role), ["admin", "customer", "customer", "manager"]);
    assert.deepEqual(database.prepare("PRAGMA foreign_key_check").all(), []);
    assert.equal(database.prepare("SELECT user_id FROM sessions").get().user_id, 1);
    assert.equal(database.prepare("SELECT actor_user_id FROM audit_events").get().actor_user_id, 1);
    database.prepare("INSERT INTO users (email, password_salt, password_hash, role) VALUES ('staff@example.test', 'salt', 'hash', 'staff')").run();
    database.prepare("INSERT INTO users (email, password_salt, password_hash, role) VALUES ('customer@example.test', 'salt', 'hash', 'customer')").run();
  } finally {
    database.close();
  }
});


test("system preferences migrate to support all 10 international languages including Chinese", () => {
  const database = new DatabaseSync(":memory:");
  database.exec(`
    CREATE TABLE system_preferences (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      theme TEXT NOT NULL DEFAULT 'emerald',
      mode TEXT NOT NULL DEFAULT 'auto' CHECK (mode IN ('light', 'dark', 'auto')),
      language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'fr', 'es', 'de')),
      time_format TEXT NOT NULL DEFAULT '12h' CHECK (time_format IN ('12h', '24h')),
      updated_at TEXT NOT NULL DEFAULT '2026-01-01T00:00:00.000Z'
    );
    INSERT INTO system_preferences (id, theme, mode, language, time_format)
    VALUES (1, 'emerald', 'auto', 'en', '12h');
  `);

  try {
    migrateSystemPreferences(database);
    for (const lang of ["en", "fr", "es", "de", "zh", "ja", "ar", "pt", "it", "ru"]) {
      database.prepare("UPDATE system_preferences SET language = ? WHERE id = 1").run(lang);
      assert.equal(database.prepare("SELECT language FROM system_preferences WHERE id = 1").get().language, lang);
    }
  } finally {
    database.close();
  }
});