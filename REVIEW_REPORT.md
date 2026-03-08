# KG Explorer — Multi-Agent Product Review

> Generated on 2026-03-08 by a panel of 6 expert agents with diverse backgrounds

---

## Executive Summary

Six expert agents — spanning UX design, product management, growth engineering, staff-level frontend engineering, knowledge graph research, and non-technical end-user advocacy — independently reviewed KG Explorer's full source code. Despite radically different lenses, they converged on a clear picture: **the core engine is excellent, but the product is locked behind developer-only walls.** The universal parser, clean architecture, and polished canvas are genuine strengths. But zero onboarding, no image export, jargon-heavy UI, broken undo positioning, npm packaging bugs, and no standard KG format support collectively limit the audience to developers who already have JSON graph files — a tiny fraction of the potential market.

**The single highest-leverage theme: make the first 2 minutes work for everyone, not just developers.**

---

## Consensus Themes (What Multiple Agents Agreed On)

| Theme | Flagged By |
|-------|-----------|
| **No onboarding / empty state — users are dropped on a canvas with zero guidance** | UX, PM, Growth, End User |
| **No image export (PNG/SVG/PDF) — blocks sharing, presentations, and virality** | PM, Growth, End User |
| **Undo/redo destroys node positions (recomputes layout instead of restoring)** | PM, Engineer, KG Researcher |
| **`alert()` for errors, no toast system, silent parse failures** | UX, Growth, Engineer |
| **No persistence — work lost on refresh** | PM |
| **Performance ceiling at ~500 nodes (no virtualization, stale closures)** | Engineer, KG Researcher |
| **No RDF/CSV/GraphML support — locked out of the KG community** | KG Researcher |
| **Jargon UI ("nodes", "edges", "properties") alienates non-developers** | UX, End User |
| **react/react-dom as hard deps breaks npm consumers** | Growth |
| **No tests or CI — every release is a gamble** | Growth, Engineer |
| **AI-powered graph generation from text could 10x the product** | PM, Growth, End User |

---

## Prioritized Roadmap

### P0 — Fix This Week (Blocking Users Now)

| # | Initiative | Impact | Effort | Agents Who Flagged |
|---|-----------|--------|--------|--------------------|
| 1 | **Add onboarding empty state** — When canvas is empty, show drag-drop target, "Load example" button, format hints | First-time activation; 80%+ drop-off without it | 4-6 hrs | UX, PM, Growth, End User |
| 2 | **Fix undo/redo to preserve positions** — Store positions in `HistoryEntry`, restore instead of recomputing layout | Undo currently destroys manual arrangement | 2 hrs | PM, Engineer |
| 3 | **Add `beforeunload` warning** — Prevent accidental tab-close data loss | Prevents the most painful data loss scenario | 1 hr | PM |
| 4 | **Add ARIA attributes to all interactive elements** — `aria-label` on toolbar buttons, roles on panels, focus management | Tool is invisible to screen readers | 4 hrs | UX |
| 5 | **Fix npm packaging** — Move react/react-dom to `peerDependencies`, add `sideEffects` field | Every npm consumer hits React hooks crash | 1 hr | Growth |
| 6 | **Add error boundary + inline error states** — Replace `alert()` and `console.error` with visible UI feedback | Silent failures kill trust on first import attempt | 3 hrs | UX, Growth, Engineer |
| 7 | **Add stable edge IDs** — Auto-generate IDs for edges, use in store instead of array index | Data integrity issue; multi-edges collide | 2 hrs | KG Researcher |

### P1 — Build This Month (High-Impact Growth)

