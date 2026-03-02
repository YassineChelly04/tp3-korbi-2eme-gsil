const path = require("path");
const Database = require("better-sqlite3");

let db;

function getDbPath() {
  return path.join(process.cwd(), "parfait_notes.db");
}

async function initDb() {
  if (db) return;
  db = new Database(getDbPath());

  // Performance pragmas
  db.pragma('journal_mode = WAL');
  db.pragma('mmap_size = 268435456');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -64000');

  // Core notes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      content_encrypted TEXT NOT NULL,
      nonce TEXT NOT NULL,
      is_pinned INTEGER NOT NULL DEFAULT 0,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      deleted_at DATETIME,
      folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#6366f1',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#6366f1',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS note_tags (
      note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
      tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (note_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS note_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      title TEXT,
      content_encrypted TEXT NOT NULL,
      nonce TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // FTS5 virtual table for full-text search (indexed with decrypted content)
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
      title, content, tags,
      content='notes', content_rowid='id'
    );

    CREATE TRIGGER IF NOT EXISTS notes_fts_insert AFTER INSERT ON notes BEGIN
      INSERT INTO notes_fts(rowid, title, content, tags)
      VALUES (new.id, new.title, '', '');
    END;

    CREATE TRIGGER IF NOT EXISTS notes_fts_delete AFTER DELETE ON notes BEGIN
      INSERT INTO notes_fts(notes_fts, rowid, title, content, tags)
      VALUES ('delete', old.id, old.title, '', '');
    END;

    CREATE TRIGGER IF NOT EXISTS notes_fts_update AFTER UPDATE ON notes BEGIN
      INSERT INTO notes_fts(notes_fts, rowid, title, content, tags)
      VALUES ('delete', old.id, old.title, '', '');
      INSERT INTO notes_fts(rowid, title, content, tags)
      VALUES (new.id, new.title, '', '');
    END;
  `);

  // Performance indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_notes_folder_id ON notes(folder_id);
    CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON notes(is_pinned);
    CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at);
    CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON note_tags(tag_id);
  `);

  // Migration: add missing columns to existing DB without error
  const notesCols = db.pragma("table_info(notes)").map((c) => c.name);
  if (!notesCols.includes("is_pinned")) {
    db.exec("ALTER TABLE notes ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0;");
  }
  if (!notesCols.includes("is_deleted")) {
    db.exec("ALTER TABLE notes ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0;");
  }
  if (!notesCols.includes("deleted_at")) {
    db.exec("ALTER TABLE notes ADD COLUMN deleted_at DATETIME;");
  }
  if (!notesCols.includes("folder_id")) {
    db.exec("ALTER TABLE notes ADD COLUMN folder_id INTEGER;");
  }
  if (!notesCols.includes("color_tag")) {
    db.exec("ALTER TABLE notes ADD COLUMN color_tag TEXT;");
  }

  // Migration: add parent_id and sort_order to folders for nested hierarchy
  const folderCols = db.pragma("table_info(folders)").map((c) => c.name);
  if (!folderCols.includes("parent_id")) {
    db.exec("ALTER TABLE folders ADD COLUMN parent_id INTEGER REFERENCES folders(id) ON DELETE SET NULL;");
  }
  if (!folderCols.includes("sort_order")) {
    db.exec("ALTER TABLE folders ADD COLUMN sort_order INTEGER DEFAULT 0;");
  }
}

// ── Notes ──────────────────────────────────────────────────────────

function listNotes({ filter = "all", folderId = null } = {}) {
  let where = "is_deleted = 0";
  if (filter === "pinned") where = "is_pinned = 1 AND is_deleted = 0";
  else if (filter === "trash") where = "is_deleted = 1";

  if (folderId && filter === "all") {
    where += ` AND folder_id = ${Number(folderId)}`;
  }

  const rows = db
    .prepare(
      `SELECT id, title, is_pinned, is_deleted, folder_id, created_at, updated_at
       FROM notes WHERE ${where}
       ORDER BY is_pinned DESC, updated_at DESC`
    )
    .all();

  return rows.map((row) => ({ ...row, preview: "" }));
}

function getNote(id) {
  return db
    .prepare(
      "SELECT id, title, content_encrypted, nonce, is_pinned, is_deleted, folder_id, created_at, updated_at FROM notes WHERE id = ?"
    )
    .get(id);
}

function createNote({ title, content_encrypted, nonce }) {
  const info = db
    .prepare("INSERT INTO notes (title, content_encrypted, nonce) VALUES (?, ?, ?)")
    .run(title, content_encrypted, nonce);
  return { id: info.lastInsertRowid, title, is_pinned: 0, preview: "" };
}

