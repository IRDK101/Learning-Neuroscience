/**
 * Content schema. Every YAML file under content/ is validated against these
 * shapes at build time (npm run validate). See CONTENT_GUIDE.md.
 */
import { z } from 'zod';

export const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const Id = z.string().regex(ID_RE, 'IDs are kebab-case: lowercase letters, digits and single hyphens');
export const CorrectionId = z.string().regex(/^C-\d{3}$/, 'Correction IDs look like C-022');
export const FlagId = z.string().regex(/^F-\d{2}$/, 'Flag IDs look like F-07');

export const Source = z.enum(['notes', 'corrected', 'added']);
export type Source = z.infer<typeof Source>;

export const UNITS = ['foundations', 'senses-and-movement', 'higher-functions'] as const;
export const Unit = z.enum(UNITS);

/** Color families for diagrams. One per anatomical system. */
export const SYSTEMS = [
  'cortex', 'frontal', 'parietal', 'temporal', 'occipital', 'insula', 'limbic', 'basal-ganglia',
  'diencephalon', 'brainstem', 'cerebellum', 'white-matter', 'ventricles', 'spinal-cord',
  'cellular', 'body', 'eye', 'ear', 'vascular', 'meninges', 'bone', 'nerve',
] as const;
export const System = z.enum(SYSTEMS);

/** A single statement with provenance. Plain strings are shorthand for source: notes. */
export const Fact = z.union([
  z.string().transform((text) => ({ text, source: 'notes' as const, corrections: [] as string[], flags: [] as string[] })),
  z.object({
    text: z.string().min(1),
    source: Source.default('notes'),
    corrections: z.array(CorrectionId).default([]),
    flags: z.array(FlagId).default([]),
  }).strict(),
]);
export type Fact = z.infer<typeof Fact>;

const base = {
  id: Id,
  name: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  /** One beginner-friendly sentence. Shown in hover definitions everywhere. */
  short: z.string().min(1),
  /** Optional longer explanation (Markdown). */
  body: z.string().optional(),
  topics: z.array(Id).default([]),
  source: Source.default('notes'),
  corrections: z.array(CorrectionId).default([]),
  flags: z.array(FlagId).default([]),
  /** Set false to stop auto-generated cards/questions for this entity. */
  generate: z.boolean().default(true),
};

export const Connection = z.object({
  to: Id,
  dir: z.enum(['in', 'out', 'both']).default('both'),
  note: z.string().optional(),
}).strict();

export const Region = z.object({
  ...base,
  type: z.literal('region'),
  kind: z.enum(['area', 'nucleus', 'tract', 'ventricle', 'cellular', 'body', 'division', 'landmark', 'vessel', 'layer']).default('area'),
  parent: Id.optional(),
  system: System,
  location: z.string().optional(),
  functions: z.array(Fact).default([]),
  connections: z.array(Connection).default([]),
  cases: z.array(Id).default([]),
  mesh: z.string().nullable().optional(),
}).strict();

export const Molecule = z.object({
  ...base,
  type: z.literal('molecule'),
  kind: z.enum(['enzyme', 'precursor', 'receptor', 'transporter', 'channel', 'protein', 'ion', 'hormone', 'other']),
  parent: Id.optional(),
  functions: z.array(Fact).default([]),
}).strict();

export const Neurotransmitter = z.object({
  ...base,
  type: z.literal('neurotransmitter'),
  class: z.enum(['amino-acid', 'amine', 'peptide', 'gas', 'other']),
  subclass: z.string().optional(),
  precursors: z.array(Id).default([]),
  synthesis: Id.optional(),
  rateLimiting: Fact.optional(),
  sources: z.array(z.object({
    nucleus: Id,
    targets: z.array(Id).default([]),
    name: z.string().optional(),
    note: z.string().optional(),
  }).strict()).default([]),
  functions: z.array(Fact).default([]),
  deactivation: z.array(Fact).default([]),
  deactivationBy: z.array(Id).default([]),
  disorders: z.array(Id).default([]),
}).strict();

export const DRUG_ACTIONS = [
  'agonist', 'antagonist', 'reuptake-inhibitor', 'enzyme-inhibitor', 'releaser',
  'channel-blocker', 'allosteric-modulator', 'precursor', 'other',
] as const;

export const Drug = z.object({
  ...base,
  type: z.literal('drug'),
  actsOn: z.array(Id).min(1),
  target: Id.optional(),
  action: z.enum(DRUG_ACTIONS),
  effect: z.enum(['increases', 'decreases', 'mixed']),
  mechanism: z.string().min(1),
  uses: z.array(Fact).default([]),
}).strict();

export const PathwayStep = z.object({
  label: z.string().min(1),
  ref: Id.optional(),
  /** What carries you INTO this step (enzyme, tract…). Entity id. */
  via: Id.optional(),
  note: z.string().optional(),
  source: Source.default('notes'),
  corrections: z.array(CorrectionId).default([]),
}).strict();

export const Pathway = z.object({
  ...base,
  type: z.literal('pathway'),
  kind: z.enum(['anatomical', 'synthesis', 'circuit', 'projection', 'signaling', 'sequence']),
  steps: z.array(PathwayStep).min(3, 'A pathway needs at least 3 steps'),
  diagrams: z.array(Id).default([]),
  /** Include in the Pathway Builder game. */
  game: z.boolean().default(true),
}).strict();

export const Case = z.object({
  ...base,
  type: z.literal('case'),
  kind: z.enum(['patient', 'syndrome', 'disorder']),
  damage: z.object({
    regions: z.array(Id).default([]),
    cause: z.string().optional(),
  }).strict().default({ regions: [] }),
  deficits: z.array(Fact).default([]),
  spared: z.array(Fact).default([]),
  treatments: z.array(Fact).default([]),
  teaches: z.string().optional(),
}).strict();

