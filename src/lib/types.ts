import { z } from 'zod';

// --- Schema ---
// Nodes and edges are flexible: just id + arbitrary key-value fields.
// Only `id` is required for nodes; `source` and `target` for edges.

export const KGNodeSchema = z
  .object({ id: z.string() })
  .catchall(z.unknown());

export const KGEdgeSchema = z
  .object({ source: z.string(), target: z.string() })
  .catchall(z.unknown());

export const KnowledgeGraphSchema = z.object({
  nodes: z.array(KGNodeSchema).min(1, 'Graph must have at least one node'),
  edges: z.array(KGEdgeSchema).default([]),
});

// --- Types ---

export type KGNode = { id: string; [key: string]: unknown };
export type KGEdge = { source: string; target: string; id?: string; [key: string]: unknown };
export type KnowledgeGraph = { nodes: KGNode[]; edges: KGEdge[] };

// Input types are the same (everything beyond id/source/target is optional)
export type KGNodeInput = KGNode;
export type KGEdgeInput = KGEdge;
export type KnowledgeGraphInput = { nodes: KGNodeInput[]; edges?: KGEdgeInput[] };

export interface HistoryEntry {
  nodes: KGNode[];
  edges: KGEdge[];
  positions: Map<string, { x: number; y: number }>;
}

// --- Helpers ---

/** Get a display label for a node: uses `label` or `name` field, falls back to `id`. */
export function getNodeLabel(node: KGNode): string {
  if (typeof node.label === 'string' && node.label) return node.label;
  if (typeof node.name === 'string' && node.name) return node.name;
  return node.id;
}

/** Get a type/category for a node: uses `type` or `category` field, falls back to 'default'. */
export function getNodeType(node: KGNode): string {
  if (typeof node.type === 'string' && node.type) return node.type;
  if (typeof node.category === 'string' && node.category) return node.category;
  return 'default';
}

/** Get a display label for an edge: uses `label` or `type` field, falls back to empty. */
export function getEdgeLabel(edge: KGEdge): string {
  if (typeof edge.label === 'string' && edge.label) return edge.label;
  if (typeof edge.type === 'string' && edge.type) return edge.type;
  return '';
}

/** Get all user-defined fields (excluding structural keys like id/source/target). */
export function getNodeFields(node: KGNode): Record<string, unknown> {
  const { id, ...fields } = node;
  return fields;
}

export function getEdgeFields(edge: KGEdge): Record<string, unknown> {
  const { source, target, ...fields } = edge;
  return fields;
}
