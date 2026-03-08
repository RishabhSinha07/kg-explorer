import yaml from 'js-yaml';
import { KnowledgeGraphSchema, type KnowledgeGraph, type KGNode, type KGEdge } from '../types';

// ---- Helpers ----

/** Check if something looks like a node (has an `id` or `name` string field) */
function looksLikeNode(obj: Record<string, unknown>): boolean {
  return (
    (typeof obj.id === 'string' && obj.id.length > 0) ||
    (typeof obj.name === 'string' && obj.name.length > 0)
  );
}

/** Check if something looks like an edge (has source/target or from/to) */
function looksLikeEdge(obj: Record<string, unknown>): boolean {
  return (
    ((typeof obj.source === 'string' || typeof obj.from === 'string') &&
     (typeof obj.target === 'string' || typeof obj.to === 'string'))
  );
}

/** Ensure a node has an `id` — derive from `name` or generate one */
function ensureNodeId(node: Record<string, unknown>, index: number): Record<string, unknown> {
  if (typeof node.id === 'string' && node.id) return node;
  if (typeof node.name === 'string' && node.name) return { ...node, id: node.name };
  return { ...node, id: `node-${index}` };
}

/** Normalize source/target aliases on an edge */
function normalizeEdgeFields(edge: Record<string, unknown>): Record<string, unknown> {
  const e = { ...edge };
  if (!e.source && e.from) { e.source = e.from; delete e.from; }
  if (!e.target && e.to) { e.target = e.to; delete e.to; }
  return e;
}

// ---- Extractors ----

/**
 * Recursively extract all node-like objects from any structure.
 * Tags with `category` based on the parent key when found inside a named group.
 */
function extractNodes(data: unknown, category?: string): Record<string, unknown>[] {
  if (!data) return [];

  // Array of items — check each
  if (Array.isArray(data)) {
    const nodes: Record<string, unknown>[] = [];
    for (const item of data) {
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        const obj = item as Record<string, unknown>;
        if (looksLikeNode(obj)) {
          const tagged = category && !obj.category && !obj.type ? { category, ...obj } : obj;
          nodes.push(tagged);
        }
      }
    }
    return nodes;
  }

  // Object — could be keyed by id, or grouped by category
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    const nodes: Record<string, unknown>[] = [];

    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        // Array under a key = category group (e.g., nodes.problems: [...])
        nodes.push(...extractNodes(value, key));
      } else if (typeof value === 'object' && value !== null) {
        const inner = value as Record<string, unknown>;
        if (looksLikeNode(inner)) {
          // Single node keyed by id
          if (!inner.id) {
            nodes.push({ id: key, ...inner });
          } else {
            nodes.push(inner);
          }
        }
      }
    }
    return nodes;
  }

  return [];
}

/** Recursively extract all edge-like objects from any structure. */
function extractEdges(data: unknown, edgeType?: string): Record<string, unknown>[] {
  if (!data) return [];

  if (Array.isArray(data)) {
    const edges: Record<string, unknown>[] = [];
    for (const item of data) {
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        const obj = normalizeEdgeFields(item as Record<string, unknown>);
        if (looksLikeEdge(obj)) {
          const tagged = edgeType && !obj.type ? { type: edgeType, ...obj } : obj;
          edges.push(tagged);
        }
      }
    }
    return edges;
  }

  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    const edges: Record<string, unknown>[] = [];

    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        edges.push(...extractEdges(value, key));
      } else if (typeof value === 'object' && value !== null) {
        const inner = normalizeEdgeFields(value as Record<string, unknown>);
        if (looksLikeEdge(inner)) {
          edges.push(inner);
        }
      }
    }
    return edges;
  }

  return [];
}

// ---- Main ----

const EDGE_KEYS = new Set(['edges', 'links', 'relationships', 'connections', 'relations']);
const SKIP_KEYS = new Set(['metadata', 'config', 'settings', 'schema', 'version', '$schema']);

function normalizeInput(raw: unknown): { nodes: Record<string, unknown>[]; edges: Record<string, unknown>[] } {
  // Top-level array — treat as nodes
  if (Array.isArray(raw)) {
    return { nodes: extractNodes(raw), edges: [] };
  }

  if (typeof raw !== 'object' || raw === null) {
    return { nodes: [], edges: [] };
  }

  const obj = raw as Record<string, unknown>;

  // Find the nodes source
  let nodesRaw: unknown = null;
  let edgesRaw: unknown = null;

  for (const [key, value] of Object.entries(obj)) {
    const k = key.toLowerCase();
    if (SKIP_KEYS.has(k)) continue;
    if (k === 'nodes' || k === 'vertices') {
      nodesRaw = value;
    } else if (EDGE_KEYS.has(k)) {
      edgesRaw = value;
    }
  }

  // If no explicit `nodes` key, the whole object might be the graph
  // (e.g., keys are node ids pointing to node objects)
  const nodes = nodesRaw ? extractNodes(nodesRaw) : [];
  const edges = edgesRaw ? extractEdges(edgesRaw) : [];

  // If we still found no nodes, try extracting from the whole object
  if (nodes.length === 0) {
    // Maybe the entire object is node-keyed
    for (const [key, value] of Object.entries(obj)) {
      if (SKIP_KEYS.has(key.toLowerCase()) || EDGE_KEYS.has(key.toLowerCase())) continue;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const inner = value as Record<string, unknown>;
        if (looksLikeNode(inner)) {
          if (!inner.id) nodes.push({ id: key, ...inner });
          else nodes.push(inner);
        }
      }
    }
  }

  return { nodes, edges };
}

export function parseKG(input: string): KnowledgeGraph {
  let raw: unknown;

  // Try JSON first, then YAML
  try {
    raw = JSON.parse(input);
  } catch {
    try {
      raw = yaml.load(input);
    } catch (e) {
      throw new Error(`Failed to parse input as JSON or YAML: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Normalize any format into { nodes, edges }
  const { nodes: rawNodes, edges: rawEdges } = normalizeInput(raw);

  // Ensure every node has an id, deduplicate
  const seen = new Set<string>();
  const nodes: KGNode[] = [];
  for (let i = 0; i < rawNodes.length; i++) {
    const node = ensureNodeId(rawNodes[i]!, i) as KGNode;
    if (seen.has(node.id)) {
      console.warn(`[kg-explorer] Duplicate node id '${node.id}', skipping`);
      continue;
    }
    seen.add(node.id);
    nodes.push(node);
  }

  if (nodes.length === 0) {
    throw new Error('No valid nodes found in the file. Nodes must have an "id" or "name" field.');
  }

  // Filter edges to only valid references and assign stable IDs
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges: KGEdge[] = [];
  for (let i = 0; i < rawEdges.length; i++) {
    const e = rawEdges[i] as KGEdge;
    if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) {
      console.warn(
        `[kg-explorer] Skipping edge: ${!nodeIds.has(e.source) ? `source '${e.source}'` : `target '${e.target}'`} not found`,
      );
      continue;
    }
    if (!e.id) {
      e.id = `edge-${e.source}-${e.target}-${i}`;
    }
    edges.push(e);
  }

  return { nodes, edges };
}
