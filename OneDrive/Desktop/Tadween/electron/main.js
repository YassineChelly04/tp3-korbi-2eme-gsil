const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
const { ZodError } = require("zod");
const {
  LoginSchema,
  ListNotesSchema,
  GetNoteSchema,
  UpdateNoteSchema,
  PinNoteSchema,
  NoteIdSchema,
  CreateFolderSchema,
  RenameFolderSchema,
  FolderIdSchema,
  SearchNotesSchema,
  ListVersionsSchema,
  CreateVersionSchema,
  RestoreVersionSchema,
} = require("./ipc-schemas");
const {
  initDb,
  listNotes,
  getNote,
  createNote,
  updateNote,
  pinNote,
  trashNote,
  restoreNote,
  deleteNote,
  listFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  searchNotes,
  rebuildSearchIndex,
  createVersion,
  listVersions,
  getVersion,
} = require("../database/db");
const {
  initCrypto,
  deriveKeyFromPassword,
  setSessionKey,
  clearSessionKey,
  encryptContent,
  decryptContent,
  verifyPasswordWithTest,
} = require("../security/crypto");

// ── Rate Limiting ────────────────────────────────────────────────
let loginAttempts = 0;
let lockoutUntil = 0;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_BASE_MS = 30000; // 30 seconds

function checkRateLimit() {
  if (Date.now() < lockoutUntil) {
    const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
    return { allowed: false, retryAfterSec: remaining };
  }
  return { allowed: true };
}

function recordLoginFailure() {
  loginAttempts++;
  if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
    const multiplier = Math.pow(2, loginAttempts - MAX_LOGIN_ATTEMPTS);
    lockoutUntil = Date.now() + LOCKOUT_BASE_MS * multiplier;
  }
}

function resetLoginAttempts() {
  loginAttempts = 0;
  lockoutUntil = 0;
}

let mainWindow = null;
let autoLockTimeout = null;
const AUTO_LOCK_MINUTES = 10;

function resetAutoLockTimer() {
  if (autoLockTimeout) clearTimeout(autoLockTimeout);
  autoLockTimeout = setTimeout(() => {
    clearSessionKey();
    if (mainWindow) mainWindow.webContents.send("locked");
  }, AUTO_LOCK_MINUTES * 60 * 1000);
}

async function createMainWindow() {
  await initCrypto();
  await initDb();

  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: "Tadween",
    frame: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Content Security Policy
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'"
        ],
      },
    });
  });

  if (isDev) {
    await mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    await mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  resetAutoLockTimer();
}

