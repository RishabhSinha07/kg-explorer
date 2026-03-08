import { describe, it, expect, beforeEach } from 'vitest';
import { useGraphStore } from '../graph-store';
import type { KnowledgeGraph } from '../../types';

const sampleGraph: KnowledgeGraph = {
  nodes: [
    { id: 'a', label: 'Alpha', type: 'Concept' },
    { id: 'b', label: 'Beta', type: 'Entity' },
    { id: 'c', label: 'Gamma', type: 'Concept' },
  ],
  edges: [
    { id: 'e1', source: 'a', target: 'b', type: 'relates' },
    { id: 'e2', source: 'b', target: 'c', type: 'relates' },
  ],
};

function getState() {
  return useGraphStore.getState();
}

describe('graph-store', () => {
  beforeEach(() => {
    // Reset the store
    getState().loadGraph(sampleGraph);
  });

  describe('loadGraph', () => {
    it('loads nodes and edges', () => {
      expect(getState().kgNodes).toHaveLength(3);
      expect(getState().kgEdges).toHaveLength(2);
      expect(getState().nodes).toHaveLength(3);
      expect(getState().edges).toHaveLength(2);
    });

    it('resets history on load', () => {
      expect(getState().past).toHaveLength(0);
      expect(getState().future).toHaveLength(0);
    });

    it('clears selection on load', () => {
      expect(getState().selectedNodeId).toBeNull();
      expect(getState().selectedEdgeId).toBeNull();
    });
  });

  describe('updateNodeField', () => {
    it('updates a field on a node', () => {
      getState().updateNodeField('a', 'label', 'New Alpha');
      const node = getState().kgNodes.find((n) => n.id === 'a');
      expect(node!.label).toBe('New Alpha');
    });

    it('pushes to history', () => {
      getState().updateNodeField('a', 'label', 'Changed');
      expect(getState().past).toHaveLength(1);
    });

    it('refuses to change id', () => {
      getState().updateNodeField('a', 'id', 'new-id');
      expect(getState().kgNodes.find((n) => n.id === 'a')).toBeTruthy();
    });
  });

  describe('deleteNodeField', () => {
    it('removes a field from a node', () => {
      getState().deleteNodeField('a', 'label');
      const node = getState().kgNodes.find((n) => n.id === 'a');
      expect(node).not.toHaveProperty('label');
    });

    it('refuses to delete id', () => {
      getState().deleteNodeField('a', 'id');
      expect(getState().kgNodes.find((n) => n.id === 'a')).toBeTruthy();
    });
  });

  describe('addNode', () => {
    it('adds a node', () => {
      getState().addNode({ id: 'd', label: 'Delta' });
      expect(getState().kgNodes).toHaveLength(4);
      expect(getState().nodes).toHaveLength(4);
    });

    it('pushes to history', () => {
      getState().addNode({ id: 'd', label: 'Delta' });
      expect(getState().past).toHaveLength(1);
    });
  });

  describe('deleteNode', () => {
    it('removes the node and connected edges', () => {
      getState().deleteNode('b');
      expect(getState().kgNodes).toHaveLength(2);
      expect(getState().kgEdges).toHaveLength(0); // both edges connected to b
    });

    it('clears selection if deleted node was selected', () => {
      getState().selectNode('b');
      getState().deleteNode('b');
      expect(getState().selectedNodeId).toBeNull();
    });
  });

  describe('addEdge', () => {
    it('adds an edge with auto-generated id', () => {
      getState().addEdge({ source: 'a', target: 'c', type: 'new' });
      expect(getState().kgEdges).toHaveLength(3);
      const newEdge = getState().kgEdges[2];
      expect(newEdge!.id).toBeDefined();
    });
  });

  describe('deleteEdge', () => {
    it('removes the edge by flow ID', () => {
      const flowEdgeId = getState().edges[0]!.id;
      getState().deleteEdge(flowEdgeId);
      expect(getState().kgEdges).toHaveLength(1);
      expect(getState().edges).toHaveLength(1);
    });
  });

  describe('undo/redo', () => {
    it('undoes a node field change', () => {
      getState().updateNodeField('a', 'label', 'Changed');
      expect(getState().kgNodes.find((n) => n.id === 'a')!.label).toBe('Changed');
      getState().undo();
      expect(getState().kgNodes.find((n) => n.id === 'a')!.label).toBe('Alpha');
    });

    it('redo restores the change', () => {
      getState().updateNodeField('a', 'label', 'Changed');
      getState().undo();
      getState().redo();
      expect(getState().kgNodes.find((n) => n.id === 'a')!.label).toBe('Changed');
    });

    it('preserves node positions on undo', () => {
      // Record initial positions
      const initialPositions = new Map(getState().nodes.map((n) => [n.id, { ...n.position }]));

      // Make a change (pushes history with current positions)
      getState().updateNodeField('a', 'label', 'Changed');

      // Undo should restore positions from history
      getState().undo();
      for (const node of getState().nodes) {
        const initial = initialPositions.get(node.id);
        expect(node.position.x).toBe(initial!.x);
        expect(node.position.y).toBe(initial!.y);
      }
    });

    it('clears future on new action', () => {
      getState().updateNodeField('a', 'label', 'V1');
      getState().undo();
      expect(getState().future).toHaveLength(1);
      getState().updateNodeField('a', 'label', 'V2');
      expect(getState().future).toHaveLength(0);
    });

    it('caps history at 50 entries', () => {
      for (let i = 0; i < 55; i++) {
        getState().updateNodeField('a', 'label', `V${i}`);
      }
      expect(getState().past.length).toBeLessThanOrEqual(50);
    });

    it('undo does nothing when history is empty', () => {
      const before = getState().kgNodes;
      getState().undo();
      expect(getState().kgNodes).toBe(before);
    });

    it('redo does nothing when future is empty', () => {
      const before = getState().kgNodes;
      getState().redo();
      expect(getState().kgNodes).toBe(before);
    });
  });

  describe('getKnowledgeGraph', () => {
    it('returns the current graph', () => {
      const kg = getState().getKnowledgeGraph();
      expect(kg.nodes).toHaveLength(3);
      expect(kg.edges).toHaveLength(2);
    });
  });

  describe('edge ID-based operations', () => {
    it('updateEdgeField uses ID not index', () => {
      const flowEdgeId = getState().edges[0]!.id;
      getState().updateEdgeField(flowEdgeId, 'weight', 10);
      const kg = getState().kgEdges.find((e) => e.id === 'e1');
      expect(kg!.weight).toBe(10);
    });

    it('deleteEdgeField uses ID not index', () => {
      const flowEdgeId = getState().edges[0]!.id;
      getState().updateEdgeField(flowEdgeId, 'weight', 10);
      getState().deleteEdgeField(flowEdgeId, 'weight');
      const kg = getState().kgEdges.find((e) => e.id === 'e1');
      expect(kg).not.toHaveProperty('weight');
    });

    it('delete first edge then edit second works correctly', () => {
      const firstFlowEdgeId = getState().edges[0]!.id;
      const secondFlowEdgeId = getState().edges[1]!.id;

      // Delete the first edge
      getState().deleteEdge(firstFlowEdgeId);
      expect(getState().kgEdges).toHaveLength(1);

      // Edit the second edge (now the only one)
      getState().updateEdgeField(secondFlowEdgeId, 'weight', 5);
      const remaining = getState().kgEdges[0];
      expect(remaining!.id).toBe('e2');
      expect(remaining!.weight).toBe(5);
    });
  });
});
