import { useCallback, useState } from 'react';
import { Link } from 'react-router';
import { content } from '../../content';
import { dueCount } from '../../lib/session';
import { streak, useProgress } from '../../progress/store';
import { DetailSheet } from '../../ui/DetailSheet';
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
  const [open, setOpen] = useState(false);
  const closeSheet = useCallback(() => setOpen(false), []);

  return (
    <div>
      <section className="home-hero">
        <div>
          <h1>Learning Introductory Neuroscience.</h1>
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
        <div>
          <Diagram
            id="nt-overlay"
            controls={false}
            showLabels={false}
            selected={picked}
            projectionsFor={picked ? [picked] : undefined}
            onSelect={(id) => {
              const same = picked === id && open;
              setPicked(same ? null : id);
              setOpen(!same);
            }}
            ariaLabel="The brain's neurotransmitter systems. Tap a structure for its facts and connections."
            caption={<span>The brain's four neurotransmitter systems. Tap any colored nucleus or structure for what it does and what it connects to.</span>}
          />
          <DetailSheet id={open ? picked : null} onClose={closeSheet} mapLink={picked ? `/map/nt-overlay?focus=${picked}` : undefined} />
        </div>
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
