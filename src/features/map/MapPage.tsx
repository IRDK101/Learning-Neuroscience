import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { connectedIds, content, diagram as getDiagram, entity, hotspotFor, NT_LAYER } from '../../content';
import type { Entity } from '../../content/types';
import { CopyLinkButton, Icon } from '../../ui/bits';
import { Diagram } from '../../ui/Diagram';
import { DetailSheet } from '../../ui/DetailSheet';
import { PathwayView } from '../../ui/PathwayView';

export function MapIndex() {
  const [q, setQ] = useState('');
  const all = useMemo(() => Object.values(content.entities).sort((a, b) => a.name.localeCompare(b.name)), []);
  const hits = q.trim()
    ? all.filter((e) => `${e.name} ${e.aliases.join(' ')} ${e.short}`.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 30)
    : [];
  return (
    <div className="stack">
      <div className="page-head">
        <h1>Brain and body maps</h1>
        <p>Every diagram is clickable. Tap a structure to see what it does, what it connects to, and which cards and questions cover it.</p>
      </div>
      <div className="grid grid-3">
        {content.diagrams.map((d) => (
          <Link key={d.id} to={`/map/${d.id}`} className="panel topic-card" style={{ padding: '0.6rem' }}>
            <Diagram id={d.id} controls={false} showLabels={false} ariaLabel={`Preview: ${d.title}`} />
            <h3 style={{ padding: '0 0.3rem' }}>{d.title}</h3>
            <p className="small muted" style={{ margin: '0 0.3rem 0.3rem' }}>
              {d.description}
            </p>
          </Link>
        ))}
      </div>
      <section className="sheet">
        <h2>Search everything</h2>
        <input type="search" placeholder="e.g. dopamine, VTA, SSRIs…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search brain structures, transmitters, drugs and concepts" style={{ width: '100%' }} />
        {hits.length > 0 && (
          <ul style={{ marginTop: '0.8rem' }}>
            {hits.map((e) => (
              <li key={e.id}>
                <Link to={content.diagramsFor[e.id] ? `/map/${content.diagramsFor[e.id][0]}?focus=${e.id}` : `/entity/${e.id}`}>{e.name}</Link>
                <span className="muted small">: {e.short}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function MapPage() {
  const { diagram: diagramId } = useParams();
  const d = getDiagram(diagramId);
  const [params, setParams] = useSearchParams();
  const selected = params.get('focus');
  const connected = params.get('connected') === '1';
  const layerParam = params.get('layers');
  const layers = layerParam !== null ? layerParam.split(',').filter(Boolean) : d?.defaultLayers ?? [];
  const [stepFocus, setStepFocus] = useState<string | null>(null);

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k);
      else next.set(k, v);
    }
    setParams(next, { replace: true });
  };

  const pathways = useMemo(
    () => Object.values(content.entities).filter((e) => e.type === 'pathway' && e.diagrams.includes(d?.id ?? '')),
    [d],
  );
  const drugs = useMemo(
    () => (d ? (Object.values(content.entities).filter((e) => e.type === 'drug' && e.target && hotspotFor(e.target, d)) as Extract<Entity, { type: 'drug' }>[]) : []),
    [d],
  );

  if (!d) return <div className="panel">Unknown diagram.</div>;

  const related = selected && connected ? connectedIds(selected).map((id) => hotspotFor(id, d)).filter((x): x is string => !!x && x !== selected) : [];
  const selectedEntity = entity(selected ?? undefined);
  const drugTarget = selectedEntity?.type === 'drug' && selectedEntity.target ? hotspotFor(selectedEntity.target, d) : undefined;
  const focus = [stepFocus, drugTarget].filter((x): x is string => !!x);
  const toggleLayer = (id: string) => update({ layers: (layers.includes(id) ? layers.filter((l) => l !== id) : [...layers, id]).join(',') || 'none' });
  const ntLayers = d.layers.filter((l) => l.color);

  const select = (id: string) => {
    setStepFocus(null);
    update({ focus: id === selected ? null : id });
  };

  return (
    <div>
      <div className="crumbs">
        <Link to="/map">Map</Link> / {d.title}
      </div>
      <div className="diagram-picker" role="tablist" aria-label="Diagrams">
        {content.diagrams.map((x) => (
          <Link key={x.id} to={`/map/${x.id}`} className={`chip${x.id === d.id ? ' on' : ''}`} role="tab" aria-selected={x.id === d.id}>
            {x.title}
          </Link>
        ))}
      </div>
      <div className="map-layout">
        <div className="stack">
          <Diagram
            id={d.id}
            layers={layers}
            selected={selected}
            focus={focus}
            related={related}
            projectionsFor={d.overlay && (selected || stepFocus) ? [selected, stepFocus].filter((x): x is string => !!x) : undefined}
            onSelect={select}
            caption={d.description}
            toolbar={
              ntLayers.length > 0 ? (
                <>
                  {ntLayers.map((l) => (
                    <button key={l.id} type="button" className="chip layer-chip" aria-pressed={layers.includes(l.id)} onClick={() => toggleLayer(l.id)}>
                      <span className="swatch" style={{ background: `var(--nt-${l.color})` }} />
                      {l.name}
                    </button>
                  ))}
                  {d.layers.some((l) => l.id === 'deep') && (
                    <button type="button" className="chip" aria-pressed={layers.includes('deep')} onClick={() => toggleLayer('deep')}>
                      Deep structures
                    </button>
                  )}
                </>
              ) : undefined
            }
          />
          {drugs.length > 0 && (
            <section className="panel">
              <h3 style={{ marginBottom: '0.5rem' }}>Where drugs act</h3>
              <div className="linklist">
                {drugs.map((x) => (
                  <button key={x.id} type="button" className="chip" aria-pressed={selected === x.id} onClick={() => update({ focus: selected === x.id ? null : x.id })}>
                    {x.name}
                  </button>
                ))}
              </div>
            </section>
          )}
          {pathways.length > 0 && (
            <section className="panel">
              <h3>Step through a pathway</h3>
              {pathways.map((pw) => (
                <PathwayView key={pw.id} id={pw.id} onStep={(ref) => setStepFocus(ref ? hotspotFor(ref, d) ?? null : null)} />
              ))}
            </section>
          )}
        </div>
        <aside className="side-sheet">
          {selected && entity(selected) ? (
            <DetailSheet
              id={selected}
              className="map-sheet"
              onClose={() => update({ focus: null, connected: null })}
              connectedOn={connected}
              onShowConnected={() => update({ connected: connected ? null : '1' })}
              extra={
                selected in NT_LAYER && d.overlay ? (
                  <button type="button" className="btn small" onClick={() => update({ layers: [NT_LAYER[selected], 'deep'].join(',') })}>
                    Show only this system
                  </button>
                ) : undefined
              }
            />
          ) : (
            <div className="panel">
              <h2>{d.title}</h2>
              <p className="muted">{d.description}</p>
              <p>
                <b>Tap any part or its label</b> to see its facts, functions and connections. Turn labels off to test yourself, or use <b>Zoom</b> on a small screen.
              </p>
              {ntLayers.length > 0 && (
                <ul className="small">
                  {ntLayers.map((l) => (
                    <li key={l.id}>
                      <span className="swatch" style={{ background: `var(--nt-${l.color})` }} /> {l.name}
                    </li>
                  ))}
                </ul>
              )}
              <div className="row">
                <Link className="btn small" to={`/play/find?diagram=${d.id}`}>
                  <Icon name="play" /> Find-the-region game
                </Link>
                <CopyLinkButton path={`/map/${d.id}`} />
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
