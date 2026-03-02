import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../hooks/useLanguage";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "../stores/ui.store";
import { useNotesStore } from "../stores/notes.store";
import { useFoldersStore } from "../stores/folders.store";
import {
  FileText, Bookmark, Trash2, Search, Plus, Lock,
  Folder, FolderPlus, ChevronDown, RotateCcw, X,
  User, Settings, Globe, PanelLeftClose, PanelLeft, Pin,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────
const SIDEBAR_W = 260;
const SIDEBAR_W_COLLAPSED = 60;

const LANG_OPTIONS = [
  { code: "fr", label: "FR", flag: "🇫🇷" },
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "ar", label: "AR", flag: "🇸🇦" },
];

const SPRING = { type: "spring", stiffness: 300, damping: 30 };
const INSTANT = { duration: 0 };

// ── Reduced-motion hook ───────────────────────────────────────────────
function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const h = (e) => setReduced(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return reduced;
}

// ── Hover-action micro-button ─────────────────────────────────────────
function HoverBtn({ icon, onClick, title, danger, active }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 22, height: 22, borderRadius: 4,
        border: "none", cursor: "pointer", background: "transparent",
        color: active ? "var(--accent)" : danger ? "var(--danger)" : "var(--text-muted)",
        transition: "background var(--transition-fast), color var(--transition-fast)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger ? "var(--danger-muted)" : "var(--bg-hover)";
        if (!danger && !active) e.currentTarget.style.color = "var(--text-primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        if (!danger && !active) e.currentTarget.style.color = "var(--text-muted)";
      }}
    >
      {icon}
    </button>
  );
}

