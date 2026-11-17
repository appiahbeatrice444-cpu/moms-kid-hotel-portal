const test = require("node:test");
const assert = require("node:assert/strict");
const {
  decryptBackup,
  encryptBackup,
  hashPassword,
  verifyPassword,
} = require("./security");

const pepper = Buffer.alloc(32, 0x5a);

test("password hashes use individual salts and verify only with the pepper", async () => {
  const first = await hashPassword("correct horse battery staple", pepper);
  const second = await hashPassword("correct horse battery staple", pepper);
  assert.notEqual(first.salt, second.salt);
  assert.notEqual(first.hash, second.hash);
  assert.equal(await verifyPassword("correct horse battery staple", first, pepper), true);
  assert.equal(await verifyPassword("correct horse battery staple", first, Buffer.alloc(32, 0x11)), false);
  assert.equal(await verifyPassword("wrong password", first, pepper), false);
});

test("AES-GCM backup encryption round-trips and detects tampering", () => {
  const key = Buffer.alloc(32, 0x42);
  const plaintext = Buffer.from("database snapshot");
  const encrypted = encryptBackup(plaintext, key);
  assert.deepEqual(decryptBackup(encrypted, key), plaintext);
  const tampered = Buffer.from(encrypted);
  tampered[tampered.length - 1] ^= 1;
  assert.throws(() => decryptBackup(tampered, key));
});