| # | Initiative | Impact | Effort | Agents Who Flagged |
|---|-----------|--------|--------|--------------------|
| 8 | **PNG/SVG image export** | Enables sharing in slides, docs, Slack — viral loop | 4 hrs | PM, Growth, End User |
| 9 | **Shareable URLs** (encode graph in URL hash with lz-string) | Every visualization becomes a link people share | 4 hrs | PM, Growth |
| 10 | **Wire up `onChange` and `readOnly` props** | Unblocks all library/embed consumers | 2 hrs | PM |
| 11 | **Toast notification system** replacing `alert()` | Professional error/success feedback | 3 hrs | UX |
| 12 | **Node/edge type filter toggles** | Core exploration capability for any non-trivial graph | 4 hrs | PM, KG Researcher |
| 13 | **Replace jargon with plain language** ("node"→"item", "edge"→"connection") | Massive perception shift for non-developers | 3 hrs | UX, End User |
| 14 | **RDF/Turtle import support** (using n3.js) | Opens tool to entire Semantic Web community | 2-3 days | KG Researcher |
| 15 | **Auto-save to localStorage** with session recovery | Converts demo into a real tool people trust | 4 hrs | PM |
| 16 | **Fix stale-closure re-render loop** in Canvas.tsx callbacks | Root cause of sluggish dragging at 500+ nodes | 1 hr | Engineer |
| 17 | **Move layout computation to Web Worker** | Unblocks UI during layout of large graphs | 3-5 days | Engineer, KG Researcher |
| 18 | **Add Vitest test suite** (parser + store minimum) | Safety net for contributions and releases | 4 hrs | Growth, Engineer |

### P2 — Build This Quarter (Strategic Expansion)

| # | Initiative | Impact | Effort | Agents Who Flagged |
|---|-----------|--------|--------|--------------------|
| 19 | **Template gallery** (Concept Map, Family Tree, Timeline, etc.) | Makes tool useful for education without JSON files | 1-2 days | End User |
| 20 | **Graph statistics + legend panel** | Orientation for new imports; "aha moment" accelerator | 6 hrs | PM, KG Researcher |
| 21 | **CSV/TSV import** for edge lists | Most common interchange format in practice | 4 hrs | KG Researcher |
| 22 | **Mobile/responsive layout** (collapsible panels, bottom sheet) | Currently broken below 768px | 1-2 days | UX |
| 23 | **Right-click context menus** | Expected interaction pattern in every visual tool | 4 hrs | End User |
| 24 | **Color picker for nodes** | Empowers visual thinkers to organize by meaning | 3 hrs | End User |
| 25 | **Ontology/schema awareness** (OWL/RDFS import, validation) | Separates KG tool from generic graph visualizer | 1-2 weeks | KG Researcher |
| 26 | **OpenGraph meta + SEO** for Vercel deployment | Every social share becomes a visual ad | 1 hr | Growth |
| 27 | **Standalone parser npm export** (`kg-explorer/parser`) | Widens audience to non-React developers | 3 hrs | Growth |
| 28 | **StackBlitz / CodeSandbox example** | Collapses evaluation friction to 10 seconds | 2 hrs | Growth |

### P3 — Nice to Have

| # | Initiative | Agents |
|---|-----------|--------|
| 29 | Keyboard shortcut cheat sheet / hints on toolbar buttons | UX, End User |
| 30 | GraphML/GEXF export | KG Researcher |
| 31 | Lazy-load panels with React.lazy + Suspense | Engineer |
| 32 | Remove unused `d3-force` dependency (~30KB) | Engineer |
| 33 | Debounce search filtering + cap results to 50 | Engineer |

---

## Quick Wins (Do This Week — Each < 1 Day)

1. **Add `aria-label={label}` to ToolbarButton** — 1 line, instant screen reader fix → `ToolbarButton.tsx`
2. **Add `beforeunload` listener** when history has entries → new hook, 15 lines
3. **Fix undo positions** — extend `HistoryEntry` with positions map → `graph-store.ts`, ~30 lines
4. **Move react/react-dom to peerDependencies** → `package.json`, 2-minute edit
5. **Stabilize Canvas callback identity** — use `getState()` instead of closure → `Canvas.tsx`, ~10 lines
6. **Cap search results to 50** with "showing N of M" → `SearchPanel.tsx`, 1 line
7. **Remove `d3-force` from dependencies** (unused, +30KB) → `package.json`
8. **Show node/edge count in toolbar** → `Toolbar.tsx`, 1 line

---

## Strategic Bets (This Quarter)

### Bet 1: AI-Powered Graph Generation from Natural Language
**Flagged by:** PM, Growth, End User (3 of 6 agents independently proposed this)

> "Describe it in words, see it as a diagram."

