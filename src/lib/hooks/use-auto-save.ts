import { useEffect } from 'react';
import { useGraphStore } from '../store/graph-store';
import { parseKG } from '../parser/parse-kg';

const STORAGE_KEY = 'kg-explorer-autosave';
const POSITIONS_KEY = 'kg-explorer-positions';

/** Auto-save graph to localStorage on changes, restore on mount if no data prop given. */
export function useAutoSave(hasDataProp: boolean) {
  // Restore from localStorage on mount (only if no data prop)
  useEffect(() => {
    if (hasDataProp) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const kg = parseKG(saved);
      const positionsRaw = localStorage.getItem(POSITIONS_KEY);
      const positions = positionsRaw
        ? new Map<string, { x: number; y: number }>(JSON.parse(positionsRaw))
        : undefined;
      useGraphStore.getState().loadGraph(kg, positions);
    } catch {
      // Corrupted data — ignore
    }
  }, [hasDataProp]);

  // Auto-save on changes
  useEffect(() => {
    const unsub = useGraphStore.subscribe((state, prevState) => {
      if (state.kgNodes !== prevState.kgNodes || state.kgEdges !== prevState.kgEdges || state.nodes !== prevState.nodes) {
        if (state.kgNodes.length === 0) {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(POSITIONS_KEY);
          return;
        }
        const json = JSON.stringify({ nodes: state.kgNodes, edges: state.kgEdges });
        localStorage.setItem(STORAGE_KEY, json);
        // Save positions separately
        const positions = state.nodes.map((n) => [n.id, n.position]);
        localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions));
      }
    });
    return unsub;
  }, []);
}
