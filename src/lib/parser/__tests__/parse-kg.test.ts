import { describe, it, expect } from 'vitest';
import { parseKG } from '../parse-kg';

describe('parseKG', () => {
  // --- Happy paths ---

  it('parses flat JSON with nodes and edges', () => {
    const input = JSON.stringify({
      nodes: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
      edges: [{ source: 'a', target: 'b' }],
    });
    const result = parseKG(input);
    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]!.source).toBe('a');
    expect(result.edges[0]!.target).toBe('b');
  });

  it('parses YAML input', () => {
    const input = `
nodes:
  - id: a
    label: Alpha
  - id: b
    label: Beta
edges:
  - source: a
    target: b
`;
    const result = parseKG(input);
    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
  });

  it('normalizes from/to to source/target', () => {
    const input = JSON.stringify({
      nodes: [{ id: 'a' }, { id: 'b' }],
      edges: [{ from: 'a', to: 'b' }],
    });
    const result = parseKG(input);
    expect(result.edges[0]!.source).toBe('a');
    expect(result.edges[0]!.target).toBe('b');
    expect(result.edges[0]).not.toHaveProperty('from');
    expect(result.edges[0]).not.toHaveProperty('to');
  });

  it('uses name as id fallback', () => {
    const input = JSON.stringify({
      nodes: [{ name: 'Alpha' }, { name: 'Beta' }],
      edges: [],
    });
    const result = parseKG(input);
    expect(result.nodes[0]!.id).toBe('Alpha');
    expect(result.nodes[1]!.id).toBe('Beta');
  });

  it('rejects nodes with no id or name', () => {
    const input = JSON.stringify({
      nodes: [{ label: 'X' }],
      edges: [],
    });
    expect(() => parseKG(input)).toThrow('No valid nodes found');
  });

  it('parses keyed-by-ID nodes (object format)', () => {
    const input = JSON.stringify({
      nodes: { ml: { name: 'ML' }, dl: { name: 'DL' } },
      edges: [],
    });
    const result = parseKG(input);
    expect(result.nodes).toHaveLength(2);
    const ids = result.nodes.map((n) => n.id);
    expect(ids).toContain('ml');
    expect(ids).toContain('dl');
  });

  it('tags category from nested node groups', () => {
    const input = JSON.stringify({
      nodes: { concepts: [{ id: 'a', name: 'A' }] },
      edges: [],
    });
    const result = parseKG(input);
    expect(result.nodes[0]!.category).toBe('concepts');
  });

  it('does not tag category when node has type', () => {
    const input = JSON.stringify({
      nodes: { concepts: [{ id: 'a', type: 'Foo' }] },
      edges: [],
    });
    const result = parseKG(input);
    expect(result.nodes[0]).not.toHaveProperty('category');
    expect(result.nodes[0]!.type).toBe('Foo');
  });

  it('recognizes links as edge key', () => {
    const input = JSON.stringify({
      nodes: [{ id: 'a' }, { id: 'b' }],
      links: [{ source: 'a', target: 'b' }],
    });
    const result = parseKG(input);
    expect(result.edges).toHaveLength(1);
  });

  it('recognizes relationships as edge key', () => {
    const input = JSON.stringify({
      nodes: [{ id: 'a' }, { id: 'b' }],
      relationships: [{ source: 'a', target: 'b' }],
    });
    const result = parseKG(input);
    expect(result.edges).toHaveLength(1);
  });

  it('recognizes vertices as node key', () => {
    const input = JSON.stringify({
      vertices: [{ id: 'a' }],
      edges: [],
    });
    const result = parseKG(input);
    expect(result.nodes).toHaveLength(1);
  });

  it('deduplicates nodes by id', () => {
    const input = JSON.stringify({
      nodes: [{ id: 'a', v: 1 }, { id: 'a', v: 2 }],
      edges: [],
    });
    const result = parseKG(input);
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0]!.v).toBe(1);
  });

  it('treats top-level array as nodes', () => {
    const input = JSON.stringify([{ id: 'a' }, { id: 'b' }]);
    const result = parseKG(input);
    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(0);
  });

  it('preserves extra fields on nodes', () => {
    const input = JSON.stringify({
      nodes: [{ id: 'a', color: 'red', score: 42 }],
      edges: [],
    });
    const result = parseKG(input);
    expect(result.nodes[0]!.color).toBe('red');
    expect(result.nodes[0]!.score).toBe(42);
  });

  it('preserves extra fields on edges', () => {
    const input = JSON.stringify({
      nodes: [{ id: 'a' }, { id: 'b' }],
      edges: [{ source: 'a', target: 'b', weight: 5 }],
    });
    const result = parseKG(input);
    expect(result.edges[0]!.weight).toBe(5);
  });

  it('handles self-loop edges', () => {
    const input = JSON.stringify({
      nodes: [{ id: 'a' }],
      edges: [{ source: 'a', target: 'a' }],
    });
    const result = parseKG(input);
    expect(result.edges).toHaveLength(1);
  });

  it('skips metadata/config/settings keys', () => {
    const input = JSON.stringify({
      nodes: [{ id: 'a' }],
      metadata: { v: '1' },
      config: {},
      edges: [],
    });
    const result = parseKG(input);
    expect(result.nodes).toHaveLength(1);
  });

  // --- Edge ID generation ---

  it('generates stable IDs for edges without IDs', () => {
    const input = JSON.stringify({
      nodes: [{ id: 'a' }, { id: 'b' }],
      edges: [{ source: 'a', target: 'b' }],
    });
    const result = parseKG(input);
    expect(result.edges[0]!.id).toBeDefined();
    expect(typeof result.edges[0]!.id).toBe('string');
  });

  it('preserves existing edge IDs', () => {
    const input = JSON.stringify({
      nodes: [{ id: 'a' }, { id: 'b' }],
      edges: [{ id: 'my-edge', source: 'a', target: 'b' }],
    });
    const result = parseKG(input);
    expect(result.edges[0]!.id).toBe('my-edge');
  });

  // --- Edge pruning ---

  it('prunes dangling edges (missing target)', () => {
    const input = JSON.stringify({
      nodes: [{ id: 'a' }],
      edges: [{ source: 'a', target: 'missing' }],
    });
    const result = parseKG(input);
    expect(result.edges).toHaveLength(0);
  });

  it('prunes dangling edges (missing source)', () => {
    const input = JSON.stringify({
      nodes: [{ id: 'b' }],
      edges: [{ source: 'missing', target: 'b' }],
    });
    const result = parseKG(input);
    expect(result.edges).toHaveLength(0);
  });

  // --- Error cases ---

  it('throws on empty nodes', () => {
    const input = JSON.stringify({ nodes: [], edges: [] });
    expect(() => parseKG(input)).toThrow('No valid nodes found');
  });

  it('throws when no nodes found', () => {
    const input = JSON.stringify({ metadata: { version: '1' } });
    expect(() => parseKG(input)).toThrow('No valid nodes found');
  });

  it('throws on completely invalid input', () => {
    expect(() => parseKG('not json or yaml {{{')).toThrow();
  });

  it('throws on null input', () => {
    expect(() => parseKG('null')).toThrow('No valid nodes found');
  });

  it('throws on number input', () => {
    expect(() => parseKG('42')).toThrow('No valid nodes found');
  });

  // --- Unicode ---

  it('handles unicode in node labels', () => {
    const input = JSON.stringify({
      nodes: [{ id: '1', label: '日本語テスト' }],
      edges: [],
    });
    const result = parseKG(input);
    expect(result.nodes[0]!.label).toBe('日本語テスト');
  });

  // --- Scale ---

  it('handles 1000 nodes without error', () => {
    const nodes = Array.from({ length: 1000 }, (_, i) => ({ id: `n${i}`, label: `Node ${i}` }));
    const edges = Array.from({ length: 500 }, (_, i) => ({ source: `n${i}`, target: `n${i + 1}` }));
    const input = JSON.stringify({ nodes, edges });
    const result = parseKG(input);
    expect(result.nodes).toHaveLength(1000);
    expect(result.edges).toHaveLength(500);
  });
});
