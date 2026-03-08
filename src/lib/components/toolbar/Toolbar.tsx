import { useCallback, useRef } from 'react';
import { Panel, useReactFlow } from '@xyflow/react';
import { useGraphStore } from '../../store/graph-store';
import { useUIStore } from '../../store/ui-store';
import { serializeKG } from '../../parser/serialize-kg';
import { parseKG } from '../../parser/parse-kg';
import { ToolbarButton } from './ToolbarButton';

function Divider() {
  return <div className="h-px w-full my-1" style={{ backgroundColor: 'var(--kg-border)' }} />;
}

export function Toolbar() {
  const applyLayout = useGraphStore((s) => s.applyLayout);
  const undo = useGraphStore((s) => s.undo);
  const redo = useGraphStore((s) => s.redo);
  const past = useGraphStore((s) => s.past);
  const future = useGraphStore((s) => s.future);
  const getKnowledgeGraph = useGraphStore((s) => s.getKnowledgeGraph);
  const loadGraph = useGraphStore((s) => s.loadGraph);
  const addNode = useGraphStore((s) => s.addNode);
  const addEdge = useGraphStore((s) => s.addEdge);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const selectNode = useGraphStore((s) => s.selectNode);
  const { fitView, screenToFlowPosition } = useReactFlow();
  const toggleSearch = useUIStore((s) => s.toggleSearch);
  const toggleProperties = useUIStore((s) => s.toggleProperties);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const toggleSelectMode = useUIStore((s) => s.toggleSelectMode);
  const selectMode = useUIStore((s) => s.selectMode);
  const theme = useUIStore((s) => s.theme);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = useCallback(() => {
    const kg = getKnowledgeGraph();
    const json = serializeKG(kg, 'json');
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'knowledge-graph.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [getKnowledgeGraph]);

  const handleExportYAML = useCallback(() => {
    const kg = getKnowledgeGraph();
    const yamlStr = serializeKG(kg, 'yaml');
    const blob = new Blob([yamlStr], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'knowledge-graph.yaml';
    a.click();
    URL.revokeObjectURL(url);
  }, [getKnowledgeGraph]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const kg = parseKG(text);
          loadGraph(kg);
        } catch (err) {
          alert(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [loadGraph],
  );

  const handleAddNode = useCallback(() => {
    const id = `node-${Date.now()}`;
    const centerPos = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    addNode({ id, label: 'New Node' }, centerPos);
    if (selectedNodeId) {
      addEdge({ source: selectedNodeId, target: id, type: 'RELATED_TO' });
    }
    selectNode(id);
    setTimeout(() => {
      fitView({ nodes: [{ id }], duration: 400, padding: 1.5 });
    }, 50);
  }, [addNode, addEdge, selectedNodeId, selectNode, screenToFlowPosition, fitView]);

  return (
    <Panel position="top-left" className="!m-3">
      <div className="flex flex-col w-40 kg-surface border kg-border rounded-lg shadow-xl overflow-hidden">
        {/* Brand */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b" style={{ borderColor: 'var(--kg-border)' }}>
          <div className="w-5 h-5 rounded bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="5" r="3" />
              <circle cx="5" cy="19" r="3" />
              <circle cx="19" cy="19" r="3" />
              <line x1="12" y1="8" x2="5" y2="16" />
              <line x1="12" y1="8" x2="19" y2="16" />
              <line x1="5" y1="19" x2="19" y2="19" />
            </svg>
          </div>
          <span className="text-xs font-semibold kg-text tracking-wide">KG Explorer</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col p-1.5">
          {/* Selection */}
          <ToolbarButton
            onClick={toggleSelectMode}
            label={selectMode ? 'Pan Mode' : 'Select Area'}
            className={selectMode ? '!text-indigo-400 !bg-indigo-500/15' : ''}
          >
            {selectMode ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 9l4-4 4 4M5 15l4 4 4-4" />
                <path d="M15 5l4 4-4 4M9 15l-4 4 4 4" />
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="1" strokeDasharray="4 2" />
                <path d="M8 15l3-3 2 2 4-4" />
              </svg>
            )}
          </ToolbarButton>

          <ToolbarButton onClick={handleAddNode} label="Add Node">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </ToolbarButton>

          <ToolbarButton onClick={applyLayout} label="Auto Layout">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <circle cx="4" cy="4" r="2" />
              <circle cx="20" cy="4" r="2" />
              <circle cx="4" cy="20" r="2" />
              <circle cx="20" cy="20" r="2" />
              <line x1="6" y1="6" x2="10" y2="10" />
              <line x1="18" y1="6" x2="14" y2="10" />
              <line x1="6" y1="18" x2="10" y2="14" />
              <line x1="18" y1="18" x2="14" y2="14" />
            </svg>
          </ToolbarButton>

          <Divider />

          {/* File operations */}
          <ToolbarButton onClick={handleImport} label="Import">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={handleExportJSON} label="Export JSON">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={handleExportYAML} label="Export YAML">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
          </ToolbarButton>

          <Divider />

          {/* View */}
          <ToolbarButton onClick={toggleSearch} label="Search">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </ToolbarButton>

          <ToolbarButton onClick={toggleProperties} label="Properties">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
          </ToolbarButton>

          <ToolbarButton onClick={toggleTheme} label={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}>
            {theme === 'dark' ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </ToolbarButton>

          <Divider />

          {/* History */}
          <div className="flex gap-0.5">
            <ToolbarButton onClick={undo} label="Undo" disabled={past.length === 0}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
              </svg>
            </ToolbarButton>
            <ToolbarButton onClick={redo} label="Redo" disabled={future.length === 0}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
              </svg>
            </ToolbarButton>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.yaml,.yml"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </Panel>
  );
}
