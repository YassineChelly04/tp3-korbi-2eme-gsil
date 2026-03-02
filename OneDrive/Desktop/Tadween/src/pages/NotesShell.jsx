import React, { useEffect, useState, useCallback } from "react";
import NotesSidebar from "../components/NotesSidebar";
import NoteEditor from "../editor/NoteEditor";
import SettingsPanel from "../components/settings/SettingsPanel";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../hooks/useLanguage";
import { useUIStore } from "../stores/ui.store";

// ── Animated Empty State ─────────────────────────────────────────────
function EmptyState({ onCreate }) {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-fade-in"
      style={{ background: "var(--bg-base)" }}>
      {/* Illustration */}
      <div className="relative">
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{ background: "var(--bg-elevated)", boxShadow: "var(--shadow-md)" }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth={1.2} style={{ color: "var(--accent)" }}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        {/* Floating ring */}
        <div className="absolute inset-0 rounded-3xl"
          style={{ boxShadow: "0 0 0 8px var(--accent-muted)", animation: "pulse-ring 2.5s ease infinite" }} />
      </div>

      <div className="text-center space-y-1.5">
        <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          {t("empty.title")}
        </p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {t("empty.subtitle")}
        </p>
      </div>

      <button
        onClick={onCreate}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all"
        style={{ background: "var(--accent)", boxShadow: "var(--shadow-accent)" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-hover)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.transform = ""; }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        {t("empty.cta")}
        <span className="kbd ms-1">Ctrl+N</span>
      </button>
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
    // Switch back to "all" so new note is visible
    if (activeFilter !== "all") setActiveFilter("all");
  };

  const handleSelectNote = (id) => {
    setActiveNoteId(id);
    setIsNewNote(false);
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
    <div className="h-screen w-screen flex overflow-hidden" style={{ background: "var(--bg-base)" }}>
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

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeNoteId ? (
          <NoteEditor
            key={activeNoteId}
            noteId={activeNoteId}
            isNew={isNewNote}
            onMetaChange={(patch) => handleUpdateMeta(activeNoteId, patch)}
            onTrash={() => handleTrash(activeNoteId)}
            onSave={loadNotes}
          />
        ) : (
          <EmptyState onCreate={handleCreateNote} />
        )}
      </div>
    </div>
  );
}

export default NotesShell;
