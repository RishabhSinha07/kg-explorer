import { KGExplorer } from '../lib';
import { sampleGraph } from './sample-data';

const hasHashData = window.location.hash.startsWith('#graph=');
const hasAutoSave = !!localStorage.getItem('kg-explorer-autosave');

export function App() {
  // Don't pass sample data if user has a saved session or shared URL
  const data = hasHashData || hasAutoSave ? undefined : sampleGraph;
  return <KGExplorer data={data} />;
}
