import type { KGNode, KGEdge } from '../types';

interface LayoutResult {
  positions: Map<string, { x: number; y: number }>;
}

const LAYER_GAP_Y = 220;
const NODE_GAP_X = 280;
const GRID_GAP_X = 300;
const GRID_GAP_Y = 200;
const MAX_GRID_COLS = 5;

// ---- Graph analysis ----

interface GraphInfo {
  childrenMap: Map<string, string[]>;
  roots: string[];
  maxDepth: number;
  depths: Map<string, number>;
}

function analyzeGraph(nodes: KGNode[], edges: KGEdge[]): GraphInfo {
  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();

  for (const node of nodes) {
    incoming.set(node.id, []);
    outgoing.set(node.id, []);
  }
  for (const edge of edges) {
    outgoing.get(edge.source)?.push(edge.target);
    incoming.get(edge.target)?.push(edge.source);
  }

  // Roots = nodes with no incoming edges
  const roots = nodes.filter((n) => (incoming.get(n.id)?.length ?? 0) === 0).map((n) => n.id);
  if (roots.length === 0 && nodes.length > 0) {
    roots.push(nodes[0]!.id);
  }

  // BFS depths
  const depths = new Map<string, number>();
  const queue: { id: string; depth: number }[] = roots.map((id) => ({ id, depth: 0 }));
  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (depths.has(id)) continue;
    depths.set(id, depth);
    for (const child of outgoing.get(id) ?? []) {
      if (!depths.has(child)) {
        queue.push({ id: child, depth: depth + 1 });
      }
    }
  }

  // Disconnected nodes
  for (const node of nodes) {
    if (!depths.has(node.id)) depths.set(node.id, 0);
  }

  // Build tree (each child claimed by one parent)
  const childrenMap = new Map<string, string[]>();
  const claimed = new Set<string>();
  for (const node of nodes) childrenMap.set(node.id, []);

  for (const edge of edges) {
    const sd = depths.get(edge.source) ?? 0;
    const td = depths.get(edge.target) ?? 0;
    if (td > sd && !claimed.has(edge.target)) {
      childrenMap.get(edge.source)!.push(edge.target);
      claimed.add(edge.target);
    }
  }

  // Unclaimed non-root nodes become extra roots
  const allRoots = new Set(roots);
  for (const node of nodes) {
    if (!claimed.has(node.id) && !allRoots.has(node.id)) {
      roots.push(node.id);
      allRoots.add(node.id);
    }
  }

  let maxDepth = 0;
  for (const d of depths.values()) maxDepth = Math.max(maxDepth, d);

  return { childrenMap, roots, maxDepth, depths };
}

// ---- Tree layout (for hierarchical graphs) ----

function treeLayout(nodes: KGNode[], info: GraphInfo): Map<string, { x: number; y: number }> {
  const { childrenMap, roots } = info;

  // Subtree widths
  const subtreeWidth = new Map<string, number>();
  function computeWidth(id: string): number {
    const children = childrenMap.get(id) ?? [];
    if (children.length === 0) { subtreeWidth.set(id, 1); return 1; }
    let total = 0;
    for (const child of children) total += computeWidth(child);
    subtreeWidth.set(id, total);
    return total;
  }
  for (const root of roots) computeWidth(root);

  const positions = new Map<string, { x: number; y: number }>();

  function positionNode(id: string, left: number, depth: number): void {
    const children = childrenMap.get(id) ?? [];
    const width = subtreeWidth.get(id) ?? 1;
    const myX = left + (width * NODE_GAP_X) / 2 - NODE_GAP_X / 2;
    const myY = depth * LAYER_GAP_Y;
    positions.set(id, { x: Math.round(myX), y: Math.round(myY) });

    let childLeft = left;
    for (const child of children) {
      const cw = subtreeWidth.get(child) ?? 1;
      positionNode(child, childLeft, depth + 1);
      childLeft += cw * NODE_GAP_X;
    }
  }

  let currentLeft = 0;
  for (const root of roots) {
    positionNode(root, currentLeft, 0);
    currentLeft += (subtreeWidth.get(root) ?? 1) * NODE_GAP_X + NODE_GAP_X;
  }

  return positions;
}

// ---- Cluster grid layout (for flat/wide graphs) ----

/**
 * Groups nodes by connected component, then lays out each component
 * in a compact cluster. Components are arranged in a grid.
 */