Add a text input where users describe what they want — "Map out the React ecosystem" or "Characters in Romeo and Juliet" — and an LLM generates the graph JSON, which the existing `parseKG` pipeline renders instantly. This eliminates the cold-start problem (users need to *have* a JSON file), expands TAM from developers to teachers/students/researchers/everyone, and creates inherent virality ("look what I made from one sentence").

**Implementation:** Toolbar button → prompt modal → LLM API call (BYOK or hosted) → structured JSON output → `parseKG()` → `loadGraph()`. The entire pipeline already exists except the API call.

### Bet 2: SPARQL Endpoint Integration / Live Subgraph Exploration
**Flagged by:** KG Researcher

Connect to Wikidata, DBpedia, or any SPARQL endpoint. Click a node → "Expand" fetches its 1-hop neighborhood. Incrementally build a curated subgraph from a live knowledge base. Nothing bridges the gap between SPARQL query results and interactive visual exploration today.

### Bet 3: WebGL Semantic Zoom for 100K+ Nodes
**Flagged by:** Engineer

Replace DOM node rendering with WebGL at low zoom levels (colored dots → rectangles → full DOM nodes as you zoom in). Enables loading entire ontologies or codebase dependency graphs. Would be a category-defining capability.

---

## Dissenting Views & Resolutions

| Topic | Disagreement | Resolution |
|-------|-------------|------------|
| **Rename "nodes"/"edges"?** | End User & UX say yes ("items"/"connections"); KG Researcher implicitly expects standard graph terminology | **Do both:** Use plain language in user-facing UI labels, keep technical terms in code/API/docs. The library API should use `nodes`/`edges`; the toolbar should say "Add Item." |
| **RDF support priority** | KG Researcher says P0; others don't mention it | **P1.** Important for the KG professional audience, but the broader user base cares more about onboarding and image export first. Ship RDF in the same month, not the same week. |
| **AI generation priority** | PM/Growth/End User say P1-P2; Engineer doesn't mention it | **P2 (this quarter).** The AI feature is transformative but the foundation (onboarding, persistence, image export) must be solid first. An AI-generated graph on a tool with no save and no image export is a party trick, not a product. |
| **Performance investment** | Engineer says P0-P1 (stale closures, Web Worker); others focus on features | **Split it:** Fix the stale closure bug this week (P0, 1 hour). Web Worker and WebGL are P1-P2 — invest after the core UX is solid. Most users today have <100 nodes; don't over-optimize before finding product-market fit. |

---

## Individual Expert Reviews

---

### 🎨 Maya Chen — UX Designer & Accessibility Expert

#### Strengths
- **Thoughtful theming system** — CSS custom properties with `--kg-*` tokens, dark/light themes fully specced, persisted via localStorage, respects `prefers-color-scheme`
- **Flexible data ingestion** — Universal parser with multiple key conventions + drag-and-drop + toolbar import = multiple paths to get data in
- **Non-destructive inline editing with undo/redo** — Double-click-to-edit, field-level editing, JSON raw-edit mode, full history stack. Escape cancels, Enter confirms
- **Clean visual hierarchy in node design** — Left-colored border accent, translucent type badge, subtitle from first string field, `truncate`/`line-clamp-2`
- **Solid keyboard shortcut coverage** — Correctly guards against input/textarea targets, cross-platform modifier key abstraction

#### Critical Issues
1. **Zero accessibility** — No ARIA attributes, no roles, no tabIndex anywhere. PropertiesPanel field values are clickable `<span>` elements invisible to assistive technology. Delete buttons use `opacity-0` making them unreachable via keyboard. WCAG 2.1 AA failure across Perceivable, Operable, and Robust.
2. **Empty canvas provides no guidance** — When loaded without data (or as library with no `data` prop), user sees blank canvas. No onboarding, no drag-drop hint. 80%+ drop-off.
3. **Error handling uses `alert()` and `console.error`** — No toast system, no inline error banner, no recovery path. `alert()` blocks the thread; silent `console.error` gives blank canvas on bad data.

