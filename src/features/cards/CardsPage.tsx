import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { content, ENTITY_TYPE_LABEL, readyTopics } from '../../content';
import type { Card, EntityType } from '../../content/types';
import { describeFilter, filterToQuery, matchCard, parseFilter, type Filter } from '../../lib/filters';
import { dueCount, planSession } from '../../lib/session';
import { formatInterval, GRADES, getProgress, preview, review, useProgress } from '../../progress/store';
import { CopyLinkButton, Icon, SourceBadges } from '../../ui/bits';
import { Diagram } from '../../ui/Diagram';

const KINDS = [
  { id: 'basic', label: 'Q & A' },
  { id: 'reverse', label: 'Reverse (function → name)' },
  { id: 'occlusion', label: 'Diagram (name the highlighted part)' },
];
const TYPES: EntityType[] = ['region', 'neurotransmitter', 'drug', 'molecule', 'pathway', 'concept', 'case', 'term'];

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

export function CardsPage() {
  const [params, setParams] = useSearchParams();
  const filter = parseFilter(params);
  const p = useProgress();
  const [session, setSession] = useState<{ queue: Card[]; cram: boolean } | null>(null);

  const cards = useMemo(() => content.cards.filter((c) => matchCard(c, filter, content)), [params]); // eslint-disable-line react-hooks/exhaustive-deps
  const due = dueCount(cards, p.cards);
  const fresh = cards.filter((c) => !p.cards[c.id]).length;
  const plan = planSession(cards, p.cards, { newLimit: p.settings.newPerSession });

  const setFilter = (f: Filter) => setParams(new URLSearchParams(filterToQuery(f).slice(1)), { replace: true });

  if (session) return <Session queue={session.queue} cram={session.cram} onDone={() => setSession(null)} />;

  return (
    <div className="stack">
      <div className="page-head">
        <div className="eyebrow">Flashcards</div>
        <h1>Spaced repetition</h1>
        <p>Cards you know well come back less often. Cards you miss come back soon. Rate honestly: that's what makes the schedule work.</p>
      </div>

      <section className="panel stack">
        <div className="row">
          <h2 style={{ margin: 0 }}>Deck: {describeFilter(filter, content)}</h2>
          <span className="spacer" />
          <CopyLinkButton path={`/cards${filterToQuery(filter)}`} label="Share deck" />
        </div>
        <div>
          <div className="small muted">Topic</div>
          <div className="linklist">
            {readyTopics.map((t) => (
              <button key={t.id} type="button" className="chip" aria-pressed={filter.topics.includes(t.id)} onClick={() => setFilter({ ...filter, topics: toggle(filter.topics, t.id) })}>
                {t.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="small muted">Exam unit</div>
          <div className="linklist">
            {content.units.map((u) => (
              <button key={u.id} type="button" className="chip" aria-pressed={filter.units.includes(u.id)} onClick={() => setFilter({ ...filter, units: toggle(filter.units, u.id) })}>
                {u.id.replace('exam', 'Exam ')} · {u.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="small muted">About</div>
          <div className="linklist">
            {TYPES.map((t) => (
              <button key={t} type="button" className="chip" aria-pressed={filter.types.includes(t)} onClick={() => setFilter({ ...filter, types: toggle(filter.types, t) })}>
                {ENTITY_TYPE_LABEL[t]}s
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="small muted">Card type</div>
          <div className="linklist">
            {KINDS.map((k) => (
              <button key={k.id} type="button" className="chip" aria-pressed={filter.kinds.includes(k.id)} onClick={() => setFilter({ ...filter, kinds: toggle(filter.kinds, k.id) })}>
                {k.label}
              </button>
            ))}
          </div>
        </div>
        {filter.ref && (
          <div className="notice">
            Only cards about <b>{content.entities[filter.ref]?.name}</b>.{' '}
            <button type="button" className="btn small ghost" onClick={() => setFilter({ ...filter, ref: undefined })}>
              Clear
            </button>
          </div>
        )}
        <div className="kpis">
          <div className="stat">
            <b>{due}</b>
            <span>due now</span>
          </div>
          <div className="stat">
            <b>{fresh}</b>
            <span>new</span>
          </div>
          <div className="stat">
            <b>{cards.length}</b>
            <span>in deck</span>
          </div>
        </div>
        <div className="row">
          <button type="button" className="btn primary" disabled={plan.queue.length === 0} onClick={() => setSession({ queue: plan.queue, cram: false })}>
            <Icon name="cards" /> Study {plan.due.length} due + {plan.fresh.length} new
          </button>
          <button type="button" className="btn" disabled={cards.length === 0} onClick={() => setSession({ queue: planSession(cards, p.cards, { cram: true }).queue.slice(0, 30), cram: true })}>
            Cram 30 at random
          </button>
        </div>
        {plan.queue.length === 0 && cards.length > 0 && <div className="notice ok">Nothing due in this deck. Come back later, or cram to practice anyway.</div>}
        <p className="tiny muted" style={{ margin: 0 }}>
          New cards per session: {p.settings.newPerSession} (change in <Link to="/progress">settings</Link>). Scheduling uses the FSRS algorithm.
        </p>
      </section>
    </div>
  );
}

function Session({ queue: initial, cram, onDone }: { queue: Card[]; cram: boolean; onDone: () => void }) {
  const [queue, setQueue] = useState(initial);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [stats, setStats] = useState({ reviewed: 0, again: 0 });
  const card = queue[i];

  const grade = (rating: number) => {
    if (!card) return;
    review(card.id, rating as 1 | 2 | 3 | 4);
    setStats((s) => ({ reviewed: s.reviewed + 1, again: s.again + (rating === 1 ? 1 : 0) }));
    // Missed cards come back later in this session (once).
    if (rating === 1 && queue.filter((c) => c.id === card.id).length < 2) setQueue((q) => [...q, card]);
    setShown(false);
    setI((x) => x + 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!card) return;
      if (!shown && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        setShown(true);
      } else if (shown && ['1', '2', '3', '4'].includes(e.key)) grade(Number(e.key));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!card) {
    return (
      <div className="panel stack" style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        <div className="summary-score">{stats.reviewed}</div>
        <h2>cards reviewed</h2>
        <p className="muted">
          {stats.reviewed ? `${Math.round(((stats.reviewed - stats.again) / stats.reviewed) * 100)}% remembered on the first try.` : ''}{' '}
          {dueCount(content.cards, getProgress().cards)} cards are due across all decks.
        </p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn primary" onClick={onDone}>
            Back to decks
          </button>
          <Link className="btn" to="/">
            Home
          </Link>
        </div>
      </div>
    );
  }

  const intervals = preview(getProgress().cards[card.id]);
  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }} className="stack">
      <div className="row">
        <button type="button" className="btn small ghost" onClick={onDone}>
          ← End session
        </button>
        <span className="spacer" />
        <span className="small muted">
          {i + 1} / {queue.length}
          {cram ? ' · cram' : ''}
        </span>
      </div>
      <div className="meter">
        <span style={{ width: `${(i / queue.length) * 100}%` }} />
      </div>
      <article className="panel flashcard" aria-live="polite">
        <div className="row">
          <span className="tag">{card.kind === 'occlusion' ? 'Diagram' : card.kind === 'reverse' ? 'Reverse' : 'Card'}</span>
          <span className="small muted">{content.topics.find((t) => t.id === card.topic)?.name}</span>
          <span className="spacer" />
          <SourceBadges corrections={card.corrections} source={card.source} />
        </div>
        {card.kind === 'occlusion' && card.diagram && card.target && (
          <Diagram
            key={card.id}
            id={card.diagram}
            layers={card.layers ?? []}
            focus={[card.target]}
            occlusion={!shown}
            showLabels={false}
            controls={false}
            ariaLabel="Diagram with one structure highlighted"
          />
        )}
        <div className="front">{card.front}</div>
        {shown ? (
          <div className="back">{card.back}</div>
        ) : (
          <button type="button" className="btn primary" onClick={() => setShown(true)} autoFocus>
            Show answer <span className="tiny">(Space)</span>
          </button>
        )}
      </article>
      {shown && (
        <div className="grades" role="group" aria-label="How well did you remember?">
          {GRADES.map((g) => (
            <button key={g.rating} type="button" className={`btn ${g.label.toLowerCase()}`} onClick={() => grade(g.rating)}>
              {g.label}
              <small>
                {formatInterval(intervals[g.rating])} · {g.key}
              </small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
