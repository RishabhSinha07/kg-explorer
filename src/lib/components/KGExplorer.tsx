import { createContext, useContext, useEffect, useRef } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Canvas } from './canvas/Canvas';
import { Toolbar } from './toolbar/Toolbar';
import { PropertiesPanel } from './panels/PropertiesPanel';
import { SearchPanel } from './panels/SearchPanel';
import { ErrorBoundary } from './ErrorBoundary';
import { ErrorToast } from './ErrorToast';
import { useGraphStore } from '../store/graph-store';
import { useUIStore } from '../store/ui-store';
import { useKeyboardShortcuts } from '../hooks/use-keyboard';
import { useFileDrop } from '../hooks/use-file-drop';
import { useBeforeUnload } from '../hooks/use-before-unload';
import { parseKG } from '../parser/parse-kg';
import type { KnowledgeGraph, KnowledgeGraphInput } from '../types';
import { KnowledgeGraphSchema } from '../types';

export interface KGExplorerProps {
  data?: string | KnowledgeGraph | KnowledgeGraphInput;
  height?: string | number;
  width?: string | number;
  onChange?: (graph: KnowledgeGraph) => void;
  readOnly?: boolean;
}

// Context for readOnly mode
const ReadOnlyContext = createContext(false);
export function useReadOnly() {
  return useContext(ReadOnlyContext);
}

function KGExplorerInner({ data, height = '100vh', width = '100%', onChange, readOnly = false }: KGExplorerProps) {
  const loadGraph = useGraphStore((s) => s.loadGraph);
  const theme = useUIStore((s) => s.theme);
  const setError = useUIStore((s) => s.setError);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useKeyboardShortcuts();
  useFileDrop();
  useBeforeUnload();

  // Fire onChange when graph mutates
  useEffect(() => {
    if (!onChangeRef.current) return;
    const unsub = useGraphStore.subscribe((state, prevState) => {
      if (state.kgNodes !== prevState.kgNodes || state.kgEdges !== prevState.kgEdges) {
        onChangeRef.current?.({ nodes: state.kgNodes, edges: state.kgEdges });
      }
    });
    return unsub;
  }, []);

  // Apply data-theme to the document root so CSS vars propagate everywhere
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!data) return;
    try {
      const kg = typeof data === 'string' ? parseKG(data) : KnowledgeGraphSchema.parse(data);
      loadGraph(kg);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to load graph: ${message}`);
      console.error('Failed to load knowledge graph:', err);
    }
  }, [data, loadGraph, setError]);

  return (
    <ReadOnlyContext.Provider value={readOnly}>
      <div
        style={{
          height: typeof height === 'number' ? `${height}px` : height,
          width: typeof width === 'number' ? `${width}px` : width,
        }}
        className="relative"
      >
        <Canvas />
        {!readOnly && <Toolbar />}
        <PropertiesPanel />
        <SearchPanel />
        <ErrorToast />
      </div>
    </ReadOnlyContext.Provider>
  );
}

export function KGExplorer(props: KGExplorerProps) {
  return (
    <ReactFlowProvider>
      <ErrorBoundary>
        <KGExplorerInner {...props} />
      </ErrorBoundary>
    </ReactFlowProvider>
  );
}
