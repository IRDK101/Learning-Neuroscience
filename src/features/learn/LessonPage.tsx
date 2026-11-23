/**
 * Lessons: text on the left, a sticky diagram on the right (top on phones). As each paragraph scrolls
 * into the reading zone, the diagram switches to that paragraph's ::diagram / ::focus state, so the
 * amygdala (or locus coeruleus…) lights up while the text is talking about it.
 */
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { diagram as getDiagram, entity, lesson as getLesson, question, topic as getTopic } from '../../content';
import type { Lesson, LessonBlock } from '../../content/types';
import { completeLesson, recordAnswer, useProgress } from '../../progress/store';
import { CopyLinkButton, Icon, UnitTag } from '../../ui/bits';
import { Diagram } from '../../ui/Diagram';
import { PathwayView } from '../../ui/PathwayView';
import { QuestionView } from '../../ui/QuestionView';

interface FigureState {
  diagram: string;
  highlight: string[];
  layers?: string[];
}
interface Segment {
  figure: FigureState | null;
  blocks: LessonBlock[];
}

function segment(l: Lesson): Segment[] {
  const out: Segment[] = [{ figure: null, blocks: [] }];
  let current: FigureState | null = null;
  for (const b of l.blocks) {
    if (b.type === 'diagram') {
      current = { diagram: b.diagram, highlight: b.highlight, layers: b.layers.length ? b.layers : undefined };
      out.push({ figure: current, blocks: [b] });
    } else if (b.type === 'focus' && current) {
      current = { diagram: current.diagram, highlight: b.highlight, layers: b.layers ?? current.layers };
      out.push({ figure: current, blocks: [] });
    } else {
      out[out.length - 1].blocks.push(b);
    }
  }
  return out.filter((s, i) => i > 0 || s.blocks.length);
}

function Block({ b, topic, onPathwayStep }: { b: LessonBlock; topic: string; onPathwayStep: (ref?: string) => void }) {
  switch (b.type) {
    case 'html':
      return <div dangerouslySetInnerHTML={{ __html: b.html }} />;
    case 'heading':
      return b.level === 2 ? <h2 id={b.anchor}>{b.text}</h2> : <h3 id={b.anchor}>{b.text}</h3>;
    case 'aside':
      return (
        <aside className={`aside aside-${b.kind}`}>
          <div className="aside-label">{b.kind === 'added' ? 'Background, added for beginners (not from the notes)' : b.kind === 'tip' ? 'Tip' : 'Note'}</div>
          <div dangerouslySetInnerHTML={{ __html: b.html }} />
        </aside>
      );
    case 'diagram': {
      const d = getDiagram(b.diagram);
      return (
        <div className="figure-marker">
          <Icon name="map" size={15} /> {b.caption ?? `See the figure: ${d?.title}.`}
        </div>
      );
    }
    case 'pathway':
      return <PathwayView id={b.pathway} onStep={(ref) => onPathwayStep(ref)} />;
    case 'check': {
      const q = question(b.question);
      if (!q) return null;
      return (
        <div className="check">
          <div className="check-label">Check yourself</div>
          <QuestionView q={q} onAnswer={(ok) => recordAnswer(topic, q.id, ok)} />
        </div>
      );
    }
    default:
      return null;
  }
}

