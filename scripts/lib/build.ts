/**
 * Content build: YAML + Markdown + SVG → one validated ContentBundle.
 * Used by the Vite plugin (virtual:content), `npm run validate`, and the tests.
 */
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { z } from 'zod';
import {
  CardIn, DiagramDef, Entity, QuestionIn, TopicDef, UnitDef,
  type EntityType, type Fact,
} from '../../src/content/schema';
import type { Card, ContentBundle, Diagram, Question, Topic } from '../../src/content/types';
import { parseCorrections } from './corrections';
import { compileLesson } from './lessons';
import { generate } from './generate';
import { scanSvg } from './svg';
import { ContentErrors, escapeRegExp, shuffled } from './util';

type CompiledLesson = NonNullable<ReturnType<typeof compileLesson>>;

export interface BuildResult {
  bundle: ContentBundle;
  errors: string[];
  warnings: string[];
  files: string[];
}

const rel = (root: string, p: string) => path.relative(root, p).split(path.sep).join('/');

function walk(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name), ext) : d.name.endsWith(ext) ? [path.join(dir, d.name)] : []))
    .sort();
}

function issues(err: z.ZodError): string {
  return err.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');
}

function readYamlList(file: string, root: string, errors: ContentErrors): unknown[] {
  try {
    const data = YAML.parse(fs.readFileSync(file, 'utf8'));
    if (data == null) return [];
    if (!Array.isArray(data)) {
      errors.add(rel(root, file), 'expected a YAML list (each item starts with "- ")');
      return [];
    }
    return data;
  } catch (e) {
    errors.add(rel(root, file), `YAML syntax error: ${(e as Error).message}`);
    return [];
  }
}

