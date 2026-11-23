import { Link } from 'react-router';
import { content, readyTopics } from '../../content';
import { dueCount } from '../../lib/session';
import { mastery, streak, useProgress } from '../../progress/store';
import { Icon, Meter, UnitTag } from '../../ui/bits';
import { Diagram } from '../../ui/Diagram';

export function HomePage() {
  const p = useProgress();
  const due = dueCount(content.cards, p.cards);
  const seen = Object.keys(p.cards).length;
  const newAvailable = content.cards.length - seen;
  const days = streak(p.days);
  const lessonsDone = Object.keys(p.lessons).length;
  const firstLesson = content.lessons[0];
  const nextLesson = content.lessons.find((l) => !p.lessons[l.id]) ?? firstLesson;

  return (
    <div className="stack">
      <section className="hero">
        <div>
          <div className="eyebrow">PSYC 6 · Intro to Neuroscience</div>
          <h1>Learn the brain by exploring it.</h1>
          <p>
            Interactive brain maps, short lessons, spaced-repetition flashcards and quick games, built from a student's course notes and
            checked for accuracy. No account needed; your progress stays on this device.
          </p>
          <div className="row">
            {lessonsDone === 0 ? (
              <Link className="btn primary" to="/learn">
                <Icon name="book" /> Start here
              </Link>
            ) : (
              nextLesson && (
                <Link className="btn primary" to={`/learn/${nextLesson.topic}/${nextLesson.slug}`}>
                  <Icon name="book" /> Continue: {nextLesson.title}
                </Link>
              )
            )}
            <Link className="btn" to="/cards">
              <Icon name="cards" /> Review {due > 0 ? `${due} due` : 'cards'}
            </Link>
            <Link className="btn" to="/map/nt-overlay">
              <Icon name="map" /> Explore the map
            </Link>
          </div>
        </div>
        <Link to="/map/nt-overlay" aria-label="Open the neurotransmitter systems map" style={{ textDecoration: 'none' }}>
          <Diagram id="nt-overlay" controls={false} showLabels={false} ariaLabel="Preview: neurotransmitter systems" />
        </Link>
      </section>

      <section className="kpis" aria-label="Your progress">
        <div className="panel stat">
          <b>{due}</b>
          <span>cards due{newAvailable > 0 ? ` · ${newAvailable} new` : ''}</span>
        </div>
        <div className="panel stat">
          <b>
            {days}
            {days > 0 && <Icon name="flame" size={20} />}
          </b>
          <span>day streak</span>
        </div>
        <div className="panel stat">
          <b>
            {lessonsDone}/{content.lessons.length}
          </b>
          <span>lessons done</span>
        </div>
      </section>

      <section>
        <h2>Your topics</h2>
        <div className="grid grid-2">
          {readyTopics.map((t) => {
            const ids = content.cards.filter((c) => c.topic === t.id).map((c) => c.id);
            const m = mastery(p, ids, t.id);
            const topicDue = dueCount(content.cards.filter((c) => c.topic === t.id), p.cards);
            return (
              <div key={t.id} className="panel stack">
                <div className="row">
                  <UnitTag unit={t.unit} />
                  <span className="spacer" />
                  <span className="small muted">{Math.round(m * 100)}% mastery</span>
                </div>
                <h3 style={{ margin: 0 }}>
                  <Link to={`/learn/${t.id}`}>{t.name}</Link>
                </h3>
                <Meter value={m} label={`${t.name} mastery`} />
                <div className="row">
                  <Link className="btn small" to={`/cards?topic=${t.id}`}>
                    Flashcards{topicDue ? ` (${topicDue} due)` : ''}
                  </Link>
                  <Link className="btn small" to={`/quiz?topic=${t.id}&n=10`}>
                    Quiz
                  </Link>
                  <Link className="btn small" to={`/play/find?diagram=nt-overlay`}>
                    Find the region
                  </Link>
                </div>
              </div>
            );
          })}
          <div className="panel stack">
            <h3 style={{ margin: 0 }}>Coming next</h3>
            <p className="muted small" style={{ margin: 0 }}>
              {content.topics.filter((t) => t.status === 'planned').length} more topics from the course, from brain anatomy to memory and mental illness.
            </p>
            <Link className="btn small" to="/learn">
              See the full path
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
