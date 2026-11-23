/** Shape of the compiled content bundle (virtual:content). Produced by scripts/lib/build.ts. */
import type { Entity, EntityType, Pathway, Source } from './schema';

export type { Entity, EntityType, Pathway, Source };
export type UnitId = 'exam1' | 'exam2' | 'exam3';

export interface Unit {
  id: UnitId;
  name: string;
  subtitle: string;
  order: number;
}

export interface Topic {
  id: string;
  name: string;
  unit: UnitId;
  order: number;
  summary: string;
  status: 'ready' | 'planned';
  lessons: string[];
}

export type LessonBlock =
  | { type: 'html'; html: string }
  | { type: 'heading'; level: 2 | 3; text: string; anchor: string }
  | { type: 'diagram'; diagram: string; highlight: string[]; layers: string[]; caption?: string }
  | { type: 'focus'; highlight: string[]; layers?: string[] }
  | { type: 'check'; question: string }
  | { type: 'aside'; kind: 'added' | 'note' | 'tip'; html: string }
  | { type: 'pathway'; pathway: string };

export interface Lesson {
  id: string; // topic/slug
  topic: string;
  slug: string;
  order: number;
  title: string;
  summary: string;
  minutes: number;
  blocks: LessonBlock[];
  anchors: string[];
  mentions: string[];
}

export interface Diagram {
  id: string;
  title: string;
  description: string;
  topics: string[];
  layers: { id: string; name: string; color?: string }[];
  defaultLayers: string[];
  overlay: boolean;
  quiz: boolean;
  svg: string;
  /** entity ids with a clickable hotspot (data-ref) */
  refs: string[];
  /** ids per layer; base hotspots are under "" */
  layerRefs: Record<string, string[]>;
}

export type CardKind = 'basic' | 'reverse' | 'occlusion';

export interface Card {
  id: string;
  kind: CardKind;
  front: string;
  back: string;
  diagram?: string;
  target?: string;
  layers?: string[];
  refs: string[];
  topic: string;
  unit: UnitId;
  difficulty: 1 | 2 | 3;
  source: Source;
  corrections: string[];
  generated: boolean;
}

export interface QuestionOption {
  text: string;
  correct: boolean;
  why?: string;
  ref?: string;
}

export interface Question {
  id: string;
  kind: 'mcq' | 'case';
  stem: string;
  options: QuestionOption[];
  explain?: string;
  refs: string[];
  lesson?: string;
  topic: string;
  unit: UnitId;
  difficulty: 1 | 2 | 3;
  source: Source;
  corrections: string[];
  generated: boolean;
  /** For questions that point at a diagram region */
  diagram?: string;
}

export interface Correction {
  id: string;
  where: string;
  notes: string;
  fixed: string;
  why: string;
}

export interface Flag {
  id: string;
  where: string;
  notes: string;
  why: string;
}

export interface ContentBundle {
  units: Unit[];
  topics: Topic[];
  entities: Record<string, Entity>;
  lessons: Lesson[];
  diagrams: Diagram[];
  cards: Card[];
  questions: Question[];
  corrections: Record<string, Correction>;
  flags: Record<string, Flag>;
  /** entity id -> ids of entities that reference it */
  backlinks: Record<string, string[]>;
  /** entity id -> diagram ids where it has a hotspot */
  diagramsFor: Record<string, string[]>;
  /** [surface form, entity id, caseSensitive] used for hover terms */
  termIndex: [string, string, boolean][];
}
