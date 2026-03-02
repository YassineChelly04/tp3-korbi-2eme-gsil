import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { shortcutRegistry } from '../../hooks/useAppShortcuts';

const categories = [
  { id: 'navigation', i18nKey: 'shortcuts.cat_navigation' },
  { id: 'editor', i18nKey: 'shortcuts.cat_editor' },
  { id: 'app', i18nKey: 'shortcuts.cat_app' },
];

function Kbd({ children }) {
  return (
    <kbd
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 24,
        height: 24,
        padding: '0 6px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-base)',
        border: '1px solid var(--border)',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        fontWeight: 500,
        lineHeight: 1,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {children}
    </kbd>
  );
}

function ShortcutRow({ entry, t }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 0',
        gap: 12,
      }}
    >
      <span
        style={{
          color: 'var(--text-primary)',
          fontSize: 13,
        }}
      >
        {t(entry.i18nKey)}
      </span>
      <span style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {entry.keys.map((key, i) => (
          <Kbd key={i}>{key}</Kbd>
        ))}
      </span>
    </div>
  );
}

export default function ShortcutsModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [isOpen, onClose]);

  const handleOverlayClick = (e) => {
    if (panelRef.current && !panelRef.current.contains(e.target)) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="shortcuts-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={handleOverlayClick}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <motion.div
            ref={panelRef}
            key="shortcuts-panel"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: `blur(var(--glass-blur))`,
              WebkitBackdropFilter: `blur(var(--glass-blur))`,
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-lg)',
              padding: 24,
              width: '90%',
              maxWidth: 540,
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                {t('shortcuts.title')}
              </h2>
              <button
                onClick={onClose}
                aria-label={t('shortcuts.close')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Categories grid - responsive via CSS */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 20,
              }}
            >
              {categories.map((cat) => {
                const entries = shortcutRegistry.filter((s) => s.category === cat.id);
                return (
                  <div key={cat.id}>
                    <h3
                      style={{
                        margin: '0 0 8px 0',
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--accent)',
                      }}
                    >
                      {t(cat.i18nKey)}
                    </h3>
                    <div
                      style={{
                        borderTop: '1px solid var(--border)',
                      }}
                    >
                      {entries.map((entry) => (
                        <ShortcutRow key={entry.id} entry={entry} t={t} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
