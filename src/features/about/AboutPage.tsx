import { Link } from 'react-router';
import { content } from '../../content';

export function AboutPage() {
  const corrections = Object.keys(content.corrections).length;
  return (
    <div className="stack" style={{ maxWidth: 760 }}>
      <div className="page-head">
        <div className="eyebrow">About</div>
        <h1>About NeuroMap</h1>
      </div>
      <section className="panel">
        <h2>What this is</h2>
        <p>
          NeuroMap teaches introductory neuroscience (PSYC 6) with interactive diagrams, short lessons, spaced-repetition flashcards and games.
          The content comes from a student's course notes. Where the notes were wrong, the site teaches the corrected version and marks it with a{' '}
          <span className="badge badge-corrected">corrected</span> badge you can tap to see the original wording ({corrections} corrections so far,{' '}
          <Link to="/corrections">listed here</Link>). Beginner background that isn't in the notes is marked{' '}
          <span className="badge badge-added">added</span>.
        </p>
        <p>
          It's a study aid, not a textbook. If your professor taught something differently, go with your professor.
        </p>
      </section>
      <section className="panel">
        <h2>Credits</h2>
        <ul>
          <li>All diagrams are original drawings made for this site. They are stylized and not to scale.</li>
          <li>
            Spaced repetition uses the FSRS algorithm via <a href="https://github.com/open-spaced-repetition/ts-fsrs">ts-fsrs</a> (MIT).
          </li>
          <li>
            Drag-and-drop by <a href="https://dndkit.com">dnd kit</a> (MIT). Built with React, React Router, Vite and Zod (MIT).
          </li>
          <li>Diagram colors are based on the Okabe-Ito colorblind-safe palette.</li>
        </ul>
      </section>
      <section className="panel">
        <h2>Privacy</h2>
        <p>
          There are no accounts, no tracking and no server. Your progress is saved in this browser's local storage. Use{' '}
          <Link to="/progress">Export</Link> to keep a copy or move it to another device.
        </p>
      </section>
    </div>
  );
}
