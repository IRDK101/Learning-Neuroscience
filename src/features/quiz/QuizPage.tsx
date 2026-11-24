import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { content, readyTopics } from '../../content';
import type { Question } from '../../content/types';
import { describeFilter, filterToQuery, matchQuestion, parseFilter, type Filter } from '../../lib/filters';
import { shuffle } from '../../lib/random';
import { recordAnswer, recordGame, useProgress } from '../../progress/store';
import { CopyLinkButton, Icon } from '../../ui/bits';
import { lessonHref, QuestionView } from '../../ui/QuestionView';

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

/** Pick n questions, mixing hand-written ones in and avoiding two questions about the same thing in a row. */
export function pickQuestions(pool: Question[], n: number, random = Math.random): Question[] {
  const hand = shuffle(pool.filter((q) => !q.generated), random);
  const gen = shuffle(pool.filter((q) => q.generated), random);
  const nHand = Math.min(hand.length, Math.ceil(n * 0.4));
  const picked = [...hand.slice(0, nHand), ...gen.slice(0, n - nHand)];
  if (picked.length < n) picked.push(...hand.slice(nHand, nHand + n - picked.length));
  const out = shuffle(picked, random);
  for (let i = 1; i < out.length; i++) {
    if (out[i].refs[0] && out[i].refs[0] === out[i - 1].refs[0]) {
      const j = out.findIndex((q, k) => k > i && q.refs[0] !== out[i].refs[0]);
      if (j > 0) [out[i], out[j]] = [out[j], out[i]];
    }
  }
  return out;
}

export function QuizPage() {
  const [params, setParams] = useSearchParams();
  const filter = parseFilter(params);
  const n = filter.n ?? 10;
  const p = useProgress();
  const pool = useMemo(() => content.questions.filter((q) => matchQuestion(q, filter, content, p.misses)), [params, p.misses]); // eslint-disable-line react-hooks/exhaustive-deps
  const [round, setRound] = useState<Question[] | null>(null);
  const setFilter = (f: Filter) => setParams(new URLSearchParams(filterToQuery(f).slice(1)), { replace: true });

  if (round) return <Round questions={round} filter={filter} onExit={() => setRound(null)} onAgain={() => setRound(pickQuestions(pool, n))} />;

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Quiz yourself</h1>
      </div>
      <section className="stack">
        <div className="row">
          <h2 style={{ margin: 0 }}>{describeFilter(filter, content)}</h2>
          <span className="spacer" />
          <CopyLinkButton path={`/quiz${filterToQuery({ ...filter, n })}`} label="Share this quiz" />
        </div>
        <div className="filter-group">
          <div className="label">Topic</div>
          <div className="linklist">
            {readyTopics.map((t) => (
              <button key={t.id} type="button" className="chip" aria-pressed={filter.topics.includes(t.id)} onClick={() => setFilter({ ...filter, topics: toggle(filter.topics, t.id) })}>
                {t.name}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <div className="label">Part</div>
          <div className="linklist">
            {content.units.map((u) => (
              <button key={u.id} type="button" className="chip" aria-pressed={filter.units.includes(u.id)} onClick={() => setFilter({ ...filter, units: toggle(filter.units, u.id) })}>
                {u.name}
              </button>
            ))}
          </div>
        </div>
        <div className="row">
          <label className="field">
            Questions
            <select value={n} onChange={(e) => setFilter({ ...filter, n: Number(e.target.value) })}>
              {[5, 10, 15, 20, 30].map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="chip" aria-pressed={!!filter.mistakes} onClick={() => setFilter({ ...filter, mistakes: !filter.mistakes || undefined })}>
            Only questions I've missed ({Object.keys(p.misses).length})
          </button>
        </div>
        <div className="row">
          <button type="button" className="btn primary" disabled={!pool.length} onClick={() => setRound(pickQuestions(pool, n))}>
            <Icon name="spark" /> Start ({Math.min(n, pool.length)} of {pool.length})
          </button>
        </div>
        {!pool.length && <div className="notice">No questions match. Try fewer filters.</div>}
      </section>
    </div>
  );
}

function Round({ questions, filter, onExit, onAgain }: { questions: Question[]; filter: Filter; onExit: () => void; onAgain: () => void }) {
  const [i, setI] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const q = questions[i];

  if (!q) {
    const score = results.filter(Boolean).length;
    let best = 0;
    let run = 0;
    for (const r of results) {
      run = r ? run + 1 : 0;
      best = Math.max(best, run);
    }
    const missed = questions.filter((_, k) => !results[k]);
    return (
      <div className="panel stack" style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="result-score">
            {score}/{questions.length}
          </div>
          <p className="muted">
            {Math.round((score / questions.length) * 100)}% correct, best streak {best}
          </p>
        </div>
        {missed.length > 0 && (
          <div>
            <h3>Review these</h3>
            <ul>
              {missed.map((m) => (
                <li key={m.id}>
                  {m.stem}{' '}
                  <span className="muted small">
                    Answer: <b>{m.options.find((o) => o.correct)?.text}</b>
                  </span>
                  {m.lesson && (
                    <>
                      {' '}
                      (<Link to={lessonHref(m.lesson)}>review the lesson</Link>)
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="row" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn primary" onClick={onAgain}>
            New round
          </button>
          <button type="button" className="btn" onClick={onExit}>
            Change settings
          </button>
          <CopyLinkButton path={`/quiz${filterToQuery({ ...filter, n: questions.length })}`} label="Share this quiz" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }} className="stack">
      <div className="row">
        <button type="button" className="btn small ghost" onClick={onExit}>
          Quit
        </button>
        <span className="spacer" />
        <span className="small muted">
          Question {i + 1} of {questions.length}, {results.filter(Boolean).length} correct so far
        </span>
      </div>
      <div className="meter">
        <span style={{ width: `${(i / questions.length) * 100}%` }} />
      </div>
      <div className="panel">
        <QuestionView
          key={q.id}
          q={q}
          onAnswer={(ok) => {
            recordAnswer(q.topic, q.id, ok);
            setResults((r) => {
              const next = [...r, ok];
              if (next.length === questions.length) recordGame('quiz', next.filter(Boolean).length);
              return next;
            });
          }}
          onNext={() => setI((x) => x + 1)}
          nextLabel={i === questions.length - 1 ? 'See results' : 'Next'}
        />
      </div>
    </div>
  );
}
