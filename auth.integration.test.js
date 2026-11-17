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

test("email verification and separate entity permissions work end to end", async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "beatrice-auth-"));
  const pepper = Buffer.alloc(32, 0x61);
  const config = {
    nodeEnv: "test",
    host: "127.0.0.1",
    port: 0,
    passwordPepper: pepper,
    sessionSecret: Buffer.alloc(32, 0x62),
    backupEncryptionKey: Buffer.alloc(32, 0x64),
    databasePath: path.join(directory, "data.sqlite"),
    backupDir: path.join(directory, "backups"),
    backupIntervalHours: 24,
    backupKeepLocal: 14,
    backupBucket: "",
    awsRegion: "us-east-1",
    awsEndpoint: "",
    trustProxy: "0",
  };
  const database = openDatabase(config.databasePath);
  const dummyCredential = await hashPassword("not a real account password", pepper);
  const password = "test-password-that-is-long-enough";
  for (const [email, role] of [
    ["admin@example.test", "admin"],
    ["manager@example.test", "manager"],
    ["staff@example.test", "staff"],
    ["customer@example.test", "customer"],
  ]) {
    const credential = await hashPassword(password, pepper);
    database.prepare("INSERT INTO users (email, password_salt, password_hash, role) VALUES (?, ?, ?, ?)")
      .run(email, credential.salt, credential.hash, role);
  }
  const deliveries = [];
  const emailService = {
    configured: true,
    async sendVerificationCode(email, code) { deliveries.push({ email, code }); },
    async sendPasswordResetCode(email, code) { deliveries.push({ email, code, purpose: "password-reset" }); },
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

  const admin = createClient();
  context.after(async () => {
    backupService.stop();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    database.close();
    await fs.rm(directory, { recursive: true, force: true });
  });

  assert.deepEqual((await admin("/api/auth/status", undefined, "GET")).data, { emailVerificationConfigured: true });
  assert.equal((await admin("/api/auth/bootstrap", { token: "anything" })).status, 404);
  assert.equal((await admin("/api/auth/login", { email: "admin@example.test", password: "wrong-password", role: "admin" })).status, 401);

  const challenge = await admin("/api/auth/login", {
    email: "admin@example.test",
    password,
    role: "admin",
  });
  assert.equal(challenge.status, 200);
  assert.equal(challenge.data.phase, "email");
  assert.match(challenge.data.destination, /^a\*+@example\.test$/);
  const adminDelivery = deliveries.at(-1);
  assert.equal(adminDelivery.email, "admin@example.test");
  assert.match(adminDelivery.code, /^\d{6}$/);
  assert.equal(JSON.stringify(challenge.data).includes(adminDelivery.code), false);
  assert.equal(database.prepare("SELECT code_hash FROM email_challenges").get().code_hash, hashToken(adminDelivery.code, config.sessionSecret));
  assert.equal((await admin("/api/auth/verify-email", { code: "000000" })).status, 401);
  const completed = await admin("/api/auth/verify-email", { code: adminDelivery.code, remember: true });
  assert.equal(completed.status, 200);
  assert.equal(completed.data.user.role, "admin");
  assert.equal((await admin("/api/users", undefined, "GET")).status, 200);

  assert.equal((await admin("/api/users", {
    email: "second-admin@example.test",
    password,
    role: "admin",
  })).status, 403);
  assert.equal((await admin("/api/users", { email: "new-manager@example.test", password, role: "manager" })).status, 201);
  assert.equal((await admin("/api/users", { email: "new-staff@example.test", password, role: "staff" })).status, 201);
  assert.equal((await admin("/api/users", { email: "new-customer@example.test", password, role: "customer" })).status, 201);
  const newStaff = database.prepare("SELECT id FROM users WHERE email = ?").get("new-staff@example.test");
  const activeStaffSession = hashToken("staff-session-to-revoke", config.sessionSecret);
  database.prepare("INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .run(activeStaffSession, newStaff.id, Date.now() + 60_000, Date.now());
  assert.equal((await admin(`/api/users/${newStaff.id}`, {}, "DELETE")).status, 200);
  assert.equal(database.prepare("SELECT id FROM users WHERE id = ?").get(newStaff.id), undefined);
  assert.equal(database.prepare("SELECT token_hash FROM sessions WHERE token_hash = ?").get(activeStaffSession), undefined);
  assert.equal(database.prepare("SELECT action, subject FROM audit_events WHERE action = 'user_account_deleted'").get().subject,
    "new-staff@example.test:staff");
  const adminId = database.prepare("SELECT id FROM users WHERE email = ?").get("admin@example.test").id;
  assert.equal((await admin(`/api/users/${adminId}`, {}, "DELETE")).status, 403);
  assert.equal((await admin("/api/users/99999", {}, "DELETE")).status, 404);

  const manager = createClient();
  const managerChallenge = await manager("/api/auth/login", { email: "manager@example.test", password, role: "manager" });
  assert.equal(managerChallenge.data.phase, "email");
  const managerCode = deliveries.at(-1).code;
  const managerReady = await manager("/api/auth/verify-email", { code: managerCode });
  assert.equal(managerReady.data.user.role, "manager");
  const managerDirectory = await manager("/api/users", undefined, "GET");
  assert.equal(managerDirectory.data.users.some((account) => account.role === "admin"), false);
  assert.equal((await manager("/api/users", {
    email: "escalated@example.test",
    password,
    role: "admin",
  })).status, 403);
  assert.equal((await manager("/api/users", {
    email: "manager-created-staff@example.test",
    password,
    role: "staff",
  })).status, 201);
  assert.equal((await manager("/api/users", { email: "manager-created-customer@example.test", password, role: "customer" })).status, 201);
  assert.equal((await manager("/api/users", { email: "manager-created-manager@example.test", password, role: "manager" })).status, 403);
  assert.equal((await manager("/api/customers", undefined, "GET")).status, 200);
  assert.equal((await manager("/api/backups/run", {})).status, 403);
  const managerTarget = database.prepare("SELECT id FROM users WHERE email = ?").get("new-customer@example.test");
  assert.equal((await manager(`/api/users/${managerTarget.id}`, {}, "DELETE")).status, 403);

  const staff = createClient();
  const staffChallenge = await staff("/api/auth/login", { email: "staff@example.test", password, role: "staff" });
  assert.equal(staffChallenge.data.phase, "email");
  const staffCode = deliveries.at(-1).code;
  assert.equal((await staff("/api/auth/verify-email", { code: staffCode })).data.user.role, "staff");
  assert.equal((await staff("/api/customers", undefined, "GET")).status, 200);
  assert.equal((await staff("/api/users", undefined, "GET")).status, 403);
  assert.equal((await staff("/api/audit", undefined, "GET")).status, 403);

  const customer = createClient();
  const customerChallenge = await customer("/api/auth/login", { email: "customer@example.test", password, role: "customer" });
  assert.equal(customerChallenge.data.phase, "email");
  const customerCode = deliveries.at(-1).code;
  assert.equal((await customer("/api/auth/verify-email", { code: customerCode })).data.user.role, "customer");
  assert.equal((await customer("/api/auth/me", undefined, "GET")).data.user.role, "customer");
  assert.equal((await customer("/api/users", undefined, "GET")).status, 403);
  assert.equal((await customer("/api/customers", undefined, "GET")).status, 403);

  const repeatLogin = createClient();
  const repeatChallenge = await repeatLogin("/api/auth/login", { email: "admin@example.test", password, role: "admin" });
  assert.equal(repeatChallenge.data.phase, "email");
  const repeatCode = deliveries.at(-1).code;
  assert.equal((await repeatLogin("/api/auth/verify-email", { code: repeatCode })).status, 200);
  assert.equal((await repeatLogin("/api/auth/verify-email", { code: repeatCode })).status, 401);
  const users = await repeatLogin("/api/users", undefined, "GET");
  assert.equal(users.data.users.some((user) => "password_hash" in user), false);
  assert.equal((await repeatLogin("/api/backups/status", undefined, "GET")).status, 200);
  assert.equal((await repeatLogin("/api/backups/run", {})).status, 200);
});

