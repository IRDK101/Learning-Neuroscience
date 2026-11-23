/**
 * Deck / quiz filters, encoded in the URL so any configuration is a shareable deep link:
 *   #/cards?topic=nt-systems&type=neurotransmitter
 *   #/quiz?unit=exam1&n=15
 */
import type { Card, ContentBundle, EntityType, Question } from '../content/types';

export interface Filter {
  topics: string[];
  units: string[];
  types: EntityType[];
  kinds: string[];
  ref?: string;
  mistakes?: boolean;
  n?: number;
}

const list = (v: string | null) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);

export function parseFilter(params: URLSearchParams): Filter {
  const n = Number(params.get('n'));
  return {
    topics: list(params.get('topic')),
    units: list(params.get('unit')),
    types: list(params.get('type')) as EntityType[],
    kinds: list(params.get('kind')),
    ref: params.get('ref') ?? undefined,
    mistakes: params.get('mistakes') === '1' || undefined,
    n: Number.isFinite(n) && n > 0 ? Math.min(50, Math.round(n)) : undefined,
  };
}

export function filterToQuery(f: Filter): string {
  const p = new URLSearchParams();
  if (f.topics.length) p.set('topic', f.topics.join(','));
  if (f.units.length) p.set('unit', f.units.join(','));
  if (f.types.length) p.set('type', f.types.join(','));
  if (f.kinds.length) p.set('kind', f.kinds.join(','));
  if (f.ref) p.set('ref', f.ref);
  if (f.mistakes) p.set('mistakes', '1');
  if (f.n) p.set('n', String(f.n));
  const s = p.toString();
  return s ? `?${s}` : '';
}

export function isEmptyFilter(f: Filter) {
  return !f.topics.length && !f.units.length && !f.types.length && !f.kinds.length && !f.ref && !f.mistakes;
}

function typeMatch(refs: string[], types: EntityType[], bundle: ContentBundle) {
  if (!types.length) return true;
  return refs.some((r) => {
    const t = bundle.entities[r]?.type;
    return !!t && types.includes(t);
  });
}

export function matchCard(c: Card, f: Filter, bundle: ContentBundle): boolean {
  if (f.topics.length && !f.topics.includes(c.topic)) return false;
  if (f.units.length && !f.units.includes(c.unit)) return false;
  if (f.kinds.length && !f.kinds.includes(c.kind)) return false;
  if (f.ref && !(c.refs.includes(f.ref) || c.target === f.ref)) return false;
  return typeMatch(c.target ? [c.target, ...c.refs] : c.refs, f.types, bundle);
}

export function matchQuestion(q: Question, f: Filter, bundle: ContentBundle, misses: Record<string, number> = {}): boolean {
  if (f.topics.length && !f.topics.includes(q.topic)) return false;
  if (f.units.length && !f.units.includes(q.unit)) return false;
  if (f.ref && !q.refs.includes(f.ref) && !q.options.some((o) => o.correct && o.ref === f.ref)) return false;
  if (f.mistakes && !misses[q.id]) return false;
  return typeMatch(q.refs, f.types, bundle);
}

export function describeFilter(f: Filter, bundle: ContentBundle): string {
  const parts: string[] = [];
  if (f.ref) parts.push(bundle.entities[f.ref]?.name ?? f.ref);
  if (f.topics.length) parts.push(f.topics.map((t) => bundle.topics.find((x) => x.id === t)?.name ?? t).join(', '));
  if (f.units.length) parts.push(f.units.map((u) => u.replace('exam', 'Exam ')).join(', '));
  if (f.types.length) parts.push(f.types.map((t) => `${t}s`).join(', '));
  if (f.kinds.length) parts.push(f.kinds.join(', ') + ' cards');
  if (f.mistakes) parts.push('my mistakes');
  return parts.length ? parts.join(' · ') : 'Everything';
}
