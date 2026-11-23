/**
 * Generates flashcards and quiz questions from the knowledge graph.
 * IDs are deterministic (gen-…) so spaced-repetition progress survives rebuilds.
 * Distractors are drawn from the same entity type (and topic when possible) with a seeded shuffle.
 */
import type { Entity, Region, Neurotransmitter, Drug, Pathway, Case, Concept, Molecule, Fact } from '../../src/content/schema';
import type { Card, Diagram, Question, QuestionOption, Topic, UnitId } from '../../src/content/types';
import { escapeRegExp, shuffled } from './util';
import { isPlural, the } from '../../src/lib/text';

export { isPlural, the };

interface Ctx {
  entities: Record<string, Entity>;
  topics: Record<string, Topic>;
  diagrams: Diagram[];
  lessonFor: (entityId: string, topic: string) => string | undefined;
}

const name = (ctx: Ctx, id: string) => ctx.entities[id]?.name ?? id;

function homeTopic(ctx: Ctx, e: Entity, prefer?: string[]): string | undefined {
  const candidates = e.topics.filter((t) => ctx.topics[t]);
  if (prefer) {
    const hit = candidates.find((t) => prefer.includes(t));
    if (hit) return hit;
  }
  return candidates[0];
}

/** Replace the entity's own name/aliases with a neutral phrase so prompts don't give the answer away. */
export function mask(text: string, e: Entity, replacement = 'this structure'): string {
  let out = text;
  for (const form of [e.name, ...e.aliases].sort((a, b) => b.length - a.length)) {
    if (form.length < 2) continue;
    out = out.replace(new RegExp(`(?<![\\w-])${escapeRegExp(form)}(?![\\w-])`, 'gi'), replacement);
  }
  return out;
}

const firstSentence = (s: string) => s.replace(/\s+/g, ' ').trim();
const factList = (facts: Fact[], n = 3) => facts.slice(0, n).map((f) => f.text).join(' • ');
const anyCorrected = (facts: Fact[]) => [...new Set(facts.flatMap((f) => f.corrections))];
const srcOf = (e: Entity, facts: Fact[] = []) =>
  e.source === 'corrected' || facts.some((f) => f.source === 'corrected') ? 'corrected' : e.source;

