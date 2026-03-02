import { useMemo, useCallback } from 'react';
import { useKeyboardShortcuts, type ShortcutMap } from './useKeyboardShortcuts';

export interface ShortcutEntry {
  id: string;
  combo: string;
  keys: string[];
  category: 'navigation' | 'editor' | 'app';
  i18nKey: string;
}

export interface AppShortcutHandlers {
  onNewNote?: () => void;
  onSave?: () => void;
  onFocusSearch?: () => void;
  onLock?: () => void;
  onToggleVoice?: () => void;
  onShowShortcuts?: () => void;
  onOpenSettings?: () => void;
  onDeleteNote?: () => void;
  onToggleSidebar?: () => void;
  onEscape?: () => void;
}

export const shortcutRegistry: ShortcutEntry[] = [
  // Navigation
  { id: 'focus-search', combo: 'ctrl+f', keys: ['Ctrl', 'F'], category: 'navigation', i18nKey: 'shortcuts.focus_search' },
  { id: 'toggle-sidebar', combo: 'ctrl+b', keys: ['Ctrl', 'B'], category: 'navigation', i18nKey: 'shortcuts.toggle_sidebar' },
  { id: 'close-modal', combo: 'escape', keys: ['Esc'], category: 'navigation', i18nKey: 'shortcuts.close_modal' },

  // Editor
  { id: 'new-note', combo: 'ctrl+n', keys: ['Ctrl', 'N'], category: 'editor', i18nKey: 'shortcuts.new_note_desc' },
  { id: 'save-note', combo: 'ctrl+s', keys: ['Ctrl', 'S'], category: 'editor', i18nKey: 'shortcuts.save_desc' },
  { id: 'delete-note', combo: 'ctrl+backspace', keys: ['Ctrl', '⌫'], category: 'editor', i18nKey: 'shortcuts.delete_note' },
  { id: 'toggle-voice', combo: 'ctrl+shift+v', keys: ['Ctrl', 'Shift', 'V'], category: 'editor', i18nKey: 'shortcuts.toggle_voice' },

  // App
  { id: 'lock-app', combo: 'ctrl+l', keys: ['Ctrl', 'L'], category: 'app', i18nKey: 'shortcuts.lock_desc' },
  { id: 'open-settings', combo: 'ctrl+,', keys: ['Ctrl', ','], category: 'app', i18nKey: 'shortcuts.open_settings' },
  { id: 'show-shortcuts', combo: 'ctrl+/', keys: ['Ctrl', '/'], category: 'app', i18nKey: 'shortcuts.show_shortcuts' },
];

export function useAppShortcuts(handlers: AppShortcutHandlers) {
  const shortcutMap: ShortcutMap = useMemo(() => {
    const map: ShortcutMap = {};
    if (handlers.onNewNote) map['ctrl+n'] = handlers.onNewNote;
    if (handlers.onSave) map['ctrl+s'] = handlers.onSave;
    if (handlers.onFocusSearch) map['ctrl+f'] = handlers.onFocusSearch;
    if (handlers.onLock) map['ctrl+l'] = handlers.onLock;
    if (handlers.onToggleVoice) map['ctrl+shift+v'] = handlers.onToggleVoice;
    if (handlers.onShowShortcuts) map['ctrl+/'] = handlers.onShowShortcuts;
    if (handlers.onOpenSettings) map['ctrl+,'] = handlers.onOpenSettings;
    if (handlers.onDeleteNote) map['ctrl+backspace'] = handlers.onDeleteNote;
    if (handlers.onToggleSidebar) map['ctrl+b'] = handlers.onToggleSidebar;
    if (handlers.onEscape) map['escape'] = handlers.onEscape;
    return map;
  }, [handlers]);

  useKeyboardShortcuts(shortcutMap);

  const getShortcutsByCategory = useCallback((category: ShortcutEntry['category']) => {
    return shortcutRegistry.filter((s) => s.category === category);
  }, []);

  return { registry: shortcutRegistry, getShortcutsByCategory };
}
