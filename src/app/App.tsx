import { KGExplorer } from '../lib';
import { sampleGraph } from './sample-data';

export function App() {
  return <KGExplorer data={sampleGraph} />;
}
