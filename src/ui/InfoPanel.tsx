import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cardsFor, connectedIds, content, entity, ENTITY_TYPE_LABEL, lessonsMentioning, questionsFor, topic as getTopic } from '../content';
import type { Entity } from '../content/types';
import { CopyLinkButton, EntityLink, FactText, Icon, SourceBadges } from './bits';

const DRUG_ACTION: Record<string, string> = {
  agonist: 'Agonist',
  antagonist: 'Antagonist',
  'reuptake-inhibitor': 'Reuptake inhibitor',
  'enzyme-inhibitor': 'Enzyme inhibitor',
  releaser: 'Releaser',
  'channel-blocker': 'Channel blocker',
  'allosteric-modulator': 'Positive modulator',
  precursor: 'Precursor',
  other: 'Other',
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function Links({ ids }: { ids: string[] }) {
  const valid = ids.filter((id) => entity(id));
  if (!valid.length) return null;
  return (
    <div className="linklist">
      {valid.map((id) => (
        <EntityLink key={id} id={id} />
      ))}
    </div>
  );
}

/** Drugs that act on this entity (NT, receptor, transporter, enzyme). */
function drugsActingOn(id: string): string[] {
  return Object.values(content.entities)
    .filter((e) => e.type === 'drug' && (e.actsOn.includes(id) || e.target === id))
    .map((e) => e.id);
}

export function EntityDetails({ e }: { e: Entity }) {
  switch (e.type) {
    case 'region':
      return (
        <>
          {e.location && <p className="muted">{e.location}</p>}
          {e.functions.length > 0 && (
            <Section title="What it does">
              <ul>
                {e.functions.map((f, i) => (
                  <li key={i}>
                    <FactText fact={f} />
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {e.connections.length > 0 && (
            <Section title="Connections">
              <ul>
                {e.connections.map((c, i) => (
                  <li key={i}>
                    {c.dir === 'out' ? 'Sends to ' : c.dir === 'in' ? 'Receives from ' : 'Linked with '}
                    <EntityLink id={c.to} />
                    {c.note && <span className="muted">: {c.note}</span>}
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {e.parent && (
            <Section title="Part of">
              <Links ids={[e.parent]} />
            </Section>
          )}
          {e.cases.length > 0 && (
            <Section title="Related cases & disorders">
              <Links ids={e.cases} />
            </Section>
          )}
        </>
      );
    case 'molecule':
      return (
        <>
          {e.functions.length > 0 && (
            <Section title="What it does">
              <ul>
                {e.functions.map((f, i) => (
                  <li key={i}>
                    <FactText fact={f} />
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {e.parent && (
            <Section title="A kind of">
              <Links ids={[e.parent]} />
            </Section>
          )}
          {drugsActingOn(e.id).length > 0 && (
            <Section title="Drugs that act here">
              <Links ids={drugsActingOn(e.id)} />
            </Section>
          )}
        </>
      );
    case 'neurotransmitter': {
      const drugs = drugsActingOn(e.id);
      return (
        <>
          <p className="muted small">
            Class: {e.class.replace('-', ' ')}
            {e.subclass ? ` · ${e.subclass}` : ''}
          </p>
          {e.precursors.length > 0 && (
            <Section title="Made from">
              <Links ids={e.precursors} />
              {e.rateLimiting && (
                <p className="small" style={{ marginTop: '0.4rem' }}>
                  <b>Rate-limiting:</b> <FactText fact={e.rateLimiting} />
                </p>
              )}
              {e.synthesis && (
                <p className="small">
                  Synthesis chain: <EntityLink id={e.synthesis} />
                </p>
              )}
            </Section>
          )}
          {e.sources.length > 0 && (
            <Section title="Where it comes from → where it goes">
              <ul>
                {e.sources.map((s, i) => (
                  <li key={i}>
                    <EntityLink id={s.nucleus} />
                    {s.targets.length > 0 && <> → {s.targets.map((t, j) => <span key={t}>{j > 0 && ', '}<EntityLink id={t} /></span>)}</>}
                    {s.note && <div className="muted small">{s.note}</div>}
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {e.functions.length > 0 && (
            <Section title="What it does">
              <ul>
                {e.functions.map((f, i) => (
                  <li key={i}>
                    <FactText fact={f} />
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {e.deactivation.length > 0 && (
            <Section title="How it's cleared">
              <ul>
                {e.deactivation.map((f, i) => (
                  <li key={i}>
                    <FactText fact={f} />
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {drugs.length > 0 && (
            <Section title="Drugs">
              <Links ids={drugs} />
            </Section>
          )}
          {e.disorders.length > 0 && (
            <Section title="Disorders">
              <Links ids={e.disorders} />
            </Section>
          )}
        </>
      );
    }
    case 'drug':
      return (
        <>
          <p className="small">
            <span className="tag">{DRUG_ACTION[e.action]}</span>{' '}
            <span className="muted">{e.effect === 'increases' ? 'increases' : e.effect === 'decreases' ? 'decreases' : 'changes'} signaling of </span>
            {e.actsOn.map((a, i) => (
              <span key={a}>
                {i > 0 && ', '}
                <EntityLink id={a} />
              </span>
            ))}
          </p>
          <Section title="How it works">
            <p>{e.mechanism}</p>
            {e.target && (
              <p className="small">
                Target: <EntityLink id={e.target} />
              </p>
            )}
          </Section>
          {e.uses.length > 0 && (
            <Section title="Uses & effects">
              <ul>
                {e.uses.map((f, i) => (
                  <li key={i}>
                    <FactText fact={f} />
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </>
      );
    case 'pathway':
      return (
        <Section title="Steps">
          <ol>
            {e.steps.map((s, i) => (
              <li key={i}>
                {s.ref ? <EntityLink id={s.ref}>{s.label}</EntityLink> : s.label}
                {s.via && (
                  <span className="muted small">
                    {' '}
                    (via <EntityLink id={s.via} />)
                  </span>
                )}
                <SourceBadges corrections={s.corrections} source={s.source} />
                {s.note && <div className="muted small">{s.note}</div>}
              </li>
            ))}
          </ol>
        </Section>
      );
    case 'case':
      return (
        <>
          {(e.damage.regions.length > 0 || e.damage.cause) && (
            <Section title="What's damaged">
              {e.damage.cause && <p>{e.damage.cause}</p>}
              <Links ids={e.damage.regions} />
            </Section>
          )}
          {e.deficits.length > 0 && (
            <Section title="Symptoms / deficits">
              <ul>
                {e.deficits.map((f, i) => (
                  <li key={i}>
                    <FactText fact={f} />
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {e.spared.length > 0 && (
            <Section title="Spared">
              <ul>
                {e.spared.map((f, i) => (
                  <li key={i}>
                    <FactText fact={f} />
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {e.treatments.length > 0 && (
            <Section title="Treatment">
              <ul>
                {e.treatments.map((f, i) => (
                  <li key={i}>
                    <FactText fact={f} />
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {e.teaches && (
            <Section title="What it teaches">
              <p>{e.teaches}</p>
            </Section>
          )}
        </>
      );
    case 'concept':
      return (
        <>
          {e.points.length > 0 && (
            <ul>
              {e.points.map((f, i) => (
                <li key={i}>
                  <FactText fact={f} />
                </li>
              ))}
            </ul>
          )}
          {e.related.length > 0 && (
            <Section title="Related">
              <Links ids={e.related} />
            </Section>
          )}
        </>
      );
    case 'experiment':
      return (
        <>
          <Section title="Setup">
            <p>{e.setup}</p>
          </Section>
          <Section title="Findings">
            <ul>
              {e.findings.map((f, i) => (
                <li key={i}>
                  <FactText fact={f} />
                </li>
              ))}
            </ul>
          </Section>
          <Section title="What it shows">
            <p>{e.shows}</p>
          </Section>
        </>
      );
    case 'person':
      return (
        <>
          {e.years && <p className="muted">{e.years}</p>}
          <ul>
            {e.contributions.map((f, i) => (
              <li key={i}>
                <FactText fact={f} />
              </li>
            ))}
          </ul>
        </>
      );
    default:
      return null;
  }
}

export function InfoPanel({
  id,
  onShowConnected,
  connectedOn,
  extra,
  compact = false,
}: {
  id: string;
  onShowConnected?: () => void;
  connectedOn?: boolean;
  extra?: ReactNode;
  compact?: boolean;
}) {
  const e = entity(id);
  if (!e) return null;
  const cards = cardsFor(id).filter((c) => getTopic(c.topic)?.status === 'ready');
  const qs = questionsFor(id).filter((q) => getTopic(q.topic)?.status === 'ready');
  const lessons = lessonsMentioning(id);
  const connected = connectedIds(id);
  return (
    <article className="info-panel" aria-live="polite">
      <div className="tiny muted">{ENTITY_TYPE_LABEL[e.type]}</div>
      <h2>
        {e.name}
        <SourceBadges corrections={e.corrections} flags={e.flags} source={e.source} />
      </h2>
      {e.aliases.length > 0 && <p className="muted small">Also: {e.aliases.join(', ')}</p>}
      <p>{e.short}</p>
      {extra}
      <EntityDetails e={e} />
      {!compact && connected.length > 0 && (
        <Section title="Connected to">
          <Links ids={connected.slice(0, 16)} />
        </Section>
      )}
      {lessons.length > 0 && (
        <Section title="In lessons">
          <ul>
            {lessons.map((l) => (
              <li key={l.id}>
                <Link to={`/learn/${l.topic}/${l.slug}`}>{l.title}</Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
      <div className="row" style={{ marginTop: '1rem' }}>
        {onShowConnected && connected.length > 0 && (
          <button type="button" className="btn small" aria-pressed={!!connectedOn} onClick={onShowConnected}>
            <Icon name="graph" /> {connectedOn ? 'Hide connections' : 'Show everything connected'}
          </button>
        )}
        {cards.length > 0 && (
          <Link className="btn small" to={`/cards?ref=${id}`}>
            <Icon name="cards" /> {cards.length} cards
          </Link>
        )}
        {qs.length > 0 && (
          <Link className="btn small" to={`/quiz?ref=${id}`}>
            <Icon name="spark" /> Quiz ({qs.length})
          </Link>
        )}
        <CopyLinkButton path={`/entity/${id}`} />
      </div>
    </article>
  );
}
