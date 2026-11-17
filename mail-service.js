const nodemailer = require("nodemailer");
const { randomBytes } = require("node:crypto");

function normalizeSmtpPassword(host, password) {
  return (host || "").toLowerCase() === "smtp.gmail.com"
    ? (password || "").replace(/\s/g, "")
    : password || "";
}

function base64Lines(value) {
  return Buffer.from(value, "utf8").toString("base64").match(/.{1,76}/g).join("\r\n");
}

function encodeMessage({ from, to, subject, text, html }) {
  if (/[\r\n]/.test(from) || /[\r\n]/.test(to) || /[\r\n]/.test(subject)) {
    throw new Error("Invalid email message header.");
  }
  const boundary = `alt_${randomBytes(18).toString("hex")}`;
  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    base64Lines(text),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    base64Lines(html),
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

function toBase64Url(value) {
  return Buffer.from(value, "utf8").toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function createEmailService(config, injected = {}) {
  const resendConfigured = Boolean(config.resendApiKey);
  const brevoConfigured = Boolean(config.brevoApiKey);
  const gmailConfigured = Boolean(
    config.gmailUser && config.gmailClientId && config.gmailClientSecret && config.gmailRefreshToken,
  );
  const smtpPassword = normalizeSmtpPassword(config.smtpHost, config.smtpPassword);
  const smtpAuthConfigured = Boolean(config.smtpUser && smtpPassword);
  const smtpConfigured = Boolean(
    config.smtpHost && config.smtpPort && config.smtpFrom && smtpAuthConfigured,
  );
  const useResend = config.emailTransport === "resend"
    || (resendConfigured && config.emailTransport !== "gmail-api" && config.emailTransport !== "brevo" && !smtpConfigured);
  const useBrevo = config.emailTransport === "brevo"
    || (!config.emailTransport && !resendConfigured && brevoConfigured);
  const useGmailApi = config.emailTransport === "gmail-api"
    || (!config.emailTransport && !resendConfigured && !brevoConfigured && gmailConfigured);
  const configured = useResend
    ? resendConfigured
    : (useBrevo
      ? brevoConfigured
      : (useGmailApi ? gmailConfigured : smtpConfigured));
  const transport = injected.transport || (!useGmailApi && smtpConfigured
    ? nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: { user: config.smtpUser, pass: smtpPassword },
      ...(config.smtpSecure ? {} : { requireTLS: true }),
    })
    : null);
  const fetchImpl = injected.fetch || globalThis.fetch;

  async function sendWithResend(message) {
    if (!resendConfigured) {
      const error = new Error("Resend API key is not configured.");
      error.code = "EMAIL_NOT_CONFIGURED";
      throw error;
    }
    const fromAddr = (config.smtpFrom && !config.smtpFrom.includes("@gmail.com"))
      ? config.smtpFrom
      : "MOM'S KID HOTEL <onboarding@resend.dev>";
    const response = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.resendApiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddr,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || "Resend API rejected the email.");
      error.code = `RESEND_API_${response.status}`;
      throw error;
    }
  }

  async function sendWithBrevo(message) {
    if (!brevoConfigured) {
      const error = new Error("Brevo API key is not configured.");
      error.code = "EMAIL_NOT_CONFIGURED";
      throw error;
    }
    const sender = {
      name: "MOM'S KID HOTEL",
      email: config.smtpUser || config.initialAdminEmail || "appiahbeatrice444@gmail.com",
    };
    const response = await fetchImpl("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": config.brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender,
        to: [{ email: message.to }],
        subject: message.subject,
        textContent: message.text,
        htmlContent: message.html,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || "Brevo API rejected the email.");
      error.code = `BREVO_API_${response.status}`;
      throw error;
    }
  }

  async function sendWithGmailApi(message) {
    if (!gmailConfigured) {
      const error = new Error("Gmail API credentials are not configured.");
      error.code = "EMAIL_NOT_CONFIGURED";
      throw error;
    }
    const tokenResponse = await fetchImpl("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.gmailClientId,
        client_secret: config.gmailClientSecret,
        refresh_token: config.gmailRefreshToken,
        grant_type: "refresh_token",
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!tokenResponse.ok) {
      const error = new Error("Gmail OAuth token refresh failed.");
      error.code = `GMAIL_OAUTH_${tokenResponse.status}`;
      throw error;
    }
    const tokenData = await tokenResponse.json();
    if (typeof tokenData.access_token !== "string" || !tokenData.access_token) {
      const error = new Error("Gmail OAuth returned no access token.");
      error.code = "GMAIL_OAUTH_INVALID_RESPONSE";
      throw error;
    }
    const raw = encodeMessage({ from: config.gmailUser, ...message });
    const sendResponse = await fetchImpl("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        authorization: `Bearer ${tokenData.access_token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ raw: toBase64Url(raw) }),
      signal: AbortSignal.timeout(15000),
    });
    if (!sendResponse.ok) {
      const error = new Error("Gmail API rejected the email.");
      error.code = `GMAIL_API_${sendResponse.status}`;
      throw error;
    }
  }

  async function send(message) {
    if (!configured) {
      const error = new Error("Email delivery is not configured.");
      error.code = "EMAIL_NOT_CONFIGURED";
      throw error;
    }
    if (useResend) {
      try {
        return await sendWithResend(message);
      } catch (err) {
        if (transport) {
          console.warn("Resend failed (" + (err.code || err.message) + "), falling back to Gmail SMTP...");
          return await transport.sendMail({ from: config.smtpFrom, ...message });
        }
        throw err;
      }
    }
    if (useBrevo) return sendWithBrevo(message);
    if (useGmailApi) return sendWithGmailApi(message);
    if (!transport) {
      const error = new Error("SMTP transport is unavailable.");
      error.code = "EMAIL_TRANSPORT_UNAVAILABLE";
      throw error;
    }
    await transport.sendMail({ from: config.smtpFrom, ...message });
  }

  return {
    configured,
        async sendVerificationCode(email, code) {
      const isLocalDomain = (email || "").toLowerCase().endsWith(".local") || (email || "").toLowerCase().endsWith(".internal");
      const destination = (isLocalDomain && config.smtpUser) ? config.smtpUser : email;
      await send({
        to: destination,
        subject: "Your MOM'S KID HOTEL sign-in code",
        text: `Your MOM'S KID HOTEL sign-in code is ${code}. It expires in 5 minutes. If you did not request it, you can ignore this email. Do not share this code.`,
        html: `<p>Your MOM'S KID HOTEL sign-in code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>It expires in 5 minutes. If you did not request it, ignore this email. Do not share this code.</p>`,
      });
    },
    async sendPasswordResetCode(email, code) {
      const isLocalDomain = (email || "").toLowerCase().endsWith(".local") || (email || "").toLowerCase().endsWith(".internal");
      const destination = (isLocalDomain && config.smtpUser) ? config.smtpUser : email;
      await send({
        to: destination,
        subject: "Your MOM'S KID HOTEL password reset code",
        text: `Your MOM'S KID HOTEL password reset code is ${code}. It expires in 10 minutes. If you did not request a password reset, ignore this email. Do not share this code.`,
        html: `<p>Your MOM'S KID HOTEL password reset code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>It expires in 10 minutes. If you did not request a password reset, ignore this email. Do not share this code.</p>`,
      });
    },
    async close() {
      if (transport && typeof transport.close === "function") transport.close();
    },
  };
}

module.exports = { createEmailService, encodeMessage, normalizeSmtpPassword, toBase64Url };
