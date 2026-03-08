import { useEffect, useCallback } from 'react';
import { parseKG } from '../parser/parse-kg';
import { useGraphStore } from '../store/graph-store';
import { useUIStore } from '../store/ui-store';

export function useFileDrop() {
  const loadGraph = useGraphStore((s) => s.loadGraph);
  const setError = useUIStore((s) => s.setError);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer?.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const kg = parseKG(text);
          loadGraph(kg);
        } catch (err) {
          setError(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      };
      reader.readAsText(file);
    },
    [loadGraph, setError],
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
  }, []);

  useEffect(() => {
    window.addEventListener('drop', handleDrop);
    window.addEventListener('dragover', handleDragOver);
    return () => {
      window.removeEventListener('drop', handleDrop);
      window.removeEventListener('dragover', handleDragOver);
    };
  }, [handleDrop, handleDragOver]);
}
