/** Runtime access to the compiled content bundle. */
import raw from 'virtual:content';
import type { Card, ContentBundle, Diagram, Entity, Lesson, Question, Topic, Unit, UnitId } from './types';

const bundle = raw as ContentBundle;

export const content = bundle;

const topicMap = new Map(bundle.topics.map((t) => [t.id, t]));
const lessonMap = new Map(bundle.lessons.map((l) => [l.id, l]));
const diagramMap = new Map(bundle.diagrams.map((d) => [d.id, d]));
const questionMap = new Map(bundle.questions.map((q) => [q.id, q]));
const cardMap = new Map(bundle.cards.map((c) => [c.id, c]));

export const entity = (id: string | undefined): Entity | undefined => (id ? bundle.entities[id] : undefined);
export const topic = (id: string | undefined): Topic | undefined => (id ? topicMap.get(id) : undefined);
export const lesson = (id: string | undefined): Lesson | undefined => (id ? lessonMap.get(id) : undefined);
export const diagram = (id: string | undefined): Diagram | undefined => (id ? diagramMap.get(id) : undefined);
export const question = (id: string | undefined): Question | undefined => (id ? questionMap.get(id) : undefined);
export const card = (id: string | undefined): Card | undefined => (id ? cardMap.get(id) : undefined);
export const unit = (id: UnitId): Unit | undefined => bundle.units.find((u) => u.id === id);

export const readyTopics = bundle.topics.filter((t) => t.status === 'ready');

export const ENTITY_TYPE_LABEL: Record<Entity['type'], string> = {
  region: 'Structure',
  molecule: 'Molecule',
  neurotransmitter: 'Neurotransmitter',
  drug: 'Drug',
  pathway: 'Pathway',
  case: 'Case / disorder',
  concept: 'Concept',
  experiment: 'Experiment',
  person: 'Person',
  term: 'Term',
};

/** Walk up `parent` links until we find something with a hotspot on the diagram. */
export function hotspotFor(id: string, d: Diagram): string | undefined {
  let cur: Entity | undefined = entity(id);
  const seen = new Set<string>();
  while (cur && !seen.has(cur.id)) {
    if (d.refs.includes(cur.id)) return cur.id;
    seen.add(cur.id);
    cur = 'parent' in cur && cur.parent ? entity(cur.parent) : undefined;
  }
  return undefined;
}

/** Everything directly connected to an entity, in either direction. */
export function connectedIds(id: string): string[] {
  const e = entity(id);
  if (!e) return [];
  const out = new Set<string>(bundle.backlinks[id] ?? []);
  const add = (x?: string) => x && x !== id && bundle.entities[x] && out.add(x);
  switch (e.type) {
    case 'region':
      add(e.parent);
      e.connections.forEach((c) => add(c.to));
      e.cases.forEach(add);
      break;
    case 'molecule':
      add(e.parent);
      break;
    case 'neurotransmitter':
      e.precursors.forEach(add);
      e.sources.forEach((s) => {
        add(s.nucleus);
        s.targets.forEach(add);
      });
      e.deactivationBy.forEach(add);
      e.disorders.forEach(add);
      break;
    case 'drug':
      e.actsOn.forEach(add);
      add(e.target);
      break;
    case 'pathway':
      e.steps.forEach((s) => {
        add(s.ref);
        add(s.via);
      });
      break;
    case 'case':
      e.damage.regions.forEach(add);
      break;
    case 'concept':
      e.related.forEach(add);
      e.regions.forEach(add);
      break;
    case 'experiment':
      e.supports.forEach(add);
      e.people.forEach(add);
      break;
  }
  // Neurotransmitters released by a nucleus count as connected to it.
  for (const nt of Object.values(bundle.entities)) {
    if (nt.type === 'neurotransmitter' && nt.sources.some((s) => s.nucleus === id || s.targets.includes(id))) out.add(nt.id);
  }
  return [...out];
}

/** NT layer id used on the overlay diagram for a neurotransmitter, if any. */
export const NT_LAYER: Record<string, string> = {
  acetylcholine: 'ach',
  dopamine: 'da',
  norepinephrine: 'ne',
  serotonin: 'serotonin',
};

export function cardsFor(id: string): Card[] {
  return bundle.cards.filter((c) => c.refs.includes(id) || c.target === id);
}
export function questionsFor(id: string): Question[] {
  return bundle.questions.filter((q) => q.refs.includes(id));
}
export function lessonsMentioning(id: string): Lesson[] {
  return bundle.lessons.filter((l) => l.mentions.includes(id));
}