function updateNote(id, { title, content_encrypted, nonce }) {
  db.prepare(
    "UPDATE notes SET title = ?, content_encrypted = ?, nonce = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).run(title, content_encrypted, nonce, id);
}

function pinNote(id, isPinned) {
  db.prepare("UPDATE notes SET is_pinned = ? WHERE id = ?").run(isPinned ? 1 : 0, id);
}

function trashNote(id) {
  db.prepare(
    "UPDATE notes SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).run(id);
}

function restoreNote(id) {
  db.prepare("UPDATE notes SET is_deleted = 0, deleted_at = NULL WHERE id = ?").run(id);
}

function deleteNote(id) {
  db.prepare("DELETE FROM notes WHERE id = ?").run(id);
}

// ── Folders ────────────────────────────────────────────────────────

function listFolders() {
  return db.prepare("SELECT * FROM folders ORDER BY sort_order ASC, name ASC").all();
}

function createFolder(name, parentId = null) {
  const info = db.prepare("INSERT INTO folders (name, parent_id) VALUES (?, ?)").run(name, parentId);
  return { id: info.lastInsertRowid, name, color: "#6366f1", parent_id: parentId, sort_order: 0 };
}

function renameFolder(id, name) {
  db.prepare("UPDATE folders SET name = ? WHERE id = ?").run(name, id);
}

function updateFolderColor(id, color) {
  db.prepare("UPDATE folders SET color = ? WHERE id = ?").run(color, id);
}

function updateFolderParent(id, parentId) {
  db.prepare("UPDATE folders SET parent_id = ? WHERE id = ?").run(parentId, id);
}

function moveNoteToFolder(noteId, folderId) {
  db.prepare("UPDATE notes SET folder_id = ? WHERE id = ?").run(folderId, noteId);
}

function getNoteCountsByFolder() {
  return db.prepare(
    "SELECT folder_id, COUNT(*) as count FROM notes WHERE is_deleted = 0 AND folder_id IS NOT NULL GROUP BY folder_id"
  ).all();
}

function deleteFolder(id) {
  // Reparent children to this folder's parent before deleting
  const folder = db.prepare("SELECT parent_id FROM folders WHERE id = ?").get(id);
  const newParent = folder ? folder.parent_id : null;
  db.prepare("UPDATE folders SET parent_id = ? WHERE parent_id = ?").run(newParent, id);
  db.prepare("UPDATE notes SET folder_id = NULL WHERE folder_id = ?").run(id);
  db.prepare("DELETE FROM folders WHERE id = ?").run(id);
}

// ── Tags ──────────────────────────────────────────────────────────
function listTags() {
  return db.prepare("SELECT * FROM tags ORDER BY name ASC").all();
}

function createTag(name, color = "#6366f1") {
  const info = db.prepare("INSERT OR IGNORE INTO tags (name, color) VALUES (?, ?)").run(name, color);
  return { id: info.lastInsertRowid, name, color };
}

function deleteTag(id) {
  db.prepare("DELETE FROM tags WHERE id = ?").run(id);
}

function addTagToNote(noteId, tagId) {
  db.prepare("INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)").run(noteId, tagId);
}

function removeTagFromNote(noteId, tagId) {
  db.prepare("DELETE FROM note_tags WHERE note_id = ? AND tag_id = ?").run(noteId, tagId);
}

function getNoteTags(noteId) {
  return db.prepare(
    "SELECT t.* FROM tags t INNER JOIN note_tags nt ON t.id = nt.tag_id WHERE nt.note_id = ? ORDER BY t.name"
  ).all(noteId);
}

// ── Versions ──────────────────────────────────────────────────────
function createVersion(noteId, title, contentEncrypted, nonce) {
  const info = db.prepare(
    "INSERT INTO note_versions (note_id, title, content_encrypted, nonce) VALUES (?, ?, ?, ?)"
  ).run(noteId, title, contentEncrypted, nonce);
  return { id: info.lastInsertRowid };
}

function listVersions(noteId) {
  return db.prepare(
    "SELECT id, note_id, title, created_at FROM note_versions WHERE note_id = ? ORDER BY created_at DESC"
  ).all(noteId);
}

function getVersion(versionId) {
  return db.prepare("SELECT * FROM note_versions WHERE id = ?").get(versionId);
}

// ── Full-Text Search ─────────────────────────────────────────────

function searchNotes(query) {
  if (!query || !query.trim()) return [];
  const safeQuery = query.trim().replace(/"/g, '""');
  return db
    .prepare(
      `SELECT
         n.id,
         n.title,
         snippet(notes_fts, 1, '<mark>', '</mark>', '…', 32) AS snippet,
         bm25(notes_fts) AS rank
       FROM notes_fts
       JOIN notes n ON n.id = notes_fts.rowid
       WHERE notes_fts MATCH ?
         AND n.is_deleted = 0
       ORDER BY rank`
    )
    .all(`"${safeQuery}"`);
}

function rebuildSearchIndex(notes) {
  const deleteAll = db.prepare("DELETE FROM notes_fts");
  const insert = db.prepare(
    "INSERT INTO notes_fts(rowid, title, content, tags) VALUES (?, ?, ?, ?)"
  );

  const rebuild = db.transaction((items) => {
    deleteAll.run();
    for (const note of items) {
      insert.run(
        note.id,
        note.title || "",
        note.content || "",
        note.tags || ""
      );
    }
  });

  rebuild(notes);
}

// ── Settings ──────────────────────────────────────────────────────
function getSetting(key) {
  const row = db.prepare("SELECT value FROM user_settings WHERE key = ?").get(key);
  return row ? row.value : null;
}

function setSetting(key, value) {
  db.prepare("INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)").run(key, String(value));
}

function getAllSettings() {
  const rows = db.prepare("SELECT key, value FROM user_settings").all();
  const settings = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return settings;
}

module.exports = {
  // existing
  initDb, listNotes, getNote, createNote, updateNote,
  pinNote, trashNote, restoreNote, deleteNote,
  listFolders, createFolder, renameFolder, deleteFolder,
  updateFolderColor, updateFolderParent, moveNoteToFolder, getNoteCountsByFolder,
  // new - tags
  listTags, createTag, deleteTag,
  addTagToNote, removeTagFromNote, getNoteTags,
  // new - versions
  createVersion, listVersions, getVersion,
  // new - search
  searchNotes, rebuildSearchIndex,
  // new - settings
  getSetting, setSetting, getAllSettings,
};
