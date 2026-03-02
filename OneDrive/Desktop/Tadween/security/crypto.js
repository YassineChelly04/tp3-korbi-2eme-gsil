const path = require("path");
const fs = require("fs");
const sodium = require("libsodium-wrappers");
const { deriveKeyFromPassword, ensureReady } = require("./key-derivation");

let masterSalt = null;
let testCipher = null;
let testNonce = null;
let sessionKey = null;

const STATE_FILE = path.join(process.cwd(), "parfait_crypto_state.json");

async function initCrypto() {
  await ensureReady();
  const S = sodium.default || sodium;
  if (fs.existsSync(STATE_FILE)) {
    const raw = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
    masterSalt = Buffer.from(raw.masterSalt, "base64");
    testCipher = raw.testCipher
      ? Buffer.from(raw.testCipher, "base64")
      : null;
    testNonce = raw.testNonce ? Buffer.from(raw.testNonce, "base64") : null;
  } else {
    const saltLength = S.crypto_pwhash_SALTBYTES || 16;
    masterSalt = Buffer.from(S.randombytes_buf(saltLength));
    fs.writeFileSync(
      STATE_FILE,
      JSON.stringify({
        masterSalt: masterSalt.toString("base64"),
        // testCipher / testNonce seront créés au premier lancement réel
      })
    );
  }
}

async function deriveKeyFromPasswordWrapper(password) {
  if (!masterSalt) {
    await initCrypto();
  }
  return deriveKeyFromPassword(password, masterSalt);
}

function encryptWithKey(key, data) {
  const S = sodium.default || sodium;
  const nonce = S.randombytes_buf(S.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
  const ciphertext = S.crypto_aead_xchacha20poly1305_ietf_encrypt(
    Buffer.from(data, "utf-8"),
    null,
    null,
    nonce,
    key
  );
  return { ciphertext: Buffer.from(ciphertext), nonce: Buffer.from(nonce) };
}

function decryptWithKey(key, ciphertext, nonce) {
  const S = sodium.default || sodium;
  const clear = S.crypto_aead_xchacha20poly1305_ietf_decrypt(
    null,
    ciphertext,
    null,
    nonce,
    key
  );
  return Buffer.from(clear).toString("utf-8");
}

async function verifyPasswordWithTest(key, firstLaunch) {
  if (firstLaunch) {
    const { ciphertext, nonce } = encryptWithKey(key, "parfait-test");
    testCipher = ciphertext;
    testNonce = nonce;
    fs.writeFileSync(
      STATE_FILE,
      JSON.stringify({
        masterSalt: masterSalt.toString("base64"),
        testCipher: testCipher.toString("base64"),
        testNonce: testNonce.toString("base64"),
      })
    );
    return true;
  }

  try {
    if (!testCipher || !testNonce) {
      return false;
    }
    const txt = decryptWithKey(key, testCipher, testNonce);
    return txt === "parfait-test";
  } catch {
    return false;
  }
}

function setSessionKey(keyBuffer) {
  sessionKey = keyBuffer;
}

function clearSessionKey() {
  if (sessionKey) {
    try {
      const S = sodium.default || sodium;
      if (typeof S.memzero === "function") {
        S.memzero(sessionKey);
      } else {
        sessionKey.fill(0);
      }
    } catch {
      sessionKey.fill(0);
    }
    sessionKey = null;
  }
}

async function encryptContent(obj) {
  if (!sessionKey) {
    throw new Error("Session verrouillée");
  }
  const json = JSON.stringify(obj);
  const { ciphertext, nonce } = encryptWithKey(sessionKey, json);
  return {
    ciphertext: ciphertext.toString("base64"),
    nonce: nonce.toString("base64"),
  };
}

async function decryptContent(ciphertextB64, nonceB64) {
  if (!sessionKey) {
    throw new Error("Session verrouillée");
  }
  const ciphertext = Buffer.from(ciphertextB64, "base64");
  const nonce = Buffer.from(nonceB64, "base64");
  const clear = decryptWithKey(sessionKey, ciphertext, nonce);
  return JSON.parse(clear);
}

module.exports = {
  initCrypto,
  deriveKeyFromPassword: deriveKeyFromPasswordWrapper,
  setSessionKey,
  clearSessionKey,
  encryptContent,
  decryptContent,
  verifyPasswordWithTest,
};

