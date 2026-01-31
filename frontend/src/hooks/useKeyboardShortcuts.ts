import { useEffect } from 'react';

interface UseKeyboardShortcutsProps {
  onGenerate?: () => void;
  onToggleView?: () => void;
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({
  onGenerate,
  onToggleView,
  enabled = true,
}: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Cmd/Ctrl + Enter: Generate diagram
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        onGenerate?.();
      }

      // Cmd/Ctrl + `: Toggle view
      if ((event.metaKey || event.ctrlKey) && event.key === '`') {
        event.preventDefault();
        onToggleView?.();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [onGenerate, onToggleView, enabled]);
};

export default useKeyboardShortcuts;