export function LessonPage() {
  const { topic: topicId, lesson: slug } = useParams();
  const [params] = useSearchParams();
  const l = getLesson(`${topicId}/${slug}`);
  const t = getTopic(topicId);
  const p = useProgress();
  const segments = useMemo(() => (l ? segment(l) : []), [l]);
  const firstFigure = segments.find((s) => s.figure)?.figure ?? null;
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState<string[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const segRefs = useRef<(HTMLDivElement | null)[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  // Which segment is in the reading zone (a band ~35% from the top of the viewport)?
  useEffect(() => {
    const els = segRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).map((e) => Number((e.target as HTMLElement).dataset.seg));
        if (visible.length) setActive(Math.max(...visible));
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [segments]);

  // Mark complete when the end of the lesson is reached.
  useEffect(() => {
    if (!l || !endRef.current) return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && completeLesson(l.id));
    io.observe(endRef.current);
    return () => io.disconnect();
  }, [l]);

  // ?s=anchor deep links to a section.
  useEffect(() => {
    const s = params.get('s');
    if (s) window.setTimeout(() => document.getElementById(s)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }, [params, l]);

  useEffect(() => {
    setSelected(null);
    setActive(0);
  }, [l]);

  if (!l || !t) return <div className="panel">Lesson not found.</div>;

  const figure = segments[active]?.figure ?? firstFigure;
  const d = figure ? getDiagram(figure.diagram) : undefined;
  const hl = (hover ?? figure?.highlight ?? []).filter((id) => d?.refs.includes(id));
  const lessons = t.lessons;
  const idx = lessons.indexOf(l.id);
  const prev = idx > 0 ? getLesson(lessons[idx - 1]) : undefined;
  const next = idx < lessons.length - 1 ? getLesson(lessons[idx + 1]) : undefined;

  // Hovering a linked term in the text highlights it on the diagram (if it's there).
  const onTextOver = (e: React.PointerEvent) => {
    const el = (e.target as Element).closest?.('[data-ref]') as HTMLElement | null;
    const ref = el?.dataset.ref;
    if (ref && d?.refs.includes(ref)) setHover([ref]);
  };
  const onTextOut = (e: React.PointerEvent) => {
    if ((e.target as Element).closest?.('[data-ref]')) setHover(null);
  };
  const onPathwayStep = (ref?: string) => {
    if (ref && d?.refs.includes(ref)) setHover([ref]);
  };

  return (
    <div>
      <div className="crumbs">
        <Link to="/learn">Learn</Link> / <Link to={`/learn/${t.id}`}>{t.name}</Link> / Lesson {idx + 1}
      </div>
      <div className="row" style={{ marginBottom: '0.4rem' }}>
        <UnitTag unit={t.unit} />
        <span className="small muted">
          {l.minutes} minutes{p.lessons[l.id] ? ', completed' : ''}
        </span>
        <span className="spacer" />
        <CopyLinkButton path={`/learn/${t.id}/${l.slug}`} />
      </div>
      <div className="lesson-head">
        <h1>{l.title}</h1>
        <p className="lede">{l.summary}</p>
      </div>

      <div className={figure ? 'lesson-layout' : ''}>
        <div className="lesson-text" onPointerOver={onTextOver} onPointerOut={onTextOut}>
          {segments.map((s, i) => (
            <div key={i} ref={(el) => void (segRefs.current[i] = el)} data-seg={i} className={`focus-block${i === active && s.figure ? ' active' : ''}`}>
              {s.blocks.map((b, j) => (
                <Fragment key={j}>
                  <Block b={b} topic={t.id} onPathwayStep={onPathwayStep} />
                </Fragment>
              ))}
            </div>
          ))}

          <div ref={endRef} className="lesson-end">
            <h2 style={{ marginTop: 0 }}>Practice this topic</h2>
            <p className="muted">Lock it in with spaced-repetition flashcards or a quick quiz on {t.name}.</p>
            <div className="row">
              <Link className="btn primary" to={`/cards?topic=${t.id}`}>
                <Icon name="cards" /> Flashcards
              </Link>
              <Link className="btn" to={`/quiz?topic=${t.id}&n=10`}>
                <Icon name="spark" /> 10-question quiz
              </Link>
            </div>
            <nav className="lesson-nav" aria-label="Lessons">
              {prev ? <Link to={`/learn/${t.id}/${prev.slug}`}>Previous: {prev.title}</Link> : <span />}
              {next ? <Link to={`/learn/${t.id}/${next.slug}`}>Next: {next.title}</Link> : <Link to={`/learn/${t.id}`}>Back to {t.name}</Link>}
            </nav>
          </div>
        </div>

        {figure && d && (
          <div className={`lesson-figure${collapsed ? ' collapsed' : ''}`}>
            <Diagram
              key={d.id}
              id={d.id}
              layers={figure.layers}
              focus={hl}
              selected={selected}
              projectionsFor={d.overlay && hl.length ? hl : undefined}
              onSelect={(id) => setSelected((s) => (s === id ? null : id))}
              caption={
                selected ? (
                  <span>
                    <b>{entity(selected)?.name}:</b> {entity(selected)?.short}{' '}
                    <Link to={`/entity/${selected}`}>More about it</Link>
                  </span>
                ) : (
                  <span className="idle">{d.title}. Tap a structure to identify it.</span>
                )
              }
              toolbar={
                <button type="button" className="chip lesson-collapse" onClick={() => setCollapsed((c) => !c)} aria-expanded={!collapsed}>
                  {collapsed ? 'Show diagram' : 'Hide'}
                </button>
              }
            />
            {collapsed && (
              <button type="button" className="chip" onClick={() => setCollapsed(false)}>
                <Icon name="map" size={15} /> Show diagram
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
