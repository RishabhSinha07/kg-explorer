import { create } from 'zustand';
import type { Node, Edge, XYPosition } from '@xyflow/react';
import type { KnowledgeGraph, KGNode, KGEdge, HistoryEntry } from '../types';
import { getNodeLabel, getNodeType, getEdgeLabel } from '../types';
import { computeForceLayout } from '../layout/force-layout';
import { getNodeColor } from '../components/canvas/node-colors';

function kgToFlowNodes(kgNodes: KGNode[], positions?: Map<string, { x: number; y: number }>): Node[] {
  return kgNodes.map((n) => {
    const pos = positions?.get(n.id) ?? { x: 0, y: 0 };
    const nodeType = getNodeType(n);
    return {
      id: n.id,
      type: 'kgNode',
      position: pos,
      data: {
        kg: n, // pass the raw KG node through
        color: getNodeColor(nodeType),
      },
    };
  });
}

function kgToFlowEdges(kgEdges: KGEdge[]): Edge[] {
  return kgEdges.map((e, i) => ({
    id: `e-${e.source}-${e.target}-${i}`,
    source: e.source,
    target: e.target,
    type: 'kgEdge',
    data: {
      kg: e, // pass the raw KG edge through
    },
  }));
}

function flowToKGNodes(nodes: Node[]): KGNode[] {
  return nodes.map((n) => (n.data.kg as KGNode));
}

function flowToKGEdges(edges: Edge[]): KGEdge[] {
  return edges.map((e) => (e.data?.kg as KGEdge));
}

export interface GraphState {
  nodes: Node[];
  edges: Edge[];
  kgNodes: KGNode[];
  kgEdges: KGEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  pinnedIds: Set<string>;
  past: HistoryEntry[];
  future: HistoryEntry[];

  loadGraph: (kg: KnowledgeGraph) => void;
  applyLayout: () => void;
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  updateNodePosition: (id: string, position: XYPosition) => void;
  updateNodeField: (nodeId: string, key: string, value: unknown) => void;
  deleteNodeField: (nodeId: string, key: string) => void;
  updateEdgeField: (edgeId: string, key: string, value: unknown) => void;
  deleteEdgeField: (edgeId: string, key: string) => void;
  addNode: (node: KGNode, position?: { x: number; y: number }) => void;
  deleteNode: (id: string) => void;
  addEdge: (edge: KGEdge) => void;
  deleteEdge: (id: string) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  undo: () => void;
  redo: () => void;
  getKnowledgeGraph: () => KnowledgeGraph;
}

function pushHistory(state: GraphState): Partial<GraphState> {
  return {
    past: [...state.past, { nodes: state.kgNodes, edges: state.kgEdges }].slice(-50),
    future: [],
  };
}

/** Rebuild a single flow node from updated KG data */
function rebuildFlowNode(flowNode: Node, kgNode: KGNode): Node {
  const nodeType = getNodeType(kgNode);
  return {
    ...flowNode,
    data: {
      kg: kgNode,
      color: getNodeColor(nodeType),
    },
  };
}

