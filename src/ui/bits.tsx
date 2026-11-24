import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { Fact } from '../content/schema';
import { content, entity, ENTITY_TYPE_LABEL } from '../content';
import { copyLink } from './toast';

export function UnitTag({ unit }: { unit: string }) {
  const u = content.units.find((x) => x.id === unit);
  return <span className={`tag unit-${unit}`}>{u ? u.name : unit}</span>;
}

export function TypeTag({ id }: { id: string }) {
  const e = entity(id);
  return e ? <span className="tag">{ENTITY_TYPE_LABEL[e.type]}</span> : null;
}

/**
 * Provenance markers. Corrections and flags stay in the content (and on the Common misconceptions page),
 * but are not shown inline: the site presents the corrected material on its own terms.
 */
export function SourceBadges(_props: { corrections?: string[]; flags?: string[]; source?: string }) {
  return null;
}

export function FactText({ fact }: { fact: Fact }) {
  return (
    <>
      {fact.text}
      <SourceBadges corrections={fact.corrections} flags={fact.flags} source={fact.source} />
    </>
  );
}

export function EntityLink({ id, children }: { id: string; children?: ReactNode }) {
  const e = entity(id);
  if (!e) return <>{children ?? id}</>;
  return (
    <Link to={`/entity/${id}`} className="ref" data-ref={id}>
      {children ?? e.name}
    </Link>
  );
}

export function Meter({ value, label }: { value: number; label?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={label}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function CopyLinkButton({ path, label = 'Copy link' }: { path: string; label?: string }) {
  return (
    <button type="button" className="btn small" onClick={() => copyLink(path)}>
      <Icon name="link" /> {label}
    </button>
  );
}

const ICONS: Record<string, string> = {
  link: 'M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5',
  home: 'M3 11l9-8 9 8M5 10v10h14V10',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 5v16',
  map: 'M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
  cards: 'M7 4h12v14H7zM4 7v13h12',
  play: 'M6 4l14 8-14 8z',
  sun: 'M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z',
  auto: 'M12 3a9 9 0 1 0 0 18V3z M12 3a9 9 0 0 1 0 18',
  tag: 'M3 12V3h9l9 9-9 9z M7.5 7.5h.01',
  zoom: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5M11 8v6M8 11h6',
  grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
  up: 'M6 15l6-6 6 6',
  down: 'M6 9l6 6 6-6',
  check: 'M5 12l5 5 9-10',
  x: 'M6 6l12 12M18 6L6 18',
  share: 'M4 12v8h16v-8M12 3v13M7 8l5-5 5 5',
  spark: 'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z',
  graph: 'M5 12a2 2 0 1 0 0 .01M12 5a2 2 0 1 0 0 .01M19 12a2 2 0 1 0 0 .01M12 19a2 2 0 1 0 0 .01M7 11l3-4M14 7l3 4M17 13l-3 4M10 17l-3-4',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5',
  flame: 'M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 3-7 1 2 2 3 3 3 0-3-1-5 0-7z',
};

export function Icon({ name, size = 18 }: { name: keyof typeof ICONS | string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name] ?? ''} />
    </svg>
  );
}