test("denies login when email verification is not configured", async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "beatrice-auth-direct-"));
  const pepper = Buffer.alloc(32, 0x61);
  const config = {
    nodeEnv: "test",
    host: "127.0.0.1",
    port: 0,
    passwordPepper: pepper,
    sessionSecret: Buffer.alloc(32, 0x62),
    backupEncryptionKey: Buffer.alloc(32, 0x64),
    databasePath: path.join(directory, "data.sqlite"),
    backupDir: path.join(directory, "backups"),
    backupIntervalHours: 24,
    backupKeepLocal: 14,
    backupBucket: "",
    awsRegion: "us-east-1",
    awsEndpoint: "",
    trustProxy: "0",
  };
  const database = openDatabase(config.databasePath);
  const dummyCredential = await hashPassword("not a real password", pepper);
  const password = "admin-password-test";
  const credential = await hashPassword(password, pepper);
  database.prepare("INSERT INTO users (email, password_salt, password_hash, role) VALUES (?, ?, ?, 'admin')")
    .run("direct@example.test", credential.salt, credential.hash);

  const emailService = { configured: false, async close() {} };
  const backupService = createBackupService({
    database,
    encryptionKey: config.backupEncryptionKey,
    backupDir: config.backupDir,
    keepLocal: 14,
    bucket: "",
    region: "us-east-1",
  });

  const server = createApp({ database, config, backupService, dummyCredential, emailService }).listen(0, "127.0.0.1");
  await once(server, "listening");
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  context.after(async () => {
    backupService.stop();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    database.close();
    await fs.rm(directory, { recursive: true, force: true });
  });

  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "direct@example.test", password, role: "admin" }),
  });
  assert.equal(res.status, 503);
  const data = await res.json();
  assert.match(data.error, /two-factor authentication is unavailable/i);
  assert.equal(res.headers.getSetCookie().some((cookie) => cookie.startsWith("beatrice_session=")), false);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM sessions").get().count, 0);
});