/** Rebuild a single flow edge from updated KG data */
function rebuildFlowEdge(flowEdge: Edge, kgEdge: KGEdge): Edge {
  return {
    ...flowEdge,
    data: {
      kg: kgEdge,
    },
  };
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  edges: [],
  kgNodes: [],
  kgEdges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  pinnedIds: new Set(),
  past: [],
  future: [],

  loadGraph: (kg) => {
    const { positions } = computeForceLayout(kg.nodes, kg.edges);
    const nodes = kgToFlowNodes(kg.nodes, positions);
    const edges = kgToFlowEdges(kg.edges);
    set({
      nodes,
      edges,
      kgNodes: kg.nodes,
      kgEdges: kg.edges,
      selectedNodeId: null,
      selectedEdgeId: null,
      pinnedIds: new Set(),
      past: [],
      future: [],
    });
  },

  applyLayout: () => {
    const state = get();
    const existingPositions = new Map(state.nodes.map((n) => [n.id, n.position]));
    const { positions } = computeForceLayout(
      state.kgNodes,
      state.kgEdges,
      state.pinnedIds,
      existingPositions,
    );
    set({
      nodes: state.nodes.map((n) => ({
        ...n,
        position: positions.get(n.id) ?? n.position,
      })),
    });
  },

  selectNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),

  updateNodePosition: (id, position) => {
    const state = get();
    set({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, position } : n)),
      pinnedIds: new Set([...state.pinnedIds, id]),
    });
  },

  updateNodeField: (nodeId, key, value) => {
    const state = get();
    const history = pushHistory(state);

    // Cannot change `id` — it's structural
    if (key === 'id') return;

    const kgNodes = state.kgNodes.map((n) =>
      n.id === nodeId ? { ...n, [key]: value } : n,
    );
    const updatedKG = kgNodes.find((n) => n.id === nodeId);
    const nodes = state.nodes.map((n) =>
      n.id === nodeId && updatedKG ? rebuildFlowNode(n, updatedKG) : n,
    );
    set({ ...history, kgNodes, nodes });
  },

  deleteNodeField: (nodeId, key) => {
    const state = get();
    const history = pushHistory(state);

    // Cannot delete `id`
    if (key === 'id') return;

    const kgNodes = state.kgNodes.map((n) => {
      if (n.id !== nodeId) return n;
      const { [key]: _, ...rest } = n;
      return rest as KGNode;
    });
    const updatedKG = kgNodes.find((n) => n.id === nodeId);
    const nodes = state.nodes.map((n) =>
      n.id === nodeId && updatedKG ? rebuildFlowNode(n, updatedKG) : n,
    );
    set({ ...history, kgNodes, nodes });
  },

  updateEdgeField: (edgeId, key, value) => {
    const state = get();
    const history = pushHistory(state);

    // Cannot change source/target — they're structural
    if (key === 'source' || key === 'target') return;

    const edgeIndex = state.edges.findIndex((e) => e.id === edgeId);
    if (edgeIndex === -1) return;

    const kgEdges = state.kgEdges.map((e, i) =>
      i === edgeIndex ? { ...e, [key]: value } : e,
    );
    const edges = state.edges.map((e, i) =>
      i === edgeIndex ? rebuildFlowEdge(e, kgEdges[i]!) : e,
    );
    set({ ...history, kgEdges, edges });
  },

  deleteEdgeField: (edgeId, key) => {
    const state = get();
    const history = pushHistory(state);

    if (key === 'source' || key === 'target') return;

    const edgeIndex = state.edges.findIndex((e) => e.id === edgeId);
    if (edgeIndex === -1) return;

    const kgEdges = state.kgEdges.map((e, i) => {
      if (i !== edgeIndex) return e;
      const { [key]: _, ...rest } = e;
      return rest as KGEdge;
    });
    const edges = state.edges.map((e, i) =>
      i === edgeIndex ? rebuildFlowEdge(e, kgEdges[i]!) : e,
    );
    set({ ...history, kgEdges, edges });
  },

  addNode: (node, position) => {
    const state = get();
    const history = pushHistory(state);
    const kgNodes = [...state.kgNodes, node];
    const nodeType = getNodeType(node);
    const newFlowNode: Node = {
      id: node.id,
      type: 'kgNode',
      position: position ?? { x: Math.random() * 400, y: Math.random() * 400 },
      selected: true,
      data: {
        kg: node,
        color: getNodeColor(nodeType),
      },
    };
    // Deselect all other nodes, select the new one
    const updatedNodes = state.nodes.map((n) => ({ ...n, selected: false }));
    set({ ...history, kgNodes, nodes: [...updatedNodes, newFlowNode] });
  },

  deleteNode: (id) => {
    const state = get();
    const history = pushHistory(state);
    set({
      ...history,
      kgNodes: state.kgNodes.filter((n) => n.id !== id),
      kgEdges: state.kgEdges.filter((e) => e.source !== id && e.target !== id),
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    });
  },

  addEdge: (edge) => {
    const state = get();
    const history = pushHistory(state);
    const kgEdges = [...state.kgEdges, edge];
    const idx = kgEdges.length - 1;
    const newFlowEdge: Edge = {
      id: `e-${edge.source}-${edge.target}-${idx}`,
      source: edge.source,
      target: edge.target,
      type: 'kgEdge',
      data: { kg: edge },
    };
    set({ ...history, kgEdges, edges: [...state.edges, newFlowEdge] });
  },

  deleteEdge: (id) => {
    const state = get();
    const history = pushHistory(state);
    const edgeIndex = state.edges.findIndex((e) => e.id === id);
    set({
      ...history,
      edges: state.edges.filter((e) => e.id !== id),
      kgEdges: state.kgEdges.filter((_, i) => i !== edgeIndex),
      selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId,
    });
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  undo: () => {
    const state = get();
    if (state.past.length === 0) return;
    const previous = state.past[state.past.length - 1]!;
    const { positions } = computeForceLayout(previous.nodes, previous.edges);
    set({
      past: state.past.slice(0, -1),
      future: [{ nodes: state.kgNodes, edges: state.kgEdges }, ...state.future],
      kgNodes: previous.nodes,
      kgEdges: previous.edges,
      nodes: kgToFlowNodes(previous.nodes, positions),
      edges: kgToFlowEdges(previous.edges),
    });
  },

  redo: () => {
    const state = get();
    if (state.future.length === 0) return;
    const next = state.future[0]!;
    const { positions } = computeForceLayout(next.nodes, next.edges);
    set({
      past: [...state.past, { nodes: state.kgNodes, edges: state.kgEdges }],
      future: state.future.slice(1),
      kgNodes: next.nodes,
      kgEdges: next.edges,
      nodes: kgToFlowNodes(next.nodes, positions),
      edges: kgToFlowEdges(next.edges),
    });
  },

  getKnowledgeGraph: () => {
    const state = get();
    return {
      nodes: flowToKGNodes(state.nodes),
      edges: flowToKGEdges(state.edges),
    };
  },
}));
