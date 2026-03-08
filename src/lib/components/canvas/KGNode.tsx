import { memo, useState, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useReadOnly } from '../KGExplorer';
import { useGraphStore } from '../../store/graph-store';
import { getNodeLabel, getNodeType, type KGNode as KGNodeType } from '../../types';

function KGNodeComponent({ id, data, selected }: NodeProps) {
  const kg = data.kg as KGNodeType;
  const color = data.color as string;
  const label = getNodeLabel(kg);
  const nodeType = getNodeType(kg);

  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(label);
  const updateNodeField = useGraphStore((s) => s.updateNodeField);
  const readOnly = useReadOnly();

  const handleDoubleClick = useCallback(() => {
    if (readOnly) return;
    setEditLabel(label);
    setIsEditing(true);
  }, [label, readOnly]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (editLabel.trim() && editLabel !== label) {
      const field = typeof kg.label === 'string' ? 'label' : typeof kg.name === 'string' ? 'name' : 'label';
      updateNodeField(id, field, editLabel.trim());
    }
  }, [editLabel, label, id, kg, updateNodeField]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        (e.target as HTMLInputElement).blur();
      } else if (e.key === 'Escape') {
        setEditLabel(label);
        setIsEditing(false);
      }
    },
    [label],
  );

  const subtitle = Object.entries(kg).find(
    ([k, v]) => !['id', 'label', 'name', 'type', 'category'].includes(k) && typeof v === 'string' && v.length > 0,
  )?.[1] as string | undefined;

  return (
    <div
      role="treeitem"
      aria-label={`${label}${nodeType !== 'default' ? ` (${nodeType})` : ''}`}
      aria-selected={selected}
      className={`
        relative min-w-[160px] max-w-[260px] rounded-lg border kg-surface
        shadow-lg transition-all duration-150
      `}
      style={{
        borderLeftWidth: '3px',
        borderLeftColor: color,
        borderColor: selected ? 'var(--kg-node-selected-border)' : 'var(--kg-border)',
        boxShadow: selected ? '0 0 0 1px var(--kg-node-selected-ring)' : undefined,
      }}
      onDoubleClick={handleDoubleClick}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2 hover:!bg-indigo-400 hover:!border-indigo-300 hover:!shadow-[0_0_8px_rgba(129,140,248,0.6)] transition-all !-top-1.5"
        style={{
          backgroundColor: 'var(--kg-border-strong)',
          borderColor: 'var(--kg-text-faint)',
        }}
      />

      <div className="px-3 py-2.5">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                autoFocus
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="w-full kg-input text-sm font-semibold px-1 py-0.5 rounded border outline-none focus:border-indigo-500"
              />
            ) : (
              <div className="text-sm font-semibold kg-text truncate">{label}</div>
            )}
            {subtitle && (
              <div className="text-xs kg-text-muted mt-0.5 line-clamp-2">{subtitle}</div>
            )}
          </div>
          {nodeType !== 'default' && (
            <span
              className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full uppercase tracking-wider"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {nodeType}
            </span>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 hover:!bg-indigo-400 hover:!border-indigo-300 hover:!shadow-[0_0_8px_rgba(129,140,248,0.6)] transition-all !-bottom-1.5"
        style={{
          backgroundColor: 'var(--kg-border-strong)',
          borderColor: 'var(--kg-text-faint)',
        }}
      />
    </div>
  );
}

export const KGNode = memo(KGNodeComponent);
