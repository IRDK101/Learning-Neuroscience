import { useState } from 'react';
import { entity } from '../content';
import type { Pathway } from '../content/types';
import { EntityLink, Icon, SourceBadges } from './bits';

/** Shortest readable name for an arrow label: an abbreviation like "TH" if there is one. */
export function shortName(id: string): string {
  const e = entity(id);
  if (!e) return id;
  if (e.name.length <= 12) return e.name;
  const abbrev = e.aliases.filter((a) => a.length <= 6).sort((a, b) => a.length - b.length)[0];
  return abbrev ?? e.name;
}

/** Step-by-step pathway: tap a step (or press Play) to walk through it. */
export function PathwayView({ id, onStep }: { id: string; onStep?: (ref: string | undefined, index: number) => void }) {
  const p = entity(id) as Pathway | undefined;
  const [active, setActive] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  if (!p || p.type !== 'pathway') return null;

  const go = (i: number) => {
    setActive(i);
    onStep?.(p.steps[i]?.ref, i);
  };
  const play = () => {
    if (playing) return;
    setPlaying(true);
    let i = 0;
    go(0);
    const timer = window.setInterval(() => {
      i++;
      if (i >= p.steps.length) {
        window.clearInterval(timer);
        setPlaying(false);
        return;
      }
      go(i);
    }, 1400);
  };
  const step = active !== null ? p.steps[active] : null;

  return (
    <div className="pathway-wrap">
      <div className="row" style={{ marginBottom: '0.3rem' }}>
        <b>
          <EntityLink id={p.id} />
        </b>
        <span className="spacer" />
        <button type="button" className="btn small" onClick={play} disabled={playing}>
          <Icon name="play" size={14} /> {playing ? 'Playing…' : 'Play steps'}
        </button>
      </div>
      <ol className="pathway" aria-label={`${p.name}, ${p.steps.length} steps`}>
        {p.steps.map((s, i) => (
          <li key={i} className="pathway-step">
            {i > 0 && (
              <span className="pathway-arrow" aria-hidden="true">
                <b>→</b>
                {s.via && <span>{shortName(s.via)}</span>}
              </span>
            )}
            <button type="button" className={`pathway-node${active === i ? ' active' : ''}`} onClick={() => go(i)} aria-current={active === i ? 'step' : undefined}>
              {s.label}
            </button>
          </li>
        ))}
      </ol>
      {step && (
        <div className="pathway-note" aria-live="polite">
          <b>
            Step {active! + 1}: {step.label}
          </b>
          {step.via && (
            <>
              {' '}
              (via <EntityLink id={step.via} />)
            </>
          )}
          <SourceBadges corrections={step.corrections} source={step.source} />
          {step.note && <div>{step.note}</div>}
        </div>
      )}
    </div>
  );
}
