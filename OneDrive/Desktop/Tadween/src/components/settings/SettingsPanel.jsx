import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../hooks/useLanguage";
import { useUIStore } from "../../stores/ui.store";
import { isRTL } from "../../i18n/index";
import { motion, AnimatePresence } from "framer-motion";
import { X, Globe, Palette, Type, Shield, Mic, Keyboard, Monitor, Sun, Moon } from "lucide-react";
import ModelManager from "../speech/ModelManager";

const LANG_OPTIONS = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
];

const THEME_OPTIONS = [
  { value: "dark", icon: Moon, labelKey: "settings.theme_dark" },
  { value: "light", icon: Sun, labelKey: "settings.theme_light" },
  { value: "system", icon: Monitor, labelKey: "settings.theme_system" },
];

const sectionVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.25 } }),
};

function Section({ icon: Icon, title, children, index }) {
  return (
    <motion.div
      className="py-4"
      style={{ borderBottom: "1px solid var(--border)" }}
      custom={index}
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} style={{ color: "var(--accent)" }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h3>
      </div>
      <div className="space-y-3 ps-6">{children}</div>
    </motion.div>
  );
}

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{label}</p>
        {description && (
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        background: checked ? "var(--accent)" : "var(--bg-hover)",
        boxShadow: checked ? "0 0 8px rgba(99,102,241,0.35)" : "none",
      }}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="inline-block h-5 w-5 rounded-full bg-white shadow-md"
        style={{
          marginTop: "2px",
          marginInlineStart: checked ? "22px" : "2px",
        }}
      />
    </button>
  );
}

function persist(key, value) {
  try {
    window.api?.setSetting(key, String(value));
  } catch { /* IPC not yet available */ }
}

