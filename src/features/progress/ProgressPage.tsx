import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { content, readyTopics } from '../../content';
import { dueCount } from '../../lib/session';
import { exportProgress, importProgress, mastery, resetProgress, setSetting, streak, today, useProgress } from '../../progress/store';
import { Icon, Meter } from '../../ui/bits';

export function ProgressPage() {
  const p = useProgress();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const download = () => {
    const blob = new Blob([exportProgress()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neuromap-progress-${today()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const res = importProgress(await f.text());
    setMsg(res.ok ? { ok: true, text: `Imported and merged progress for ${res.cards} cards.` } : { ok: false, text: res.error });
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="stack">
      <div className="page-head">
        <div className="eyebrow">Your progress</div>
        <h1>Progress & settings</h1>
        <p>Everything is stored in this browser only. Use export/import to move it to another device.</p>
      </div>

      <section className="kpis">
        <div className="panel stat">
          <b>{dueCount(content.cards, p.cards)}</b>
          <span>cards due</span>
        </div>
        <div className="panel stat">
          <b>{p.reviews}</b>
          <span>reviews done</span>
        </div>
        <div className="panel stat">
          <b>{streak(p.days)}</b>
          <span>day streak</span>
        </div>
      </section>

      <section className="panel">
        <h2>Mastery by topic</h2>
        {readyTopics.map((t) => {
          const m = mastery(p, content.cards.filter((c) => c.topic === t.id).map((c) => c.id), t.id);
          const q = p.quiz[t.id];
          return (
            <div key={t.id} style={{ marginBottom: '0.8rem' }}>
              <div className="row">
                <Link to={`/learn/${t.id}`}>{t.name}</Link>
                <span className="spacer" />
                <span className="small muted">
                  {Math.round(m * 100)}%{q ? ` · quiz ${q.correct}/${q.answered}` : ''}
                </span>
              </div>
              <Meter value={m} label={`${t.name} mastery`} />
            </div>
          );
        })}
        <p className="tiny muted">Mastery blends how well your cards are learned (FSRS stability) with your recent quiz accuracy.</p>
      </section>

      <section className="panel stack">
        <h2>Move progress between devices</h2>
        <div className="row">
          <button type="button" className="btn primary" onClick={download}>
            <Icon name="share" /> Export progress (.json)
          </button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            Import progress…
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
        <p className="small muted" style={{ margin: 0 }}>
          Importing merges: for each card the most recent review wins, and streak days and completed lessons are combined.
        </p>
        {msg && <div className={`notice ${msg.ok ? 'ok' : 'bad'}`}>{msg.text}</div>}
      </section>

      <section className="panel stack">
        <h2>Settings</h2>
        <label className="field" style={{ maxWidth: 260 }}>
          Theme
          <select value={p.settings.theme} onChange={(e) => setSetting('theme', e.target.value as 'system' | 'light' | 'dark')}>
            <option value="system">Match my device</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label className="field" style={{ maxWidth: 260 }}>
          New flashcards per session
          <input type="number" min={0} max={100} value={p.settings.newPerSession} onChange={(e) => setSetting('newPerSession', Math.max(0, Math.min(100, Number(e.target.value) || 0)))} />
        </label>
        <label className="row small">
          <input type="checkbox" checked={p.settings.patterns} onChange={(e) => setSetting('patterns', e.target.checked)} />
          Add textures to brain systems on diagrams (helps if colors are hard to tell apart)
        </label>
        <div>
          <button
            type="button"
            className="btn small"
            onClick={() => {
              if (window.confirm('Erase all progress on this device? Export first if you want a backup.')) resetProgress();
            }}
          >
            Reset all progress
          </button>
        </div>
      </section>
    </div>
  );
}
