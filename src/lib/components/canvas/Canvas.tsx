import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  SelectionMode,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type Connection,
  type NodeMouseHandler,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { KGNode } from './KGNode';
import { KGEdge } from './KGEdge';
import { EmptyState } from '../EmptyState';
import { useReadOnly } from '../KGExplorer';
import { useGraphStore } from '../../store/graph-store';
import { useUIStore } from '../../store/ui-store';

const nodeTypes = { kgNode: KGNode };
const edgeTypes = { kgEdge: KGEdge };

export function Canvas() {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const kgNodeCount = useGraphStore((s) => s.kgNodes.length);
  const isEmpty = kgNodeCount === 0;
  const readOnly = useReadOnly();
  const setNodes = useGraphStore((s) => s.setNodes);
  const setEdges = useGraphStore((s) => s.setEdges);
  const selectNode = useGraphStore((s) => s.selectNode);
  const selectEdge = useGraphStore((s) => s.selectEdge);
  const addEdge = useGraphStore((s) => s.addEdge);
  const updateNodePosition = useGraphStore((s) => s.updateNodePosition);
  const theme = useUIStore((s) => s.theme);
  const selectMode = useUIStore((s) => s.selectMode);

  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'kgEdge',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: theme === 'dark' ? '#52525b' : '#94a3b8',
        width: 16,
        height: 16,
      },
    }),
    [theme],
  );

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      const currentNodes = useGraphStore.getState().nodes;
      setNodes(applyNodeChanges(changes, currentNodes));
      for (const change of changes) {
        if (change.type === 'position' && change.position && !change.dragging) {
          updateNodePosition(change.id, change.position);
        }
      }
    },
    [setNodes, updateNodePosition],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      const currentEdges = useGraphStore.getState().edges;
      setEdges(applyEdgeChanges(changes, currentEdges));
    },
    [setEdges],
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        addEdge({
          source: connection.source,
          target: connection.target,
          type: 'RELATED_TO',
        });
      }
    },
    [addEdge],
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      selectNode(node.id);
    },
    [selectNode],
  );

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: { id: string }) => {
      selectEdge(edge.id);
    },
    [selectEdge],
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
    selectEdge(null);
  }, [selectNode, selectEdge]);

  const proOptions = useMemo(() => ({ hideAttribution: true }), []);

  return (
    <>
    {isEmpty && <EmptyState />}
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={readOnly ? undefined : onConnect}
      onNodeClick={onNodeClick}
      onEdgeClick={onEdgeClick}
      onPaneClick={onPaneClick}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      proOptions={proOptions}
      nodesConnectable={!readOnly}
      nodesDraggable={!readOnly}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      minZoom={0.1}
      maxZoom={4}
      selectionOnDrag={selectMode}
      selectionMode={SelectionMode.Partial}
      panOnDrag={!selectMode}
      style={{ backgroundColor: 'var(--kg-bg)' }}
      colorMode={theme}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={24}
        size={1}
        color="var(--kg-dots)"
      />
      <Controls
        className="!border !shadow-lg !rounded-lg !overflow-hidden"
        style={{
          backgroundColor: 'var(--kg-surface)',
          borderColor: 'var(--kg-border)',
        }}
      />
      <MiniMap
        nodeStrokeColor="var(--kg-border)"
        nodeColor={(n) => (n.data?.color as string) ?? '#64748b'}
        maskColor="var(--kg-minimap-mask)"
        style={{
          backgroundColor: 'var(--kg-bg-subtle)',
          borderColor: 'var(--kg-border)',
        }}
        className="!rounded-lg !border"
        pannable
        zoomable
      />
    </ReactFlow>
    </>
  );
}
