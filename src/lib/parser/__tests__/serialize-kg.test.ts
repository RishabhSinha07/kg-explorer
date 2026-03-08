import { describe, it, expect } from 'vitest';
import { serializeKG } from '../serialize-kg';
import { parseKG } from '../parse-kg';

describe('serializeKG', () => {
  const graph = {
    nodes: [{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }],
    edges: [{ source: 'a', target: 'b', id: 'e1' }],
  };

  it('serializes to JSON by default', () => {
    const result = serializeKG(graph);
    const parsed = JSON.parse(result);
    expect(parsed.nodes).toHaveLength(2);
    expect(parsed.edges).toHaveLength(1);
  });

  it('serializes to YAML', () => {
    const result = serializeKG(graph, 'yaml');
    expect(result).toContain('nodes:');
    expect(result).toContain('Alpha');
  });

  it('round-trips through parseKG', () => {
    const json = serializeKG(graph, 'json');
    const restored = parseKG(json);
    expect(restored.nodes).toHaveLength(2);
    expect(restored.edges).toHaveLength(1);
    expect(restored.nodes[0]!.id).toBe('a');
  });

  it('preserves special characters in JSON', () => {
    const g = { nodes: [{ id: 'a', label: 'He said "hello"' }], edges: [] };
    const json = serializeKG(g, 'json');
    const parsed = JSON.parse(json);
    expect(parsed.nodes[0].label).toBe('He said "hello"');
  });
});
