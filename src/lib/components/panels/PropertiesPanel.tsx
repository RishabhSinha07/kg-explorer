import { useState, useCallback } from 'react';
import { Panel } from '@xyflow/react';
import { useReadOnly } from '../KGExplorer';
import { useGraphStore } from '../../store/graph-store';
import { useUIStore } from '../../store/ui-store';
import { getNodeFields, getEdgeFields, type KGNode, type KGEdge } from '../../types';

function toDisplayString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

function parseFieldValue(input: string): unknown {
  try {
    const parsed = JSON.parse(input);
    if (typeof parsed === 'object' || typeof parsed === 'number' || typeof parsed === 'boolean') {
      return parsed;
    }
  } catch {
    // Not JSON
  }
  return input;
}

function EditableField({
  fieldKey,
  value,
  onUpdate,
  onDelete,
  readOnlyKey = false,
}: {
  fieldKey: string;
  value: unknown;
  onUpdate: (key: string, value: unknown) => void;
  onDelete: (key: string) => void;
  readOnlyKey?: boolean;
}) {
  const displayStr = toDisplayString(value);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(displayStr);

  const handleBlur = useCallback(() => {
    setEditing(false);
    if (editValue !== displayStr) {
      onUpdate(fieldKey, parseFieldValue(editValue));
    }
  }, [editValue, displayStr, fieldKey, onUpdate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      if (e.key === 'Escape') {
        setEditValue(displayStr);
        setEditing(false);
      }
    },
    [displayStr],
  );

  return (
    <div className="group flex items-center gap-2 text-xs py-1 px-1 -mx-1 rounded kg-hover">
      <span className="kg-text-faint font-medium min-w-[60px] shrink-0 truncate">{fieldKey}</span>
      {editing ? (
        <input
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 kg-input text-xs px-1.5 py-0.5 rounded border outline-none"
        />
      ) : (
        <span
          role="button"
          tabIndex={0}
          onClick={() => {
            setEditValue(displayStr);
            setEditing(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setEditValue(displayStr);
              setEditing(true);
            }
          }}
          className="flex-1 min-w-0 kg-text-secondary truncate cursor-text hover:text-[var(--kg-text)]"
        >
          {!displayStr ? (
            <span className="kg-text-faint italic">empty</span>
          ) : (
            displayStr
          )}
        </span>
      )}
      {!readOnlyKey && (
        <button
          type="button"
          onClick={() => onDelete(fieldKey)}
          aria-label={`Delete ${fieldKey}`}
          className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 kg-text-faint hover:text-red-400 transition-all shrink-0"
          title={`Delete "${fieldKey}"`}
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}

function ConnectToRow({
  currentNodeId,
  allNodes,
  existingEdges,
  onConnect,
}: {
  currentNodeId: string;
  allNodes: KGNode[];
  existingEdges: KGEdge[];
  onConnect: (targetId: string) => void;
}) {
  const [targetId, setTargetId] = useState('');

  const connectedIds = new Set(
    existingEdges
      .filter((e) => e.source === currentNodeId || e.target === currentNodeId)
      .flatMap((e) => [e.source, e.target]),
  );
  const available = allNodes.filter((n) => n.id !== currentNodeId && !connectedIds.has(n.id));

  const handleConnect = useCallback(() => {
    if (!targetId) return;
    onConnect(targetId);
    setTargetId('');
  }, [targetId, onConnect]);

  if (available.length === 0) return null;

  return (
    <div className="flex gap-1.5">
      <select
        value={targetId}
        onChange={(e) => setTargetId(e.target.value)}
        className="flex-1 kg-input text-xs px-2 py-1.5 rounded border outline-none"
      >
        <option value="">Select node...</option>
        {available.map((n) => {
          const label = typeof n.label === 'string' ? n.label : typeof n.name === 'string' ? n.name : n.id;
          return (
            <option key={n.id} value={n.id}>
              {label}
            </option>
          );
        })}
      </select>
      <button
        onClick={handleConnect}
        disabled={!targetId}
        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2 disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
      >
        Link
      </button>
    </div>
  );
}

function AddFieldRow({ onAdd }: { onAdd: (key: string, value: string) => void }) {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');

  const handleAdd = useCallback(() => {
    if (!key.trim()) return;
    onAdd(key.trim(), value);
    setKey('');
    setValue('');
  }, [key, value, onAdd]);

  return (
    <div className="flex gap-1.5 mt-2">
      <input
        placeholder="field name"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        className="flex-1 kg-input text-xs px-2 py-1.5 rounded border outline-none placeholder:text-[var(--kg-text-faint)]"
      />
      <input
        placeholder="value"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        className="flex-1 kg-input text-xs px-2 py-1.5 rounded border outline-none placeholder:text-[var(--kg-text-faint)]"
      />
      <button
        onClick={handleAdd}
        disabled={!key.trim()}
        className="text-xs text-indigo-400 hover:text-indigo-300 font-bold px-2 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        +
      </button>
    </div>
  );
}

function JsonView({
  data,
  onSave,
}: {
  data: KGNode | KGEdge;
  onSave: (updated: Record<string, unknown>) => void;
}) {
  const jsonStr = JSON.stringify(data, null, 2);
  const [editJson, setEditJson] = useState(jsonStr);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const currentJson = JSON.stringify(data, null, 2);
  if (!dirty && editJson !== currentJson) {
    setEditJson(currentJson);
    setError(null);
  }

  const handleSave = useCallback(() => {
    try {
      const parsed = JSON.parse(editJson);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setError('Must be a JSON object');
        return;
      }
      setError(null);
      setDirty(false);
      onSave(parsed);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [editJson, onSave]);

  return (
    <div className="px-3 py-2">
      <textarea
        value={editJson}
        onChange={(e) => {
          setEditJson(e.target.value);
          setDirty(true);
          setError(null);
        }}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 's') {
            e.preventDefault();
            handleSave();
          }
        }}
        spellCheck={false}
        className="w-full kg-surface-deep kg-text-secondary text-[11px] font-mono px-3 py-2.5 rounded-md border kg-border outline-none focus:border-indigo-500 transition-colors resize-y min-h-[120px] leading-relaxed"
        rows={Math.min(Math.max(jsonStr.split('\n').length, 6), 20)}
      />
      {error && (
        <div className="text-[10px] text-red-400 mt-1 px-1">{error}</div>
      )}
      {dirty && (
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] kg-text-faint">Ctrl+S to save</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => {
                setEditJson(currentJson);
                setDirty(false);
                setError(null);
              }}
              className="text-[10px] kg-text-faint hover:text-[var(--kg-text)] px-2 py-1 rounded transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded font-medium transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionDivider() {
  return <div className="border-t" style={{ borderColor: 'var(--kg-border)' }} />;
}

export function PropertiesPanel() {
  const showProperties = useUIStore((s) => s.showProperties);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const selectedEdgeId = useGraphStore((s) => s.selectedEdgeId);
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const kgNodes = useGraphStore((s) => s.kgNodes);
  const kgEdges = useGraphStore((s) => s.kgEdges);
  const updateNodeField = useGraphStore((s) => s.updateNodeField);
  const deleteNodeField = useGraphStore((s) => s.deleteNodeField);
  const updateEdgeField = useGraphStore((s) => s.updateEdgeField);
  const deleteEdgeField = useGraphStore((s) => s.deleteEdgeField);
  const deleteNode = useGraphStore((s) => s.deleteNode);
  const addEdge = useGraphStore((s) => s.addEdge);
  const deleteEdge = useGraphStore((s) => s.deleteEdge);

  const readOnly = useReadOnly();
  const [viewMode, setViewMode] = useState<'fields' | 'json'>('fields');

  const selectedNode = selectedNodeId ? kgNodes.find((n) => n.id === selectedNodeId) : null;
  const selectedFlowEdge = selectedEdgeId ? edges.find((e) => e.id === selectedEdgeId) : null;
  const selectedEdgeIndex = selectedFlowEdge ? edges.indexOf(selectedFlowEdge) : -1;
  const selectedKGEdge = selectedEdgeIndex >= 0 ? kgEdges[selectedEdgeIndex] : null;

  const handleNodeJsonSave = useCallback(
    (updated: Record<string, unknown>) => {
      if (!selectedNodeId) return;
      const oldNode = kgNodes.find((n) => n.id === selectedNodeId);
      if (!oldNode) return;
      for (const key of Object.keys(oldNode)) {
        if (key === 'id') continue;
        if (!(key in updated)) deleteNodeField(selectedNodeId, key);
      }
      for (const [key, value] of Object.entries(updated)) {
        if (key === 'id') continue;
        updateNodeField(selectedNodeId, key, value);
      }
    },
    [selectedNodeId, kgNodes, updateNodeField, deleteNodeField],
  );

  const handleEdgeJsonSave = useCallback(
    (updated: Record<string, unknown>) => {
      if (!selectedEdgeId || selectedEdgeIndex < 0) return;
      const oldEdge = kgEdges[selectedEdgeIndex];
      if (!oldEdge) return;
      for (const key of Object.keys(oldEdge)) {
        if (key === 'source' || key === 'target') continue;
        if (!(key in updated)) deleteEdgeField(selectedEdgeId, key);
      }
      for (const [key, value] of Object.entries(updated)) {
        if (key === 'source' || key === 'target') continue;
        updateEdgeField(selectedEdgeId, key, value);
      }
    },
    [selectedEdgeId, selectedEdgeIndex, kgEdges, updateEdgeField, deleteEdgeField],
  );

  if (!showProperties) return null;

  const hasSelection = selectedNode || selectedKGEdge;

  return (
    <Panel position="top-right" className="!m-3">
      <div className="w-72 max-h-[calc(100vh-40px)] overflow-y-auto kg-surface border kg-border rounded-lg shadow-xl" role="region" aria-label="Properties panel">
        {/* Header */}
        <div
          className="px-4 py-3 border-b kg-surface sticky top-0 z-10 flex items-center justify-between"
          style={{ borderColor: 'var(--kg-border)' }}
        >
          <h3 className="text-xs font-semibold kg-text-muted uppercase tracking-wider">Properties</h3>
          {hasSelection && (
            <div className="flex rounded-md p-0.5" style={{ backgroundColor: 'var(--kg-input-bg)' }}>
              <button
                type="button"
                onClick={() => setViewMode('fields')}
                className={`text-[10px] font-medium px-2 py-0.5 rounded transition-colors ${
                  viewMode === 'fields'
                    ? 'kg-text'
                    : 'kg-text-faint hover:text-[var(--kg-text)]'
                }`}
                style={viewMode === 'fields' ? { backgroundColor: 'var(--kg-surface-hover)' } : undefined}
              >
                Fields
              </button>
              <button
                type="button"
                onClick={() => setViewMode('json')}
                className={`text-[10px] font-medium px-2 py-0.5 rounded font-mono transition-colors ${
                  viewMode === 'json'
                    ? 'kg-text'
                    : 'kg-text-faint hover:text-[var(--kg-text)]'
                }`}
                style={viewMode === 'json' ? { backgroundColor: 'var(--kg-surface-hover)' } : undefined}
              >
                JSON
              </button>
            </div>
          )}
        </div>

        {!hasSelection ? (
          <div className="px-4 py-8 text-center">
            <p className="text-xs kg-text-faint">Select a node or edge to view properties</p>
          </div>
        ) : selectedNode ? (
          viewMode === 'json' ? (
            <div>
              <JsonView data={selectedNode} onSave={handleNodeJsonSave} />
              <SectionDivider />
              <div className="px-4 py-3">
                <button
                  type="button"
                  aria-label="Delete node"
                  onClick={() => deleteNode(selectedNodeId!)}
                  className="w-full text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 py-1.5 rounded transition-colors"
                >
                  Delete Node
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="px-4 pt-3 pb-1">
                <div className="flex items-center gap-2 text-xs py-1">
                  <span className="kg-text-faint font-medium min-w-[60px] shrink-0">id</span>
                  <span className="kg-text-muted font-mono truncate">{selectedNode.id}</span>
                </div>
              </div>

              <div className="px-4 py-2 space-y-0.5">
                {Object.entries(getNodeFields(selectedNode)).map(([key, value]) => (
                  <EditableField
                    key={key}
                    fieldKey={key}
                    value={value}
                    onUpdate={(k, v) => updateNodeField(selectedNodeId!, k, v)}
                    onDelete={(k) => deleteNodeField(selectedNodeId!, k)}
                    readOnlyKey={readOnly}
                  />
                ))}
              </div>

              {!readOnly && (
                <>
                  <SectionDivider />
                  <div className="px-4 py-2">
                    <div className="text-[10px] kg-text-faint uppercase tracking-wider font-medium mb-1">Add Field</div>
                    <AddFieldRow onAdd={(k, v) => updateNodeField(selectedNodeId!, k, v)} />
                  </div>

                  <SectionDivider />
                  <div className="px-4 py-2">
                    <div className="text-[10px] kg-text-faint uppercase tracking-wider font-medium mb-1">Connect To</div>
                    <ConnectToRow
                      currentNodeId={selectedNodeId!}
                      allNodes={kgNodes}
                      existingEdges={kgEdges}
                      onConnect={(targetId) =>
                        addEdge({ source: selectedNodeId!, target: targetId, type: 'RELATED_TO' })
                      }
                    />
                  </div>

                  <SectionDivider />
                  <div className="px-4 py-3">
                    <button
                      type="button"
                      aria-label="Delete node"
                      onClick={() => deleteNode(selectedNodeId!)}
                      className="w-full text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 py-1.5 rounded transition-colors"
                    >
                      Delete Node
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        ) : selectedKGEdge ? (
          viewMode === 'json' ? (
            <div>
              <JsonView data={selectedKGEdge} onSave={handleEdgeJsonSave} />
              <SectionDivider />
              <div className="px-4 py-3">
                <button
                  type="button"
                  aria-label="Delete edge"
                  onClick={() => deleteEdge(selectedEdgeId!)}
                  className="w-full text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 py-1.5 rounded transition-colors"
                >
                  Delete Edge
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="px-4 pt-3 pb-1 space-y-0.5">
                <div className="flex items-center gap-2 text-xs py-1">
                  <span className="kg-text-faint font-medium min-w-[60px] shrink-0">source</span>
                  <span className="kg-text-muted font-mono truncate">{selectedKGEdge.source}</span>
                </div>
                <div className="flex items-center gap-2 text-xs py-1">
                  <span className="kg-text-faint font-medium min-w-[60px] shrink-0">target</span>
                  <span className="kg-text-muted font-mono truncate">{selectedKGEdge.target}</span>
                </div>
              </div>

              <div className="px-4 py-2 space-y-0.5">
                {Object.entries(getEdgeFields(selectedKGEdge)).map(([key, value]) => (
                  <EditableField
                    key={key}
                    fieldKey={key}
                    value={value}
                    onUpdate={(k, v) => updateEdgeField(selectedEdgeId!, k, v)}
                    onDelete={(k) => deleteEdgeField(selectedEdgeId!, k)}
                    readOnlyKey={readOnly}
                  />
                ))}
              </div>

              {!readOnly && (
                <>
                  <SectionDivider />
                  <div className="px-4 py-2">
                    <div className="text-[10px] kg-text-faint uppercase tracking-wider font-medium mb-1">Add Field</div>
                    <AddFieldRow onAdd={(k, v) => updateEdgeField(selectedEdgeId!, k, v)} />
                  </div>

                  <SectionDivider />
                  <div className="px-4 py-3">
                    <button
                      type="button"
                      aria-label="Delete edge"
                      onClick={() => deleteEdge(selectedEdgeId!)}
                      className="w-full text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 py-1.5 rounded transition-colors"
                    >
                      Delete Edge
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        ) : null}
      </div>
    </Panel>
  );
}
