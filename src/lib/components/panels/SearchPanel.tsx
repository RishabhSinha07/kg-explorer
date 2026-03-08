import { useCallback, useRef, useEffect } from 'react';
import { Panel, useReactFlow } from '@xyflow/react';
import { useUIStore } from '../../store/ui-store';
import { useGraphStore } from '../../store/graph-store';
import { getNodeLabel, getNodeType, type KGNode } from '../../types';

export function SearchPanel() {
  const showSearch = useUIStore((s) => s.showSearch);
  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const toggleSearch = useUIStore((s) => s.toggleSearch);
  const nodes = useGraphStore((s) => s.nodes);
  const selectNode = useGraphStore((s) => s.selectNode);
  const { fitView } = useReactFlow();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showSearch) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [showSearch]);

  const matchingNodes = searchQuery.trim()
    ? nodes.filter((n) => {
        const q = searchQuery.toLowerCase();
        const kg = n.data.kg as Record<string, unknown>;
        return Object.values(kg).some(
          (v) => typeof v === 'string' && v.toLowerCase().includes(q),
        ) || n.id.toLowerCase().includes(q);
      })
    : [];

  const handleSelect = useCallback(
    (nodeId: string) => {
      selectNode(nodeId);
      fitView({ nodes: [{ id: nodeId }], duration: 400, padding: 1 });
      toggleSearch();
    },
    [selectNode, fitView, toggleSearch],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        toggleSearch();
      } else if (e.key === 'Enter' && matchingNodes.length > 0) {
        handleSelect(matchingNodes[0]!.id);
      }
    },
    [toggleSearch, matchingNodes, handleSelect],
  );

  if (!showSearch) return null;

  return (
    <Panel position="top-center" className="!mt-3">
      <div className="w-96 kg-surface border kg-border rounded-lg shadow-xl overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: 'var(--kg-border)' }}>
          <svg className="w-4 h-4 kg-text-faint shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search nodes by label, type, or ID..."
            className="flex-1 bg-transparent text-sm kg-text outline-none placeholder:text-[var(--kg-text-faint)]"
          />
          <button
            onClick={toggleSearch}
            className="kg-text-faint hover:text-[var(--kg-text)] transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {searchQuery.trim() && (
          <div className="max-h-64 overflow-y-auto">
            {matchingNodes.length === 0 ? (
              <div className="px-4 py-3 text-xs kg-text-faint">No matching nodes</div>
            ) : (
              matchingNodes.map((node) => (
                <button
                  key={node.id}
                  onClick={() => handleSelect(node.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 kg-hover transition-colors text-left"
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: node.data.color as string }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm kg-text truncate">{getNodeLabel(node.data.kg as KGNode)}</div>
                    <div className="text-[10px] kg-text-faint">{getNodeType(node.data.kg as KGNode)}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}
