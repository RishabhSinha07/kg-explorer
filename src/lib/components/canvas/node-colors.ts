export const NODE_COLORS: Record<string, string> = {
  Concept: '#6366f1',     // indigo
  Entity: '#06b6d4',      // cyan
  Person: '#f59e0b',      // amber
  Event: '#ef4444',        // red
  Property: '#10b981',    // emerald
  Process: '#8b5cf6',     // violet
  Technology: '#3b82f6',  // blue
  Organization: '#ec4899', // pink
  Location: '#14b8a6',    // teal
  Document: '#f97316',    // orange
  Category: '#a855f7',    // purple
  default: '#64748b',     // slate
};

export function getNodeColor(type: string): string {
  return NODE_COLORS[type] ?? NODE_COLORS['default']!;
}
