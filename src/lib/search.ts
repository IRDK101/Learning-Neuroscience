/** Ranked search over entities, lessons and diagrams (used by the site-wide search and the map index). */
import { content, ENTITY_TYPE_LABEL } from '../content';

export interface Hit {
  key: string;
  kind: 'entity' | 'lesson' | 'diagram';
  title: string;
  detail: string;
  tag: string;
  to: string;
  score: number;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, "'")
    .replace(/[-_/]+/g, ' ');

/** 0 = no match. Higher is better: exact > prefix > word prefix > substring. */
function scoreText(q: string, text: string, weight: number): number {
  const t = norm(text);
  if (!t) return 0;
  if (t === q) return 100 * weight;
  if (t.startsWith(q)) return 70 * weight;
  if (new RegExp(`(^|[\\s(/-])${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(t)) return 50 * weight;
  if (t.includes(q)) return 25 * weight;
  // Multi-word queries: every word must start a word in the text ("brown seq" → Brown-Séquard).
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length > 1 && words.every((w) => t.split(/[\s(]+/).some((tw) => tw.startsWith(w)))) return 40 * weight;
  return 0;
}

function entityLink(id: string): string {
  const d = content.diagramsFor[id]?.[0];
  return d ? `/map/${d}?focus=${id}` : `/entity/${id}`;
}

export function search(query: string, limit = 12): Hit[] {
  const q = norm(query.trim());
  if (q.length < 1) return [];
  const hits: Hit[] = [];
  for (const e of Object.values(content.entities)) {
    const s = Math.max(
      scoreText(q, e.name, 1),
      ...e.aliases.map((a) => scoreText(q, a, 0.95)),
      q.length >= 3 ? scoreText(q, e.short, 0.3) : 0,
    );
    if (s > 0) {
      hits.push({ key: `e:${e.id}`, kind: 'entity', title: e.name, detail: e.short, tag: ENTITY_TYPE_LABEL[e.type], to: entityLink(e.id), score: s });
    }
  }
  for (const l of content.lessons) {
    const s = Math.max(scoreText(q, l.title, 0.9), q.length >= 3 ? scoreText(q, l.summary, 0.3) : 0);
    if (s > 0) hits.push({ key: `l:${l.id}`, kind: 'lesson', title: l.title, detail: l.summary, tag: 'Lesson', to: `/learn/${l.topic}/${l.slug}`, score: s });
  }
  for (const d of content.diagrams) {
    const s = Math.max(scoreText(q, d.title, 0.85), q.length >= 3 ? scoreText(q, d.description, 0.25) : 0);
    if (s > 0) hits.push({ key: `d:${d.id}`, kind: 'diagram', title: d.title, detail: d.description, tag: 'Diagram', to: `/map/${d.id}`, score: s });
  }
  return hits.sort((a, b) => b.score - a.score || a.title.length - b.title.length).slice(0, limit);
}