export function generate(ctx: Ctx): { cards: Card[]; questions: Question[] } {
  const cards: Card[] = [];
  const questions: Question[] = [];
  const all = Object.values(ctx.entities);
  const ofType = <T extends Entity['type']>(t: T) => all.filter((e) => e.type === t) as Extract<Entity, { type: T }>[];

  const unitOf = (topic: string): UnitId => ctx.topics[topic].unit;

  const card = (
    id: string,
    e: Entity,
    topic: string,
    front: string,
    back: string,
    extra: Partial<Card> = {},
  ) => {
    cards.push({
      id,
      kind: 'basic',
      front,
      back,
      refs: [e.id],
      topic,
      unit: unitOf(topic),
      difficulty: 2,
      source: e.source,
      corrections: e.corrections,
      generated: true,
      ...extra,
    });
  };

  /**
   * Build a multiple-choice question. `pool` are candidate (text, ref) distractors; anything equal to the
   * answer text or listed in `exclude` is skipped. Needs ≥3 distractors or the question is dropped.
   */
  const mcq = (
    id: string,
    e: Entity,
    topic: string,
    stem: string,
    answer: { text: string; ref?: string },
    pool: { text: string; ref?: string }[] | { text: string; ref?: string }[][],
    extra: Partial<Question> = {},
    exclude: string[] = [],
  ) => {
    const seen = new Set([answer.text.toLowerCase(), ...exclude.map((x) => x.toLowerCase())]);
    const distractors: QuestionOption[] = [];
    // A pool may come in tiers (e.g., same topic first); shuffle within a tier, never across tiers.
    const tiers = (Array.isArray(pool[0]) ? pool : [pool]) as { text: string; ref?: string }[][];
    const ordered = tiers.flatMap((t, i) => shuffled(t, `${id}:${i}`));
    for (const p of ordered) {
      const k = p.text.toLowerCase();
      if (seen.has(k) || (p.ref && exclude.includes(p.ref))) continue;
      seen.add(k);
      distractors.push({ text: p.text, correct: false, ref: p.ref });
      if (distractors.length === 3) break;
    }
    if (distractors.length < 3) return;
    questions.push({
      id,
      kind: 'mcq',
      stem,
      options: [{ text: answer.text, correct: true, ref: answer.ref }, ...distractors],
      explain: extra.explain ?? `${e.name}: ${e.short}`,
      refs: [e.id],
      lesson: ctx.lessonFor(answer.ref ?? e.id, topic) ?? ctx.lessonFor(e.id, topic),
      topic,
      unit: unitOf(topic),
      difficulty: 2,
      source: e.source,
      corrections: e.corrections,
      generated: true,
      ...extra,
    });
  };

  // Prefer distractors from the same topic, then anything of the same type (two tiers).
  const sameTopicFirst = <T extends Entity>(items: T[], topic: string): T[][] => [
    items.filter((x) => x.topics.includes(topic)),
    items.filter((x) => !x.topics.includes(topic)).sort((a, b) => a.id.localeCompare(b.id)),
  ];
  const tiersMap = <T, U>(tiers: T[][], fn: (x: T) => U): U[][] => tiers.map((t) => t.map(fn));

  // ------------------------------------------------------------------ regions
  const regions = ofType('region').filter((r) => r.generate);
  for (const r of regions as Region[]) {
    const topic = homeTopic(ctx, r);
    if (!topic || r.functions.length === 0) continue;
    const fn = r.functions;
    const plural = isPlural(r.name);
    card(`gen-fn-${r.id}`, r, topic, `What ${plural ? 'do' : 'does'} ${the(r.name)} do?`, factList(fn), {
      source: srcOf(r, fn),
      corrections: [...new Set([...r.corrections, ...anyCorrected(fn)])],
    });
    card(`gen-rev-${r.id}`, r, topic, `Which structure? “${mask(fn[0].text, r)}”`, `${r.name}`, {
      kind: 'reverse',
      source: srcOf(r, [fn[0]]),
      corrections: [...new Set([...r.corrections, ...fn[0].corrections])],
    });
    const peers = sameTopicFirst(
      regions.filter((x) => x.id !== r.id && x.functions.length && x.parent !== r.id && r.parent !== x.id && x.kind === r.kind),
      topic,
    );
    mcq(
      `gen-q-fn-${r.id}`,
      r,
      topic,
      `Which structure fits this description? “${mask(fn[0].text, r)}”`,
      { text: r.name, ref: r.id },
      tiersMap(peers, (x) => ({ text: x.name, ref: x.id })),
    );
    mcq(
      `gen-q-rfn-${r.id}`,
      r,
      topic,
      `Which of these is a key role of ${the(r.name)}?`,
      { text: fn[0].text, ref: r.id },
      tiersMap(peers, (x) => ({ text: mask(x.functions[0].text, x, 'it'), ref: x.id })),
    );
  }

  // ------------------------------------------------------------------ neurotransmitters
  const nts = ofType('neurotransmitter').filter((n) => n.generate) as Neurotransmitter[];
  const label = (n: Neurotransmitter) => (n.aliases[0] ? `${n.name} (${n.aliases[0]})` : n.name);
  for (const n of nts) {
    const topic = homeTopic(ctx, n, ['nt-systems']);
    if (!topic) continue;
    if (n.sources.length) {
      card(
        `gen-nt-src-${n.id}`,
        n,
        topic,
        `Where are the main ${label(n)} neurons, and where do they project?`,
        n.sources
          .map((s) => `${name(ctx, s.nucleus)}${s.targets.length ? ` → ${s.targets.map((t) => name(ctx, t)).join(', ')}` : ''}`)
          .join(' • '),
      );
      const own = n.sources.map((s) => s.nucleus);
      mcq(
        `gen-q-ntsrc-${n.id}`,
        n,
        topic,
        `Which of these is a main source of ${label(n)} in the brain?`,
        { text: name(ctx, n.sources[0].nucleus), ref: n.sources[0].nucleus },
        nts.flatMap((o) => (o.id === n.id ? [] : o.sources.map((s) => ({ text: name(ctx, s.nucleus), ref: s.nucleus })))),
        {},
        own,
      );
      for (const s of n.sources) {
        const nucleus = ctx.entities[s.nucleus];
        mcq(
          `gen-q-nucnt-${s.nucleus}`,
          nucleus,
          topic,
          `Neurons in ${the(nucleus.name)} mainly release which neurotransmitter?`,
          { text: label(n), ref: n.id },
          nts.filter((o) => o.id !== n.id).map((o) => ({ text: label(o), ref: o.id })),
          { explain: `${nucleus.name} is a source of ${n.name}. ${nucleus.short}` },
        );
      }
    }
    if (n.precursors.length) {
      const pre = n.precursors.map((p) => name(ctx, p)).join(' + ');
      card(
        `gen-nt-syn-${n.id}`,
        n,
        topic,
        `How is ${label(n)} made? Name the precursor${n.rateLimiting ? ' and the rate-limiting step' : ''}.`,
        `Precursor: ${pre}.${n.rateLimiting ? ` Rate-limiting: ${n.rateLimiting.text}` : ''}`,
        {
          source: n.rateLimiting ? srcOf(n, [n.rateLimiting]) : n.source,
          corrections: [...new Set([...n.corrections, ...(n.rateLimiting?.corrections ?? [])])],
        },
      );
      const molecules = all.filter((e) => e.type === 'molecule' && (e as Molecule).kind === 'precursor');
      mcq(
        `gen-q-ntpre-${n.id}`,
        n,
        topic,
        `What is the starting molecule (precursor) for ${label(n)}?`,
        { text: name(ctx, n.precursors[0]), ref: n.precursors[0] },
        [
          ...nts.flatMap((o) => (o.id === n.id ? [] : o.precursors.map((p) => ({ text: name(ctx, p), ref: p })))),
          ...molecules.map((m) => ({ text: m.name, ref: m.id })),
        ],
        {},
        n.precursors,
      );
    }
    if (n.deactivation.length) {
      card(`gen-nt-off-${n.id}`, n, topic, `How is ${label(n)} cleared from the synapse?`, factList(n.deactivation), {
        source: srcOf(n, n.deactivation),
        corrections: [...new Set([...n.corrections, ...anyCorrected(n.deactivation)])],
      });
    }
    if (n.functions.length) {
      card(`gen-nt-fn-${n.id}`, n, topic, `What does ${label(n)} do in the brain?`, factList(n.functions));
    }
  }

  // ------------------------------------------------------------------ drugs
  const drugs = ofType('drug').filter((d) => d.generate) as Drug[];
  for (const d of drugs) {
    const topic = homeTopic(ctx, d, ['nt-systems']);
    if (!topic) continue;
    const acts = d.actsOn.map((a) => name(ctx, a)).join(' / ');
    card(`gen-drug-${d.id}`, d, topic, `How does ${d.name} work?`, firstSentence(d.mechanism));
    card(`gen-drug-rev-${d.id}`, d, topic, `Which drug? “${mask(firstSentence(d.mechanism), d, 'this drug')}”`, d.name, {
      kind: 'reverse',
    });
    mcq(
      `gen-q-drug-${d.id}`,
      d,
      topic,
      `How does ${d.name} change ${acts} signaling?`,
      { text: mask(firstSentence(d.mechanism), d, 'it'), ref: d.id },
      drugs.filter((o) => o.id !== d.id).map((o) => ({ text: mask(firstSentence(o.mechanism), o, 'it'), ref: o.id })),
    );
    mcq(
      `gen-q-drugrev-${d.id}`,
      d,
      topic,
      `Which drug does this? “${mask(firstSentence(d.mechanism), d, 'it')}”`,
      { text: d.name, ref: d.id },
      tiersMap(sameTopicFirst(drugs.filter((o) => o.id !== d.id), topic), (o) => ({ text: o.name, ref: o.id })),
    );
  }

  // ------------------------------------------------------------------ enzymes & other molecules
  const molecules = ofType('molecule').filter((m) => m.generate) as Molecule[];
  for (const m of molecules) {
    const topic = homeTopic(ctx, m);
    if (!topic || !m.functions.length) continue;
    card(`gen-mol-${m.id}`, m, topic, `What ${isPlural(m.name) ? 'do' : 'does'} ${m.name}${m.aliases[0] && m.aliases[0].length <= 8 ? ` (${m.aliases[0]})` : ''} do?`, factList(m.functions), {
      source: srcOf(m, m.functions),
      corrections: [...new Set([...m.corrections, ...anyCorrected(m.functions)])],
    });
    mcq(
      `gen-q-mol-${m.id}`,
      m,
      topic,
      `Which ${m.kind === 'enzyme' ? 'enzyme' : 'molecule'} does this? “${mask(m.functions[0].text, m, 'it')}”`,
      { text: m.name, ref: m.id },
      tiersMap(sameTopicFirst(molecules.filter((o) => o.id !== m.id && o.kind === m.kind), topic), (o) => ({ text: o.name, ref: o.id })),
    );
  }

  // ------------------------------------------------------------------ cases
  const cases = ofType('case').filter((c) => c.generate) as Case[];
  for (const c of cases) {
    const topic = homeTopic(ctx, c);
    if (!topic) continue;
    if (c.damage.regions.length || c.deficits.length) {
      card(
        `gen-case-${c.id}`,
        c,
        topic,
        `${c.name}: what is damaged, and what goes wrong?`,
        [
          c.damage.regions.length ? `Damage: ${c.damage.regions.map((r) => name(ctx, r)).join(', ')}.` : '',
          c.deficits.length ? `Result: ${factList(c.deficits)}` : '',
        ]
          .filter(Boolean)
          .join(' '),
        {
          source: srcOf(c, c.deficits),
          corrections: [...new Set([...c.corrections, ...anyCorrected(c.deficits)])],
        },
      );
    }
    if (c.damage.regions.length) {
      const target = c.damage.regions[0];
      mcq(
        `gen-q-case-${c.id}`,
        c,
        topic,
        `${c.name}${c.deficits[0] ? ` (${c.deficits[0].text.replace(/\.$/, '')})` : ''}: which structure is damaged?`,
        { text: name(ctx, target), ref: target },
        tiersMap(
          sameTopicFirst(
            regions.filter((r) => !c.damage.regions.includes(r.id) && ['area', 'nucleus', 'division'].includes(r.kind) && !['cellular', 'body', 'bone', 'vascular', 'meninges', 'ventricles'].includes(r.system)),
            topic,
          ),
          (r) => ({ text: r.name, ref: r.id }),
        ),
        { explain: `${c.name}: ${c.short}` },
      );
    }
  }

  // ------------------------------------------------------------------ concepts
  const concepts = ofType('concept').filter((c) => c.generate) as Concept[];
  for (const c of concepts) {
    const topic = homeTopic(ctx, c);
    if (!topic) continue;
    card(`gen-concept-${c.id}`, c, topic, `What is ${c.name}?`, c.short + (c.points.length ? ` • ${factList(c.points, 2)}` : ''), {
      source: srcOf(c, c.points),
      corrections: [...new Set([...c.corrections, ...anyCorrected(c.points)])],
    });
    mcq(
      `gen-q-concept-${c.id}`,
      c,
      topic,
      `Which term matches? “${mask(c.short, c, 'this')}”`,
      { text: c.name, ref: c.id },
      tiersMap(sameTopicFirst(concepts.filter((o) => o.id !== c.id), topic), (o) => ({ text: o.name, ref: o.id })),
    );
  }

  // ------------------------------------------------------------------ glossary terms
  for (const t of ofType('term').filter((x) => x.generate)) {
    const topic = homeTopic(ctx, t);
    if (!topic) continue;
    card(`gen-term-${t.id}`, t, topic, `Define: ${t.name}${t.aliases[0] ? ` (${t.aliases[0]})` : ''}`, t.short, { difficulty: 1 });
  }

  // ------------------------------------------------------------------ pathways: "what comes next"
  for (const p of ofType('pathway').filter((x) => x.generate) as Pathway[]) {
    const topic = homeTopic(ctx, p);
    if (!topic) continue;
    card(`gen-path-${p.id}`, p, topic, `Put in order: ${p.name}`, p.steps.map((s) => s.label).join(' → '), {
      source: p.steps.some((s) => s.source === 'corrected') ? 'corrected' : p.source,
      corrections: [...new Set([...p.corrections, ...p.steps.flatMap((s) => s.corrections)])],
    });
    const idxs = shuffled(
      p.steps.map((_, i) => i).slice(1),
      p.id,
    ).slice(0, Math.min(3, p.steps.length - 1));
    for (const i of idxs.sort((a, b) => a - b)) {
      const prev = p.steps[i - 1];
      const step = p.steps[i];
      const via = step.via ? ` (via ${name(ctx, step.via)})` : '';
      mcq(
        `gen-q-path-${p.id}-${i}`,
        p,
        topic,
        `${p.name}: what comes right after “${prev.label}”?`,
        { text: step.label, ref: step.ref },
        p.steps.filter((_, j) => j !== i && j !== i - 1).map((s) => ({ text: s.label, ref: s.ref })),
        {
          explain: `${prev.label} → ${step.label}${via}.${step.note ? ` ${step.note}` : ''}`,
          source: step.source === 'corrected' ? 'corrected' : p.source,
          corrections: [...new Set([...p.corrections, ...step.corrections])],
        },
      );
    }
  }

  // ------------------------------------------------------------------ occlusion cards from diagrams
  // One per structure, only for structures that belong to the diagram's topics. Plain anatomy diagrams
  // are preferred over overlays, so each structure is quizzed on its clearest view.
  const occluded = new Set<string>();
  for (const d of [...ctx.diagrams].sort((a, b) => Number(a.overlay) - Number(b.overlay))) {
    if (!d.quiz) continue;
    for (const [layer, refs] of Object.entries(d.layerRefs)) {
      for (const ref of refs) {
        const e = ctx.entities[ref];
        if (!e || !e.generate || occluded.has(ref)) continue;
        const topic = e.topics.find((t) => d.topics.includes(t) && ctx.topics[t]);
        if (!topic) continue;
        occluded.add(ref);
        const deep = d.layers.some((l) => l.id === 'deep') && layer !== 'deep' ? ['deep'] : [];
        card(`gen-occ-${d.id}-${ref}`, e, topic, 'Name the highlighted structure.', `${e.name}: ${e.short}`, {
          kind: 'occlusion',
          diagram: d.id,
          target: ref,
          layers: layer ? [layer, ...deep] : [],
        });
      }
    }
  }

  return { cards, questions };
}
