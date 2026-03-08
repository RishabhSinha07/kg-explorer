import { useMemo } from 'react';
import { Panel } from '@xyflow/react';
import { useGraphStore } from '../../store/graph-store';
import { useUIStore } from '../../store/ui-store';
import { getNodeType } from '../../types';
import { getNodeColor } from '../canvas/node-colors';

export function TypeFilter() {
  const kgNodes = useGraphStore((s) => s.kgNodes);
  const hiddenTypes = useUIStore((s) => s.hiddenTypes);
  const toggleTypeFilter = useUIStore((s) => s.toggleTypeFilter);

  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const node of kgNodes) {
      const t = getNodeType(node);
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [kgNodes]);

  if (typeCounts.length <= 1) return null;

  return (
    <Panel position="bottom-left" className="!m-3">
      <div className="kg-surface border kg-border rounded-lg shadow-xl p-2 flex flex-wrap gap-1.5 max-w-xs">
        {typeCounts.map(([type, count]) => {
          const hidden = hiddenTypes.has(type);
          const color = getNodeColor(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggleTypeFilter(type)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                hidden
                  ? 'opacity-40 line-through kg-text-faint'
                  : 'kg-text kg-hover'
              }`}
              title={`${hidden ? 'Show' : 'Hide'} ${type} (${count})`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span>{type}</span>
              <span className="kg-text-faint">{count}</span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
