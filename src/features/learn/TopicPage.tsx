import { Link, useParams } from 'react-router';
import { content, lesson as getLesson, topic as getTopic } from '../../content';
import { filterToQuery } from '../../lib/filters';
import { mastery, useProgress } from '../../progress/store';
import { CopyLinkButton, EntityLink, Icon, Meter, UnitTag } from '../../ui/bits';

export function TopicPage() {
  const { topic: topicId } = useParams();
  const t = getTopic(topicId);
  const p = useProgress();
  if (!t) return <div className="panel">Unknown topic.</div>;
  const cards = content.cards.filter((c) => c.topic === t.id);
  const m = mastery(p, cards.map((c) => c.id), t.id);
  const diagrams = content.diagrams.filter((d) => d.topics.includes(t.id));
  const pathways = Object.values(content.entities).filter((e) => e.type === 'pathway' && e.topics.includes(t.id) && e.game);

  return (
    <div className="stack">
      <div className="page-head">
        <div className="crumbs">
          <Link to="/learn">Learn</Link> / {t.name}
        </div>
        <div className="row">
          <UnitTag unit={t.unit} />
          <span className="spacer" />
          <CopyLinkButton path={`/learn/${t.id}`} />
        </div>
        <h1 style={{ marginTop: '0.6rem' }}>{t.name}</h1>
        <p>{t.summary}</p>
        {t.status === 'planned' && <div className="notice">This topic is coming soon.</div>}
        {m > 0 && (
          <div style={{ maxWidth: 420 }}>
            <div className="small muted">{Math.round(m * 100)}% mastered</div>
            <Meter value={m} label="Topic mastery" />
          </div>
        )}
      </div>

      {t.lessons.length > 0 && (
        <section>
          <h2>Lessons</h2>
          <ol className="lesson-list">
            {t.lessons.map((id, i) => {
              const l = getLesson(id)!;
              const done = !!p.lessons[id];
              return (
                <li key={id}>
                  <Link to={`/learn/${t.id}/${l.slug}`}>
                    <span className={`lesson-num${done ? ' done' : ''}`} aria-label={done ? 'Done' : undefined}>
                      {done ? <Icon name="check" size={22} /> : i + 1}
                    </span>
                    <span>
                      <b>{l.title}</b>
                      <span className="small muted" style={{ display: 'block' }}>
                        {l.summary} ({l.minutes} min)
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <section className="sheet">
        <h2>Practice this topic</h2>
        <div className="row">
          <Link className="btn primary" to={`/cards${filterToQuery({ topics: [t.id], units: [], types: [], kinds: [] })}`}>
            <Icon name="cards" /> Flashcards ({cards.length})
          </Link>
          <Link className="btn" to={`/quiz?topic=${t.id}&n=10`}>
            <Icon name="spark" /> Quiz
          </Link>
          {diagrams.filter((d) => d.quiz).map((d) => (
            <Link key={d.id} className="btn" to={`/play/find?diagram=${d.id}`}>
              <Icon name="map" /> Find the region: {d.title}
            </Link>
          ))}
          {pathways.length > 0 && (
            <Link className="btn" to={`/play/pathway?topic=${t.id}`}>
              <Icon name="play" /> Pathway builder
            </Link>
          )}
        </div>
      </section>

      {diagrams.length > 0 && (
        <section className="sheet">
          <h2>Diagrams</h2>
          <div className="linklist">
            {diagrams.map((d) => (
              <Link key={d.id} className="chip" to={`/map/${d.id}`}>
                <Icon name="map" size={15} /> {d.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="sheet">
        <h2>Key ideas</h2>
        {(['neurotransmitter', 'drug', 'pathway', 'concept', 'case'] as const).map((type) => {
          const ids = Object.values(content.entities)
            .filter((e) => e.type === type && e.topics.includes(t.id))
            .map((e) => e.id);
          if (!ids.length) return null;
          return (
            <div key={type} style={{ marginBottom: '0.8rem' }}>
              <h3>{{ neurotransmitter: 'Neurotransmitters', drug: 'Drugs', pathway: 'Pathways', concept: 'Concepts', case: 'Disorders' }[type]}</h3>
              <div className="linklist">
                {ids.map((id) => (
                  <EntityLink key={id} id={id} />
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
