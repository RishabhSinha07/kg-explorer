# KG Explorer

Interactive knowledge graph explorer. Drop in any JSON or YAML knowledge graph and get a visual, editable canvas.

**Live demo:** [kg-explorer-umber.vercel.app](https://kg-explorer-umber.vercel.app)

## Features

- **Universal parser** — accepts any JSON/YAML structure with nodes and edges. Supports `id`/`name`, `source`/`target`/`from`/`to`, nested categories, and more
- **Drag-and-drop canvas** — pan, zoom, and rearrange nodes freely on an infinite canvas powered by React Flow
- **Inline editing** — double-click any node to edit its label directly on the canvas
- **Flexible schema** — nodes and edges are open-ended key-value objects. Add any fields you want from the properties panel
- **Properties panel** — view and edit all fields on the selected node or edge, add new fields, delete fields, or edit as raw JSON
- **Area selection** — toggle select mode to drag-select multiple nodes at once
- **Auto layout** — one-click layout that adapts between tree (hierarchical graphs) and cluster grid (flat/wide graphs)
- **Search** — find nodes by label, type, ID, or any field value (Ctrl+F)
- **Import/Export** — import JSON or YAML files, export as JSON or YAML
- **Undo/Redo** — full history stack for all operations (Ctrl+Z / Ctrl+Shift+Z)
- **Light & dark mode** — toggle between themes, persisted to localStorage
- **Minimap** — overview map for navigating large graphs
- **Connect nodes** — drag from node handles to create edges, or use the "Connect to" dropdown in the properties panel
- **Works offline** — fully client-side, no server required

## Quick Start

```bash
git clone https://github.com/RishabhSinha07/kg-explorer.git
cd kg-explorer
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Supported Formats

KG Explorer auto-detects the structure of your file. All of these work:

**Flat nodes and edges:**
```json
{
  "nodes": [
    { "id": "ml", "label": "Machine Learning", "type": "Concept" },
    { "id": "dl", "label": "Deep Learning", "type": "Concept" }
  ],
  "edges": [
    { "source": "ml", "target": "dl", "type": "INCLUDES" }
  ]
}
```

**Categorized nodes:**
```yaml
nodes:
  concepts:
    - id: ml
      name: Machine Learning
    - id: dl
      name: Deep Learning
  people:
    - id: hinton
      name: Geoffrey Hinton
edges:
  - from: ml
    to: dl
    type: INCLUDES
```

**Keyed by ID:**
```json
{
  "nodes": {
    "ml": { "name": "Machine Learning" },
    "dl": { "name": "Deep Learning" }
  },
  "links": [
    { "source": "ml", "target": "dl" }
  ]
}
```

Edge keys `edges`, `links`, `relationships`, `connections`, and `relations` are all recognized. Node keys `nodes` and `vertices` are recognized. Source/target aliases `from`/`to` are normalized automatically.

## Tech Stack

- **React 19** + **TypeScript**
- **Vite 6** — dev server and build
- **@xyflow/react** (React Flow v12) — graph rendering engine
- **Zustand v5** — state management
- **Tailwind CSS v4** — styling
- **js-yaml** — YAML parsing
- **Zod** — schema validation

## Project Structure

```
src/
  app/              # Standalone app (entry point, sample data)
  lib/              # Reusable library
    components/
      canvas/       # KGNode, KGEdge, Canvas
      panels/       # PropertiesPanel, SearchPanel
      toolbar/      # Toolbar, ToolbarButton
    hooks/          # useFileDrop, useKeyboard
    layout/         # Auto-layout algorithms
    parser/         # Universal JSON/YAML parser, serializer
    store/          # Zustand stores (graph-store, ui-store)
    types.ts        # Flexible KGNode/KGEdge types
```

## Use as a Library

KG Explorer is also published as an embeddable React component:

```bash
npm install kg-explorer
```

```tsx
import { KGExplorer } from 'kg-explorer';
import 'kg-explorer/styles.css';

function App() {
  const data = {
    nodes: [{ id: 'a', label: 'Node A' }, { id: 'b', label: 'Node B' }],
    edges: [{ source: 'a', target: 'b', type: 'RELATED' }],
  };

  return <KGExplorer data={data} />;
}
```

## License

MIT