app.whenReady().then(() => {
  createMainWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ── Auth ──────────────────────────────────────────────────────────

ipcMain.handle("auth:login", async (_e, raw) => {
  try {
    const { password, firstLaunch } = LoginSchema.parse(raw);
    const rateCheck = checkRateLimit();
    if (!rateCheck.allowed) {
      return { error: "RATE_LIMITED", retryAfterSec: rateCheck.retryAfterSec };
    }
    resetAutoLockTimer();
    const key = await deriveKeyFromPassword(password);
    const ok = await verifyPasswordWithTest(key, firstLaunch);
    if (!ok) {
      recordLoginFailure();
      return false;
    }
    resetLoginAttempts();
    setSessionKey(key);
    return true;
  } catch (err) {
    if (err instanceof ZodError) return { error: "VALIDATION_ERROR", details: err.errors };
    throw err;
  }
});

ipcMain.handle("session:lock", async () => {
  clearSessionKey();
  if (mainWindow) mainWindow.webContents.send("locked");
  return true;
});

// ── Notes ─────────────────────────────────────────────────────────

ipcMain.handle("notes:list", async (_e, raw) => {
  try {
    const { filter, folderId } = ListNotesSchema.parse(raw);
    resetAutoLockTimer();
    return listNotes({ filter, folderId });
  } catch (err) {
    if (err instanceof ZodError) return { error: "VALIDATION_ERROR", details: err.errors };
    throw err;
  }
});

ipcMain.handle("notes:get", async (_e, raw) => {
  try {
    const { id } = GetNoteSchema.parse(raw);
    resetAutoLockTimer();
    const row = await getNote(id);
    if (!row) return null;
    const decrypted = await decryptContent(row.content_encrypted, row.nonce);
    return { id: row.id, title: row.title, content: decrypted, is_pinned: row.is_pinned };
  } catch (err) {
    if (err instanceof ZodError) return { error: "VALIDATION_ERROR", details: err.errors };
    throw err;
  }
});

ipcMain.handle("notes:create", async () => {
  resetAutoLockTimer();
  const { ciphertext, nonce } = await encryptContent({ type: "doc", content: [] });
  return createNote({ title: "New note", content_encrypted: ciphertext, nonce });
});

ipcMain.handle("notes:update", async (_e, raw) => {
  try {
    const { id, patch } = UpdateNoteSchema.parse(raw);
    resetAutoLockTimer();
    const existing = await getNote(id);
    if (!existing) return false;
    let { content_encrypted, nonce } = existing;
    if (patch.content !== undefined) {
      const enc = await encryptContent(patch.content);
      content_encrypted = enc.ciphertext;
      nonce = enc.nonce;
    }
    updateNote(id, { title: patch.title ?? existing.title, content_encrypted, nonce });
    return true;
  } catch (err) {
    if (err instanceof ZodError) return { error: "VALIDATION_ERROR", details: err.errors };
    throw err;
  }
});

ipcMain.handle("notes:pin", async (_e, raw) => {
  try {
    const { id, isPinned } = PinNoteSchema.parse(raw);
    resetAutoLockTimer();
    pinNote(id, isPinned);
    return true;
  } catch (err) {
    if (err instanceof ZodError) return { error: "VALIDATION_ERROR", details: err.errors };
    throw err;
  }
});

ipcMain.handle("notes:trash", async (_e, raw) => {
  try {
    const { id } = NoteIdSchema.parse(raw);
    resetAutoLockTimer();
    trashNote(id);
    return true;
  } catch (err) {
    if (err instanceof ZodError) return { error: "VALIDATION_ERROR", details: err.errors };
    throw err;
  }
});

ipcMain.handle("notes:restore", async (_e, raw) => {
  try {
    const { id } = NoteIdSchema.parse(raw);
    resetAutoLockTimer();
    restoreNote(id);
    return true;
  } catch (err) {
    if (err instanceof ZodError) return { error: "VALIDATION_ERROR", details: err.errors };
    throw err;
  }
});

ipcMain.handle("notes:delete", async (_e, raw) => {
  try {
    const { id } = NoteIdSchema.parse(raw);
    resetAutoLockTimer();
    deleteNote(id);
    return true;
  } catch (err) {
    if (err instanceof ZodError) return { error: "VALIDATION_ERROR", details: err.errors };
    throw err;
  }
});

// ── Search ─────────────────────────────────────────────────────────

ipcMain.handle("notes:search", async (_e, raw) => {
  try {
    const { query } = SearchNotesSchema.parse(raw);
    resetAutoLockTimer();
    return searchNotes(query);
  } catch (err) {
    if (err instanceof ZodError) return { error: "VALIDATION_ERROR", details: err.errors };
    throw err;
  }
});

ipcMain.handle("notes:rebuild-index", async () => {
  resetAutoLockTimer();
  const allNotes = listNotes({ filter: "all" });
  const decryptedNotes = [];
  for (const note of allNotes) {
    try {
      const row = getNote(note.id);
      if (!row) continue;
      const content = await decryptContent(row.content_encrypted, row.nonce);
      const contentText = typeof content === "string" ? content : JSON.stringify(content);
      decryptedNotes.push({
        id: note.id,
        title: note.title || "",
        content: contentText,
        tags: "",
      });
    } catch {
      // Skip notes that fail to decrypt
    }
  }
  rebuildSearchIndex(decryptedNotes);
  return { indexed: decryptedNotes.length };
});

// ── Folders ───────────────────────────────────────────────────────

ipcMain.handle("folders:list", async () => {
  resetAutoLockTimer();
  return listFolders();
});

ipcMain.handle("folders:create", async (_e, raw) => {
  try {
    const { name } = CreateFolderSchema.parse(raw);
    resetAutoLockTimer();
    return createFolder(name);
  } catch (err) {
    if (err instanceof ZodError) return { error: "VALIDATION_ERROR", details: err.errors };
    throw err;
  }
});

ipcMain.handle("folders:rename", async (_e, raw) => {
  try {
    const { id, name } = RenameFolderSchema.parse(raw);
    resetAutoLockTimer();
    renameFolder(id, name);
    return true;
  } catch (err) {
    if (err instanceof ZodError) return { error: "VALIDATION_ERROR", details: err.errors };
    throw err;
  }
});

ipcMain.handle("folders:delete", async (_e, raw) => {
  try {
    const { id } = FolderIdSchema.parse(raw);
    resetAutoLockTimer();
    deleteFolder(id);
    return true;
  } catch (err) {
    if (err instanceof ZodError) return { error: "VALIDATION_ERROR", details: err.errors };
    throw err;
  }
});

// ── Versions ──────────────────────────────────────────────────────

ipcMain.handle("versions:list", async (_e, raw) => {
  try {
    const { noteId } = ListVersionsSchema.parse(raw);
    resetAutoLockTimer();
    return listVersions(noteId);
  } catch (err) {
    if (err instanceof ZodError) return { error: "VALIDATION_ERROR", details: err.errors };
    throw err;
  }
});

ipcMain.handle("versions:create", async (_e, raw) => {
  try {
    const { noteId, title, encryptedContent, nonce } = CreateVersionSchema.parse(raw);
    resetAutoLockTimer();
    return createVersion(noteId, title, encryptedContent, nonce);
  } catch (err) {
    if (err instanceof ZodError) return { error: "VALIDATION_ERROR", details: err.errors };
    throw err;
  }
});

ipcMain.handle("versions:restore", async (_e, raw) => {
  try {
    const { versionId } = RestoreVersionSchema.parse(raw);
    resetAutoLockTimer();
    const version = getVersion(versionId);
    if (!version) return null;
    return version;
  } catch (err) {
    if (err instanceof ZodError) return { error: "VALIDATION_ERROR", details: err.errors };
    throw err;
  }
});

// ── Speech ────────────────────────────────────────────────────────

ipcMain.handle("speech:models", async () => {
  try {
    const { listAvailableModels } = require("./services/whisper.service");
    return listAvailableModels();
  } catch {
    return [];
  }
});

ipcMain.handle("speech:transcribe", async (_e, { audioPath, language, model }) => {
  const { transcribe } = require("./services/whisper.service");
  return transcribe(audioPath, { language, model });
});

ipcMain.handle("speech:transcribe-buffer", async (_e, { audio, language, model }) => {
  const fs = require("fs");
  const os = require("os");
  const { transcribe } = require("./services/whisper.service");

  // Write WAV buffer to a temp file for whisper-node
  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, `tadween_audio_${Date.now()}.wav`);
  try {
    const buffer = Buffer.from(audio);
    fs.writeFileSync(tmpFile, buffer);
    const text = await transcribe(tmpFile, { language, model });
    return text;
  } finally {
    // Clean up temp file
    try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
  }
});
