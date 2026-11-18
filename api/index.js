const fs = require("node:fs");
const path = require("node:path");
const { randomBytes } = require("node:crypto");
const { openDatabase } = require("../database");
const { createEmailService } = require("../mail-service");
const { createBackupService } = require("../backup-service");
const { hashPassword } = require("../security");
const { createApp, getConfig } = require("../server");

let appPromise = null;

async function getApp() {
  if (appPromise) return appPromise;

  appPromise = (async () => {
    const isVercel = Boolean(process.env.VERCEL);
    const config = getConfig();

    const targetDbPath = isVercel ? "/tmp/beatrice.sqlite" : config.databasePath;
    const targetBackupDir = isVercel ? "/tmp/backups" : config.backupDir;

    if (isVercel) {
      try {
        fs.mkdirSync("/tmp", { recursive: true });
        fs.mkdirSync(targetBackupDir, { recursive: true });
      } catch (dirErr) {
        console.error("Directory creation warning:", dirErr.message);
      }

      if (!fs.existsSync(targetDbPath)) {
        const seedCandidates = [
          path.resolve(__dirname, "../data/beatrice.sqlite"),
          path.join(process.cwd(), "data/beatrice.sqlite"),
        ];
        for (const seedPath of seedCandidates) {
          if (fs.existsSync(seedPath)) {
            try {
              fs.copyFileSync(seedPath, targetDbPath);
              console.log(`Seeded /tmp/beatrice.sqlite from ${seedPath}`);
              break;
            } catch (copyErr) {
              console.error("Seed copy error:", copyErr.message);
            }
          }
        }
      }
    }

    const database = openDatabase(targetDbPath);
    const dummyCredential = await hashPassword(randomBytes(32).toString("hex"), config.passwordPepper);
    const emailService = createEmailService(config);
    const backupService = createBackupService({
      database,
      encryptionKey: config.backupEncryptionKey,
      backupDir: targetBackupDir,
      keepLocal: config.backupKeepLocal,
      bucket: config.backupBucket,
      region: config.awsRegion,
      endpoint: config.awsEndpoint,
    });

    const app = createApp({ database, config, backupService, dummyCredential, emailService });
    return app;
  })();

  return appPromise;
}

module.exports = async (req, res) => {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    console.error("Serverless invocation error:", error.stack || error.message);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      error: "Internal Server Error",
      message: error.message,
    }));
  }
};
