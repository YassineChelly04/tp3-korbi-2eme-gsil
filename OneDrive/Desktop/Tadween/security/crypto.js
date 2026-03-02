const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const sodium = require("libsodium-wrappers");
const { deriveKeyFromPassword, ensureReady } = require("./key-derivation");

let sessionKey = null;
let currentUserId = null;
let stateData = null; // { accounts: { [hash]: { masterSalt, testCipher, testNonce } } }

const STATE_FILE = path.join(process.cwd(), "parfait_crypto_state.json");

function hashUsername(username) {
  return crypto.createHash("sha256").update(username.toLowerCase().trim()).digest("hex");
}

function loadStateFile() {
  if (!fs.existsSync(STATE_FILE)) {
    stateData = { accounts: {} };
    return;
  }
  const raw = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
  // Migrate old single-account format to multi-account
  if (raw.masterSalt && !raw.accounts) {
    const legacyAccount = {
      masterSalt: raw.masterSalt,
      testCipher: raw.testCipher || null,
      testNonce: raw.testNonce || null,
    };
    stateData = { accounts: { default: legacyAccount } };
    saveStateFile();
  } else {
    stateData = raw.accounts ? raw : { accounts: {} };
  }
}

function saveStateFile() {
  fs.writeFileSync(STATE_FILE, JSON.stringify(stateData, null, 2));
}

async function initCrypto() {
  await ensureReady();
  loadStateFile();
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

async function loginAccount(username, password) {
  if (!stateData) await initCrypto();
  const S = sodium.default || sodium;
  const userId = hashUsername(username);
  const account = stateData.accounts[userId];

  if (account) {
    // Existing account — verify password
    const salt = Buffer.from(account.masterSalt, "base64");
    const key = await deriveKeyFromPassword(password, salt);
    if (!account.testCipher || !account.testNonce) {
      return { success: false, userId };
    }
    try {
      const tc = Buffer.from(account.testCipher, "base64");
      const tn = Buffer.from(account.testNonce, "base64");
      const txt = decryptWithKey(key, tc, tn);
      if (txt !== "parfait-test") {
        return { success: false, userId };
      }
    } catch {
      return { success: false, userId };
    }
    sessionKey = key;
    currentUserId = userId;
    return { success: true, userId };
  }

  // New account — generate salt, derive key, create test cipher
  const saltLength = S.crypto_pwhash_SALTBYTES || 16;
  const salt = Buffer.from(S.randombytes_buf(saltLength));
  const key = await deriveKeyFromPassword(password, salt);
  const { ciphertext, nonce } = encryptWithKey(key, "parfait-test");
  stateData.accounts[userId] = {
    masterSalt: salt.toString("base64"),
    testCipher: ciphertext.toString("base64"),
    testNonce: nonce.toString("base64"),
  };
  saveStateFile();
  sessionKey = key;
  currentUserId = userId;
  return { success: true, userId };
}

function getCurrentUserId() {
  return currentUserId;
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
  currentUserId = null;
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
  loginAccount,
  getCurrentUserId,
  clearSessionKey,
  encryptContent,
  decryptContent,
};