// ── Note Card ─────────────────────────────────────────────────────────
function NoteCard({ note, isActive, activeFilter, onSelect, onPin, onTrash, onRestore, onDelete, formatDate, noMotion, t }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      layout={!noMotion}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={noMotion ? INSTANT : { duration: 0.15 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: "relative" }}
    >
      <button
        onClick={() => onSelect(note.id)}
        style={{
          width: "100%", textAlign: "start",
          padding: "8px 10px", borderRadius: "var(--radius-sm)",
          border: isActive ? "1px solid var(--accent)" : "1px solid transparent",
          cursor: "pointer",
          background: isActive ? "var(--accent-muted)" : hovered ? "var(--bg-hover)" : "transparent",
          transition: "all var(--transition-fast)",
          display: "flex", flexDirection: "column", gap: 3,
        }}
      >
        {/* Title row */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {note.color && (
            <span style={{
              width: 6, height: 6, borderRadius: "var(--radius-full)",
              background: note.color, flexShrink: 0,
            }} />
          )}
          {note.is_pinned === 1 && (
            <Pin size={10} style={{ color: "var(--accent)", flexShrink: 0, transform: "rotate(45deg)" }} />
          )}
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: isActive ? "var(--accent)" : "var(--text-primary)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
          }}>
            {note.title || t("sidebar.untitled") || "Untitled"}
          </span>
        </div>
        {/* Preview line */}
        <div style={{
          fontSize: 11, color: "var(--text-muted)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.4,
        }}>
          {note.preview || t("sidebar.no_content") || "No content"}
        </div>
        {/* Date */}
        <div style={{ fontSize: 10, color: "var(--text-muted)", opacity: 0.7 }}>
          {formatDate(note.updated_at || note.created_at)}
        </div>
      </button>

      {/* Hover actions */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            style={{
              position: "absolute", top: 6, insetInlineEnd: 6,
              display: "flex", alignItems: "center", gap: 2,
              background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)",
              padding: "2px 3px", boxShadow: "var(--shadow-sm)",
            }}
          >
            {activeFilter === "trash" ? (
              <>
                <HoverBtn icon={<RotateCcw size={12} />}
                  onClick={(e) => { e.stopPropagation(); onRestore(note.id); }}
                  title={t("sidebar.restore") || "Restore"} />
                <HoverBtn icon={<X size={12} />}
                  onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
                  title={t("sidebar.delete_forever") || "Delete forever"} danger />
              </>
            ) : (
              <>
                <HoverBtn icon={<Pin size={12} style={{ transform: "rotate(45deg)" }} />}
                  onClick={(e) => { e.stopPropagation(); onPin(note.id, note.is_pinned !== 1); }}
                  title={note.is_pinned ? (t("sidebar.unpin") || "Unpin") : (t("sidebar.pin") || "Pin")}
                  active={note.is_pinned === 1} />
                <HoverBtn icon={<Trash2 size={12} />}
                  onClick={(e) => { e.stopPropagation(); onTrash(note.id); }}
                  title={t("sidebar.trash") || "Trash"} danger />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Sidebar ──────────────────────────────────────────────────────
function NotesSidebar({
  notes, activeNoteId, activeFilter, onSelect, onCreate, onDelete, onPin,
  onTrash, onRestore, onFilterChange, query, onQueryChange, onLock,
  folders, onCreateFolder,
}) {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const noMotion = useReducedMotion();

  // ── Stores ──
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  // Keep store references available for future migration
  useNotesStore;
  useFoldersStore;

  // ── Local state ──
  const [foldersOpen, setFoldersOpen] = useState(true);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const searchRef = useRef(null);

  // Ctrl+F focuses search
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const handleCreateFolder = (e) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName("");
      setShowNewFolder(false);
    }
  };

  const navItems = [
    { key: "all", label: t("sidebar.all_notes"), Icon: FileText },
    { key: "pinned", label: t("sidebar.pinned"), Icon: Bookmark },
    { key: "trash", label: t("sidebar.trash"), Icon: Trash2 },
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString(currentLanguage, { month: "short", day: "numeric" });
    } catch { return ""; }
  };

  const collapsed = sidebarCollapsed;
  const fade = {
    visible: { opacity: 1, transition: { delay: 0.05 } },
    hidden:  { opacity: 0, transition: { duration: 0.08 } },
  };

  // ── Render ──
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W }}
      transition={noMotion ? INSTANT : SPRING}
      style={{
        background: "var(--bg-surface)",
        borderInlineEnd: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        overflow: "hidden", height: "100%", flexShrink: 0,
      }}
    >
      {/* ── Brand + Toggle ── */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        padding: collapsed ? "16px 0" : "16px 16px 12px",
        minHeight: 52,
      }}>
        {!collapsed && (
          <motion.div variants={fade} initial="hidden" animate="visible" exit="hidden"
            style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "var(--radius-sm)",
              background: "linear-gradient(135deg, var(--accent), #7c3aed)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, boxShadow: "var(--shadow-accent)",
            }}>
              <FileText size={14} color="white" strokeWidth={2.2} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
              Tadween
            </span>
          </motion.div>
        )}
        <button
          onClick={toggleSidebar}
          title={collapsed ? t("sidebar.expand") || "Expand" : t("sidebar.collapse") || "Collapse"}
          aria-label={collapsed ? t("sidebar.expand") || "Expand" : t("sidebar.collapse") || "Collapse"}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: 6,
            borderRadius: "var(--radius-sm)", color: "var(--text-muted)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background var(--transition-fast), color var(--transition-fast)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-muted)"; }}
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* ── Collapsed quick-access ── */}
      {collapsed && (
        <motion.div variants={fade} initial="hidden" animate="visible" exit="hidden"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, paddingBlock: 8, flex: 1 }}>
          {navItems.map(({ key, label, Icon }) => {
            const active = activeFilter === key;
            return (
              <button key={key} onClick={() => onFilterChange(key)} title={label} aria-label={label}
                style={{
                  width: 36, height: 36, borderRadius: "var(--radius-sm)",
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: active ? "var(--accent)" : "var(--text-muted)",
                  background: active ? "var(--accent-muted)" : "transparent",
                  transition: "all var(--transition-fast)",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <Icon size={18} />
              </button>
            );
          })}

          <div style={{ flex: 1 }} />

          <button onClick={onCreate} title={t("sidebar.new_note")} aria-label={t("sidebar.new_note")}
            style={{
              width: 36, height: 36, borderRadius: "var(--radius-sm)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", background: "var(--accent)", boxShadow: "var(--shadow-accent)",
              transition: "background var(--transition-fast)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; }}
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>

          <button onClick={onLock} title={t("sidebar.lock")} aria-label={t("sidebar.lock")}
            style={{
              width: 36, height: 36, borderRadius: "var(--radius-sm)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text-muted)", background: "transparent",
              transition: "all var(--transition-fast)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <Lock size={18} />
          </button>
        </motion.div>
      )}

      {/* ── Expanded content ── */}
      {!collapsed && (
        <motion.div variants={fade} initial="hidden" animate="visible" exit="hidden"
          style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", minWidth: 0 }}>

          {/* ── Search ── */}
          <div style={{ paddingInline: 12, paddingBottom: 10 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              borderRadius: "var(--radius-md)", paddingInline: 10, paddingBlock: 7,
              background: "var(--bg-elevated)", border: "1px solid var(--border)",
              transition: "border-color var(--transition-fast)",
            }}>
              <Search size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              <input
                ref={searchRef}
                type="search"
                placeholder={t("sidebar.search_placeholder")}
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                style={{
                  flex: 1, background: "transparent", outline: "none", border: "none",
                  fontSize: 12, color: "var(--text-primary)", minWidth: 0,
                }}
              />
              {query && (
                <button onClick={() => onQueryChange("")}
                  aria-label={t("sidebar.clear_search") || "Clear"}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "var(--text-muted)", display: "flex", flexShrink: 0 }}>
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* ── Action buttons ── */}
          <div style={{ paddingInline: 12, paddingBottom: 10, display: "flex", gap: 6 }}>
            <button onClick={onCreate}
              title={t("sidebar.new_note") + " (Ctrl+N)"} aria-label={t("sidebar.new_note")}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "7px 0", borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 600, color: "white",
                background: "var(--accent)", boxShadow: "var(--shadow-accent)",
                transition: "background var(--transition-fast), transform var(--transition-fast)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-hover)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.transform = ""; }}
            >
              <Plus size={14} strokeWidth={2.5} />
              {t("sidebar.new_note")}
            </button>
            <button onClick={() => setShowNewFolder((v) => !v)}
              title={t("sidebar.new_folder")} aria-label={t("sidebar.new_folder")}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "7px 10px", borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)", cursor: "pointer",
                background: "var(--bg-elevated)", color: "var(--text-secondary)",
                transition: "background var(--transition-fast), color var(--transition-fast)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
            >
              <FolderPlus size={14} />
            </button>
          </div>

          {/* ── Nav filters ── */}
          <div style={{ paddingInline: 12, marginBottom: 6 }}>
            <p style={{
              fontSize: 10, fontWeight: 600, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "var(--text-muted)",
              marginBottom: 4, paddingInlineStart: 4,
            }}>
              {t("sidebar.filters") || "Filters"}
            </p>
            <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {navItems.map(({ key, label, Icon }) => {
                const active = activeFilter === key;
                return (
                  <button key={key} onClick={() => onFilterChange(key)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      paddingBlock: 6, paddingInline: 8,
                      borderRadius: "var(--radius-sm)", border: "none",
                      cursor: "pointer", width: "100%", textAlign: "start",
                      fontSize: 13, fontWeight: active ? 600 : 400,
                      color: active ? "var(--accent)" : "var(--text-secondary)",
                      background: active ? "var(--accent-muted)" : "transparent",
                      transition: "all var(--transition-fast)",
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--bg-hover)"; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = active ? "var(--accent-muted)" : "transparent"; }}
                  >
                    <Icon size={15} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* ── Folders ── */}
          <div style={{ paddingInline: 12, marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, paddingInline: 4 }}>
              <button onClick={() => setFoldersOpen((v) => !v)}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  fontSize: 10, fontWeight: 600, textTransform: "uppercase",
                  letterSpacing: "0.08em", color: "var(--text-muted)",
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                }}>
                <motion.span animate={{ rotate: foldersOpen ? 0 : -90 }}
                  transition={noMotion ? INSTANT : { duration: 0.2 }} style={{ display: "flex" }}>
                  <ChevronDown size={12} />
                </motion.span>
                {t("sidebar.folders")}
              </button>
              <button onClick={() => setShowNewFolder((v) => !v)}
                title={t("sidebar.new_folder")} aria-label={t("sidebar.new_folder")}
                style={{
                  background: "none", border: "none", cursor: "pointer", padding: 4,
                  borderRadius: "var(--radius-sm)", color: "var(--text-muted)", display: "flex",
                  transition: "color var(--transition-fast)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
              >
                <FolderPlus size={13} />
              </button>
            </div>

            <AnimatePresence initial={false}>
              {foldersOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={noMotion ? INSTANT : { duration: 0.2 }}
                  style={{ overflow: "hidden" }}
                >
                  {showNewFolder && (
                    <form onSubmit={handleCreateFolder} style={{ paddingInline: 8, paddingBlock: 4 }}>
                      <input autoFocus value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder={t("sidebar.new_folder")}
                        onKeyDown={(e) => e.key === "Escape" && setShowNewFolder(false)}
                        style={{
                          width: "100%", background: "transparent", outline: "none", border: "none",
                          borderBottom: "1px solid var(--accent)", fontSize: 12,
                          color: "var(--text-primary)", paddingBlock: 4,
                        }}
                      />
                    </form>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {folders.map((f) => (
                      <button key={f.id}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          paddingBlock: 5, paddingInline: 8,
                          borderRadius: "var(--radius-sm)", border: "none",
                          cursor: "pointer", width: "100%", textAlign: "start",
                          fontSize: 12, color: "var(--text-secondary)", background: "transparent",
                          transition: "background var(--transition-fast)",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <Folder size={14} style={{ color: f.color || "var(--text-muted)" }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {f.name}
                        </span>
                      </button>
                    ))}
                    {folders.length === 0 && !showNewFolder && (
                      <p style={{ fontSize: 11, color: "var(--text-muted)", paddingInlineStart: 8, paddingBlock: 4 }}>
                        {t("sidebar.no_folders") || "No folders yet"}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Divider ── */}
          <div style={{ marginInline: 12, borderTop: "1px solid var(--border)", marginBottom: 6 }} />

          {/* ── Notes list ── */}
          <div style={{ flex: 1, overflowY: "auto", paddingInline: 8, paddingBlock: 2 }}>
            {notes.length === 0 ? (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", paddingBlock: 32, gap: 8, color: "var(--text-muted)",
              }}>
                <FileText size={28} strokeWidth={1.2} />
                <p style={{ fontSize: 12, textAlign: "center" }}>
                  {activeFilter === "trash"
                    ? (t("sidebar.trash_empty") || "Trash is empty")
                    : (t("sidebar.no_notes") || "No notes")}
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <AnimatePresence initial={false}>
                  {notes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      isActive={activeNoteId === note.id}
                      activeFilter={activeFilter}
                      onSelect={onSelect}
                      onPin={onPin}
                      onTrash={onTrash}
                      onRestore={onRestore}
                      onDelete={onDelete}
                      formatDate={formatDate}
                      noMotion={noMotion}
                      t={t}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div style={{
            paddingInline: 12, paddingBlock: 10,
            borderTop: "1px solid var(--border)",
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            {/* Language switcher */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
              <Globe size={12} style={{ color: "var(--text-muted)" }} />
              {LANG_OPTIONS.map((l) => (
                <button key={l.code} onClick={() => changeLanguage(l.code)}
                  title={l.flag + " " + l.label} aria-label={l.label}
                  style={{
                    fontSize: 10, fontWeight: 600, paddingInline: 6, paddingBlock: 3,
                    borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer",
                    transition: "all var(--transition-fast)",
                    background: currentLanguage === l.code ? "var(--accent-muted)" : "transparent",
                    color: currentLanguage === l.code ? "var(--accent)" : "var(--text-muted)",
                  }}
                  onMouseEnter={(e) => { if (currentLanguage !== l.code) e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={(e) => { if (currentLanguage !== l.code) e.currentTarget.style.background = "transparent"; }}
                >
                  {l.flag}
                </button>
              ))}
            </div>

            {/* Lock button */}
            <button onClick={onLock}
              title={t("sidebar.lock") + " (Ctrl+L)"} aria-label={t("sidebar.lock")}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "7px 0", borderRadius: "var(--radius-md)",
                border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500,
                color: "var(--text-secondary)", background: "var(--bg-elevated)",
                transition: "background var(--transition-fast)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; }}
            >
              <Lock size={14} />
              <span>{t("sidebar.lock")}</span>
              <span style={{
                marginInlineStart: "auto", paddingInlineEnd: 10,
                fontSize: 9, padding: "1px 5px", borderRadius: 4,
                background: "var(--bg-hover)", color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
              }}>
                Ctrl+L
              </span>
            </button>

            {/* User profile + settings */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              paddingInline: 8, paddingBlock: 6,
              borderRadius: "var(--radius-md)", background: "var(--bg-elevated)",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "var(--radius-full)",
                background: "linear-gradient(135deg, var(--accent), #7c3aed)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <User size={14} color="white" />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 9, fontWeight: 500, color: "var(--text-muted)" }}>
                  {t("sidebar.welcome")}
                </div>
                <div style={{
                  fontSize: 12, fontWeight: 600, color: "var(--text-primary)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {t("sidebar.user")}
                </div>
              </div>
              <button title={t("sidebar.settings") || "Settings"} aria-label={t("sidebar.settings") || "Settings"}
                onClick={() => useUIStore.getState().toggleSettings()}
                style={{
                  background: "none", border: "none", cursor: "pointer", padding: 4,
                  borderRadius: "var(--radius-sm)", color: "var(--text-muted)", display: "flex",
                  transition: "color var(--transition-fast)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
              >
                <Settings size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.aside>
  );
}

export default NotesSidebar;
