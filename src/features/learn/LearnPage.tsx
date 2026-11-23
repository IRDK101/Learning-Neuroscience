import { Link } from 'react-router';
import { content } from '../../content';
import { mastery, useProgress } from '../../progress/store';
import { Meter, UnitTag } from '../../ui/bits';

export function LearnPage() {
  const p = useProgress();
  return (
    <div>
      <div className="page-head">
        <div className="eyebrow">Learning path</div>
        <h1>Start here</h1>
        <p>
          The course runs in three parts: <b>Foundations</b> (how neurons and the brain are built and how they signal), <b>Senses & Movement</b>,
          and <b>Higher Functions</b>. Each lesson takes 5–10 minutes, has diagrams that light up as you read, and ends with a few
          check-yourself questions.
        </p>
      </div>
      {content.units.map((u) => (
        <section key={u.id} className="unit-block">
          <div className="row" style={{ marginBottom: '0.6rem' }}>
            <h2 style={{ margin: 0 }}>{u.name}</h2>
            <UnitTag unit={u.id} />
          </div>
          <p className="muted small">{u.subtitle}</p>
          <div className="grid grid-3">
            {content.topics
              .filter((t) => t.unit === u.id)
              .map((t) => {
                const ready = t.status === 'ready';
                const done = t.lessons.filter((l) => p.lessons[l]).length;
                const m = mastery(p, content.cards.filter((c) => c.topic === t.id).map((c) => c.id), t.id);
                const inner = (
                  <>
                    <div className="small muted">
                      {t.order}. {ready ? `${t.lessons.length} lessons · ${done} done` : 'Coming soon'}
                    </div>
                    <h3>{t.name}</h3>
                    <p className="small muted" style={{ margin: 0 }}>
                      {t.summary}
                    </p>
                    {ready && <Meter value={m} label={`${t.name} mastery`} />}
                  </>
                );
                return ready ? (
                  <Link key={t.id} to={`/learn/${t.id}`} className="panel topic-card">
                    {inner}
                  </Link>
                ) : (
                  <div key={t.id} className="panel topic-card planned" aria-disabled="true">
                    {inner}
                  </div>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}
