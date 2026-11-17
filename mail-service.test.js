const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createEmailService,
  encodeMessage,
  normalizeSmtpPassword,
  toBase64Url,
} = require("./mail-service");

const smtpConfig = {
  smtpHost: "mail.example.test",
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: "mailer@example.test",
  smtpPassword: "provider-app-password",
  smtpFrom: "Beatrice <login@example.test>",
};

test("Gmail app passwords ignore the grouping spaces shown by Google", () => {
  assert.equal(normalizeSmtpPassword("smtp.gmail.com", "abcd efgh ijkl mnop"), "abcdefghijklmnop");
  assert.equal(normalizeSmtpPassword("mail.example.test", " pass word "), " pass word ");
});

test("email service sends a short-lived sign-in code through its configured transport", async () => {
  const messages = [];
  const service = createEmailService(smtpConfig, {
    transport: { async sendMail(message) { messages.push(message); } },
  });
  assert.equal(service.configured, true);
  await service.sendVerificationCode("customer@example.test", "004217");
  assert.equal(messages.length, 1);
  assert.equal(messages[0].to, "customer@example.test");
  assert.match(messages[0].subject, /MOM'S KID HOTEL/i);
  assert.match(messages[0].subject, /sign-in code/i);
  assert.match(messages[0].text, /004217/);
  assert.match(messages[0].text, /5 minutes/);
  assert.equal(messages[0].text.includes(smtpConfig.smtpPassword), false);
});

test("email service reports missing SMTP without exposing a code", async () => {
  const service = createEmailService({ smtpHost: "", smtpPort: 587, smtpFrom: "" });
  assert.equal(service.configured, false);
  await assert.rejects(service.sendVerificationCode("customer@example.test", "123456"), {
    code: "EMAIL_NOT_CONFIGURED",
  });
});

test("email service sends a short-lived password reset code", async () => {
  const messages = [];
  const service = createEmailService(smtpConfig, {
    transport: { async sendMail(message) { messages.push(message); } },
  });
  await service.sendPasswordResetCode("customer@example.test", "002468");
  assert.equal(messages.length, 1);
  assert.equal(messages[0].to, "customer@example.test");
  assert.match(messages[0].subject, /password reset/i);
  assert.match(messages[0].text, /002468/);
  assert.match(messages[0].text, /10 minutes/);
  assert.equal(messages[0].text.includes(smtpConfig.smtpPassword), false);
});

test("partial SMTP credentials disable email delivery without preventing startup", async () => {
  const service = createEmailService({
    smtpHost: "mail.example.test",
    smtpPort: 587,
    smtpFrom: "login@example.test",
    smtpUser: "mailer",
    smtpPassword: "",
  });
  assert.equal(service.configured, false);
  await assert.rejects(service.sendVerificationCode("customer@example.test", "123456"), {
    code: "EMAIL_NOT_CONFIGURED",
  });
});

test("Gmail API delivery refreshes OAuth and sends a base64url MIME message", async () => {
  const calls = [];
  const config = {
    emailTransport: "gmail-api",
    gmailUser: "mailer@example.test",
    gmailClientId: "oauth-client-id",
    gmailClientSecret: "oauth-client-secret",
    gmailRefreshToken: "oauth-refresh-token",
  };
  const service = createEmailService(config, {
    async fetch(url, options) {
      calls.push({ url, options });
      return url.endsWith("/token")
        ? { ok: true, async json() { return { access_token: "short-lived-access-token" }; } }
        : { ok: true, async json() { return { id: "message-id" }; } };
    },
  });

  assert.equal(service.configured, true);
  await service.sendVerificationCode("customer@example.test", "004217");
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, "https://oauth2.googleapis.com/token");
  assert.equal(calls[1].url, "https://gmail.googleapis.com/gmail/v1/users/me/messages/send");
  assert.equal(calls[1].options.headers.authorization, "Bearer short-lived-access-token");
  const { raw } = JSON.parse(calls[1].options.body);
  const decoded = Buffer.from(raw.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
  assert.match(decoded, /From: mailer@example\.test/);
  assert.ok(decoded.includes(Buffer.from("004217").toString("base64")));
  assert.equal(decoded.includes("oauth-client-secret"), false);
  assert.equal(decoded.includes("oauth-refresh-token"), false);
});

test("Gmail API reports authorization rejection without exposing credentials", async () => {
  const service = createEmailService({
    emailTransport: "gmail-api",
    gmailUser: "mailer@example.test",
    gmailClientId: "oauth-client-id",
    gmailClientSecret: "oauth-client-secret",
    gmailRefreshToken: "oauth-refresh-token",
  }, {
    async fetch(url) {
      return url.endsWith("/token")
        ? { ok: true, async json() { return { access_token: "short-lived-access-token" }; } }
        : { ok: false, status: 403 };
    },
  });
  await assert.rejects(service.sendVerificationCode("customer@example.test", "123456"), {
    code: "GMAIL_API_403",
  });
});

test("explicit Gmail API mode remains disabled until all OAuth settings are present", async () => {
  const service = createEmailService({
    emailTransport: "gmail-api",
    gmailUser: "mailer@example.test",
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpUser: "mailer@example.test",
    smtpPassword: "old-app-password",
    smtpFrom: "mailer@example.test",
  });
  assert.equal(service.configured, false);
  await assert.rejects(service.sendVerificationCode("customer@example.test", "123456"), {
    code: "EMAIL_NOT_CONFIGURED",
  });
});

test("Gmail API MIME messages reject newlines in email headers", () => {
  assert.throws(() => encodeMessage({
    from: "sender@example.test\r\nBcc: attacker@example.test",
    to: "customer@example.test",
    subject: "Sign-in code",
    text: "123456",
    html: "<p>123456</p>",
  }), /Invalid email message header/);
  assert.match(toBase64Url("hello?"), /^[A-Za-z0-9_-]+$/);
});
