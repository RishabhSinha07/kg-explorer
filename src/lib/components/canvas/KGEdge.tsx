import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import { getEdgeLabel, type KGEdge as KGEdgeType } from '../../types';

function KGEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const kg = data?.kg as KGEdgeType | undefined;
  const label = kg ? getEdgeLabel(kg) : '';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: selected ? '#818cf8' : 'var(--kg-edge)',
          strokeWidth: selected ? 2 : 1.5,
          transition: 'stroke 0.15s, stroke-width 0.15s',
        }}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            className="absolute text-[10px] font-medium px-1.5 py-0.5 rounded pointer-events-auto cursor-pointer transition-all duration-150 border"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              backgroundColor: selected ? 'rgba(99,102,241,0.15)' : 'var(--kg-surface)',
              color: selected ? '#818cf8' : 'var(--kg-text-muted)',
              borderColor: selected ? 'rgba(99,102,241,0.3)' : 'var(--kg-border)',
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const KGEdge = memo(KGEdgeComponent);
