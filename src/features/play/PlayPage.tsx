import { Link } from 'react-router';
import { content } from '../../content';
import { streak, useProgress } from '../../progress/store';
import { Icon } from '../../ui/bits';

export function PlayPage() {
  const p = useProgress();
  const best = (k: string) => p.games[k]?.best;
  const pathways = Object.values(content.entities).filter((e) => e.type === 'pathway' && e.game);
  return (
    <div className="stack">
      <div className="page-head">
        <div className="eyebrow">Games</div>
        <h1>Play</h1>
        <p>Short rounds that drill the same material as the cards. Current streak: {streak(p.days)} day(s).</p>
      </div>
      <div className="grid grid-3">
        <div className="panel stack">
          <h2>Find the region</h2>
          <p className="muted small">“Click the locus coeruleus.” Labels off, no hints. Reverse mode: say what the highlighted part does.</p>
          {content.diagrams.filter((d) => d.quiz).map((d) => (
            <div key={d.id} className="row">
              <b className="small" style={{ minWidth: 0, flex: 1 }}>{d.title}</b>
              <Link className="btn small" to={`/play/find?diagram=${d.id}`}>
                Untimed
              </Link>
              <Link className="btn small" to={`/play/find?diagram=${d.id}&timed=1`}>
                60s
              </Link>
              <Link className="btn small" to={`/play/find?diagram=${d.id}&mode=reverse`}>
                Reverse
              </Link>
            </div>
          ))}
          {best('find') !== undefined && <div className="small muted">Best timed score: {best('find')}</div>}
        </div>
        <div className="panel stack">
          <h2>Trivia quiz</h2>
          <p className="muted small">Multiple choice and “which region would be damaged if…” cases, with explanations.</p>
          <Link className="btn primary" to="/quiz?n=10">
            <Icon name="spark" /> Quick 10
          </Link>
          <Link className="btn" to="/quiz?mistakes=1&n=10">
            Retry my mistakes
          </Link>
          {best('quiz') !== undefined && <div className="small muted">Best round: {best('quiz')} correct</div>}
        </div>
        <div className="panel stack">
          <h2>Pathway builder</h2>
          <p className="muted small">Put the steps of a pathway or synthesis chain in order. Drag, or use the arrow buttons.</p>
          {pathways.map((pw) => (
            <Link key={pw.id} className="btn small" to={`/play/pathway?id=${pw.id}`}>
              {pw.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
