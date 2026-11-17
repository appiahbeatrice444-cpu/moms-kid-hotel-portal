const fs = require("node:fs");
const path = require("node:path");
const { randomBytes } = require("node:crypto");

const envPath = path.join(__dirname, ".env");

function ensureEnvironmentFile() {
  if (fs.existsSync(envPath)) {
    const current = fs.readFileSync(envPath, "utf8");
    const lines = current.split(/\r?\n/)
      .filter((line) => !line.startsWith("BOOTSTRAP_TOKEN=") && !line.startsWith("OTP_ENCRYPTION_KEY="));
    const defaults = [
      "INITIAL_ADMIN_EMAIL=appiahbeatrice444@gmail.com",
      "SMTP_HOST=smtp.gmail.com",
      "SMTP_PORT=587",
      "SMTP_SECURE=false",
      "SMTP_USER=appiahbeatrice444@gmail.com",
      "SMTP_PASSWORD=pdyh nuwr rtgp queu",
      "SMTP_FROM=Beatrice <appiahbeatrice444@gmail.com>",
      "EMAIL_TRANSPORT=smtp",
      "GMAIL_USER=appiahbeatrice444@gmail.com",
      "GMAIL_CLIENT_ID=",
      "GMAIL_CLIENT_SECRET=",
      "GMAIL_REFRESH_TOKEN=",
      "ALLOW_DEMO_2FA=true",
    ];
    for (const setting of defaults) {
      const key = setting.slice(0, setting.indexOf("="));
      const index = lines.findIndex((line) => line.startsWith(`${key}=`));
      if (index < 0) lines.push(setting);
      else if (lines[index] === `${key}=` && setting !== `${key}=`) lines[index] = setting;
    }
    const updated = `${lines.filter(Boolean).join("\n")}\n`;
    if (updated !== current) fs.writeFileSync(envPath, updated, { mode: 0o600 });
    return false;
  }

  const values = [
    "NODE_ENV=development",
    "HOST=127.0.0.1",
    "PORT=3000",
    `PASSWORD_PEPPER=${randomBytes(32).toString("hex")}`,
    `SESSION_SECRET=${randomBytes(32).toString("hex")}`,
    `BACKUP_ENCRYPTION_KEY=${randomBytes(32).toString("hex")}`,
    "INITIAL_ADMIN_EMAIL=appiahbeatrice444@gmail.com",
    "SMTP_HOST=smtp.gmail.com",
    "SMTP_PORT=587",
    "SMTP_SECURE=false",
    "SMTP_USER=appiahbeatrice444@gmail.com",
    "SMTP_PASSWORD=pdyh nuwr rtgp queu",
    "SMTP_FROM=Beatrice <appiahbeatrice444@gmail.com>",
    "EMAIL_TRANSPORT=smtp",
    "GMAIL_USER=appiahbeatrice444@gmail.com",
    "GMAIL_CLIENT_ID=",
    "GMAIL_CLIENT_SECRET=",
    "GMAIL_REFRESH_TOKEN=",
    "DB_PATH=data/beatrice.sqlite",
    "BACKUP_DIR=backups",
    "BACKUP_INTERVAL_HOURS=24",
    "BACKUP_KEEP_LOCAL=14",
    "ALLOW_DEMO_2FA=true",
    "BACKUP_S3_BUCKET=",
    "AWS_REGION=us-east-1",
    "AWS_ENDPOINT_URL=",
    "AWS_ACCESS_KEY_ID=",
    "AWS_SECRET_ACCESS_KEY=",
    "TRUST_PROXY=0",
  ];

  try {
    fs.writeFileSync(envPath, `${values.join("\n")}\n`, { flag: "wx", mode: 0o600 });
    console.log("Created .env with fresh random secrets. Keep this file private.");
    return true;
  } catch (error) {
    if (error.code === "EEXIST") return false;
    throw error;
  }
}

if (require.main === module) ensureEnvironmentFile();

module.exports = { ensureEnvironmentFile };
