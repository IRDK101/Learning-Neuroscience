import { useState } from 'react';
import { Link } from 'react-router';
import { content, entity } from '../../content';
import { dueCount } from '../../lib/session';
import { streak, useProgress } from '../../progress/store';
import { Diagram } from '../../ui/Diagram';
import { Syllabus } from '../../ui/Syllabus';

export function HomePage() {
  const p = useProgress();
  const [picked, setPicked] = useState<string | null>('locus-coeruleus');
  const due = dueCount(content.cards, p.cards);
  const days = streak(p.days);
  const lessonsDone = Object.keys(p.lessons).length;
  const first = content.lessons[0];
  const next = content.lessons.find((l) => !p.lessons[l.id]) ?? first;
  const e = entity(picked ?? undefined);

  return (
    <div>
      <section className="home-hero">
        <div>
          <h1>Learn the brain by taking it apart.</h1>
          <p className="lede">
            Short lessons, maps you can tap, and flashcards that come back right before you'd forget them. Built from PSYC 6 course
            notes, with the mistakes fixed.
          </p>
          <div className="row">
            {next && (
              <Link className="btn primary" to={`/learn/${next.topic}/${next.slug}`}>
                {lessonsDone === 0 ? 'Start the first lesson' : `Continue: ${next.title}`}
              </Link>
            )}
            <Link className="btn" to="/cards">
              {due > 0 ? `Review ${due} due cards` : 'Study flashcards'}
            </Link>
          </div>
        </div>
        <Diagram
          id="nt-overlay"
          controls={false}
          showLabels={false}
          selected={picked}
          projectionsFor={picked ? [picked] : undefined}
          onSelect={(id) => setPicked((x) => (x === id ? null : id))}
          ariaLabel="The brain's neurotransmitter systems. Tap a structure to identify it."
          caption={
            e ? (
              <span>
                <b>{e.name}.</b> {e.short} <Link to={`/map/nt-overlay?focus=${e.id}`}>Open in the map</Link>
              </span>
            ) : (
              <span>The brain's four neurotransmitter systems. Tap any colored nucleus to see what it does.</span>
            )
          }
        />
      </section>

      <p className="today" aria-label="Your progress today">
        {due > 0 ? (
          <span>
            <b>{due}</b> flashcards are due today.
          </span>
        ) : (
          <span>Nothing is due today.</span>
        )}
        {days > 0 && (
          <span>
            You're on a <b>{days}-day</b> streak.
          </span>
        )}
        <span>
          <b>{lessonsDone}</b> of {content.lessons.length} lessons done.
        </span>
        <span className="spacer" />
        <Link to="/progress">Your progress</Link>
      </p>

      <Syllabus />
    </div>
  );
}