export function buildContent(root = process.cwd()): BuildResult {
  const errors = new ContentErrors();
  const contentDir = path.join(root, 'content');
  const files: string[] = [];
  const read = (p: string) => {
    files.push(p);
    return fs.readFileSync(p, 'utf8');
  };

  // ---------------------------------------------------------------- corrections
  const correctionsPath = path.join(root, 'CORRECTIONS.md');
  const { corrections, flags } = parseCorrections(fs.existsSync(correctionsPath) ? read(correctionsPath) : '');

  // ---------------------------------------------------------------- units & topics
  const units = readYamlList(path.join(contentDir, 'units.yaml'), root, errors).flatMap((u, i) => {
    const r = UnitDef.safeParse(u);
    if (!r.success) errors.add(`content/units.yaml[${i}]`, issues(r.error));
    return r.success ? [r.data] : [];
  });
  files.push(path.join(contentDir, 'units.yaml'), path.join(contentDir, 'topics.yaml'));
  const topicList: Topic[] = readYamlList(path.join(contentDir, 'topics.yaml'), root, errors).flatMap((t, i) => {
    const r = TopicDef.safeParse(t);
    if (!r.success) errors.add(`content/topics.yaml[${i}]`, issues(r.error));
    return r.success ? [{ ...r.data, lessons: [] as string[] }] : [];
  });
  const topics = Object.fromEntries(topicList.map((t) => [t.id, t]));
  for (const t of topicList) {
    if (topicList.filter((x) => x.id === t.id).length > 1) errors.add('content/topics.yaml', `duplicate topic id "${t.id}"`);
  }

  // ---------------------------------------------------------------- entities
  const entities: Record<string, Entity> = {};
  const entityFile: Record<string, string> = {};
  const entityFiles = [
    ...walk(path.join(contentDir, 'shared'), '.yaml'),
    ...walk(path.join(contentDir, 'topics'), '.yaml').filter((f) => f.endsWith(`${path.sep}entities.yaml`)),
  ];
  for (const file of entityFiles) {
    files.push(file);
    const r = rel(root, file);
    const folderTopic = r.match(/^content\/topics\/([^/]+)\//)?.[1];
    readYamlList(file, root, errors).forEach((raw, i) => {
      const id = (raw as { id?: string })?.id ?? `#${i}`;
      const parsed = Entity.safeParse(raw);
      if (!parsed.success) {
        errors.add(`${r} → ${id}`, issues(parsed.error));
        return;
      }
      const e = parsed.data;
      if (entities[e.id]) {
        errors.add(`${r} → ${e.id}`, `duplicate id (already defined in ${entityFile[e.id]})`);
        return;
      }
      if (folderTopic && !e.topics.includes(folderTopic)) e.topics.unshift(folderTopic);
      entities[e.id] = e;
      entityFile[e.id] = r;
    });
  }

  // ---------------------------------------------------------------- reference checks
  const where = (id: string) => `${entityFile[id]} → ${id}`;
  const expect = (from: string, field: string, id: string | undefined, types?: EntityType[]) => {
    if (!id) return;
    const target = entities[id];
    if (!target) errors.add(where(from), `${field}: unknown id "${id}"`);
    else if (types && !types.includes(target.type)) errors.add(where(from), `${field}: "${id}" is a ${target.type}, expected ${types.join(' or ')}`);
  };
  const checkFacts = (from: string, field: string, facts: Fact[] | undefined) => {
    facts?.forEach((f, i) => {
      f.corrections.forEach((c) => corrections[c] || errors.add(where(from), `${field}[${i}]: ${c} is not in CORRECTIONS.md`));
      f.flags.forEach((c) => flags[c] || errors.add(where(from), `${field}[${i}]: ${c} is not in CORRECTIONS.md`));
      if (f.source === 'corrected' && f.corrections.length === 0) errors.add(where(from), `${field}[${i}]: source is "corrected" but no corrections: [C-xxx] given`);
    });
  };

  for (const e of Object.values(entities)) {
    e.topics.forEach((t) => topics[t] || errors.add(where(e.id), `topics: unknown topic "${t}"`));
    e.corrections.forEach((c) => corrections[c] || errors.add(where(e.id), `corrections: ${c} is not in CORRECTIONS.md`));
    e.flags.forEach((c) => flags[c] || errors.add(where(e.id), `flags: ${c} is not in CORRECTIONS.md`));
    if (e.source === 'corrected' && e.corrections.length === 0) errors.add(where(e.id), 'source is "corrected" but no corrections: [C-xxx] given');
    switch (e.type) {
      case 'region':
        expect(e.id, 'parent', e.parent, ['region']);
        e.connections.forEach((c, i) => expect(e.id, `connections[${i}].to`, c.to, ['region']));
        e.cases.forEach((c) => expect(e.id, 'cases', c, ['case']));
        checkFacts(e.id, 'functions', e.functions);
        break;
      case 'molecule':
        expect(e.id, 'parent', e.parent, ['molecule']);
        checkFacts(e.id, 'functions', e.functions);
        break;
      case 'neurotransmitter':
        e.precursors.forEach((p) => expect(e.id, 'precursors', p, ['molecule', 'drug', 'neurotransmitter']));
        expect(e.id, 'synthesis', e.synthesis, ['pathway']);
        e.sources.forEach((s, i) => {
          expect(e.id, `sources[${i}].nucleus`, s.nucleus, ['region']);
          s.targets.forEach((t) => expect(e.id, `sources[${i}].targets`, t, ['region']));
        });
        e.deactivationBy.forEach((d) => expect(e.id, 'deactivationBy', d, ['molecule', 'region']));
        e.disorders.forEach((d) => expect(e.id, 'disorders', d, ['case']));
        checkFacts(e.id, 'functions', e.functions);
        checkFacts(e.id, 'deactivation', e.deactivation);
        if (e.rateLimiting) checkFacts(e.id, 'rateLimiting', [e.rateLimiting]);
        break;
      case 'drug':
        e.actsOn.forEach((a) => expect(e.id, 'actsOn', a, ['neurotransmitter', 'molecule']));
        expect(e.id, 'target', e.target, ['molecule', 'region']);
        checkFacts(e.id, 'uses', e.uses);
        break;
      case 'pathway':
        e.steps.forEach((s, i) => {
          expect(e.id, `steps[${i}].ref`, s.ref);
          expect(e.id, `steps[${i}].via`, s.via);
          s.corrections.forEach((c) => corrections[c] || errors.add(where(e.id), `steps[${i}]: ${c} is not in CORRECTIONS.md`));
          if (s.source === 'corrected' && !s.corrections.length) errors.add(where(e.id), `steps[${i}]: source "corrected" needs corrections: [C-xxx]`);
        });
        break;
      case 'case':
        e.damage.regions.forEach((r) => expect(e.id, 'damage.regions', r, ['region']));
        checkFacts(e.id, 'deficits', e.deficits);
        checkFacts(e.id, 'spared', e.spared);
        checkFacts(e.id, 'treatments', e.treatments);
        break;
      case 'concept':
        e.related.forEach((r) => expect(e.id, 'related', r));
        e.regions.forEach((r) => expect(e.id, 'regions', r, ['region']));
        checkFacts(e.id, 'points', e.points);
        break;
      case 'experiment':
        e.supports.forEach((r) => expect(e.id, 'supports', r));
        e.people.forEach((r) => expect(e.id, 'people', r, ['person']));
        checkFacts(e.id, 'findings', e.findings);
        break;
      case 'person':
        checkFacts(e.id, 'contributions', e.contributions);
        break;
    }
  }
  // Parent cycles
  for (const e of Object.values(entities)) {
    const seen = new Set<string>();
    let cur: Entity | undefined = e;
    while (cur && 'parent' in cur && cur.parent) {
      if (seen.has(cur.id)) {
        errors.add(where(e.id), 'parent chain loops back on itself');
        break;
      }
      seen.add(cur.id);
      cur = entities[cur.parent];
    }
  }

  // ---------------------------------------------------------------- diagrams
  const diagramDir = path.join(contentDir, 'diagrams');
  const diagrams: Diagram[] = [];
  readYamlList(path.join(diagramDir, 'diagrams.yaml'), root, errors).forEach((raw, i) => {
    const parsed = DiagramDef.safeParse(raw);
    const w = `content/diagrams/diagrams.yaml[${i}]`;
    if (!parsed.success) return errors.add(w, issues(parsed.error));
    const d = parsed.data;
    const svgPath = path.join(diagramDir, d.svg);
    if (!fs.existsSync(svgPath)) return errors.add(w, `svg file not found: content/diagrams/${d.svg}`);
    const svg = read(svgPath);
    const scan = scanSvg(svg);
    scan.problems.forEach((p) => errors.add(`content/diagrams/${d.svg}`, p));
    for (const [layer, refs] of Object.entries(scan.layerRefs)) {
      for (const ref of refs) {
        if (!entities[ref]) errors.add(`content/diagrams/${d.svg}`, `data-ref="${ref}"${layer ? ` (layer ${layer})` : ''} is not a known entity id`);
      }
    }
    scan.links.forEach((l) => entities[l] || errors.add(`content/diagrams/${d.svg}`, `data-from/data-to "${l}" is not a known entity id`));
    d.layers.forEach((l) => scan.layers.includes(l.id) || errors.add(w, `layer "${l.id}" has no <g data-layer="${l.id}"> in the SVG`));
    d.defaultLayers.forEach((l) => d.layers.some((x) => x.id === l) || errors.add(w, `defaultLayers: "${l}" is not a declared layer`));
    d.topics.forEach((t) => topics[t] || errors.add(w, `topics: unknown topic "${t}"`));
    if (diagrams.some((x) => x.id === d.id)) errors.add(w, `duplicate diagram id "${d.id}"`);
    // Only the base and the layers this diagram declares count as its hotspots.
    const layerRefs = Object.fromEntries(
      Object.entries(scan.layerRefs).filter(([layer]) => layer === '' || d.layers.some((l) => l.id === layer)),
    );
    const refs = [...new Set(Object.values(layerRefs).flat())];
    diagrams.push({ ...d, svg: svg.replace(/<\?xml[^>]*>\s*/, ''), refs, layerRefs });
  });
  files.push(path.join(diagramDir, 'diagrams.yaml'));
  const diagramById = Object.fromEntries(diagrams.map((d) => [d.id, d]));
  const diagramsFor: Record<string, string[]> = {};
  for (const d of diagrams) for (const r of d.refs) (diagramsFor[r] ??= []).push(d.id);
  for (const e of Object.values(entities)) {
    if (e.type === 'pathway') e.diagrams.forEach((d) => diagramById[d] || errors.add(where(e.id), `diagrams: unknown diagram "${d}"`));
  }

  // ---------------------------------------------------------------- term index (hover definitions)
  const termIndex: [string, string, boolean][] = [];
  const isAbbrev = (s: string) => /^[A-Z0-9][A-Za-z0-9-]{0,5}$/.test(s) && /[A-Z].*[A-Z0-9]|^[A-Z]{2}/.test(s);
  for (const e of Object.values(entities)) {
    for (const form of [e.name, ...e.aliases]) {
      if (form.length < 2 || /[()]/.test(form)) continue;
      termIndex.push([form, e.id, isAbbrev(form)]);
    }
  }
  const formOwners = new Map<string, string>();
  for (const [form, id, cs] of termIndex) {
    const k = cs ? form : form.toLowerCase();
    const prev = formOwners.get(k);
    if (prev && prev !== id) errors.warn('term index', `"${form}" is a name/alias of both ${prev} and ${id}; hover will use ${prev}`);
    else formOwners.set(k, id);
  }
  const dedupedTerms = termIndex.filter(([form, id, cs]) => formOwners.get(cs ? form : form.toLowerCase()) === id);

  // ---------------------------------------------------------------- lessons
  const lessons: CompiledLesson[] = [];
  for (const t of topicList) {
    const dir = path.join(contentDir, 'topics', t.id, 'lessons');
    for (const file of walk(dir, '.md')) {
      const l = compileLesson(rel(root, file), read(file), t.id, {
        entityName: (id) => entities[id]?.name,
        hasCorrection: (id) => !!corrections[id],
        hasFlag: (id) => !!flags[id],
        termIndex: dedupedTerms,
      }, errors);
      if (l) lessons.push(l);
    }
  }
  lessons.sort((a, b) => (topics[a.topic].order - topics[b.topic].order) || a.order - b.order);
  for (const l of lessons) topics[l.topic].lessons.push(l.id);
  for (const t of topicList) if (t.status === 'ready' && t.lessons.length === 0) errors.add('content/topics.yaml', `topic "${t.id}" is marked ready but has no lessons`);

  // "Review this" links: the lesson section that talks about an entity the most.
  const lessonForCache = new Map<string, string | undefined>();
  const mentionScore = (text: string, id: string): number => {
    const e = entities[id];
    if (!e) return 0;
    let score = text.split(id).length - 1; // directive highlights and [[links]] use the id
    for (const form of [e.name, ...e.aliases]) {
      if (form.length < 2) continue;
      const re = new RegExp(`(?<![\\w-])${escapeRegExp(form)}(?![\\w-])`, /^[A-Z0-9-]{2,6}$/.test(form) ? 'g' : 'gi');
      score += (text.match(re) ?? []).length;
    }
    return score;
  };
  const lessonFor = (entityId: string, topic: string): string | undefined => {
    const key = `${entityId}|${topic}`;
    if (lessonForCache.has(key)) return lessonForCache.get(key);
    const pick = (pool: CompiledLesson[]) => {
      let best: { lesson: CompiledLesson; anchor: string; score: number } | undefined;
      for (const l of pool) {
        for (const sec of l.sections) {
          const score = mentionScore(sec.text, entityId);
          if (score > 0 && (!best || score > best.score)) best = { lesson: l, anchor: sec.anchor, score };
        }
      }
      return best;
    };
    const best = pick(lessons.filter((l) => l.topic === topic)) ?? pick(lessons);
    const result = best ? (best.anchor ? `${best.lesson.id}#${best.anchor}` : best.lesson.id) : undefined;
    lessonForCache.set(key, result);
    return result;
  };

  // ---------------------------------------------------------------- hand-written cards
  const cards: Card[] = [];
  for (const t of topicList) {
    const file = path.join(contentDir, 'topics', t.id, 'cards.yaml');
    if (!fs.existsSync(file)) continue;
    files.push(file);
    readYamlList(file, root, errors).forEach((raw, i) => {
      const w = `${rel(root, file)}[${i}]`;
      const parsed = CardIn.safeParse(raw);
      if (!parsed.success) return errors.add(w, issues(parsed.error));
      const c = parsed.data;
      const topic = c.tags.topic ?? t.id;
      if (!topics[topic]) return errors.add(w, `unknown topic "${topic}"`);
      c.refs.forEach((r) => entities[r] || errors.add(`${w} ${c.id}`, `refs: unknown id "${r}"`));
      c.corrections.forEach((x) => corrections[x] || errors.add(`${w} ${c.id}`, `${x} is not in CORRECTIONS.md`));
      if (c.source === 'corrected' && !c.corrections.length) errors.add(`${w} ${c.id}`, 'source "corrected" needs corrections: [C-xxx]');
      const common = {
        id: c.id, refs: c.refs, topic, unit: c.tags.unit ?? topics[topic].unit, difficulty: c.tags.difficulty,
        source: c.source, corrections: c.corrections, generated: false,
      };
      if (c.kind === 'occlusion') {
        const d = diagramById[c.diagram];
        if (!d) return errors.add(`${w} ${c.id}`, `unknown diagram "${c.diagram}"`);
        if (!d.refs.includes(c.target)) return errors.add(`${w} ${c.id}`, `"${c.target}" has no hotspot on diagram ${c.diagram}`);
        const target = entities[c.target];
        cards.push({
          ...common, kind: 'occlusion', diagram: c.diagram, target: c.target, layers: c.layer ? [c.layer] : [],
          refs: [...new Set([c.target, ...c.refs])],
          front: c.front ?? 'Name the highlighted structure.',
          back: c.back ?? `${target?.name}: ${target?.short}`,
        });
      } else {
        cards.push({ ...common, kind: c.kind, front: c.front, back: c.back });
      }
    });
  }

  // ---------------------------------------------------------------- hand-written questions
  const questions: Question[] = [];
  for (const t of topicList) {
    const file = path.join(contentDir, 'topics', t.id, 'questions.yaml');
    if (!fs.existsSync(file)) continue;
    files.push(file);
    readYamlList(file, root, errors).forEach((raw, i) => {
      const w = `${rel(root, file)}[${i}]`;
      const parsed = QuestionIn.safeParse(raw);
      if (!parsed.success) return errors.add(w, issues(parsed.error));
      const q = parsed.data;
      const topic = q.tags.topic ?? t.id;
      if (!topics[topic]) return errors.add(w, `unknown topic "${topic}"`);
      q.refs.forEach((r) => entities[r] || errors.add(`${w} ${q.id}`, `refs: unknown id "${r}"`));
      q.corrections.forEach((x) => corrections[x] || errors.add(`${w} ${q.id}`, `${x} is not in CORRECTIONS.md`));
      if (q.source === 'corrected' && !q.corrections.length) errors.add(`${w} ${q.id}`, 'source "corrected" needs corrections: [C-xxx]');
      const common = {
        id: q.id, stem: q.stem, explain: q.explain, refs: q.refs, topic,
        unit: q.tags.unit ?? topics[topic].unit, difficulty: q.tags.difficulty,
        source: q.source, corrections: q.corrections, generated: false,
        lesson: q.lesson ?? q.refs.map((r) => lessonFor(r, topic)).find(Boolean),
      };
      if (q.kind === 'mcq') {
        questions.push({
          ...common, kind: 'mcq',
          options: [{ text: q.answer, correct: true }, ...q.distractors.map((d) => ({ text: d.text, correct: false, why: d.why }))],
        });
      } else {
        const answer = entities[q.answer];
        if (!answer) return errors.add(`${w} ${q.id}`, `answer: unknown id "${q.answer}"`);
        let pool = q.distractors?.map((d) => entities[d]).filter(Boolean) as Entity[] | undefined;
        q.distractors?.forEach((d) => entities[d] || errors.add(`${w} ${q.id}`, `distractors: unknown id "${d}"`));
        if (!pool) {
          const same = Object.values(entities).filter((e) => e.type === answer.type && e.id !== answer.id);
          pool = shuffled([...same.filter((e) => e.topics.includes(topic)), ...same.filter((e) => !e.topics.includes(topic))].slice(0, 12), q.id).slice(0, 3);
        }
        if (pool.length < 2) return errors.add(`${w} ${q.id}`, 'not enough distractors of the same type; list some in distractors: [...]');
        questions.push({
          ...common, kind: 'case',
          refs: [...new Set([answer.id, ...q.refs])],
          lesson: common.lesson ?? lessonFor(answer.id, topic),
          options: [
            { text: answer.name, correct: true, ref: answer.id },
            ...pool.map((e) => ({ text: e.name, correct: false, ref: e.id, why: e.short })),
          ],
        });
      }
    });
  }

  // ---------------------------------------------------------------- generated cards & questions
  // Only topics marked ready get generated cards/questions; planned topics stay validated but quiet.
  const readyTopics = Object.fromEntries(topicList.filter((t) => t.status === 'ready').map((t) => [t.id, t]));
  const gen = generate({ entities, topics: readyTopics, diagrams, lessonFor });
  cards.push(...gen.cards);
  questions.push(...gen.questions);

  // IDs must be unique (SR progress is keyed on them)
  const dupCheck = (items: { id: string }[], label: string) => {
    const seen = new Set<string>();
    for (const it of items) {
      if (seen.has(it.id)) errors.add(label, `duplicate id "${it.id}"`);
      seen.add(it.id);
    }
  };
  dupCheck(cards, 'cards');
  dupCheck(questions, 'questions');

  // ---------------------------------------------------------------- lesson cross-checks
  const questionById = Object.fromEntries(questions.map((q) => [q.id, q]));
  for (const l of lessons) {
    const w = `content/topics/${l.topic}/lessons (${l.slug})`;
    l.checkIds.forEach((q) => questionById[q] || errors.add(w, `::check q="${q}" is not a known question id`));
    l.pathwayIds.forEach((p) => entities[p]?.type === 'pathway' || errors.add(w, `::pathway id="${p}" is not a pathway`));
    for (const { diagram, ids } of l.directiveRefs) {
      const d = diagramById[diagram];
      if (!d) {
        errors.add(w, `::diagram id="${diagram}" is not a known diagram`);
        continue;
      }
      ids.forEach((id) => d.refs.includes(id) || errors.add(w, `"${id}" has no hotspot on diagram ${diagram}`));
    }
  }
  const allAnchors = new Set(lessons.flatMap((l) => [l.id, ...l.anchors.map((a) => `${l.id}#${a}`)]));
  for (const q of questions) {
    if (q.lesson && !allAnchors.has(q.lesson)) errors.add(`question ${q.id}`, `lesson "${q.lesson}" does not exist (format: topic/lesson-slug#heading-anchor)`);
  }

  // ---------------------------------------------------------------- backlinks
  const backlinks: Record<string, Set<string>> = {};
  const link = (from: string, to: string | undefined) => {
    if (!to || !entities[to] || to === from) return;
    (backlinks[to] ??= new Set()).add(from);
  };
  for (const e of Object.values(entities)) {
    const refs: (string | undefined)[] = [];
    switch (e.type) {
      case 'region': refs.push(e.parent, ...e.connections.map((c) => c.to), ...e.cases); break;
      case 'molecule': refs.push(e.parent); break;
      case 'neurotransmitter': refs.push(...e.precursors, e.synthesis, ...e.sources.flatMap((s) => [s.nucleus, ...s.targets]), ...e.deactivationBy, ...e.disorders); break;
      case 'drug': refs.push(...e.actsOn, e.target); break;
      case 'pathway': refs.push(...e.steps.flatMap((s) => [s.ref, s.via])); break;
      case 'case': refs.push(...e.damage.regions); break;
      case 'concept': refs.push(...e.related, ...e.regions); break;
      case 'experiment': refs.push(...e.supports, ...e.people); break;
    }
    refs.forEach((r) => link(e.id, r));
  }

  const strip = ({ checkIds: _c, directiveRefs: _d, pathwayIds: _p, anchorFor: _a, sections: _s, ...l }: (typeof lessons)[number]) => l;
  const bundle: ContentBundle = {
    units: units.sort((a, b) => a.order - b.order),
    topics: topicList.sort((a, b) => a.order - b.order),
    entities,
    lessons: lessons.map(strip),
    diagrams,
    cards,
    questions,
    corrections,
    flags,
    backlinks: Object.fromEntries(Object.entries(backlinks).map(([k, v]) => [k, [...v].sort()])),
    diagramsFor,
    termIndex: dedupedTerms,
  };
  return { bundle, errors: errors.errors, warnings: errors.warnings, files };
}
