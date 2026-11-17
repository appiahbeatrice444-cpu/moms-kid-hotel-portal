const {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  scrypt: callbackScrypt,
  timingSafeEqual,
} = require("node:crypto");
const { promisify } = require("node:util");

const scrypt = promisify(callbackScrypt);
const SCRYPT_OPTIONS = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const PASSWORD_KEY_BYTES = 64;
const BACKUP_MAGIC = Buffer.from("BEA1");

function pepperedPassword(password, pepper) {
  return createHmac("sha256", pepper).update(password, "utf8").digest();
}

async function hashPassword(password, pepper) {
  const salt = randomBytes(16);
  const hash = await scrypt(pepperedPassword(password, pepper), salt, PASSWORD_KEY_BYTES, SCRYPT_OPTIONS);
  return { salt: salt.toString("hex"), hash: hash.toString("hex") };
}

async function verifyPassword(password, credential, pepper) {
  const salt = Buffer.from(credential.salt, "hex");
  const expected = Buffer.from(credential.hash, "hex");
  if (salt.length !== 16 || expected.length !== PASSWORD_KEY_BYTES) return false;
  const actual = await scrypt(pepperedPassword(password, pepper), salt, expected.length, SCRYPT_OPTIONS);
  return timingSafeEqual(actual, expected);
}

function encryptValue(plaintext, key, magic) {
  if (!Buffer.isBuffer(key) || key.length !== 32) throw new Error("Backup key must be 32 bytes");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([magic, iv, tag, ciphertext]);
}

function decryptValue(envelope, key, magic) {
  if (!Buffer.isBuffer(key) || key.length !== 32) throw new Error("Backup key must be 32 bytes");
  if (envelope.length < 32 || !envelope.subarray(0, 4).equals(magic)) {
    throw new Error("Invalid encrypted value");
  }
  const iv = envelope.subarray(4, 16);
  const tag = envelope.subarray(16, 32);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(envelope.subarray(32)), decipher.final()]);
}

function encryptBackup(plaintext, key) {
  return encryptValue(plaintext, key, BACKUP_MAGIC);
}

function decryptBackup(envelope, key) {
  return decryptValue(envelope, key, BACKUP_MAGIC);
}

function safeEqualStrings(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

function hashToken(token, secret) {
  return createHmac("sha256", secret).update(token).digest("hex");
}

function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

module.exports = {
  createSessionToken,
  decryptBackup,
  encryptBackup,
  hashPassword,
  hashToken,
  safeEqualStrings,
  verifyPassword,
};
