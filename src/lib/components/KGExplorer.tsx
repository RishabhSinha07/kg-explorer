import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Canvas } from './canvas/Canvas';
import { Toolbar } from './toolbar/Toolbar';
import { PropertiesPanel } from './panels/PropertiesPanel';
import { SearchPanel } from './panels/SearchPanel';
import { useGraphStore } from '../store/graph-store';
import { useUIStore } from '../store/ui-store';
import { useKeyboardShortcuts } from '../hooks/use-keyboard';
import { useFileDrop } from '../hooks/use-file-drop';
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

function KGExplorerInner({ data, height = '100vh', width = '100%', onChange }: KGExplorerProps) {
  const loadGraph = useGraphStore((s) => s.loadGraph);
  const theme = useUIStore((s) => s.theme);

  useKeyboardShortcuts();
  useFileDrop();

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
      console.error('Failed to load knowledge graph:', err);
    }
  }, [data, loadGraph]);

  return (
    <div
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: typeof width === 'number' ? `${width}px` : width,
      }}
      className="relative"
    >
      <Canvas />
      <Toolbar />
      <PropertiesPanel />
      <SearchPanel />
    </div>
  );
}

export function KGExplorer(props: KGExplorerProps) {
  return (
    <ReactFlowProvider>
      <KGExplorerInner {...props} />
    </ReactFlowProvider>
  );
}
