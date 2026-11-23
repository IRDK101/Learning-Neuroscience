import { Link, useParams } from 'react-router';
import { content, diagram as getDiagram, entity, hotspotFor } from '../../content';
import { Diagram } from '../../ui/Diagram';
import { InfoPanel } from '../../ui/InfoPanel';

export function EntityPage() {
  const { id } = useParams();
  const e = entity(id);
  if (!e) return <div className="panel">Nothing called “{id}” yet.</div>;
  // Show it on a diagram if it (or its parent) has a hotspot somewhere.
  const diagramId = content.diagramsFor[e.id]?.[0] ?? content.diagrams.find((d) => hotspotFor(e.id, d))?.id;
  const d = getDiagram(diagramId);
  const spot = d ? hotspotFor(e.id, d) : undefined;
  return (
    <div>
      <div className="crumbs">
        <Link to="/map">Map</Link> / {e.name}
      </div>
      <div className={d ? 'map-layout' : ''}>
        <div className="panel">
          <InfoPanel id={e.id} />
        </div>
        {d && spot && (
          <div className="stack">
            <Diagram id={d.id} selected={spot} focus={[spot]} caption={spot === e.id ? d.title : `${d.title}: shown at ${entity(spot)?.name}`} />
            <Link className="btn small" to={`/map/${d.id}?focus=${spot}`}>
              Open in the map
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
