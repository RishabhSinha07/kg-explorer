import { create } from 'zustand';

export type Theme = 'dark' | 'light';

export interface UIState {
  theme: Theme;
  showProperties: boolean;
  showSearch: boolean;
  showImport: boolean;
  selectMode: boolean;
  searchQuery: string;
  highlightedNodeIds: Set<string>;
  error: string | null;
  hiddenTypes: Set<string>;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  toggleProperties: () => void;
  toggleSearch: () => void;
  toggleImport: () => void;
  toggleSelectMode: () => void;
  setSearchQuery: (q: string) => void;
  setHighlightedNodeIds: (ids: Set<string>) => void;
  setError: (error: string | null) => void;
  toggleTypeFilter: (type: string) => void;
}

function getInitialTheme(): Theme {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('kg-theme');
    if (stored === 'light' || stored === 'dark') return stored;
    if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  }
  return 'dark';
}

export const useUIStore = create<UIState>((set) => ({
  theme: getInitialTheme(),
  showProperties: true,
  showSearch: false,
  showImport: false,
  selectMode: false,
  searchQuery: '',
  highlightedNodeIds: new Set(),
  error: null,
  hiddenTypes: new Set(),

  setTheme: (theme) => {
    localStorage.setItem('kg-theme', theme);
    set({ theme });
  },
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('kg-theme', next);
      return { theme: next };
    }),
  toggleProperties: () => set((s) => ({ showProperties: !s.showProperties })),
  toggleSearch: () => set((s) => ({ showSearch: !s.showSearch, searchQuery: '' })),
  toggleImport: () => set((s) => ({ showImport: !s.showImport })),
  toggleSelectMode: () => set((s) => ({ selectMode: !s.selectMode })),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setHighlightedNodeIds: (ids) => set({ highlightedNodeIds: ids }),
  setError: (error) => set({ error }),
  toggleTypeFilter: (type) =>
    set((s) => {
      const next = new Set(s.hiddenTypes);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return { hiddenTypes: next };
    }),
}));