export const Concept = z.object({
  ...base,
  type: z.literal('concept'),
  points: z.array(Fact).default([]),
  related: z.array(Id).default([]),
  regions: z.array(Id).default([]),
}).strict();

export const Experiment = z.object({
  ...base,
  type: z.literal('experiment'),
  setup: z.string().min(1),
  findings: z.array(Fact).min(1),
  shows: z.string().min(1),
  supports: z.array(Id).default([]),
  people: z.array(Id).default([]),
}).strict();

export const Person = z.object({
  ...base,
  type: z.literal('person'),
  years: z.string().optional(),
  contributions: z.array(Fact).default([]),
}).strict();

export const Term = z.object({
  ...base,
  type: z.literal('term'),
}).strict();

export const Entity = z.discriminatedUnion('type', [
  Region, Molecule, Neurotransmitter, Drug, Pathway, Case, Concept, Experiment, Person, Term,
]);
export type EntityIn = z.input<typeof Entity>;
export type Entity = z.infer<typeof Entity>;
export type EntityType = Entity['type'];
export type Region = z.infer<typeof Region>;
export type Molecule = z.infer<typeof Molecule>;
export type Neurotransmitter = z.infer<typeof Neurotransmitter>;
export type Drug = z.infer<typeof Drug>;
export type Pathway = z.infer<typeof Pathway>;
export type Case = z.infer<typeof Case>;
export type Concept = z.infer<typeof Concept>;
export type Experiment = z.infer<typeof Experiment>;
export type Person = z.infer<typeof Person>;
export type Term = z.infer<typeof Term>;

export const ENTITY_TYPES = [
  'region', 'molecule', 'neurotransmitter', 'drug', 'pathway', 'case', 'concept', 'experiment', 'person', 'term',
] as const satisfies readonly EntityType[];

// ---------------------------------------------------------------- cards & questions

export const Tags = z.object({
  topic: Id.optional(),
  unit: Unit.optional(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
}).strict();

const cardBase = {
  id: z.string().regex(/^c-[a-z0-9-]+$/, 'Hand-written card IDs start with c-'),
  refs: z.array(Id).default([]),
  tags: Tags.default({ difficulty: 2 }),
  source: Source.default('notes'),
  corrections: z.array(CorrectionId).default([]),
};

export const CardIn = z.discriminatedUnion('kind', [
  z.object({ ...cardBase, kind: z.literal('basic'), front: z.string().min(1), back: z.string().min(1) }).strict(),
  z.object({ ...cardBase, kind: z.literal('reverse'), front: z.string().min(1), back: z.string().min(1) }).strict(),
  z.object({
    ...cardBase,
    kind: z.literal('occlusion'),
    diagram: Id,
    target: Id,
    layer: z.string().optional(),
    front: z.string().optional(),
    back: z.string().optional(),
  }).strict(),
]);
export type CardIn = z.infer<typeof CardIn>;

const qBase = {
  id: z.string().regex(/^q-[a-z0-9-]+$/, 'Hand-written question IDs start with q-'),
  stem: z.string().min(1),
  explain: z.string().optional(),
  refs: z.array(Id).default([]),
  /** Lesson anchor for "review this": <topic>/<lesson-slug>#<heading-anchor> */
  lesson: z.string().regex(/^[a-z0-9-]+\/[a-z0-9-]+(#[a-z0-9-]+)?$/).optional(),
  tags: Tags.default({ difficulty: 2 }),
  source: Source.default('notes'),
  corrections: z.array(CorrectionId).default([]),
};

export const QuestionIn = z.discriminatedUnion('kind', [
  z.object({
    ...qBase,
    kind: z.literal('mcq'),
    answer: z.string().min(1),
    distractors: z.array(z.object({ text: z.string().min(1), why: z.string().optional() }).strict()).min(2).max(5),
  }).strict(),
  z.object({
    ...qBase,
    kind: z.literal('case'),
    /** Entity id of the correct answer. Distractors default to same-type entities from the same topic. */
    answer: Id,
    distractors: z.array(Id).optional(),
  }).strict(),
]);
export type QuestionIn = z.infer<typeof QuestionIn>;

// ---------------------------------------------------------------- structure files

export const UnitDef = z.object({
  id: Unit,
  name: z.string(),
  subtitle: z.string(),
  order: z.number().int(),
}).strict();

export const TopicDef = z.object({
  id: Id,
  name: z.string(),
  unit: Unit,
  order: z.number().int(),
  summary: z.string(),
  status: z.enum(['ready', 'planned']).default('planned'),
}).strict();

export const DiagramDef = z.object({
  id: Id,
  title: z.string(),
  svg: z.string().regex(/\.svg$/),
  description: z.string(),
  topics: z.array(Id).default([]),
  /** Optional layers (<g data-layer="…">) that can be toggled. */
  layers: z.array(z.object({ id: Id, name: z.string(), color: z.string().optional() }).strict()).default([]),
  /** Layers shown when the diagram opens. */
  defaultLayers: z.array(Id).default([]),
  /** Fade the base anatomy so overlay layers stand out. */
  overlay: z.boolean().default(false),
  /** Generate image-occlusion cards and Find-the-region rounds from this diagram. */
  quiz: z.boolean().default(true),
}).strict();

export const LessonFront = z.object({
  title: z.string(),
  summary: z.string(),
  minutes: z.number().int().positive().default(6),
}).strict();
