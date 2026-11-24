import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { content, diagram as getDiagram, entity } from '../../content';
import type { Question } from '../../content/types';
import { sample, shuffle } from '../../lib/random';
import { the } from '../../lib/text';
import { recordGame } from '../../progress/store';
import { CopyLinkButton } from '../../ui/bits';
import { Diagram } from '../../ui/Diagram';
import { QuestionView } from '../../ui/QuestionView';

const ROUND = 10;
const capitalize = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const SECONDS = 60;

function maskName(text: string, id: string) {
  const e = entity(id);
  if (!e) return text;
  let out = text;
  for (const f of [e.name, ...e.aliases].sort((a, b) => b.length - a.length)) {
    if (f.length > 1) out = out.replace(new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), 'this structure');
  }
  return out;
}

export function FindGame() {
  const [params] = useSearchParams();
  const d = getDiagram(params.get('diagram') ?? 'nt-overlay') ?? content.diagrams[0];
  const mode = params.get('mode') === 'reverse' ? 'reverse' : 'find';
  const timed = params.get('timed') === '1';
  const layers = d.defaultLayers;
  const pool = useMemo(() => d.refs.filter((r) => entity(r) && Object.entries(d.layerRefs).some(([l, refs]) => refs.includes(r) && (l === '' || layers.includes(l)))), [d, layers]);

  const [order, setOrder] = useState<string[]>(() => shuffle(pool));
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [run, setRun] = useState(0);
  const [bestRun, setBestRun] = useState(0);
  const [feedback, setFeedback] = useState<{ wrong?: string; ok: boolean } | null>(null);
  const [timeLeft, setTimeLeft] = useState(SECONDS);
  const [over, setOver] = useState(false);
  const recorded = useRef(false);

  const target = order[i % order.length];
  const finished = over || (!timed && answered >= Math.min(ROUND, pool.length));

  const restart = useCallback(() => {
    setOrder(shuffle(pool));
    setI(0);
    setScore(0);
    setAnswered(0);
    setRun(0);
    setBestRun(0);
    setFeedback(null);
    setTimeLeft(SECONDS);
    setOver(false);
    recorded.current = false;
  }, [pool]);

  useEffect(restart, [restart]);

  useEffect(() => {
    if (!timed || finished) return;
    const t = window.setInterval(() => setTimeLeft((s) => (s <= 1 ? (setOver(true), 0) : s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [timed, finished]);

  useEffect(() => {
    if (finished && !recorded.current) {
      recorded.current = true;
      recordGame(timed ? 'find' : 'find-untimed', score);
    }
  }, [finished, score, timed]);

  const result = (ok: boolean, wrong?: string) => {
    setAnswered((a) => a + 1);
    if (ok) {
      setScore((s) => s + 1);
      setRun((r) => {
        setBestRun((b) => Math.max(b, r + 1));
        return r + 1;
      });
    } else setRun(0);
    setFeedback({ ok, wrong });
    window.setTimeout(
      () => {
        setFeedback(null);
        setI((x) => x + 1);
      },
      ok ? 650 : 1500,
    );
  };

  const onSelect = (id: string) => {
    if (feedback || finished) return;
    result(id === target, id === target ? undefined : id);
  };

  // Reverse mode: "what does the highlighted structure do?"
  const reverseQ: Question | null = useMemo(() => {
    if (mode !== 'reverse' || !target) return null;
    const e = entity(target)!;
    const others = sample(pool.filter((x) => x !== target), 3).map((x) => ({ text: maskName(entity(x)!.short, x), correct: false, ref: x }));
    return {
      id: `find-rev-${target}-${i}`,
      kind: 'mcq',
      stem: 'What does the highlighted structure do?',
      options: [{ text: maskName(e.short, target), correct: true, ref: target }, ...others],
      explain: `That's ${the(e.name)}.`,
      refs: [target],
      topic: d.topics[0],
      unit: 'foundations',
      difficulty: 2,
      source: e.source,
      corrections: [],
      generated: true,
    };
  }, [mode, target, i, pool, d]);

  if (pool.length < 4) return <div className="panel">This diagram doesn't have enough regions for the game yet.</div>;

  const share = `/play/find?diagram=${d.id}${mode === 'reverse' ? '&mode=reverse' : ''}${timed ? '&timed=1' : ''}`;

  if (finished) {
    return (
      <div className="panel stack" style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        <div className="result-score">{score}</div>
        <h2>
          {timed ? 'found in 60 seconds' : `out of ${answered}`}
        </h2>
        <p className="muted">
          {answered ? Math.round((score / answered) * 100) : 0}% accurate, best streak {bestRun}
        </p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn primary" onClick={restart}>
            Play again
          </button>
          <Link className="btn" to="/play">
            All games
          </Link>
          <CopyLinkButton path={share} label="Share" />
        </div>
      </div>
    );
  }

  const name = entity(target)?.name;
  return (
    <div className="stack">
      <div className="crumbs">
        <Link to="/play">Play</Link> / Find the region / {d.title}
      </div>
      <div className="game-hud">
        <span>
          <b>{score}</b> found
        </span>
        <span>
          <b>{run}</b> in a row
        </span>
        {timed ? (
          <>
            <span>
              <b>{timeLeft}</b> seconds left
            </span>
            <div className="timer-bar" aria-hidden="true">
              <span style={{ width: `${(timeLeft / SECONDS) * 100}%` }} />
            </div>
          </>
        ) : (
          <span>
            <b>{answered + 1}</b> of {Math.min(ROUND, pool.length)}
          </span>
        )}
        <span className="spacer" />
        <div className="linklist">
          <Link className={`chip${mode === 'find' && !timed ? ' on' : ''}`} to={`/play/find?diagram=${d.id}`}>
            Untimed
          </Link>
          <Link className={`chip${timed ? ' on' : ''}`} to={`/play/find?diagram=${d.id}&timed=1`}>
            Timed
          </Link>
          <Link className={`chip${mode === 'reverse' ? ' on' : ''}`} to={`/play/find?diagram=${d.id}&mode=reverse`}>
            Reverse
          </Link>
        </div>
      </div>
      {mode === 'find' ? (
        <>
          <p className={`prompt${feedback ? (feedback.ok ? ' ok' : ' bad') : ''}`} aria-live="assertive">
            {feedback
              ? feedback.ok
                ? `Yes, that's ${the(name ?? '')}.`
                : `That's ${the(entity(feedback.wrong)?.name ?? '')}. ${capitalize(the(name ?? ''))} is outlined.`
              : `Find ${the(name ?? '')}.`}
          </p>
          <Diagram
            id={d.id}
            layers={layers}
            occlusion
            controls
            showLabels={false}
            onSelect={onSelect}
            focus={feedback ? [target] : []}
            selected={feedback?.wrong ?? null}
            ariaLabel={`Find the ${name}`}
          />
        </>
      ) : (
        <div className="map-layout">
          <Diagram id={d.id} layers={layers} occlusion showLabels={false} focus={[target]} controls />
          <div className="panel">
            {reverseQ && (
              <QuestionView
                key={reverseQ.id}
                q={reverseQ}
                showLessonLink={false}
                onAnswer={(ok) => {
                  setAnswered((a) => a + 1);
                  if (ok) {
                    setScore((s) => s + 1);
                    setRun((r) => {
                      setBestRun((b) => Math.max(b, r + 1));
                      return r + 1;
                    });
                  } else setRun(0);
                }}
                onNext={() => setI((x) => x + 1)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