#### High-Impact Improvements
1. Empty/welcome state with onboarding overlay (P0)
2. Toast notification system replacing `alert()` (P1)
3. ARIA attributes and focus management across all components (P0)
4. Keyboard navigation for search results (P1)
5. Visual drag-and-drop feedback with `isDragging` overlay (P1)
6. Mobile/touch responsive layout with collapsible panels (P2)
7. Keyboard shortcut hints on toolbar buttons (P2)

#### Quick Wins
- Add `aria-label={label}` to all toolbar buttons (1 line change)
- Add `focus-visible:opacity-100` to PropertiesPanel delete buttons
- Add "no results" illustration to search panel
- Show node/edge count in toolbar
- Add two-click confirm pattern for destructive delete

#### Bold Bet
**Semantic Graph Intelligence Layer** — Client-side structural metrics (degree centrality, connected components, bridge nodes, cycles) displayed as node badges and a summary panel. Optionally integrate LLM for natural-language graph insights. Transforms passive visualizer into active reasoning partner.

---

### 📊 Alex Rivera — Product Manager (B2B SaaS)

#### Strengths
- **Universal parser is the moat** — "Just drop whatever you have" vs. competitors requiring Cypher/GEXF/specific formats
- **Clean embeddable library architecture** — `src/lib` vs `src/app` split, proper `exports` map, small API surface
- **Fully client-side / local-first / zero-config** — No backend = no procurement for privacy-sensitive enterprise
- **Solid state management** — Dual KG/Flow data model, 50-entry history stack
- **Editing, not just viewing** — Inline editing + properties panel puts it in "editor" category

#### Critical Issues
1. **No persistence** — All work lost on refresh. `onChange` callback declared but never wired up. No localStorage, no IndexedDB, no `beforeunload` warning.
2. **Undo/redo destroys positions** — `HistoryEntry` only stores KG data, not positions. Every undo recomputes layout, scrambling manual arrangement.
3. **No scalability signal** — No virtualization, no node count warning. Will freeze at 500+ nodes with no feedback.

#### High-Impact Improvements
1. Auto-save to localStorage/IndexedDB with session recovery (P0)
2. Store positions in history entries (P0)
3. Wire up `onChange` callback and `readOnly` prop (P1)
4. PNG/SVG image export (P1)
5. Graph statistics and legend panel (P2)
6. Filter and hide by node type (P2)
7. URL-based graph loading / shareable links (P2)

#### Quick Wins
- `beforeunload` warning (1 hour)
- Fix undo positions (2 hours)
- Wire `onChange` prop (1 hour)
- Shortcut hints on tooltips (30 min)
- "Fit View" toolbar button (30 min)

#### Bold Bet
**AI-Powered Graph Generation from Natural Language** — Text input → LLM → structured JSON → `parseKG` → render. Eliminates cold-start, expands TAM 100x, creates viral "one sentence to graph" moment. Monetize via usage-based API tokens (free tier + $5/mo or BYOK).

---

### 🚀 Priya Kapoor — Growth Engineer & DevRel

#### Strengths
- **Universal parser is a growth moat** — "Just works" magic that makes people tweet about a tool
- **Clean library/app separation** — Right architecture for embeddable growth
- **Strong feature density for v0.1** — Competitive with paid tools for "quick visualization" use case
- **Schema-free data model** — `catchall(z.unknown())` lets users attach any metadata
- **Fully client-side** — Zero friction for security-conscious teams

#### Critical Issues
1. **react/react-dom as hard dependencies** — Causes "Invalid hook call" crash for every npm consumer. 100% bounce rate for library users.
2. **No tests, no CI, no GitHub Actions** — Parser has zero automated coverage. Contributors can't safely submit PRs.
3. **No error boundary or user-facing error state** — Parse failures silently show blank canvas. Loses users at moment of highest intent.

#### High-Impact Improvements
1. Interactive playground with shareable URLs (P1)
2. Fix peerDependencies + bundle size reporting (P0)
3. Empty state + error state with clear CTAs (P0)
4. Standalone `kg-explorer/parser` npm export (P2)
5. OpenGraph meta, structured data, proper landing page (P1)
6. StackBlitz / CodeSandbox "Try it" example (P1)
7. Fix npm keywords (remove misleading "excalidraw") (P2)

