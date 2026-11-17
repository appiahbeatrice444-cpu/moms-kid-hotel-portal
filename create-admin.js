require("./setup-env").ensureEnvironmentFile();
require("dotenv").config();

const readline = require("node:readline");
const { openDatabase } = require("./database");
const { hashPassword } = require("./security");

async function promptPassword(prompt) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    throw new Error("Run this command in an interactive PowerShell terminal to enter the password.");
  }

  readline.emitKeypressEvents(process.stdin);
  process.stdout.write(prompt);
  const wasRaw = process.stdin.isRaw;
  process.stdin.setRawMode(true);
  process.stdin.resume();

  return new Promise((resolve, reject) => {
    let password = "";
    const cleanup = () => {
      process.stdin.removeListener("keypress", onKeypress);
      process.stdin.setRawMode(wasRaw);
      process.stdin.pause();
      process.stdout.write("\n");
    };
    const onKeypress = (character, key = {}) => {
      if (key.ctrl && (key.name === "c" || key.name === "d")) {
        cleanup();
        reject(new Error("Password entry cancelled."));
      } else if (key.name === "return" || key.name === "enter") {
        cleanup();
        resolve(password);
      } else if (key.name === "backspace") {
        password = password.slice(0, -1);
      } else if (character && !key.ctrl && !key.meta) {
        password += character;
      }
    };
    process.stdin.on("keypress", onKeypress);
  });
}

async function createAdmin() {
  const email = (process.env.INITIAL_ADMIN_EMAIL || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Set a valid INITIAL_ADMIN_EMAIL in .env first.");
  }
  const pepper = Buffer.from(process.env.PASSWORD_PEPPER || "", "hex");
  if (pepper.length !== 32) throw new Error("PASSWORD_PEPPER must be a 32-byte hex value in .env.");

  const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const password = bootstrapPassword || await promptPassword(`Create password for ${email}: `);
  if (!bootstrapPassword) {
    const confirmation = await promptPassword("Confirm password: ");
    if (password !== confirmation) throw new Error("Passwords did not match.");
  }
  if (password.length < 12 || password.length > 128) {
    throw new Error("Choose a password between 12 and 128 characters.");
  }

  const database = openDatabase(process.env.DB_PATH || "data/beatrice.sqlite");
  try {
    if (database.initialize) await database.initialize();
    const existing = await database.prepare("SELECT id FROM users WHERE LOWER(email) = ?").get(email);
    if (existing) throw new Error("An account already exists for INITIAL_ADMIN_EMAIL.");
    const credential = await hashPassword(password, pepper);
    const created = await database.prepare(`
      INSERT INTO users (email, password_salt, password_hash, role)
      VALUES (?, ?, ?, 'admin')
      RETURNING id
    `).run(email, credential.salt, credential.hash);
    await database.prepare("INSERT INTO audit_events (actor_user_id, action, subject) VALUES (?, ?, ?)")
      .run(Number(created.lastInsertRowid), "admin_created_locally", email);
    console.log("Administrator account created. Sign in through the web page.");
  } finally {
    await database.close();
  }
}

if (require.main === module) {
  createAdmin().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { createAdmin };
