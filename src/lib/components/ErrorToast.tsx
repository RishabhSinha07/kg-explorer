import { useEffect } from 'react';
import { useUIStore } from '../store/ui-store';

export function ErrorToast() {
  const error = useUIStore((s) => s.error);
  const setError = useUIStore((s) => s.setError);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 6000);
    return () => clearTimeout(timer);
  }, [error, setError]);

  if (!error) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-bottom-2">
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl max-w-md"
        style={{ backgroundColor: 'var(--kg-surface)', borderColor: 'var(--kg-border)' }}
      >
        <div className="w-5 h-5 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
          <svg className="w-3 h-3 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="text-xs kg-text flex-1">{error}</p>
        <button
          type="button"
          onClick={() => setError(null)}
          className="text-xs kg-text-muted hover:kg-text shrink-0 p-1"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