test("customer registration and every later sign-in require role selection and email 2FA", async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "beatrice-auth-registration-"));
  const config = {
    nodeEnv: "test",
    host: "127.0.0.1",
    port: 0,
    passwordPepper: Buffer.alloc(32, 0x71),
    sessionSecret: Buffer.alloc(32, 0x72),
    backupEncryptionKey: Buffer.alloc(32, 0x73),
    databasePath: path.join(directory, "data.sqlite"),
    backupDir: path.join(directory, "backups"),
    backupIntervalHours: 24,
    backupKeepLocal: 14,
    backupBucket: "",
    awsRegion: "us-east-1",
    awsEndpoint: "",
    trustProxy: "0",
  };
  const database = openDatabase(config.databasePath);
  const dummyCredential = await hashPassword("registration test dummy password", config.passwordPepper);
  const deliveries = [];
  const emailService = {
    configured: true,
    async sendVerificationCode(email, code) { deliveries.push({ email, code }); },
    async sendPasswordResetCode(email, code) { deliveries.push({ email, code, purpose: "password-reset" }); },
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
  const server = createApp({ database, config, backupService, dummyCredential, emailService }).listen(0, "127.0.0.1");
  await once(server, "listening");
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const cookies = new Map();

  async function request(route, body, method = "POST") {
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
    return {
      status: response.status,
      data: response.status === 204 ? null : await response.json(),
    };
  }

  context.after(async () => {
    backupService.stop();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    database.close();
    await fs.rm(directory, { recursive: true, force: true });
  });

  const password = "registered-customer-password";
  const registered = await request("/api/auth/register", {
    email: "new-guest@example.test",
    password,
    role: "manager",
  });
  assert.equal(registered.status, 201);
  const stored = database.prepare("SELECT id, role, password_salt, password_hash FROM users WHERE email = ?")
    .get("new-guest@example.test");
  assert.equal(stored.role, "customer");
  assert.notEqual(stored.password_hash, password);
  assert.equal((await request("/api/auth/register", { email: "new-guest@example.test", password })).status, 409);

  assert.equal((await request("/api/auth/login", {
    email: "new-guest@example.test",
    password,
    role: "manager",
  })).status, 401);
  assert.equal(deliveries.length, 0);
  assert.equal((await request("/api/auth/login", {
    email: "new-guest@example.test",
    password,
  })).status, 401);

  const firstLogin = await request("/api/auth/login", {
    email: "new-guest@example.test",
    password,
    role: "customer",
  });
  assert.equal(firstLogin.status, 200);
  assert.equal(firstLogin.data.phase, "email");
  assert.equal(deliveries.at(-1).email, "new-guest@example.test");
  const firstCode = deliveries.at(-1).code;
  assert.equal((await request("/api/auth/verify-email", { code: firstCode })).data.user.role, "customer");
  assert.equal((await request("/api/auth/me", undefined, "GET")).status, 200);
  assert.equal((await request("/api/auth/logout", {})).status, 204);
  assert.equal((await request("/api/auth/me", undefined, "GET")).status, 401);

  const laterLogin = await request("/api/auth/login", {
    email: "new-guest@example.test",
    password,
    role: "customer",
  });
  assert.equal(laterLogin.status, 200);
  assert.equal(laterLogin.data.phase, "email");
  assert.notEqual(deliveries.at(-1).code, firstCode);
  assert.equal((await request("/api/auth/verify-email", { code: firstCode })).status, 401);
  assert.equal((await request("/api/auth/verify-email", { code: deliveries.at(-1).code })).status, 200);

  const sessionCountBeforeReset = database.prepare("SELECT COUNT(*) AS count FROM sessions WHERE user_id = ?")
    .get(stored.id).count;
  assert.equal(sessionCountBeforeReset, 1);
  const unknownRecovery = await request("/api/auth/forgot-password", { email: "unknown@example.test" });
  const knownRecovery = await request("/api/auth/forgot-password", { email: "new-guest@example.test" });
  assert.equal(unknownRecovery.status, 200);
  assert.deepEqual(knownRecovery.data, unknownRecovery.data);
  assert.equal(deliveries.at(-1).email, "new-guest@example.test");
  const resetCode = deliveries.at(-1).code;
  const resetHash = database.prepare("SELECT code_hash FROM password_reset_challenges").get().code_hash;
  assert.equal(resetHash, hashToken(resetCode, config.sessionSecret));

  const weakPassword = await request("/api/auth/reset-password", { code: resetCode, password: "short" });
  assert.equal(weakPassword.status, 400);
  const wrongResetCode = resetCode === "000000" ? "000001" : "000000";
  assert.equal((await request("/api/auth/reset-password", { code: wrongResetCode, password: "replacement-password-2026" })).status, 401);
  const reset = await request("/api/auth/reset-password", { code: resetCode, password: "replacement-password-2026" });
  assert.equal(reset.status, 200);
  assert.match(reset.data.message, /complete email verification/i);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM sessions WHERE user_id = ?").get(stored.id).count, 0);
  assert.equal((await request("/api/auth/me", undefined, "GET")).status, 401);
  assert.equal((await request("/api/auth/login", {
    email: "new-guest@example.test",
    password,
    role: "customer",
  })).status, 401);
  const recoveredLogin = await request("/api/auth/login", {
    email: "new-guest@example.test",
    password: "replacement-password-2026",
    role: "customer",
  });
  assert.equal(recoveredLogin.status, 200);
  assert.equal(recoveredLogin.data.phase, "email");
  assert.equal((await request("/api/auth/verify-email", { code: deliveries.at(-1).code })).status, 200);
});
