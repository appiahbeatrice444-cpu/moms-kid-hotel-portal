const fs = require("node:fs/promises");
const path = require("node:path");
const { randomBytes } = require("node:crypto");
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { createOnlineSnapshot } = require("./database");
const { encryptBackup } = require("./security");

function createBackupService({ database, encryptionKey, backupDir, keepLocal, bucket, region, endpoint }) {
  const directory = path.resolve(backupDir);
  const cloudEnabled = Boolean(bucket);
  const s3 = cloudEnabled
    ? new S3Client({ region, ...(endpoint ? { endpoint, forcePathStyle: true } : {}) })
    : null;
  let running = false;
  let timer;
  const status = { lastBackupAt: null, lastBackupError: null, cloudEnabled };

  async function pruneLocalBackups() {
    const files = (await fs.readdir(directory, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && /^beatrice-.*\.sqlite\.aes$/.test(entry.name))
      .map((entry) => entry.name)
      .sort()
      .reverse();
    const remove = files.slice(Math.max(1, keepLocal));
    await Promise.all(remove.map((name) => fs.rm(path.join(directory, name), { force: true })));
  }

  async function createBackup() {
    if (running) return { skipped: true };
    running = true;
    let rawPath;
    let encryptedPath;
    try {
      await fs.mkdir(directory, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const unique = randomBytes(5).toString("hex");
      const filename = `beatrice-${stamp}-${unique}.sqlite.aes`;
      encryptedPath = path.join(directory, filename);
      rawPath = path.join(directory, `.${filename}.tmp.sqlite`);
      await createOnlineSnapshot(database, rawPath);
      const plaintext = await fs.readFile(rawPath);
      const encrypted = encryptBackup(plaintext, encryptionKey);
      await fs.writeFile(encryptedPath, encrypted, { flag: "wx", mode: 0o600 });

      if (s3) {
        await s3.send(new PutObjectCommand({
          Bucket: bucket,
          Key: `beatrice/${filename}`,
          Body: encrypted,
          ContentType: "application/octet-stream",
          ServerSideEncryption: "AES256",
          Metadata: { encryption: "AES-256-GCM" },
        }));
      }

      await pruneLocalBackups();
      status.lastBackupAt = new Date().toISOString();
      status.lastBackupError = null;
      return { filename, uploaded: cloudEnabled };
    } catch (error) {
      status.lastBackupError = error.message;
      throw error;
    } finally {
      running = false;
      if (rawPath) {
        await Promise.all([
          fs.rm(rawPath, { force: true }),
          fs.rm(`${rawPath}-wal`, { force: true }),
          fs.rm(`${rawPath}-shm`, { force: true }),
        ]);
      }
    }
  }

  function start(intervalHours) {
    const intervalMs = Math.max(1, intervalHours) * 60 * 60 * 1000;
    timer = setInterval(() => {
      createBackup().catch((error) => console.error("Scheduled backup failed:", error.message));
    }, intervalMs);
    timer.unref();
    createBackup().catch((error) => console.error("Initial backup failed:", error.message));
  }

  function stop() {
    if (timer) clearInterval(timer);
    if (s3) s3.destroy();
  }

  return { createBackup, start, stop, status };
}

module.exports = { createBackupService };