export default function SettingsPanel({ open, onClose }) {
  const { t, i18n } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const setStoreTheme = useUIStore((s) => s.setTheme);
  const storeTheme = useUIStore((s) => s.theme);

  const [theme, setThemeLocal] = useState(storeTheme || "dark");
  const [autoSave, setAutoSave] = useState(true);
  const [spellCheck, setSpellCheck] = useState(true);
  const [autoLockMinutes, setAutoLockMinutes] = useState(10);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [loaded, setLoaded] = useState(false);

  // Load saved settings from IPC on mount
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const all = await window.api.getAllSettings();
        if (cancelled) return;
        if (all.language) {
          changeLanguage(all.language);
        }
        if (all.theme) {
          setThemeLocal(all.theme);
          applyTheme(all.theme);
        }
        if (all.editor_font_size) {
          const s = Number(all.editor_font_size);
          if (s >= 14 && s <= 24) { setFontSize(s); applyFontSize(s); }
        }
        if (all.auto_save !== undefined) setAutoSave(all.auto_save === "true");
        if (all.spell_check !== undefined) setSpellCheck(all.spell_check === "true");
        if (all.auto_lock_minutes) {
          const m = Number(all.auto_lock_minutes);
          if (m >= 5 && m <= 60) setAutoLockMinutes(m);
        }
        if (all.reduce_motion !== undefined) {
          const v = all.reduce_motion === "true";
          setReducedMotion(v);
          applyReduceMotion(v);
        }
      } catch { /* IPC not ready yet — use defaults */ }
      if (!cancelled) setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Apply helpers ---
  const applyTheme = useCallback((value) => {
    setStoreTheme(value);
    const resolved = value === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : value;
    document.documentElement.setAttribute("data-theme", resolved);
  }, [setStoreTheme]);

  const applyFontSize = (size) => {
    document.documentElement.style.setProperty("--editor-font-size", size + "px");
  };

  const applyReduceMotion = (on) => {
    document.documentElement.classList.toggle("reduce-motion", on);
  };

  // --- Change handlers (persist + apply) ---
  const handleLanguageChange = (code) => {
    changeLanguage(code);
    i18n.changeLanguage(code);
    const dir = isRTL(code) ? "rtl" : "ltr";
    document.documentElement.dir = dir;
    document.documentElement.lang = code;
    persist("language", code);
  };

  const handleThemeChange = (value) => {
    setThemeLocal(value);
    applyTheme(value);
    persist("theme", value);
  };

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    applyFontSize(size);
    persist("editor_font_size", size);
  };

  const handleAutoSaveChange = (v) => {
    setAutoSave(v);
    persist("auto_save", v);
  };

  const handleSpellCheckChange = (v) => {
    setSpellCheck(v);
    persist("spell_check", v);
  };

  const handleAutoLockChange = (mins) => {
    setAutoLockMinutes(mins);
    persist("auto_lock_minutes", mins);
  };

  const handleReduceMotionChange = (v) => {
    setReducedMotion(v);
    applyReduceMotion(v);
    persist("reduce_motion", v);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl p-6"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {t("settings.title", "Settings")}
            </h2>
            <button onClick={onClose} className="btn-icon p-1.5" aria-label={t("shortcuts.close", "Close")}>
              <X size={16} />
            </button>
          </div>

          {/* Language */}
          <Section icon={Globe} title={t("settings.language", "Language")} index={0}>
            <div className="flex gap-2 flex-wrap">
              {LANG_OPTIONS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => handleLanguageChange(l.code)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: currentLanguage === l.code ? "var(--accent-muted)" : "var(--bg-elevated)",
                    color: currentLanguage === l.code ? "var(--accent)" : "var(--text-secondary)",
                    border: currentLanguage === l.code ? "1px solid var(--accent)" : "1px solid transparent",
                    boxShadow: currentLanguage === l.code ? "0 0 8px rgba(99,102,241,0.2)" : "none",
                  }}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          </Section>

          {/* Theme */}
          <Section icon={Palette} title={t("settings.theme", "Theme")} index={1}>
            <div className="flex gap-2 flex-wrap">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleThemeChange(opt.value)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: theme === opt.value ? "var(--accent-muted)" : "var(--bg-elevated)",
                    color: theme === opt.value ? "var(--accent)" : "var(--text-secondary)",
                    border: theme === opt.value ? "1px solid var(--accent)" : "1px solid transparent",
                    boxShadow: theme === opt.value ? "0 0 8px rgba(99,102,241,0.2)" : "none",
                  }}
                >
                  <opt.icon size={14} />
                  <span>{t(opt.labelKey, opt.value.charAt(0).toUpperCase() + opt.value.slice(1))}</span>
                </button>
              ))}
            </div>
          </Section>

          {/* Editor */}
          <Section icon={Type} title={t("settings.editor", "Editor")} index={2}>
            <SettingRow label={t("settings.font_size", "Font Size")} description={`${fontSize}px`}>
              <input
                type="range"
                min={14}
                max={24}
                value={fontSize}
                onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                className="w-24 accent-indigo-500"
              />
            </SettingRow>
            <SettingRow label={t("settings.auto_save", "Auto-save")} description={t("settings.auto_save_desc", "Save changes automatically")}>
              <Toggle checked={autoSave} onChange={handleAutoSaveChange} />
            </SettingRow>
            <SettingRow label={t("settings.spell_check", "Spell check")} description={t("settings.spell_check_desc", "Underline spelling errors")}>
              <Toggle checked={spellCheck} onChange={handleSpellCheckChange} />
            </SettingRow>
          </Section>

          {/* Security */}
          <Section icon={Shield} title={t("settings.security", "Security")} index={3}>
            <SettingRow
              label={t("settings.auto_lock", "Auto-lock")}
              description={t("settings.auto_lock_desc", "Lock after {{minutes}} minutes of inactivity", { minutes: autoLockMinutes })}
            >
              <select
                value={autoLockMinutes}
                onChange={(e) => handleAutoLockChange(Number(e.target.value))}
                className="text-xs rounded-lg px-2 py-1"
                style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
              >
                <option value={5}>5 min</option>
                <option value={10}>10 min</option>
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={60}>1 {t("settings.hour", "hour")}</option>
              </select>
            </SettingRow>
          </Section>

          {/* Speech */}
          <Section icon={Mic} title={t("settings.speech", "Speech-to-Text")} index={4}>
            <ModelManager />
          </Section>

          {/* Accessibility */}
          <Section icon={Keyboard} title={t("settings.accessibility", "Accessibility")} index={5}>
            <SettingRow label={t("settings.reduced_motion", "Reduce animations")} description={t("settings.reduced_motion_desc", "Disable motion effects")}>
              <Toggle checked={reducedMotion} onChange={handleReduceMotionChange} />
            </SettingRow>
          </Section>

          {/* Keyboard shortcuts */}
          <motion.div
            className="pt-4 mt-2"
            custom={6}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
              {t("settings.keyboard_shortcuts", "Keyboard Shortcuts")}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
              {[
                [t("shortcuts.new_note_desc", "New Note"), "Ctrl+N"],
                [t("shortcuts.save_desc", "Save"), "Ctrl+S"],
                [t("shortcuts.focus_search", "Search"), "Ctrl+F"],
                [t("shortcuts.lock_desc", "Lock"), "Ctrl+L"],
                [t("editor.bold", "Bold"), "Ctrl+B"],
                [t("editor.italic", "Italic"), "Ctrl+I"],
                [t("shortcuts.toggle_voice", "Voice Input"), "Ctrl+Shift+V"],
                [t("shortcuts.open_settings", "Settings"), "Ctrl+,"],
              ].map(([action, shortcut]) => (
                <div key={action} className="flex items-center justify-between px-2 py-1.5 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
                  <span>{action}</span>
                  <kbd className="kbd">{shortcut}</kbd>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
