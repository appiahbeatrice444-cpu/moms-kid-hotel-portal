const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { once } = require("node:events");
const { openDatabase } = require("./database");
const { createBackupService } = require("./backup-service");
const { hashPassword, hashToken } = require("./security");
const { createApp } = require("./server");

test("hotel management, reservations, deleted accounts archive, and preferences restore work end-to-end", async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "hotel-auth-test-"));
  const pepper = Buffer.alloc(32, 0x61);
  const config = {
    nodeEnv: "test",
    host: "127.0.0.1",
    port: 0,
    passwordPepper: pepper,
    sessionSecret: Buffer.alloc(32, 0x62),
    backupEncryptionKey: Buffer.alloc(32, 0x64),
    databasePath: path.join(directory, "hotel-data.sqlite"),
    backupDir: path.join(directory, "backups"),
    backupIntervalHours: 24,
    backupKeepLocal: 14,
    backupBucket: "",
    awsRegion: "us-east-1",
    awsEndpoint: "",
    trustProxy: "0",
  };

  const database = openDatabase(config.databasePath);
  const password = "hotel-test-password-secure";

  for (const [email, role] of [
    ["admin@hotel.test", "admin"],
    ["manager@hotel.test", "manager"],
    ["staff@hotel.test", "staff"],
    ["customer@hotel.test", "customer"],
  ]) {
    const credential = await hashPassword(password, pepper);
    database.prepare("INSERT INTO users (email, password_salt, password_hash, role) VALUES (?, ?, ?, ?)")
      .run(email, credential.salt, credential.hash, role);
  }

  const deliveries = [];
  const emailService = {
    configured: true,
    async sendVerificationCode(email, code) { deliveries.push({ email, code }); },
    async sendPasswordResetCode(email, code) { deliveries.push({ email, code, purpose: "reset" }); },
    async close() {},
  };

  const backupService = createBackupService({
    database,
    encryptionKey: config.backupEncryptionKey,
    backupDir: config.backupDir,
    keepLocal: 14,
    bucket: "",
    region: "us-east-1",
  });

  const dummyCredential = await hashPassword("dummy password", pepper);
  const server = createApp({ database, config, backupService, dummyCredential, emailService }).listen(0, "127.0.0.1");
  await once(server, "listening");
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  function createClient() {
    const cookies = new Map();
    return async (route, body, method = "POST") => {
      const headers = {};
      if (body !== undefined) headers["content-type"] = "application/json";
      if (cookies.size) headers.cookie = Array.from(cookies, ([key, value]) => `${key}=${value}`).join("; ");
      const response = await fetch(`${baseUrl}${route}`, {
        method,
        headers,
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
      for (const header of response.headers.getSetCookie()) {
        const pair = header.split(";", 1)[0];
        const separator = pair.indexOf("=");
        if (separator < 0) continue;
        const name = pair.slice(0, separator);
        const value = pair.slice(separator + 1);
        if (/Max-Age=0/i.test(header)) cookies.delete(name);
        else cookies.set(name, value);
      }
      const data = response.status === 204 ? null : await response.json();
      return { status: response.status, data };
    };
  }

  async function loginAs(email, role) {
    const client = createClient();
    const loginRes = await client("/api/auth/login", { email, password, role });
    assert.equal(loginRes.status, 200);
    const delivery = deliveries.at(-1);
    assert.equal(delivery.email, email);
    const verifyRes = await client("/api/auth/verify-email", { code: delivery.code });
    assert.equal(verifyRes.status, 200);
    assert.equal(verifyRes.data.user.role, role);
    return client;
  }

  context.after(async () => {
    backupService.stop();
    await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
    database.close();
    await fs.rm(directory, { recursive: true, force: true });
  });

  const adminClient = await loginAs("admin@hotel.test", "admin");
  const managerClient = await loginAs("manager@hotel.test", "manager");
  const staffClient = await loginAs("staff@hotel.test", "staff");
  const customerClient = await loginAs("customer@hotel.test", "customer");

  // 1. Room Catalog & Management
  const roomsList = await adminClient("/api/rooms", undefined, "GET");
  assert.equal(roomsList.status, 200);
  assert.ok(roomsList.data.rooms.length >= 8);

  const newRoom = await managerClient("/api/rooms", {
    room_number: "401",
    room_type: "Ocean Panoramic Villa",
    price_per_night: 350.00,
    capacity: 4,
    amenities: "Private Infinity Pool, King Bed, Ocean View",
    status: "available",
    description: "Exclusive villa perched over the azure bay.",
  });
  assert.equal(newRoom.status, 201);
  assert.equal(newRoom.data.room.room_number, "401");

  const updatedRoom = await managerClient(`/api/rooms/${newRoom.data.room.id}`, {
    price_per_night: 395.00,
    status: "available",
  }, "PATCH");
  assert.equal(updatedRoom.status, 200);
  assert.equal(updatedRoom.data.room.price_per_night, 395.00);

  // 2. Reservation & Booking Workflow
  const bookingRes = await customerClient("/api/bookings", {
    room_id: newRoom.data.room.id,
    check_in_date: "2026-11-10",
    check_out_date: "2026-11-15",
    num_guests: 2,
    guest_name: "Customer Tester",
    guest_phone: "+1 555-0199",
    special_requests: "Champagne on arrival",
  });
  assert.equal(bookingRes.status, 201);
  assert.equal(bookingRes.data.booking.status, "confirmed");
  assert.match(bookingRes.data.booking.booking_reference, /^MKH-\d{6}$/);

  // Overlapping booking prevention
  const collisionBooking = await customerClient("/api/bookings", {
    room_id: newRoom.data.room.id,
    check_in_date: "2026-11-12",
    check_out_date: "2026-11-18",
    num_guests: 2,
  });
  assert.equal(collisionBooking.status, 409);

  // Front desk check-in
  const checkInRes = await staffClient(`/api/bookings/${bookingRes.data.booking.id}/status`, {
    status: "checked-in",
  }, "PATCH");
  assert.equal(checkInRes.status, 200);
  assert.equal(checkInRes.data.booking.status, "checked-in");

  // Verify room is marked as occupied
  const roomAfterCheckIn = database.prepare("SELECT status FROM rooms WHERE id = ?").get(newRoom.data.room.id);
  assert.equal(roomAfterCheckIn.status, "occupied");

  // Attempting to delete room with active booking is blocked
  const deleteRoomAttempt = await adminClient(`/api/rooms/${newRoom.data.room.id}`, {}, "DELETE");
  assert.equal(deleteRoomAttempt.status, 409);

  // Front desk check-out
  const checkOutRes = await staffClient(`/api/bookings/${bookingRes.data.booking.id}/status`, {
    status: "checked-out",
  }, "PATCH");
  assert.equal(checkOutRes.status, 200);
  assert.equal(checkOutRes.data.booking.status, "checked-out");

  const roomAfterCheckOut = database.prepare("SELECT status FROM rooms WHERE id = ?").get(newRoom.data.room.id);
  assert.equal(roomAfterCheckOut.status, "cleaning");

  // 3. User Account Deletion & Deleted Accounts Archive
  const testStaffUser = await adminClient("/api/users", {
    email: "temp-staff@hotel.test",
    password,
    role: "staff",
  });
  assert.equal(testStaffUser.status, 201);
  const tempStaffId = testStaffUser.data.user.id;

  const deleteUserRes = await adminClient(`/api/users/${tempStaffId}`, {
    reason: "Seasonal contract completed",
  }, "DELETE");
  assert.equal(deleteUserRes.status, 200);

  // User deleted from active users
  assert.equal(database.prepare("SELECT id FROM users WHERE id = ?").get(tempStaffId), undefined);

  // User archived in deleted_users
  const deletedUsersRes = await adminClient("/api/deleted-users", undefined, "GET");
  assert.equal(deletedUsersRes.status, 200);
  const archived = deletedUsersRes.data.deletedUsers.find((u) => u.original_user_id === tempStaffId);
  assert.ok(archived);
  assert.equal(archived.email, "temp-staff@hotel.test");
  assert.equal(archived.role, "staff");
  assert.equal(archived.reason, "Seasonal contract completed");
  assert.equal(archived.deleted_by_email, "admin@hotel.test");

  // 4. System Preferences & Restore Non-Functional Units
  const updatePref = await adminClient("/api/preferences", {
    theme: "amber",
    mode: "dark",
    language: "fr",
    time_format: "24h",
  }, "PATCH");
  assert.equal(updatePref.status, 200);
  assert.equal(updatePref.data.preferences.mode, "dark");
  assert.equal(updatePref.data.preferences.language, "fr");

  const restorePref = await adminClient("/api/preferences/restore", {});
  assert.equal(restorePref.status, 200);
  assert.equal(restorePref.data.preferences.theme, "emerald");
  assert.equal(restorePref.data.preferences.mode, "auto");
  assert.equal(restorePref.data.preferences.language, "en");
  assert.equal(restorePref.data.preferences.time_format, "12h");

  // Verify business data is unchanged after restore
  const roomsCountAfter = Number(database.prepare("SELECT COUNT(*) AS count FROM rooms").get().count);
  assert.ok(roomsCountAfter >= 9);
  const bookingsCountAfter = Number(database.prepare("SELECT COUNT(*) AS count FROM bookings").get().count);
  assert.ok(bookingsCountAfter >= 3);
});
