import { useGraphStore } from '../store/graph-store';
import { parseKG } from '../parser/parse-kg';
import { useUIStore } from '../store/ui-store';

const SAMPLE_GRAPH = `{
  "nodes": [
    { "id": "kg", "label": "Knowledge Graph", "type": "Concept" },
    { "id": "node", "label": "Node", "type": "Entity" },
    { "id": "edge", "label": "Edge", "type": "Entity" },
    { "id": "property", "label": "Property", "type": "Property" },
    { "id": "viz", "label": "Visualization", "type": "Process" }
  ],
  "edges": [
    { "source": "kg", "target": "node", "type": "contains" },
    { "source": "kg", "target": "edge", "type": "contains" },
    { "source": "node", "target": "property", "type": "has" },
    { "source": "edge", "target": "property", "type": "has" },
    { "source": "kg", "target": "viz", "type": "enables" }
  ]
}`;

export function EmptyState() {
  const loadGraph = useGraphStore((s) => s.loadGraph);
  const setError = useUIStore((s) => s.setError);

  const handleLoadSample = () => {
    try {
      const kg = parseKG(SAMPLE_GRAPH);
      loadGraph(kg);
    } catch (err) {
      setError(`Failed to load sample: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
      <div
        className="flex flex-col items-center gap-5 p-8 rounded-xl border max-w-sm text-center pointer-events-auto"
        style={{ backgroundColor: 'var(--kg-surface)', borderColor: 'var(--kg-border)' }}
      >
        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-indigo-500/15 flex items-center justify-center">
          <svg className="w-7 h-7 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="5" r="3" />
            <circle cx="5" cy="19" r="3" />
            <circle cx="19" cy="19" r="3" />
            <line x1="12" y1="8" x2="5" y2="16" />
            <line x1="12" y1="8" x2="19" y2="16" />
            <line x1="5" y1="19" x2="19" y2="19" />
          </svg>
        </div>

        <div>
          <h2 className="text-sm font-semibold kg-text mb-1.5">Welcome to KG Explorer</h2>
          <p className="text-xs kg-text-muted leading-relaxed">
            Drop a JSON or YAML file here to visualize your knowledge graph,
            or load a sample to get started.
          </p>
        </div>

        {/* Drop zone hint */}
        <div
          className="w-full border-2 border-dashed rounded-lg py-4 px-3 flex flex-col items-center gap-2"
          style={{ borderColor: 'var(--kg-border)' }}
        >
          <svg className="w-5 h-5 kg-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          <span className="text-[11px] kg-text-muted">Drag & drop a .json or .yaml file</span>
        </div>

        {/* Supported formats */}
        <div className="text-[10px] kg-text-faint leading-relaxed">
          Supports nodes + edges in JSON or YAML.
          Accepts keys like <code className="px-1 py-0.5 rounded bg-white/5">nodes</code>,{' '}
          <code className="px-1 py-0.5 rounded bg-white/5">edges</code>,{' '}
          <code className="px-1 py-0.5 rounded bg-white/5">links</code>,{' '}
          <code className="px-1 py-0.5 rounded bg-white/5">relationships</code>.
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={handleLoadSample}
            className="flex-1 px-3 py-2 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
          >
            Load Example
          </button>
        </div>
      </div>
    </div>
  );
}
