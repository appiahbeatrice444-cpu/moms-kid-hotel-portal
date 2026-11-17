const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { createBackupService } = require("./backup-service");
const { decryptBackup } = require("./security");

test("backup service creates a locally encrypted, readable SQLite snapshot", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "beatrice-backup-"));
  const database = new DatabaseSync(":memory:");
  database.exec("CREATE TABLE backup_check (value TEXT); INSERT INTO backup_check VALUES ('snapshot ok');");
  const key = Buffer.alloc(32, 0x24);
  const service = createBackupService({
    database,
    encryptionKey: key,
    backupDir: directory,
    keepLocal: 14,
    bucket: "",
    region: "us-east-1",
  });

  try {
    const result = await service.createBackup();
    const encrypted = await fs.readFile(path.join(directory, result.filename));
    const plaintext = decryptBackup(encrypted, key);
    assert.equal(plaintext.subarray(0, 16).toString(), "SQLite format 3\0");
    assert.equal(result.uploaded, false);
    assert.equal(service.status.cloudEnabled, false);
    assert.equal(service.status.lastBackupError, null);
  } finally {
    service.stop();
    database.close();
    await fs.rm(directory, { recursive: true, force: true });
  }
});
