import { Link } from 'react-router';

export function AboutPage() {
  return (
    <div className="stack" style={{ maxWidth: 760 }}>
      <div className="page-head">
        <h1>About NeuroMap</h1>
      </div>
      <section className="panel">
        <p>
          Interactive diagrams, short lessons, spaced-repetition flashcards and games for learning neuroscience. Diagrams are original drawings,
          stylized and not to scale.
        </p>
      </section>
      <section className="panel">
        <h2>Privacy</h2>
        <p>
          No accounts, tracking or server. Progress stays in this browser; <Link to="/progress">export it</Link> to move it to another device.
        </p>
      </section>
      <section className="panel">
        <h2>Credits</h2>
        <ul>
          <li>
            Scheduling: FSRS via <a href="https://github.com/open-spaced-repetition/ts-fsrs">ts-fsrs</a> (MIT).
          </li>
          <li>
            <a href="https://dndkit.com">dnd kit</a>, React, React Router, Vite and Zod (MIT).
          </li>
          <li>Diagram colors are based on the Okabe-Ito colorblind-safe palette.</li>
        </ul>
      </section>
    </div>
  );
}
