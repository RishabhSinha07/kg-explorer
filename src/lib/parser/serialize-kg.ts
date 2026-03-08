import yaml from 'js-yaml';
import type { KnowledgeGraph } from '../types';

export function serializeKG(graph: KnowledgeGraph, format: 'json' | 'yaml' = 'json'): string {
  if (format === 'yaml') {
    return yaml.dump(graph, { indent: 2, lineWidth: 120 });
  }
  return JSON.stringify(graph, null, 2);
}
