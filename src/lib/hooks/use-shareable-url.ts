import { useEffect } from 'react';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { useGraphStore } from '../store/graph-store';
import { serializeKG } from '../parser/serialize-kg';
import { parseKG } from '../parser/parse-kg';

const HASH_PREFIX = '#graph=';

/** On mount, load graph from URL hash if present. On graph change, update URL hash. */
export function useShareableUrl() {
  // Load from URL on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith(HASH_PREFIX)) return;
    try {
      const compressed = hash.slice(HASH_PREFIX.length);
      const json = decompressFromEncodedURIComponent(compressed);
      if (!json) return;
      const kg = parseKG(json);
      useGraphStore.getState().loadGraph(kg);
    } catch {
      // Silently ignore bad URL data
    }
  }, []);

  // Update URL when graph changes
  useEffect(() => {
    const unsub = useGraphStore.subscribe((state, prevState) => {
      if (state.kgNodes !== prevState.kgNodes || state.kgEdges !== prevState.kgEdges) {
        if (state.kgNodes.length === 0) return;
        const json = serializeKG({ nodes: state.kgNodes, edges: state.kgEdges }, 'json');
        const compressed = compressToEncodedURIComponent(json);
        window.history.replaceState(null, '', `${HASH_PREFIX}${compressed}`);
      }
    });
    return unsub;
  }, []);
}

/** Get a shareable URL for the current graph */
export function getShareableUrl(): string {
  const state = useGraphStore.getState();
  const json = serializeKG({ nodes: state.kgNodes, edges: state.kgEdges }, 'json');
  const compressed = compressToEncodedURIComponent(json);
  return `${window.location.origin}${window.location.pathname}${HASH_PREFIX}${compressed}`;
}
