const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync, backup } = require("node:sqlite");

function openDatabase(filename) {
  const databasePath = path.resolve(filename);
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new DatabaseSync(databasePath);
  database.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL; PRAGMA busy_timeout = 5000;");
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff', 'customer')),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
    CREATE TABLE IF NOT EXISTS email_challenges (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code_hash TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS email_challenges_expiry ON email_challenges(expires_at);
    CREATE TABLE IF NOT EXISTS password_reset_challenges (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code_hash TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS password_reset_challenges_expiry ON password_reset_challenges(expires_at);
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_events (
      id INTEGER PRIMARY KEY,
      actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      subject TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
    CREATE INDEX IF NOT EXISTS audit_events_created ON audit_events(created_at);

    CREATE TABLE IF NOT EXISTS deleted_users (
      id INTEGER PRIMARY KEY,
      original_user_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      user_created_at TEXT NOT NULL,
      deleted_by_admin_id INTEGER,
      deleted_by_email TEXT NOT NULL,
      deleted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      reason TEXT DEFAULT 'Deleted by administrator'
    );
    CREATE INDEX IF NOT EXISTS deleted_users_email ON deleted_users(email);
    CREATE INDEX IF NOT EXISTS deleted_users_deleted_at ON deleted_users(deleted_at);

    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY,
      room_number TEXT NOT NULL UNIQUE,
      room_type TEXT NOT NULL,
      price_per_night REAL NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 2,
      amenities TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'cleaning')),
      description TEXT,
      image_url TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
    CREATE INDEX IF NOT EXISTS rooms_status ON rooms(status);

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY,
      booking_reference TEXT NOT NULL UNIQUE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      guest_name TEXT NOT NULL,
      guest_email TEXT NOT NULL,
      guest_phone TEXT,
      room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
      check_in_date TEXT NOT NULL,
      check_out_date TEXT NOT NULL,
      num_guests INTEGER NOT NULL DEFAULT 1,
      total_price REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'checked-in', 'checked-out', 'cancelled')),
      special_requests TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
    CREATE INDEX IF NOT EXISTS bookings_user_id ON bookings(user_id);
    CREATE INDEX IF NOT EXISTS bookings_room_id ON bookings(room_id);
    CREATE INDEX IF NOT EXISTS bookings_status ON bookings(status);
    CREATE INDEX IF NOT EXISTS bookings_dates ON bookings(check_in_date, check_out_date);

    CREATE TABLE IF NOT EXISTS system_preferences (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      theme TEXT NOT NULL DEFAULT 'emerald',
      mode TEXT NOT NULL DEFAULT 'auto' CHECK (mode IN ('light', 'dark', 'auto')),
      language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'fr', 'es', 'de', 'zh', 'ja', 'ar', 'pt', 'it', 'ru')),
      time_format TEXT NOT NULL DEFAULT '12h' CHECK (time_format IN ('12h', '24h')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
    INSERT OR IGNORE INTO system_preferences (id, theme, mode, language, time_format)
    VALUES (1, 'emerald', 'auto', 'en', '12h');
  `);
  migrateUserRoles(database);
  migrateSystemPreferences(database);
  seedInitialData(database);
  database.exec("DROP TABLE IF EXISTS auth_challenges;");
  return database;
}

function seedInitialData(database) {
  const roomCount = Number(database.prepare("SELECT COUNT(*) AS count FROM rooms").get().count);
  if (roomCount === 0) {
    const insertRoom = database.prepare(`
      INSERT INTO rooms (room_number, room_type, price_per_night, capacity, amenities, status, description, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const rooms = [
      ["101", "Deluxe Queen Suite", 145.00, 2, "Queen Bed, Wi-Fi, Garden Veranda, Rain Shower, Mini-Bar", "available", "Quiet ground-floor queen suite with private botanical courtyard view.", "/room-deluxe-queen.jpg"],
      ["102", "Executive King Room", 195.00, 2, "King Bed, Ocean Horizon View, Workstation, Nespresso, Smart TV", "available", "Spacious luxury king suite with panoramic ocean horizon views.", "/room-executive-king.jpg"],
      ["201", "Family Harmony Suite", 260.00, 4, "Two Queen Beds, Kid Play Area, Living Lounge, Kitchenette, Bathtub", "occupied", "Tailored specially for parents and children with dedicated relaxation zones.", "/room-family-suite.jpg"],
      ["202", "Junior Garden Suite", 175.00, 3, "King Bed + Daybed, Sunlit Balcony, Espresso Bar, Marble Vanity", "available", "Sun-drenched retreat overlooking the hotel central gardens.", "/room-junior-suite.jpg"],
      ["301", "Presidential Penthouse", 480.00, 6, "Two Master Suites, Private Terrace, Jacuzzi, Butler Service, Full Kitchen", "available", "The pinnacle of MOM'S KID HOTEL luxury with private rooftop vistas.", "/room-penthouse.jpg"],
      ["302", "Skyline Deluxe Room", 215.00, 2, "King Bed, Skyline City View, Soundproof Glass, High-Speed Wi-Fi", "cleaning", "High-floor sanctuary with expansive city skyline view and rainfall bath.", "/room-skyline.jpg"],
      ["104", "Cozy Studio Single", 95.00, 1, "Single Plush Bed, Fast Wi-Fi, Desk, En-Suite Shower, Smart TV", "available", "Intimate, serene studio optimized for business and solo travelers.", "/room-studio.jpg"],
      ["204", "Luxury Poolside Twin", 185.00, 3, "Two Double Beds, Pool Deck View, Premium Toiletries, Lounge Chairs", "maintenance", "Generous double-room facing the terrace pool, undergoing seasonal maintenance.", "/room-twin.jpg"]
    ];
    for (const room of rooms) {
      insertRoom.run(...room);
    }
  }

  const bookingCount = Number(database.prepare("SELECT COUNT(*) AS count FROM bookings").get().count);
  if (bookingCount === 0) {
    const room201 = database.prepare("SELECT id FROM rooms WHERE room_number = '201'").get();
    const room102 = database.prepare("SELECT id FROM rooms WHERE room_number = '102'").get();
    if (room201 && room102) {
      const insertBooking = database.prepare(`
        INSERT INTO bookings (booking_reference, guest_name, guest_email, guest_phone, room_id, check_in_date, check_out_date, num_guests, total_price, status, special_requests)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertBooking.run("MKH-104921", "Eleanor Vance", "eleanor@example.test", "+1 (555) 234-8901", room201.id, "2026-10-15", "2026-10-20", 3, 1300.00, "checked-in", "Quiet room requested, traveling with toddler.");
      
      insertBooking.run("MKH-883920", "Marcus Brody", "marcus@example.test", "+1 (555) 456-7812", room102.id, "2026-10-22", "2026-10-25", 2, 585.00, "confirmed", "Late arrival around 8:00 PM.");
    }
  }

  const adminEmail = "appiahbeatrice444@gmail.com";
  const adminSalt = "636a8deb03ef0b6068b1a2dc33baefcb";
  const adminHash = "46e0deb187da7ddc4308f773f01d7e6ffe887fa2af06fc30d60efdc77c6c942ae66f011663376b275f40c7f83e99588b581f1e2da3afbf8aee2727f9701312c2";
  const existingAdmin = database.prepare("SELECT id FROM users WHERE LOWER(email) = ?").get(adminEmail);
  if (!existingAdmin) {
    database.prepare("INSERT INTO users (email, password_salt, password_hash, role) VALUES (?, ?, ?, 'admin')")
      .run(adminEmail, adminSalt, adminHash);
  } else {
    database.prepare("UPDATE users SET password_salt = ?, password_hash = ?, role = 'admin' WHERE id = ?")
      .run(adminSalt, adminHash, existingAdmin.id);
  }
}

function migrateUserRoles(database) {
  const schema = database.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'").get()?.sql || "";
  if (schema.includes("'staff'") && schema.includes("'customer'")) return;

  database.exec("PRAGMA foreign_keys = OFF; PRAGMA legacy_alter_table = ON; BEGIN IMMEDIATE;");
  try {
    database.exec("ALTER TABLE users RENAME TO users_legacy_role_migration;");
    database.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        email TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_salt TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff', 'customer')),
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );
      INSERT INTO users (id, email, password_salt, password_hash, role, created_at)
      SELECT id, email, password_salt, password_hash,
        CASE WHEN role IN ('user', 'master-view') THEN 'customer' ELSE role END,
        created_at
      FROM users_legacy_role_migration;
      DROP TABLE users_legacy_role_migration;
      COMMIT;
    `);
  } catch (error) {
    if (database.isTransaction) database.exec("ROLLBACK;");
    throw error;
  } finally {
    database.exec("PRAGMA legacy_alter_table = OFF; PRAGMA foreign_keys = ON;");
  }
}

async function createOnlineSnapshot(database, destination) {
  return backup(database, destination);
}


function migrateSystemPreferences(database) {
  const schema = database.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'system_preferences'").get()?.sql || "";
  if (schema.includes("'zh'") && schema.includes("'ja'")) return;

  database.exec("PRAGMA foreign_keys = OFF; PRAGMA legacy_alter_table = ON; BEGIN IMMEDIATE;");
  try {
    database.exec("ALTER TABLE system_preferences RENAME TO system_preferences_legacy;");
    database.exec(`
      CREATE TABLE system_preferences (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        theme TEXT NOT NULL DEFAULT 'emerald',
        mode TEXT NOT NULL DEFAULT 'auto' CHECK (mode IN ('light', 'dark', 'auto')),
        language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'fr', 'es', 'de', 'zh', 'ja', 'ar', 'pt', 'it', 'ru')),
        time_format TEXT NOT NULL DEFAULT '12h' CHECK (time_format IN ('12h', '24h')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );
      INSERT INTO system_preferences (id, theme, mode, language, time_format, updated_at)
      SELECT id, theme, mode,
        CASE WHEN language IN ('en', 'fr', 'es', 'de', 'zh', 'ja', 'ar', 'pt', 'it', 'ru') THEN language ELSE 'en' END,
        time_format, updated_at
      FROM system_preferences_legacy;
      DROP TABLE system_preferences_legacy;
      COMMIT;
    `);
  } catch (error) {
    if (database.isTransaction) database.exec("ROLLBACK;");
    throw error;
  } finally {
    database.exec("PRAGMA legacy_alter_table = OFF; PRAGMA foreign_keys = ON;");
  }
}

module.exports = { createOnlineSnapshot, migrateSystemPreferences, migrateUserRoles, openDatabase };
