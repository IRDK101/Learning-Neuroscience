import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { content } from '../../content';

export function CorrectionsPage() {
  const { hash } = useLocation();
  useEffect(() => {
    const id = hash.replace('#', '');
    if (id) document.getElementById(id)?.scrollIntoView({ block: 'center' });
  }, [hash]);
  const corrections = Object.values(content.corrections);
  const flags = Object.values(content.flags);
  return (
    <div className="stack" style={{ maxWidth: 860 }}>
      <div className="page-head">
        <div className="eyebrow">Accuracy</div>
        <h1>Corrections to the notes</h1>
        <p>
          The site follows the course notes but fixes factual errors. Each fix is listed here with the original wording. <b>Flags</b> are
          debatable points that were kept as written. If your professor taught it differently, answer the exam their way.
        </p>
      </div>
      <section className="panel">
        <h2>Corrections ({corrections.length})</h2>
        {corrections.map((c) => (
          <article key={c.id} id={c.id} style={{ borderTop: '1px solid var(--line)', padding: '0.8rem 0', scrollMarginTop: 80 }}>
            <div className="small muted">{c.id}</div>
            <h3 style={{ marginBottom: '0.3rem' }}>{c.where}</h3>
            <p className="small" style={{ margin: '0 0 0.3rem' }}>
              <b>Notes:</b> <i>{c.notes}</i>
            </p>
            <p className="small" style={{ margin: '0 0 0.3rem', whiteSpace: 'pre-line' }}>
              <b>Corrected:</b> {c.fixed}
            </p>
            <p className="small muted" style={{ margin: 0 }}>
              <b>Why:</b> {c.why}
            </p>
          </article>
        ))}
      </section>
      <section className="panel">
        <h2>Flags ({flags.length})</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Where</th>
                <th>Notes say</th>
                <th>Why it's flagged</th>
              </tr>
            </thead>
            <tbody>
              {flags.map((f) => (
                <tr key={f.id} id={f.id}>
                  <td>{f.id}</td>
                  <td>{f.where}</td>
                  <td>{f.notes}</td>
                  <td>{f.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