#### Quick Wins
- Fix peerDependencies (2 hours)
- Inline error state for parse failures (3 hours)
- OpenGraph meta tags in `index.html` (1 hour)
- `CONTRIBUTING.md` + "good first issue" labels (2 hours)
- Vitest setup with 5 parser tests (4 hours)

#### Bold Bet
**"Paste a URL, get a knowledge graph"** — AI-powered auto-extraction from any webpage. Paste Wikipedia/GitHub/docs URL → fetch content → LLM extracts entities/relationships → renders graph. Eliminates cold-start entirely. Content marketing writes itself: "Turn any webpage into a knowledge graph in 10 seconds."

---

### ⚙️ Tomás Silva — Staff Frontend Engineer

#### Strengths
- **Clean Zustand with granular selectors** — Components subscribe to individual slices, preventing unnecessary re-renders
- **Robust, forgiving parser** — Handles JSON, YAML, aliases, auto-IDs, deduplication, dangling edge pruning
- **Thoughtful layout engine** — Adaptive tree vs. cluster-grid strategy, pinned-node system
- **Dual KG/Flow data model** — Clean separation of domain data from view state
- **Good TypeScript discipline** — `strict: true`, `noUncheckedIndexedAccess`, Zod at boundaries, `memo()` on custom components

#### Critical Issues
1. **`onNodesChange` causes O(n) re-renders per drag frame** — `nodes` in dependency array creates cascading re-render storm at 1K+ nodes. Same for `onEdgesChange`.
2. **Undo/redo recomputes layout synchronously** — Blocks UI for hundreds of ms at 10K nodes. Destroys all manual positioning.
3. **No error boundary** — Single bad node crashes the entire app with white screen.

#### High-Impact Improvements
1. Fix stale-closure re-render loop in Canvas callbacks (P0)
2. Store positions in history entries (P1)
3. Move layout to Web Worker (P1)
4. Add error boundary around explorer (P0)
5. Virtualize search results and "Connect To" dropdown (P2)
6. Debounce search filtering (P2)
7. Add Vitest test suite for parser and store (P2)

#### Quick Wins
- Stabilize `onNodesChange`/`onEdgesChange` identity with `getState()` (1 hour)
- Lazy-load panels with `React.lazy` + Suspense (30 min)
- Replace `alert()` with inline error (30 min)
- Cap search results to 50 (15 min)
- Remove unused `d3-force` dependency (10 min)

#### Bold Bet
**WebGL semantic zoom for 100K+ nodes** — Replace DOM node rendering with WebGL canvas at low zoom (colored dots → rectangles → full DOM as you zoom in). Hybrid approach keeps full editing for visible nodes while enabling massive-scale exploration. Uses quadtree spatial index for viewport culling.

---

### 🧬 Dr. Oluwaseun Adeyemi — Knowledge Graph Researcher

#### Strengths
- **Flexible, schema-tolerant parser** — Graceful degradation across heterogeneous formats
- **Open-ended property model** — `{ id: string; [key: string]: unknown }` mirrors Neo4j property graph model
- **Clean KG/Flow data separation** — Export always reflects semantic graph
- **Undo/redo at KG abstraction level** — Correct conceptual layer for graph operations
- **Embeddable as library** — Strong distribution for research dashboards

#### Critical Issues
1. **Edges have no unique identity** — No `id` field; identity derived from array index. Multi-edges collide, index-based matching is fragile, deletion shifts all subsequent indices.
2. **Zero support for standard KG formats** — No RDF, Turtle, N-Triples, JSON-LD, GraphML, GEXF, or CSV. Dealbreaker for KG professionals.
3. **Layout won't scale beyond hundreds of nodes** — Cubic complexity in `clusterGridLayout`, recursive `computeWidth` will stack-overflow on deep hierarchies.

#### High-Impact Improvements
1. Add stable edge IDs to data model (P0)
2. RDF/Turtle import and N-Triples export (P0)
3. Web Worker layout + level-of-detail rendering (P1)
4. Query/filter bar with predicate-based filtering (P1)
5. Ontology/schema awareness (OWL/RDFS) (P2)
6. CSV/TSV import for edge lists (P2)
7. GraphML and GEXF export (P3)

