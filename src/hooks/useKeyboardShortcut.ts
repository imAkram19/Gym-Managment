import { useEffect } from 'react';

interface ShortcutOptions {
  ctrlOrCmd?: boolean;
  shift?: boolean;
  alt?: boolean;
  enabled?: boolean;
  preventDefault?: boolean;
  ignoreInputs?: boolean;
}

/**
 * useKeyboardShortcut — hook for global & contextual keyboard shortcuts
 * Ensures inputs/textareas are not intercepted unless explicitly intended.
 */
export function useKeyboardShortcut(
  key: string,
  callback: (e: KeyboardEvent) => void,
  options: ShortcutOptions = {}
) {
  const {
    ctrlOrCmd = false,
    shift = false,
    alt = false,
    enabled = true,
    preventDefault = true,
    ignoreInputs = true,
  } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is actively typing in an input/textarea/select
      if (ignoreInputs) {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable)
        ) {
          return;
        }
      }

      // Check modifier keys
      const matchesCtrlCmd = ctrlOrCmd ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
      const matchesShift = shift ? e.shiftKey : !e.shiftKey;
      const matchesAlt = alt ? e.altKey : !e.altKey;
      const matchesKey = e.key.toLowerCase() === key.toLowerCase();

      if (matchesCtrlCmd && matchesShift && matchesAlt && matchesKey) {
        if (preventDefault) {
          e.preventDefault();
        }
        callback(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, ctrlOrCmd, shift, alt, enabled, preventDefault, ignoreInputs]);
}
