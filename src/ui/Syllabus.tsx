import { Link } from 'react-router';
import { content } from '../content';
import { mastery, useProgress } from '../progress/store';
import { Meter } from './bits';

/** All topics as a numbered table of contents, one column per part. */
export function Syllabus({ detailed = false }: { detailed?: boolean }) {
  const p = useProgress();
  return (
    <div className="syllabus">
      {content.units.map((u) => (
        <section key={u.id} aria-labelledby={`unit-${u.id}`}>
          <h2 id={`unit-${u.id}`}>{u.name}</h2>
          <p className="unit-sub">{u.subtitle.replace(' · ', ': ')}</p>
          <ol>
            {content.topics
              .filter((t) => t.unit === u.id)
              .map((t) => {
                const ready = t.status === 'ready';
                const done = t.lessons.filter((l) => p.lessons[l]).length;
                const m = mastery(p, content.cards.filter((c) => c.topic === t.id).map((c) => c.id), t.id);
                return (
                  <li key={t.id} className={ready ? 'ready' : 'planned'}>
                    <span className="num" aria-hidden="true">
                      {t.order}
                    </span>
                    <div>
                      {ready ? (
                        <Link className="topic-name" to={`/learn/${t.id}`}>
                          {t.name}
                        </Link>
                      ) : (
                        <span className="topic-name">{t.name}</span>
                      )}
                      {detailed && <p className="topic-summary">{t.summary}</p>}
                      <div className="topic-meta">
                        {ready
                          ? `${t.lessons.length} lessons${done ? `, ${done} done` : ''}${m > 0 ? `, ${Math.round(m * 100)}% mastered` : ''}`
                          : 'Coming soon'}
                      </div>
                      {ready && m > 0 && <Meter value={m} label={`${t.name} mastery`} />}
                    </div>
                  </li>
                );
              })}
          </ol>
        </section>
      ))}
    </div>
  );
}