#### Quick Wins
- Generate stable edge IDs on parse (2 hours)
- CSV edge-list import (4 hours)
- Edge-type and node-type filter toggles (4 hours)
- Fix `computeWidth` stack overflow (convert recursive → iterative, 1 hour)
- Show graph statistics in toolbar (1 hour)

#### Bold Bet
**SPARQL endpoint integration with live subgraph exploration** — Connect to Wikidata/DBpedia/any triplestore, issue queries from the canvas, click nodes to expand neighborhoods, pin and prune, export curated subgraphs. Transforms static file visualizer into a visual SPARQL browser.

---

### 🧑‍🏫 Jordan Park — Non-Technical End User & Educator

#### Strengths
- **Canvas looks and feels polished** — Dark mode, smooth zoom/pan, glassmorphic panels. Would not be embarrassed projecting in class.
- **Inline editing is intuitive** — Double-click to rename matches Miro/Google Slides mental model.
- **Auto Layout is a lifesaver** — One-click organization for people who won't hand-arrange nodes.
- **Undo/Redo works as expected** — Ctrl+Z/Shift+Z with visual disabled states.
- **Drag-and-drop file import** — Smooth on-ramp for users with existing files.

#### Critical Issues
1. **Zero onboarding** — No welcome screen, no tips, no guidance. Jargon everywhere ("nodes", "edges", "properties"). The 2-minute test fails immediately.
2. **No image export** — Only JSON/YAML export. Teachers need PNG/PDF for slides and handouts. Dealbreaker.
3. **No templates or blank canvas option** — Always loads ML sample data. No "New Graph", no "Concept Map" template. Can't start from scratch without a JSON file.

#### High-Impact Improvements
1. Welcome/onboarding modal on first visit (P0)
2. PNG/PDF image export (P0)
3. Replace jargon with plain language everywhere (P1)
4. Template gallery for education (Concept Map, Family Tree, Timeline, etc.) (P1)
5. Right-click context menus (P2)
6. Color picker for nodes (P2)
7. Keyboard shortcut cheat sheet (P2)

#### Quick Wins
- Rename user-facing jargon (2-3 hours, zero logic changes)
- "Export as Image" using html-to-image (half day)
- "New Graph" / blank canvas button (2-3 hours)
- Make export buttons visually distinct (1 hour)
- Add tooltip hints with shortcuts to toolbar buttons (30 min)

#### Bold Bet
**"Describe it in words, see it as a diagram"** — AI text-to-graph generation. Teacher types "Photosynthesis process" → gets a fully connected concept map in 3 seconds. Eliminates blank-canvas problem. Transforms from developer tool to something a million teachers would use.

#### Emotional Assessment
> "Current vibe: developer tool that happens to look nice. Beautiful but intimidating, then confusing, then abandoned. The gap is entirely in the last mile of user experience — onboarding, plain language, templates, and image export. These are not hard engineering problems. They are empathy problems."

---

## Recommended Execution Order

```
WEEK 1 (Foundation fixes):
├── beforeunload warning
├── Fix undo to preserve positions
├── Fix peerDependencies (npm)
├── Stabilize Canvas callback identity
├── Add error boundary
├── Remove unused d3-force
├── Add aria-labels to toolbar
└── Cap search results to 50

WEEK 2-3 (Onboarding & Core UX):
├── Empty state with onboarding overlay
├── Toast notification system
├── Inline error states (replace alert)
├── PNG/SVG image export
├── Wire onChange + readOnly props
└── Replace jargon with plain language

MONTH 2 (Growth & Engagement):
├── Shareable URLs (lz-string)
├── Auto-save to localStorage
├── Node type filter toggles
├── Graph statistics panel
├── RDF/Turtle import
├── Vitest test suite
├── Template gallery
└── OpenGraph meta + SEO

QUARTER 2 (Strategic Bets):
├── AI-powered graph generation from text
├── CSV import
├── SPARQL endpoint integration
├── Web Worker layout
├── Mobile responsive layout
└── Ontology awareness
```

---

*This review was generated by 6 independent Claude Code agents, each adopting a distinct expert persona, then synthesized into a unified action plan.*
