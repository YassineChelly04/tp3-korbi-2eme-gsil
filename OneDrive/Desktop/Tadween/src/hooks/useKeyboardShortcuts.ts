import { useEffect } from 'react';

export type ShortcutHandler = () => void;

export type ShortcutMap = Record<string, ShortcutHandler>;

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      const shift = e.shiftKey;

      let combo: string;
      if (mod) {
        combo = 'ctrl+';
        if (shift) combo += 'shift+';
        combo += key;
      } else if (key === 'escape') {
        combo = 'escape';
      } else {
        return;
      }

      const fn = shortcuts[combo];
      if (fn) {
        e.preventDefault();
        fn();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}
