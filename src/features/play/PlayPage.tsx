import { Link } from 'react-router';
import { content } from '../../content';
import { useProgress } from '../../progress/store';

export function PlayPage() {
  const p = useProgress();
  const best = (k: string) => p.games[k]?.best;
  const pathways = Object.values(content.entities).filter((e) => e.type === 'pathway' && e.game);
  return (
    <div>
      <div className="page-head">
        <h1>Games</h1>
      </div>
      <ul className="game-list">
        <li>
          <div>
            <h2>Find the region</h2>
            <p className="muted">
              Labels hidden: tap the named part, or name the highlighted one.
            </p>
            {best('find') !== undefined && <p className="small muted">Your best 60-second score: {best('find')}.</p>}
          </div>
          <div className="stack">
            {content.diagrams.filter((d) => d.quiz).map((d) => (
              <div key={d.id} className="row">
                <b style={{ flex: '1 1 12rem' }}>{d.title}</b>
                <Link className="btn small" to={`/play/find?diagram=${d.id}`}>
                  10 rounds
                </Link>
                <Link className="btn small" to={`/play/find?diagram=${d.id}&timed=1`}>
                  60 seconds
                </Link>
                <Link className="btn small" to={`/play/find?diagram=${d.id}&mode=reverse`}>
                  Reverse
                </Link>
              </div>
            ))}
          </div>
        </li>
        <li>
          <div>
            <h2>Trivia quiz</h2>
            <p className="muted">Multiple choice and lesion cases.</p>
            {best('quiz') !== undefined && <p className="small muted">Your best round: {best('quiz')} correct.</p>}
          </div>
          <div className="row" style={{ alignSelf: 'start' }}>
            <Link className="btn primary" to="/quiz?n=10">
              Start a 10-question quiz
            </Link>
            <Link className="btn" to="/quiz?mistakes=1&n=10">
              Retry questions I missed
            </Link>
          </div>
        </li>
        <li>
          <div>
            <h2>Pathway builder</h2>
            <p className="muted">Put the steps of a pathway in order.</p>
          </div>
          <div className="row" style={{ alignSelf: 'start' }}>
            {pathways.map((pw) => (
              <Link key={pw.id} className="btn small" to={`/play/pathway?id=${pw.id}`}>
                {pw.name}
              </Link>
            ))}
          </div>
        </li>
      </ul>
    </div>
  );
}
