import React, { useEffect, useState, useCallback } from "react";
import NotesSidebar from "../components/NotesSidebar";
import NoteEditor from "../editor/NoteEditor";
import SettingsPanel from "../components/settings/SettingsPanel";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../hooks/useLanguage";
import { useUIStore } from "../stores/ui.store";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Lock, ArrowLeft, FileText } from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────
function formatCardDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  } catch { return ""; }
}

function truncate(str, len = 22) {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

// ── Stagger animation config ────────────────────────────────────────
const gridContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};
const cardVariant = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
};

// ── Home Grid View ──────────────────────────────────────────────────
function HomeGrid({ notes, onSelect, onCreate, t }) {
  return (
    <div className="tw-main-area">
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: 28, fontWeight: 800, margin: 0,
          color: "var(--text-primary)", lineHeight: 1.3,
        }}>
          {t("home.title") || "My Notes"}
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-muted)", marginTop: 4 }}>
          {t("home.subtitle") || "All your thoughts, beautifully organized."}
        </p>
      </div>

      {/* Card Grid */}
      <motion.div
        className="tw-notes-grid"
        variants={gridContainer}
        initial="hidden"
        animate="visible"
      >
        {/* New Note card */}
        <motion.div
          variants={cardVariant}
          className="tw-new-note-card"
          onClick={onCreate}
          role="button"
          tabIndex={0}
          aria-label={t("sidebar.new_note") || "New note"}
          onKeyDown={(e) => e.key === "Enter" && onCreate()}
        >
          <div className="tw-new-note-icon">
            <Plus size={28} strokeWidth={2} />
          </div>
          <span className="tw-new-note-text">
            {t("sidebar.new_note") || "New note"}
          </span>
        </motion.div>

        {/* Note cards */}
        {notes.map((note) => (
          <motion.div
            key={note.id}
            variants={cardVariant}
            className="tw-note-card"
            onClick={() => onSelect(note.id)}
            role="button"
            tabIndex={0}
            aria-label={note.title || t("sidebar.untitled") || "Untitled"}
            onKeyDown={(e) => e.key === "Enter" && onSelect(note.id)}
          >
            <h3 className="tw-note-title">
              {truncate(note.title || t("sidebar.untitled") || "Untitled")}
            </h3>
            <p className="tw-note-preview">
              {note.preview || t("sidebar.no_content") || "No content"}
            </p>
            <div className="tw-note-footer">
              <span className="tw-note-date">
                {formatCardDate(note.updated_at || note.created_at)}
              </span>
              <span className="tw-note-lock" aria-hidden="true">
                <Lock size={14} />
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ── Editor View (with back button) ──────────────────────────────────
function EditorView({ noteId, isNew, onBack, onMetaChange, onTrash, onSave, t }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      {/* Back button bar */}
      <div style={{ paddingInline: 24, paddingTop: 16, paddingBottom: 0 }}>
        <button
          className="tw-back-btn"
          onClick={onBack}
          aria-label={t("home.back") || "Back to notes"}
        >
          <ArrowLeft size={16} className="icon-directional" />
          {t("home.back") || "Back to notes"}
        </button>
      </div>
      <NoteEditor
        key={noteId}
        noteId={noteId}
        isNew={isNew}
        onMetaChange={onMetaChange}
        onTrash={onTrash}
        onSave={onSave}
      />
    </div>
  );
}

// ── Shell ────────────────────────────────────────────────────────────
function NotesShell({ onLock }) {
  const { t } = useTranslation();
  useLanguage(); // activate RTL switching
  const { settingsOpen, setSettingsOpen } = useUIStore();

  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [isNewNote, setIsNewNote] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [folders, setFolders] = useState([]);

  // Load notes whenever filter changes
  const loadNotes = useCallback(async () => {
    const all = await window.api.listNotes({ filter: activeFilter });
    setNotes(all);
  }, [activeFilter]);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  // Load folders once
  useEffect(() => {
    window.api.listFolders().then(setFolders).catch(() => setFolders([]));
  }, []);

  // ── Global keyboard shortcuts ────────────────────────────────────
  useEffect(() => {
    const handleKey = async (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        await handleCreateNote();
      }
      if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        await handleLock();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []); // eslint-disable-line

  const handleCreateNote = async () => {
    const created = await window.api.createNote();
    await loadNotes();
    setActiveNoteId(created.id);
    setIsNewNote(true);
    if (activeFilter !== "all") setActiveFilter("all");
  };

  const handleSelectNote = (id) => {
    setActiveNoteId(id);
    setIsNewNote(false);
  };

  const handleBackToHome = () => {
    setActiveNoteId(null);
    setIsNewNote(false);
    loadNotes(); // refresh grid after editing
  };

  const handleTrash = async (id) => {
    await window.api.trashNote(id);
    if (activeNoteId === id) setActiveNoteId(null);
    await loadNotes();
  };

  const handleDelete = async (id) => {
    await window.api.deleteNote(id);
    if (activeNoteId === id) setActiveNoteId(null);
    await loadNotes();
  };

  const handlePin = async (id, isPinned) => {
    await window.api.pinNote(id, isPinned);
    await loadNotes();
  };

  const handleRestore = async (id) => {
    await window.api.restoreNote(id);
    await loadNotes();
  };

  const handleLock = async () => {
    await window.api.lock();
    onLock();
  };

  const handleCreateFolder = async (name) => {
    const f = await window.api.createFolder(name);
    setFolders((prev) => [...prev, f]);
  };

  const handleUpdateMeta = (id, patch) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  };

  // Client-side search filter
  const filteredNotes = query
    ? notes.filter(
      (n) =>
        n.title?.toLowerCase().includes(query.toLowerCase()) ||
        n.preview?.toLowerCase().includes(query.toLowerCase())
    )
    : notes;

  return (
    <div className="tw-dash-root">
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <NotesSidebar
        notes={filteredNotes}
        activeNoteId={activeNoteId}
        activeFilter={activeFilter}
        onSelect={handleSelectNote}
        onCreate={handleCreateNote}
        onTrash={handleTrash}
        onDelete={handleDelete}
        onPin={handlePin}
        onRestore={handleRestore}
        onFilterChange={(f) => { setActiveFilter(f); setActiveNoteId(null); }}
        query={query}
        onQueryChange={setQuery}
        onLock={handleLock}
        folders={folders}
        onCreateFolder={handleCreateFolder}
      />

      {/* ── Main content: Home grid or Editor ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {activeNoteId ? (
          <EditorView
            noteId={activeNoteId}
            isNew={isNewNote}
            onBack={handleBackToHome}
            onMetaChange={(patch) => handleUpdateMeta(activeNoteId, patch)}
            onTrash={() => handleTrash(activeNoteId)}
            onSave={loadNotes}
            t={t}
          />
        ) : (
          <HomeGrid
            notes={filteredNotes}
            onSelect={handleSelectNote}
            onCreate={handleCreateNote}
            t={t}
          />
        )}
      </div>
    </div>
  );
}

export default NotesShell;
