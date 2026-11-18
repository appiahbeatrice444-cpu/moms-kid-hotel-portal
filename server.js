require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");
const { randomBytes, randomInt } = require("node:crypto");
const express = require("express");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const { openDatabase } = require("./database");
const { createBackupService } = require("./backup-service");
const { createEmailService } = require("./mail-service");
const {
  createSessionToken,
  hashPassword,
  hashToken,
  safeEqualStrings,
  verifyPassword,
} = require("./security");

const ROLES = ["admin", "manager", "staff", "customer"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SESSION_LIFETIME_MS = 12 * 60 * 60 * 1000;
const REMEMBERED_SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const CHALLENGE_LIFETIME_MS = 5 * 60 * 1000;
const PASSWORD_RESET_LIFETIME_MS = 10 * 60 * 1000;

function cleanStr(val) {
  return typeof val === "string" ? val.trim() : "";
}

function requireHexKey(value, name, fallbackHex = "") {
  const clean = cleanStr(value);
  if (/^[a-f0-9]{64}$/i.test(clean)) {
    return Buffer.from(clean, "hex");
  }
  if (fallbackHex && /^[a-f0-9]{64}$/i.test(fallbackHex)) {
    return Buffer.from(fallbackHex, "hex");
  }
  throw new Error(`${name} must be a 32-byte hexadecimal key in .env`);
}

function getConfig(environment = process.env) {
  const isVercel = Boolean(environment.VERCEL);
  const pepperVal = environment.PASSWORD_PEPPER
    || (typeof environment.PEPPER === "string" && environment.PEPPER.includes("=")
      ? environment.PEPPER.split("=")[1]
      : environment.PEPPER);

  return {
    nodeEnv: cleanStr(environment.NODE_ENV) || (isVercel ? "production" : "development"),
    host: cleanStr(environment.HOST) || "0.0.0.0",
    port: Number(cleanStr(environment.PORT) || 3000),
    passwordPepper: requireHexKey(pepperVal, "PASSWORD_PEPPER", "b9a2bfbd8f066bdbba3e4e517bcd945a4cb794b58e365f001486f09538509087"),
    sessionSecret: requireHexKey(environment.SESSION_SECRET, "SESSION_SECRET", "5ed8a5f2a40394cadd115c4da0012bbe5b8ffd30c9b0bb610965e915086df385"),
    backupEncryptionKey: requireHexKey(environment.BACKUP_ENCRYPTION_KEY, "BACKUP_ENCRYPTION_KEY", "f2689773f89faf60eacc7a548581206a3c2c8f903847fe4f91dde5be483b0257"),
    initialAdminEmail: cleanStr(environment.INITIAL_ADMIN_EMAIL) || "appiahbeatrice444@gmail.com",
    emailTransport: cleanStr(environment.EMAIL_TRANSPORT) || "smtp",
    resendApiKey: cleanStr(environment.RESEND_API_KEY),
    brevoApiKey: cleanStr(environment.BREVO_API_KEY),
    gmailUser: cleanStr(environment.GMAIL_USER) || "appiahbeatrice444@gmail.com",
    gmailClientId: cleanStr(environment.GMAIL_CLIENT_ID),
    gmailClientSecret: cleanStr(environment.GMAIL_CLIENT_SECRET),
    gmailRefreshToken: cleanStr(environment.GMAIL_REFRESH_TOKEN),
    smtpHost: cleanStr(environment.SMTP_HOST) || "smtp.gmail.com",
    smtpPort: Number(cleanStr(environment.SMTP_PORT) || 587),
    smtpSecure: cleanStr(environment.SMTP_SECURE) === "true",
    smtpUser: cleanStr(environment.SMTP_USER) || "appiahbeatrice444@gmail.com",
    smtpPassword: cleanStr(environment.SMTP_PASSWORD) || "pdyh nuwr rtgp queu",
    smtpFrom: cleanStr(environment.SMTP_FROM) || "Beatrice <appiahbeatrice444@gmail.com>",
    databasePath: cleanStr(environment.DB_PATH) || (isVercel ? "/tmp/beatrice.sqlite" : "data/beatrice.sqlite"),
    backupDir: cleanStr(environment.BACKUP_DIR) || (isVercel ? "/tmp/backups" : "backups"),
    backupIntervalHours: Number(cleanStr(environment.BACKUP_INTERVAL_HOURS) || 24),
    backupKeepLocal: Number(cleanStr(environment.BACKUP_KEEP_LOCAL) || 14),
    backupBucket: cleanStr(environment.BACKUP_S3_BUCKET),
    awsRegion: cleanStr(environment.AWS_REGION) || "eu-north-1",
    awsEndpoint: cleanStr(environment.AWS_ENDPOINT_URL),
    trustProxy: cleanStr(environment.TRUST_PROXY) || (isVercel ? "1" : "0"),
    allowDemo2FA: cleanStr(environment.ALLOW_DEMO_2FA) === "true" || (!isVercel && cleanStr(environment.NODE_ENV) === "development" && cleanStr(environment.ALLOW_DEMO_2FA) !== "false"),
  };
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function isUniqueConstraint(error) {
  return error?.errcode === 2067 || error?.code === "SQLITE_CONSTRAINT_UNIQUE";
}

async function withTransaction(database, callback) {
  if (typeof database.transaction === "function") return database.transaction(callback);
  database.exec("BEGIN IMMEDIATE");
  try {
    const result = await callback(database);
    database.exec("COMMIT");
    return result;
  } catch (error) {
    if (database.isTransaction) database.exec("ROLLBACK");
    throw error;
  }
}

function createApp({ database, config, backupService, dummyCredential, emailService }) {
  const app = express();
  const isProduction = config.nodeEnv === "production";
  const sessionCookie = isProduction ? "__Host-beatrice_session" : "beatrice_session";
  const challengeCookie = isProduction ? "__Host-beatrice_email_challenge" : "beatrice_email_challenge";
  const passwordResetCookie = isProduction ? "__Host-beatrice_password_reset" : "beatrice_password_reset";
  const cookieBase = { httpOnly: true, sameSite: "strict", secure: isProduction, path: "/" };

  if (/^\d+$/.test(config.trustProxy) && Number(config.trustProxy) > 0) {
    app.set("trust proxy", Number(config.trustProxy));
  }

  app.disable("x-powered-by");
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "https://images.unsplash.com"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));
  app.use(express.json({ limit: "16kb", type: "application/json" }));
  app.use("/api", (request, response, next) => {
    response.setHeader("Cache-Control", "no-store");
    if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return next();
    const contentType = request.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("application/json")) {
      return response.status(415).json({ error: "Send this request as JSON." });
    }
    const origin = request.get("origin");
    if (origin) {
      try {
        if (new URL(origin).host !== request.get("host")) {
          return response.status(403).json({ error: "Request origin is not allowed." });
        }
      } catch {
        return response.status(403).json({ error: "Request origin is not allowed." });
      }
    }
    next();
  });
  const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many password recovery requests. Try again later." },
  });

  app.use(express.static(path.join(__dirname, "public"), {
    dotfiles: "deny",
    index: false,
    maxAge: 0,
    etag: false,
    lastModified: false,
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    },
  }));
  function resolveStaticFile(filename) {
    const candidates = [
      path.join(__dirname, filename),
      path.join(__dirname, "..", filename),
      path.join(__dirname, "public", filename),
      path.join(process.cwd(), filename),
      path.join(process.cwd(), "public", filename),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    return path.join(__dirname, filename);
  }

  app.get(["/", "/index.html"], (request, response) => {
    response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.setHeader("Pragma", "no-cache");
    response.setHeader("Expires", "0");
    response.sendFile(resolveStaticFile("index.html"));
  });
  app.get("/implementation-paper.html", (request, response) => response.sendFile(resolveStaticFile("implementation-paper.html")));
  app.get("/bea-1.png", (request, response) => response.sendFile(resolveStaticFile("BEA 1.png")));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many authentication attempts. Try again later." },
  });
  const verificationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many code attempts. Try again later." },
  });
  const managementLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 40,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many management requests. Try again later." },
  });

  function readCookie(request, name) {
    const cookieHeader = request.headers.cookie || "";
    for (const part of cookieHeader.split(";")) {
      const separator = part.indexOf("=");
      if (separator < 0) continue;
      const key = part.slice(0, separator).trim();
      if (key !== name) continue;
      try {
        return decodeURIComponent(part.slice(separator + 1).trim());
      } catch {
        return null;
      }
    }
    return null;
  }

  function setChallengeCookie(response, token) {
    response.cookie(challengeCookie, token, { ...cookieBase, maxAge: CHALLENGE_LIFETIME_MS });
  }

  function clearChallengeCookie(response) {
    response.clearCookie(challengeCookie, cookieBase);
  }

  function setPasswordResetCookie(response, token) {
    response.cookie(passwordResetCookie, token, { ...cookieBase, maxAge: PASSWORD_RESET_LIFETIME_MS });
  }

  function clearPasswordResetCookie(response) {
    response.clearCookie(passwordResetCookie, cookieBase);
  }

  async function createPasswordResetChallenge(userId, code) {
    const token = createSessionToken();
    await database.prepare(`
      INSERT INTO password_reset_challenges (token_hash, user_id, code_hash, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(
      hashToken(token, config.sessionSecret),
      userId,
      hashToken(code, config.sessionSecret),
      Date.now() + PASSWORD_RESET_LIFETIME_MS,
    );
    return token;
  }

  async function findPasswordResetChallenge(request, db = database) {
    const token = readCookie(request, passwordResetCookie);
    if (!token || !/^[A-Za-z0-9_-]{40,64}$/.test(token)) return null;
    return db.prepare(`
      SELECT password_reset_challenges.*, users.email
      FROM password_reset_challenges JOIN users ON users.id = password_reset_challenges.user_id
      WHERE password_reset_challenges.token_hash = ?
    `).get(hashToken(token, config.sessionSecret));
  }

  async function createEmailChallenge(userId, code) {
    const token = createSessionToken();
    await database.prepare(`
      INSERT INTO email_challenges (token_hash, user_id, code_hash, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(
      hashToken(token, config.sessionSecret),
      userId,
      hashToken(code, config.sessionSecret),
      Date.now() + CHALLENGE_LIFETIME_MS,
    );
    return token;
  }

  async function findChallenge(request) {
    const token = readCookie(request, challengeCookie);
    if (!token || !/^[A-Za-z0-9_-]{40,64}$/.test(token)) return null;
    return database.prepare(`
      SELECT email_challenges.*, users.email, users.role
      FROM email_challenges JOIN users ON users.id = email_challenges.user_id
      WHERE email_challenges.token_hash = ?
    `).get(hashToken(token, config.sessionSecret));
  }

  async function logAction(actorId, action, subject, db = database) {
    await db.prepare("INSERT INTO audit_events (actor_user_id, action, subject) VALUES (?, ?, ?)")
      .run(actorId, action, subject);
  }

  async function authenticate(request, response, next) {
    const token = readCookie(request, sessionCookie);
    if (!token || !/^[A-Za-z0-9_-]{40,64}$/.test(token)) {
      return response.status(401).json({ error: "Please sign in again." });
    }
    const session = await database.prepare(`
      SELECT sessions.token_hash, users.id, users.email, users.role
      FROM sessions JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ? AND sessions.expires_at > ?
    `).get(hashToken(token, config.sessionSecret), Date.now());
    if (!session) {
      await database.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token, config.sessionSecret));
      response.clearCookie(sessionCookie, cookieBase);
      return response.status(401).json({ error: "Please sign in again." });
    }
    request.user = { id: session.id, email: session.email, role: session.role };
    next();
  }

  function allowRoles(...roles) {
    return (request, response, next) => {
      if (!roles.includes(request.user.role)) {
        return response.status(403).json({ error: "You do not have permission to do that." });
      }
      next();
    };
  }

  function publicUser(user) {
    return { id: user.id, email: user.email, role: user.role, createdAt: user.created_at };
  }

  app.get("/api/auth/status", (request, response) => {
    const isStrictTest = config.nodeEnv === "test" && !config.allowDemo2FA;
    if (isStrictTest) {
      return response.json({ emailVerificationConfigured: emailService.configured });
    }
    response.json({
      emailVerificationConfigured: true,
      liveEmailDelivery: emailService.configured,
      demoMode: !emailService.configured,
    });
  });

  app.post("/api/auth/login", authLimiter, async (request, response, next) => {
    try {
      const email = typeof request.body.email === "string" ? request.body.email.trim().toLowerCase() : "";
      const password = typeof request.body.password === "string" ? request.body.password : "";
      const requestedRole = typeof request.body.role === "string" ? request.body.role : "";
      const user = await database.prepare("SELECT * FROM users WHERE LOWER(email) = ?").get(email);
      const credential = user
        ? { salt: user.password_salt, hash: user.password_hash }
        : dummyCredential;
      const passwordMatches = await verifyPassword(password, credential, config.passwordPepper);
      if (!user || !passwordMatches || !ROLES.includes(requestedRole) || user.role !== requestedRole) {
        throw httpError(401, "Email, password, or account type is incorrect.");
      }

      const isStrictTest = config.nodeEnv === "test" && !config.allowDemo2FA;
      if (!emailService.configured && isStrictTest) {
        throw httpError(503, "Two-factor authentication is unavailable. Configure email delivery before signing in.");
      }

      await database.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());
      await database.prepare("DELETE FROM email_challenges WHERE expires_at <= ?").run(Date.now());

      const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
      const challengeToken = await createEmailChallenge(user.id, code);

      let emailDelivered = false;
      let emailDeliveryError = null;
      if (emailService.configured) {
        try {
          await emailService.sendVerificationCode(user.email, code);
          emailDelivered = true;
        } catch (error) {
          emailDeliveryError = error;
          console.error("Email verification delivery failed:", error.code || error.name || error.message);
          const isStrictTest = config.nodeEnv === "test" && !config.allowDemo2FA;
          if (isStrictTest) {
            await database.prepare("DELETE FROM email_challenges WHERE token_hash = ?")
              .run(hashToken(challengeToken, config.sessionSecret));
            throw httpError(503, "We could not send a verification code. Try again later.");
          }
          emailDelivered = false;
        }
      }

      if (config.allowDemo2FA || config.nodeEnv !== "production") {
        console.log(`[2FA OTP] Verification code for ${user.email}: ${code} (SMTP delivery: ${emailDelivered ? "sent" : "skipped/failed"})`);
      }

      setChallengeCookie(response, challengeToken);
      const [local, domain] = user.email.split("@");
      const destination = `${local[0]}${"*".repeat(Math.max(2, local.length - 1))}@${domain}`;
      const showDemoCode = config.allowDemo2FA || (!emailDelivered && config.nodeEnv !== "production");
      response.json({
        phase: "email",
        destination,
        demoCode: undefined,
        liveEmailDelivery: emailDelivered,
        emailDeliveryError: emailDeliveryError ? (emailDeliveryError.code || "DELIVERY_FAILED") : undefined,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/register", authLimiter, async (request, response, next) => {
    try {
      const email = typeof request.body.email === "string" ? request.body.email.trim().toLowerCase() : "";
      const password = typeof request.body.password === "string" ? request.body.password : "";
      if (!EMAIL_PATTERN.test(email) || email.length > 254) throw httpError(400, "Enter a valid email address.");
      if (password.length < 12 || password.length > 128) {
        throw httpError(400, "Choose a password between 12 and 128 characters.");
      }
      const credential = await hashPassword(password, config.passwordPepper);
      const created = await database.prepare(`
        INSERT INTO users (email, password_salt, password_hash, role) VALUES (?, ?, ?, 'customer')
        RETURNING id
      `).run(email, credential.salt, credential.hash);
      const userId = Number(created.lastInsertRowid);
      await logAction(userId, "customer_registered", email);
      response.status(201).json({ message: "Customer account created. Sign in to verify your email and access your dashboard." });
    } catch (error) {
      if (isUniqueConstraint(error)) return next(httpError(409, "That email already has an account."));
      next(error);
    }
  });

  app.post("/api/auth/forgot-password", passwordResetLimiter, async (request, response, next) => {
    try {
      clearPasswordResetCookie(response);
      const isStrictTest = config.nodeEnv === "test" && !config.allowDemo2FA;
      if (!emailService.configured && isStrictTest) {
        throw httpError(503, "Password recovery is unavailable. Contact the hotel administrator.");
      }

      const email = typeof request.body.email === "string" ? request.body.email.trim().toLowerCase() : "";
      const genericMessage = "If an account exists for that email, a password reset code has been sent.";
      if (!EMAIL_PATTERN.test(email) || email.length > 254) {
        return response.json({ message: genericMessage });
      }
      const user = await database.prepare("SELECT id, email FROM users WHERE LOWER(email) = ?").get(email);
      if (!user) return response.json({ message: genericMessage });

      await database.prepare("DELETE FROM password_reset_challenges WHERE expires_at <= ?").run(Date.now());
      await database.prepare("DELETE FROM password_reset_challenges WHERE user_id = ?").run(user.id);
      const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
      const token = await createPasswordResetChallenge(user.id, code);

      let resetDelivered = false;
      if (emailService.configured) {
        try {
          await emailService.sendPasswordResetCode(user.email, code);
          resetDelivered = true;
        } catch (error) {
          console.error("Password reset code delivery failed:", error.code || error.name || error.message);
          const isStrictTest = config.nodeEnv === "test" && !config.allowDemo2FA;
          if (isStrictTest) {
            await database.prepare("DELETE FROM password_reset_challenges WHERE token_hash = ?")
              .run(hashToken(token, config.sessionSecret));
            return response.json({ message: genericMessage });
          }
          resetDelivered = false;
        }
      }

      if (config.allowDemo2FA || config.nodeEnv !== "production") {
        console.log(`[2FA PASSWORD RESET] Code for ${user.email}: ${code} (SMTP delivery: ${resetDelivered ? "sent" : "skipped/failed"})`);
      }

      setPasswordResetCookie(response, token);
      const showResetDemoCode = config.allowDemo2FA || (!resetDelivered && config.nodeEnv !== "production");
      return response.json({
        message: genericMessage,
        demoCode: undefined,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/reset-password", passwordResetLimiter, async (request, response, next) => {
    try {
      const password = typeof request.body.password === "string" ? request.body.password : "";
      if (password.length < 12 || password.length > 128) {
        throw httpError(400, "Choose a password between 12 and 128 characters.");
      }
      const code = typeof request.body.code === "string" ? request.body.code.trim() : "";
      const token = readCookie(request, passwordResetCookie);
      if (!token || !/^[A-Za-z0-9_-]{40,64}$/.test(token)) {
        clearPasswordResetCookie(response);
        throw httpError(401, "That reset code is invalid or expired. Start password recovery again.");
      }

      const credential = await hashPassword(password, config.passwordPepper);
      let result = "invalid";
      await withTransaction(database, async (transaction) => {
        const challenge = await findPasswordResetChallenge(request, transaction);
        if (!challenge || challenge.expires_at <= Date.now()) {
          if (challenge) {
            await transaction.prepare("DELETE FROM password_reset_challenges WHERE token_hash = ?").run(challenge.token_hash);
          }
        } else if (challenge.attempts >= 5) {
          await transaction.prepare("DELETE FROM password_reset_challenges WHERE token_hash = ?").run(challenge.token_hash);
          result = "locked";
        } else {
          const codeMatches = /^\d{6}$/.test(code)
            && safeEqualStrings(hashToken(code, config.sessionSecret), challenge.code_hash);
          if (!codeMatches) {
            const attempts = challenge.attempts + 1;
            await transaction.prepare("UPDATE password_reset_challenges SET attempts = ? WHERE token_hash = ?")
              .run(attempts, challenge.token_hash);
            if (attempts >= 5) {
              await transaction.prepare("DELETE FROM password_reset_challenges WHERE token_hash = ?").run(challenge.token_hash);
              result = "locked";
            }
          } else {
            await transaction.prepare("UPDATE users SET password_salt = ?, password_hash = ? WHERE id = ?")
              .run(credential.salt, credential.hash, challenge.user_id);
            await transaction.prepare("DELETE FROM password_reset_challenges WHERE user_id = ?").run(challenge.user_id);
            await transaction.prepare("DELETE FROM email_challenges WHERE user_id = ?").run(challenge.user_id);
            await transaction.prepare("DELETE FROM sessions WHERE user_id = ?").run(challenge.user_id);
            await logAction(challenge.user_id, "password_reset", challenge.email, transaction);
            result = "success";
          }
        }
      });

      if (result !== "success") {
        if (result === "locked") clearPasswordResetCookie(response);
        throw httpError(result === "locked" ? 429 : 401,
          result === "locked"
            ? "Too many reset-code attempts. Start password recovery again."
            : "That reset code is invalid or expired. Check it and try again.");
      }
      clearPasswordResetCookie(response);
      response.json({ message: "Password updated. Sign in with your new password and complete email verification." });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/resend-code", verificationLimiter, async (request, response, next) => {
    try {
      const challenge = await findChallenge(request);
      if (!challenge || challenge.expires_at <= Date.now()) {
        clearChallengeCookie(response);
        throw httpError(401, "This verification step expired. Sign in again.");
      }

      const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
      await database.prepare(`
        UPDATE email_challenges
        SET code_hash = ?, expires_at = ?, attempts = 0
        WHERE token_hash = ?
      `).run(
        hashToken(code, config.sessionSecret),
        Date.now() + CHALLENGE_LIFETIME_MS,
        challenge.token_hash
      );

      let emailDelivered = false;
      let emailDeliveryError = null;
      if (emailService.configured) {
        try {
          await emailService.sendVerificationCode(challenge.email, code);
          emailDelivered = true;
        } catch (error) {
          emailDeliveryError = error;
          console.error("Email resend delivery failed:", error.code || error.name || error.message);
          const isStrictTest = config.nodeEnv === "test" && !config.allowDemo2FA;
          if (isStrictTest) {
            throw httpError(503, "We could not resend a verification code. Try again later.");
          }
        }
      }

      if (config.allowDemo2FA || config.nodeEnv !== "production") {
        console.log(`[2FA RESEND] New verification code for ${challenge.email}: ${code} (SMTP delivery: ${emailDelivered ? "sent" : "skipped/failed"})`);
      }

      const showDemoCode = config.allowDemo2FA || (!emailDelivered && config.nodeEnv !== "production");
      response.json({
        message: "A new verification code has been dispatched. Please check your inbox and spam folder.",
        demoCode: undefined,
        liveEmailDelivery: emailDelivered,
        emailDeliveryError: emailDeliveryError ? (emailDeliveryError.code || "DELIVERY_FAILED") : undefined,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/verify-email", verificationLimiter, async (request, response, next) => {
    try {
      const challenge = await findChallenge(request);
      if (!challenge || challenge.expires_at <= Date.now()) {
        clearChallengeCookie(response);
        throw httpError(401, "This verification step expired. Sign in again.");
      }
      if (challenge.attempts >= 5) {
        await database.prepare("DELETE FROM email_challenges WHERE token_hash = ?").run(challenge.token_hash);
        clearChallengeCookie(response);
        throw httpError(429, "Too many verification attempts. Sign in again.");
      }
      const code = typeof request.body.code === "string" ? request.body.code.trim() : "";
      const codeMatches = /^\d{6}$/.test(code)
        && safeEqualStrings(hashToken(code, config.sessionSecret), challenge.code_hash);
      if (!codeMatches) {
        const attempts = challenge.attempts + 1;
        await database.prepare("UPDATE email_challenges SET attempts = ? WHERE token_hash = ?")
          .run(attempts, challenge.token_hash);
        if (attempts >= 5) {
          await database.prepare("DELETE FROM email_challenges WHERE token_hash = ?").run(challenge.token_hash);
          clearChallengeCookie(response);
        }
        throw httpError(401, "That code is incorrect or expired. Check your email and try again.");
      }

      await database.prepare("DELETE FROM email_challenges WHERE token_hash = ?").run(challenge.token_hash);
      clearChallengeCookie(response);

      const remember = request.body.remember === true;
      const lifetime = remember ? REMEMBERED_SESSION_LIFETIME_MS : SESSION_LIFETIME_MS;
      const sessionToken = createSessionToken();
      await database.prepare("INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
        .run(hashToken(sessionToken, config.sessionSecret), challenge.user_id, Date.now() + lifetime, Date.now());
      response.cookie(sessionCookie, sessionToken, { ...cookieBase, maxAge: lifetime });
      response.json({ user: { id: challenge.user_id, email: challenge.email, role: challenge.role } });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/auth/me", authenticate, (request, response) => {
    response.json({ user: request.user });
  });

  app.post("/api/auth/logout", authenticate, async (request, response) => {
    await database.prepare("DELETE FROM sessions WHERE token_hash = ?")
      .run(hashToken(readCookie(request, sessionCookie), config.sessionSecret));
    response.clearCookie(sessionCookie, cookieBase);
    response.status(204).end();
  });

  app.get("/api/users", authenticate, allowRoles("admin", "manager"), async (request, response) => {
    const users = request.user.role === "admin"
      ? await database.prepare("SELECT id, email, role, created_at FROM users ORDER BY id").all()
      : await database.prepare("SELECT id, email, role, created_at FROM users WHERE role != 'admin' ORDER BY id").all();
    response.json({ users: users.map(publicUser) });
  });

  app.get("/api/customers", authenticate, allowRoles("admin", "manager", "staff"), async (request, response) => {
    const customers = await database.prepare("SELECT id, email, role, created_at FROM users WHERE role = 'customer' ORDER BY id").all();
    response.json({ customers: customers.map(publicUser) });
  });

  app.post("/api/users", authenticate, managementLimiter, allowRoles("admin", "manager"), async (request, response, next) => {
    try {
      const email = typeof request.body.email === "string" ? request.body.email.trim().toLowerCase() : "";
      const password = typeof request.body.password === "string" ? request.body.password : "";
      const role = typeof request.body.role === "string" ? request.body.role : "";
      if (!EMAIL_PATTERN.test(email) || email.length > 254) throw httpError(400, "Enter a valid email address.");
      if (password.length < 12 || password.length > 128) {
        throw httpError(400, "Choose a password between 12 and 128 characters.");
      }
      const assignableRoles = request.user.role === "admin"
        ? ["manager", "staff", "customer"]
        : ["staff", "customer"];
      if (!assignableRoles.includes(role)) throw httpError(403, "Your role cannot assign that access level.");
      const credential = await hashPassword(password, config.passwordPepper);
      const created = await database.prepare(`
        INSERT INTO users (email, password_salt, password_hash, role) VALUES (?, ?, ?, ?)
        RETURNING id
      `).run(email, credential.salt, credential.hash, role);
      await logAction(request.user.id, "user_created", email);
      response.status(201).json({ user: { id: Number(created.lastInsertRowid), email, role } });
    } catch (error) {
      if (isUniqueConstraint(error)) return next(httpError(409, "That email already has an account."));
      next(error);
    }
  });

  app.patch("/api/users/:id/role", authenticate, managementLimiter, allowRoles("admin"), async (request, response, next) => {
    try {
      const id = Number(request.params.id);
      const role = request.body.role;
      if (!Number.isSafeInteger(id) || id < 1 || !ROLES.includes(role)) {
        throw httpError(400, "Choose a valid user and access level.");
      }
      const target = await database.prepare("SELECT id, email, role FROM users WHERE id = ?").get(id);
      if (!target) throw httpError(404, "User not found.");
      if (target.role === "admin" && role !== "admin") {
        const adminCount = Number((await database.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'").get()).count);
        if (adminCount <= 1) throw httpError(409, "The last administrator cannot be demoted.");
      }
      await database.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, id);
      await logAction(request.user.id, "user_role_changed", `${target.email}:${target.role}->${role}`);
      response.json({ user: { id, email: target.email, role } });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/users/:id", authenticate, managementLimiter, allowRoles("admin"), async (request, response, next) => {
    try {
      const id = Number(request.params.id);
      if (!Number.isSafeInteger(id) || id < 1) throw httpError(400, "Choose a valid account.");
      const target = await database.prepare("SELECT id, email, role, created_at FROM users WHERE id = ?").get(id);
      if (!target) throw httpError(404, "Account not found.");
      if (target.role === "admin") {
        throw httpError(403, "Administrator accounts cannot be permanently deleted here.");
      }

      await withTransaction(database, async (transaction) => {
        await transaction.prepare(`
          INSERT INTO deleted_users (
            original_user_id, email, role, user_created_at,
            deleted_by_admin_id, deleted_by_email, deleted_at, reason
          ) VALUES (?, ?, ?, ?, ?, ?, (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')), ?)
        `).run(
          target.id,
          target.email,
          target.role,
          target.created_at,
          request.user.id,
          request.user.email,
          (typeof request.body.reason === "string" && request.body.reason.trim()) || "Deleted by administrator"
        );
        await logAction(request.user.id, "user_account_deleted", `${target.email}:${target.role}`, transaction);
        await transaction.prepare("DELETE FROM users WHERE id = ?").run(target.id);
      });
      response.json({
        message: "Account permanently deleted and archived.",
        user: { id: target.id, email: target.email, role: target.role }
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/deleted-users", authenticate, allowRoles("admin"), async (request, response) => {
    const deletedUsers = await database.prepare(`
      SELECT id, original_user_id, email, role, user_created_at,
             deleted_by_admin_id, deleted_by_email, deleted_at, reason
      FROM deleted_users
      ORDER BY id DESC
    `).all();
    response.json({ deletedUsers });
  });

  app.get("/api/preferences", async (request, response) => {
    const prefs = await database.prepare("SELECT theme, mode, language, time_format, updated_at FROM system_preferences WHERE id = 1").get();
    response.json({ preferences: prefs || { theme: "emerald", mode: "auto", language: "en", time_format: "12h" } });
  });

  app.patch("/api/preferences", async (request, response) => {
    const { theme, mode, language, time_format } = request.body || {};
    const current = (await database.prepare("SELECT * FROM system_preferences WHERE id = 1").get())
      || { theme: "emerald", mode: "auto", language: "en", time_format: "12h" };
    const newTheme = typeof theme === "string" ? theme : current.theme;
    const newMode = ["light", "dark", "auto"].includes(mode) ? mode : current.mode;
    const newLang = ["en", "fr", "es", "de", "zh", "ja", "ar", "pt", "it", "ru"].includes(language) ? language : current.language;
    const newTime = ["12h", "24h"].includes(time_format) ? time_format : current.time_format;
    await database.prepare(`
      UPDATE system_preferences
      SET theme = ?, mode = ?, language = ?, time_format = ?, updated_at = (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      WHERE id = 1
    `).run(newTheme, newMode, newLang, newTime);
    response.json({
      message: "Preferences updated.",
      preferences: { theme: newTheme, mode: newMode, language: newLang, time_format: newTime }
    });
  });

  app.post("/api/preferences/restore", async (request, response) => {
    await database.prepare(`
      UPDATE system_preferences
      SET theme = 'emerald', mode = 'auto', language = 'en', time_format = '12h',
          updated_at = (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      WHERE id = 1
    `).run();
    response.json({
      message: "System preferences restored to factory defaults without altering any accounts, rooms, or booking data.",
      preferences: { theme: "emerald", mode: "auto", language: "en", time_format: "12h" }
    });
  });

  app.get("/api/rooms", async (request, response) => {
    const { status, type } = request.query;
    let query = "SELECT id, room_number, room_type, price_per_night, capacity, amenities, status, description, image_url, created_at FROM rooms WHERE 1=1";
    const params = [];
    if (status) {
      query += " AND status = ?";
      params.push(status);
    }
    if (type) {
      query += " AND room_type = ?";
      params.push(type);
    }
    query += " ORDER BY room_number ASC";
    const rooms = await database.prepare(query).all(...params);
    response.json({ rooms });
  });

  app.post("/api/rooms", authenticate, managementLimiter, allowRoles("admin", "manager"), async (request, response, next) => {
    try {
      const roomNumber = String(request.body.room_number || "").trim();
      const roomType = String(request.body.room_type || "").trim();
      const pricePerNight = Number(request.body.price_per_night);
      const capacity = Number(request.body.capacity) || 2;
      const amenities = String(request.body.amenities || "").trim();
      const status = String(request.body.status || "available").trim();
      const description = String(request.body.description || "").trim();
      const imageUrl = String(request.body.image_url || "").trim();

      if (!roomNumber || !roomType || !Number.isFinite(pricePerNight) || pricePerNight <= 0) {
        throw httpError(400, "Provide a valid room number, room type, and price per night.");
      }
      if (!["available", "occupied", "maintenance", "cleaning"].includes(status)) {
        throw httpError(400, "Invalid room status.");
      }
      const result = await database.prepare(`
        INSERT INTO rooms (room_number, room_type, price_per_night, capacity, amenities, status, description, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(roomNumber, roomType, pricePerNight, capacity, amenities, status, description, imageUrl);

      await logAction(request.user.id, "room_created", `Room ${roomNumber} (${roomType})`);
      response.status(201).json({
        room: {
          id: Number(result.lastInsertRowid),
          room_number: roomNumber,
          room_type: roomType,
          price_per_night: pricePerNight,
          capacity,
          amenities,
          status,
          description,
          image_url: imageUrl,
        }
      });
    } catch (error) {
      if (isUniqueConstraint(error)) return next(httpError(409, "A room with that number already exists."));
      next(error);
    }
  });

  app.patch("/api/rooms/:id", authenticate, managementLimiter, allowRoles("admin", "manager"), async (request, response, next) => {
    try {
      const id = Number(request.params.id);
      if (!Number.isSafeInteger(id) || id < 1) throw httpError(400, "Invalid room ID.");
      const room = await database.prepare("SELECT * FROM rooms WHERE id = ?").get(id);
      if (!room) throw httpError(404, "Room not found.");

      const roomType = typeof request.body.room_type === "string" ? request.body.room_type.trim() : room.room_type;
      const pricePerNight = request.body.price_per_night !== undefined ? Number(request.body.price_per_night) : room.price_per_night;
      const capacity = request.body.capacity !== undefined ? Number(request.body.capacity) : room.capacity;
      const amenities = typeof request.body.amenities === "string" ? request.body.amenities.trim() : room.amenities;
      const status = typeof request.body.status === "string" ? request.body.status.trim() : room.status;
      const description = typeof request.body.description === "string" ? request.body.description.trim() : room.description;

      if (!["available", "occupied", "maintenance", "cleaning"].includes(status)) {
        throw httpError(400, "Invalid room status.");
      }
      if (!Number.isFinite(pricePerNight) || pricePerNight <= 0) {
        throw httpError(400, "Price per night must be positive.");
      }

      await database.prepare(`
        UPDATE rooms
        SET room_type = ?, price_per_night = ?, capacity = ?, amenities = ?, status = ?, description = ?
        WHERE id = ?
      `).run(roomType, pricePerNight, capacity, amenities, status, description, id);

      await logAction(request.user.id, "room_updated", `Room ${room.room_number}: status=${status}, price=${pricePerNight}`);
      response.json({
        room: { ...room, room_type: roomType, price_per_night: pricePerNight, capacity, amenities, status, description }
      });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/rooms/:id", authenticate, managementLimiter, allowRoles("admin"), async (request, response, next) => {
    try {
      const id = Number(request.params.id);
      if (!Number.isSafeInteger(id) || id < 1) throw httpError(400, "Invalid room ID.");
      const room = await database.prepare("SELECT * FROM rooms WHERE id = ?").get(id);
      if (!room) throw httpError(404, "Room not found.");

      const activeBookings = Number((await database.prepare(`
        SELECT COUNT(*) AS count FROM bookings WHERE room_id = ? AND status IN ('confirmed', 'checked-in')
      `).get(id)).count);
      if (activeBookings > 0) {
        throw httpError(409, "Cannot remove a room that currently has confirmed or active checked-in bookings.");
      }

      await database.prepare("DELETE FROM rooms WHERE id = ?").run(id);
      await logAction(request.user.id, "room_deleted", `Room ${room.room_number} (${room.room_type})`);
      response.json({ message: "Room removed successfully.", room });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/bookings", authenticate, async (request, response) => {
    let query = `
      SELECT b.id, b.booking_reference, b.user_id, b.guest_name, b.guest_email, b.guest_phone,
             b.room_id, b.check_in_date, b.check_out_date, b.num_guests, b.total_price,
             b.status, b.special_requests, b.created_at,
             r.room_number, r.room_type, r.price_per_night
      FROM bookings b
      JOIN rooms r ON r.id = b.room_id
    `;
    const params = [];
    if (request.user.role === "customer") {
      query += " WHERE (b.user_id = ? OR LOWER(b.guest_email) = LOWER(?))";
      params.push(request.user.id, request.user.email);
    } else {
      query += " WHERE 1=1";
    }
    const { status, q } = request.query;
    if (status) {
      query += " AND b.status = ?";
      params.push(status);
    }
    if (q) {
      query += " AND (b.booking_reference LIKE ? OR b.guest_name LIKE ? OR b.guest_email LIKE ? OR r.room_number LIKE ?)";
      const pattern = `%${q}%`;
      params.push(pattern, pattern, pattern, pattern);
    }
    query += " ORDER BY b.id DESC LIMIT 200";
    const bookings = await database.prepare(query).all(...params);
    response.json({ bookings });
  });

  app.post("/api/bookings", authenticate, managementLimiter, async (request, response, next) => {
    try {
      const roomId = Number(request.body.room_id);
      const checkInDate = String(request.body.check_in_date || "").trim();
      const checkOutDate = String(request.body.check_out_date || "").trim();
      const numGuests = Number(request.body.num_guests) || 1;
      const specialRequests = String(request.body.special_requests || "").trim();

      const guestName = String(
        request.user.role === "customer"
          ? (request.body.guest_name || request.user.email.split("@")[0])
          : (request.body.guest_name || "")
      ).trim();

      const guestEmail = String(
        request.user.role === "customer"
          ? request.user.email
          : (request.body.guest_email || request.user.email)
      ).trim().toLowerCase();

      const guestPhone = String(request.body.guest_phone || "").trim();

      if (!guestName || !EMAIL_PATTERN.test(guestEmail)) {
        throw httpError(400, "A valid guest name and email are required for booking.");
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(checkInDate) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOutDate)) {
        throw httpError(400, "Check-in and check-out dates must be formatted as YYYY-MM-DD.");
      }
      if (checkInDate >= checkOutDate) {
        throw httpError(400, "Check-out date must be after check-in date.");
      }

      const room = await database.prepare("SELECT * FROM rooms WHERE id = ?").get(roomId);
      if (!room) throw httpError(404, "Selected room was not found.");
      if (room.status === "maintenance") {
        throw httpError(409, "This room is currently under maintenance and cannot be reserved.");
      }

      const overlap = await database.prepare(`
        SELECT COUNT(*) AS count FROM bookings
        WHERE room_id = ?
          AND status IN ('confirmed', 'checked-in')
          AND NOT (check_out_date <= ? OR check_in_date >= ?)
      `).get(roomId, checkInDate, checkOutDate);

      if (Number(overlap.count) > 0) {
        throw httpError(409, "This room is already reserved for the selected dates. Please choose different dates or another room.");
      }

      const checkInMs = new Date(checkInDate).getTime();
      const checkOutMs = new Date(checkOutDate).getTime();
      const nights = Math.max(1, Math.round((checkOutMs - checkInMs) / (24 * 60 * 60 * 1000)));
      const totalPrice = Number((nights * room.price_per_night).toFixed(2));
      const reference = `MKH-${randomInt(100000, 999999)}`;

      const userId = request.user.role === "customer" ? request.user.id : (request.body.user_id || null);

      const result = await database.prepare(`
        INSERT INTO bookings (
          booking_reference, user_id, guest_name, guest_email, guest_phone,
          room_id, check_in_date, check_out_date, num_guests, total_price,
          status, special_requests
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)
      `).run(
        reference,
        userId,
        guestName,
        guestEmail,
        guestPhone,
        roomId,
        checkInDate,
        checkOutDate,
        numGuests,
        totalPrice,
        specialRequests
      );

      await logAction(request.user.id, "booking_created", `${reference}: Room ${room.room_number} for ${guestName} (${nights} nights)`);

      response.status(201).json({
        booking: {
          id: Number(result.lastInsertRowid),
          booking_reference: reference,
          guest_name: guestName,
          guest_email: guestEmail,
          guest_phone: guestPhone,
          room_id: roomId,
          room_number: room.room_number,
          room_type: room.room_type,
          check_in_date: checkInDate,
          check_out_date: checkOutDate,
          num_guests: numGuests,
          total_price: totalPrice,
          status: "confirmed",
          special_requests: specialRequests,
        }
      });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/bookings/:id/status", authenticate, managementLimiter, async (request, response, next) => {
    try {
      const id = Number(request.params.id);
      const newStatus = String(request.body.status || "").trim();
      if (!["confirmed", "checked-in", "checked-out", "cancelled"].includes(newStatus)) {
        throw httpError(400, "Invalid booking status.");
      }
      const booking = await database.prepare("SELECT * FROM bookings WHERE id = ?").get(id);
      if (!booking) throw httpError(404, "Booking not found.");

      if (request.user.role === "customer") {
        if (booking.user_id !== request.user.id && booking.guest_email.toLowerCase() !== request.user.email.toLowerCase()) {
          throw httpError(403, "You can only manage your own bookings.");
        }
        if (newStatus !== "cancelled") {
          throw httpError(403, "Customers can only cancel confirmed bookings.");
        }
        if (booking.status !== "confirmed") {
          throw httpError(400, "Only confirmed bookings can be cancelled.");
        }
      }

      await withTransaction(database, async (transaction) => {
        await transaction.prepare("UPDATE bookings SET status = ? WHERE id = ?").run(newStatus, id);
        if (newStatus === "checked-in") {
          await transaction.prepare("UPDATE rooms SET status = 'occupied' WHERE id = ?").run(booking.room_id);
        } else if (newStatus === "checked-out") {
          await transaction.prepare("UPDATE rooms SET status = 'cleaning' WHERE id = ?").run(booking.room_id);
        } else if (newStatus === "cancelled" && booking.status === "checked-in") {
          await transaction.prepare("UPDATE rooms SET status = 'available' WHERE id = ?").run(booking.room_id);
        }
        await logAction(request.user.id, "booking_status_changed", `${booking.booking_reference}:${booking.status}->${newStatus}`, transaction);
      });

      response.json({
        message: `Booking ${booking.booking_reference} status updated to ${newStatus}.`,
        booking: { ...booking, status: newStatus }
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/audit", authenticate, allowRoles("admin", "manager"), async (request, response) => {
    const events = await database.prepare(`
      SELECT audit_events.id, audit_events.action, audit_events.subject, audit_events.created_at,
             users.email AS actor_email
      FROM audit_events LEFT JOIN users ON users.id = audit_events.actor_user_id
      ORDER BY audit_events.id DESC LIMIT 100
    `).all();
    response.json({ events });
  });

  app.get("/api/backups/status", authenticate, allowRoles("admin"), (request, response) => {
    response.json({
      cloudEnabled: backupService.status.cloudEnabled,
      lastBackupAt: backupService.status.lastBackupAt,
      lastBackupError: backupService.status.lastBackupError ? "The most recent backup failed." : null,
    });
  });

  app.post("/api/backups/run", authenticate, managementLimiter, allowRoles("admin"), async (request, response, next) => {
    try {
      await backupService.createBackup();
      response.json({ message: "Encrypted backup created.", lastBackupAt: backupService.status.lastBackupAt });
    } catch (error) {
      console.error("Manual backup failed:", error.message);
      next(httpError(503, "Backup failed. Check server configuration and logs."));
    }
  });

  app.use((request, response) => response.status(404).json({ error: "Not found." }));
  app.use((error, request, response, next) => {
    if (response.headersSent) return next(error);
    if (error.status && error.status <= 503) return response.status(error.status).json({ error: error.message });
    if (isUniqueConstraint(error)) return response.status(409).json({ error: "That email already has an account." });
    console.error("Request failed:", error.stack || error.message);
    response.status(500).json({ error: "The request could not be completed." });
  });

  return app;
}

async function startServer() {
  const config = getConfig();
  if (!Number.isFinite(config.port) || config.port < 1 || config.port > 65535) throw new Error("PORT must be a valid TCP port");
  if (!Number.isFinite(config.backupIntervalHours) || config.backupIntervalHours < 1) {
    throw new Error("BACKUP_INTERVAL_HOURS must be at least 1");
  }
  if (!Number.isInteger(config.backupKeepLocal) || config.backupKeepLocal < 1) {
    throw new Error("BACKUP_KEEP_LOCAL must be a positive integer");
  }

  const database = openDatabase(config.databasePath);
  const dummyCredential = await hashPassword(randomBytes(32).toString("hex"), config.passwordPepper);
  const emailService = createEmailService(config);
  const backupService = createBackupService({
    database,
    encryptionKey: config.backupEncryptionKey,
    backupDir: config.backupDir,
    keepLocal: config.backupKeepLocal,
    bucket: config.backupBucket,
    region: config.awsRegion,
    endpoint: config.awsEndpoint,
  });
  const app = createApp({ database, config, backupService, dummyCredential, emailService });
  const server = app.listen(config.port, config.host, () => {
    console.log(`Beatrice login listening on http://${config.host}:${config.port}`);
    console.log(emailService.configured
      ? "Email OTP delivery is configured."
      : "Email OTP delivery is disabled. Configure Gmail API OAuth credentials or complete SMTP settings.");
    console.log(config.backupBucket
      ? "Encrypted automatic backups: local plus configured S3-compatible bucket."
      : "Encrypted automatic backups: local only. Set BACKUP_S3_BUCKET and AWS credentials to enable cloud copies.");
    backupService.start(config.backupIntervalHours);
  });

  function shutdown() {
    backupService.stop();
    server.close(() => {
      emailService.close();
      database.close();
      process.exit(0);
    });
  }
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Could not start Beatrice login:", error.message);
    process.exitCode = 1;
  });
}

module.exports = { createApp, getConfig, startServer };