function clusterGridLayout(nodes: KGNode[], edges: KGEdge[], info: GraphInfo): Map<string, { x: number; y: number }> {
  // Find connected components (undirected)
  const adj = new Map<string, Set<string>>();
  for (const node of nodes) adj.set(node.id, new Set());
  for (const edge of edges) {
    adj.get(edge.source)?.add(edge.target);
    adj.get(edge.target)?.add(edge.source);
  }

  const visited = new Set<string>();
  const components: string[][] = [];

  for (const node of nodes) {
    if (visited.has(node.id)) continue;
    const component: string[] = [];
    const stack = [node.id];
    while (stack.length > 0) {
      const id = stack.pop()!;
      if (visited.has(id)) continue;
      visited.add(id);
      component.push(id);
      for (const neighbor of adj.get(id) ?? []) {
        if (!visited.has(neighbor)) stack.push(neighbor);
      }
    }
    components.push(component);
  }

  // Sort components: largest first
  components.sort((a, b) => b.length - a.length);

  const positions = new Map<string, { x: number; y: number }>();

  // Layout each component internally using a mini tree layout
  const componentBoxes: { width: number; height: number; positions: Map<string, { x: number; y: number }> }[] = [];

  for (const comp of components) {
    const compNodes = comp.map((id) => nodes.find((n) => n.id === id)!);
    const compEdges = edges.filter((e) => comp.includes(e.source) && comp.includes(e.target));
    const compInfo = analyzeGraph(compNodes, compEdges);

    let compPositions: Map<string, { x: number; y: number }>;

    if (comp.length <= 3 || compInfo.maxDepth <= 1) {
      // Small or flat component — simple grid within
      compPositions = new Map();
      const cols = Math.min(comp.length, 3);
      for (let i = 0; i < comp.length; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        compPositions.set(comp[i]!, { x: col * NODE_GAP_X, y: row * LAYER_GAP_Y });
      }
    } else {
      // Hierarchical component — use tree layout
      compPositions = treeLayout(compNodes, compInfo);
    }

    // Compute bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const pos of compPositions.values()) {
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x);
      minY = Math.min(minY, pos.y);
      maxY = Math.max(maxY, pos.y);
    }

    // Normalize to start at (0, 0)
    for (const pos of compPositions.values()) {
      pos.x -= minX;
      pos.y -= minY;
    }

    componentBoxes.push({
      width: maxX - minX + GRID_GAP_X,
      height: maxY - minY + GRID_GAP_Y,
      positions: compPositions,
    });
  }

  // Arrange component boxes in a grid layout
  // Use a simple row-based packing approach
  const maxRowWidth = Math.max(
    3000,
    Math.ceil(Math.sqrt(nodes.length)) * GRID_GAP_X,
  );

  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;

  for (const box of componentBoxes) {
    // Start a new row if this component would exceed the max width
    if (cursorX > 0 && cursorX + box.width > maxRowWidth) {
      cursorX = 0;
      cursorY += rowHeight + GRID_GAP_Y;
      rowHeight = 0;
    }

    // Place all nodes of this component
    for (const [id, pos] of box.positions) {
      positions.set(id, { x: Math.round(cursorX + pos.x), y: Math.round(cursorY + pos.y) });
    }

    cursorX += box.width + GRID_GAP_X;
    rowHeight = Math.max(rowHeight, box.height);
  }

  return positions;
}

// ---- Main entry ----

export function computeForceLayout(
  nodes: KGNode[],
  edges: KGEdge[],
  pinnedIds: Set<string> = new Set(),
  existingPositions?: Map<string, { x: number; y: number }>,
): LayoutResult {
  if (nodes.length === 0) return { positions: new Map() };

  const info = analyzeGraph(nodes, edges);

  // Decide strategy: if the graph is mostly flat (many roots relative to total),
  // use cluster grid layout. Otherwise use tree layout.
  const rootRatio = info.roots.length / nodes.length;
  const isFlat = rootRatio > 0.4 || (info.maxDepth <= 1 && nodes.length > 6);

  let computed: Map<string, { x: number; y: number }>;
  if (isFlat) {
    computed = clusterGridLayout(nodes, edges, info);
  } else {
    computed = treeLayout(nodes, info);
  }

  // Center everything around origin
  if (computed.size > 0) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const pos of computed.values()) {
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x);
      minY = Math.min(minY, pos.y);
      maxY = Math.max(maxY, pos.y);
    }
    const offsetX = (minX + maxX) / 2;
    const offsetY = (minY + maxY) / 2;
    for (const pos of computed.values()) {
      pos.x -= offsetX;
      pos.y -= offsetY;
    }
  }

  // Respect pinned nodes
  const positions = new Map<string, { x: number; y: number }>();
  for (const node of nodes) {
    if (pinnedIds.has(node.id) && existingPositions?.has(node.id)) {
      positions.set(node.id, existingPositions.get(node.id)!);
    } else {
      positions.set(node.id, computed.get(node.id) ?? { x: 0, y: 0 });
    }
  }

  return { positions };
}
