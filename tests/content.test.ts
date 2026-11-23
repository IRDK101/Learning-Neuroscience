import { describe, expect, it } from 'vitest';
import { buildContent } from '../scripts/lib/build';

const { bundle, errors } = buildContent();

describe('content bundle', () => {
  it('validates with no errors', () => {
    expect(errors).toEqual([]);
  });

  it('every diagram hotspot maps to a real entity', () => {
    for (const d of bundle.diagrams) {
      for (const ref of d.refs) expect(bundle.entities[ref], `${d.id}: ${ref}`).toBeDefined();
    }
  });

  it('every region with a diagram shows up in diagramsFor', () => {
    for (const d of bundle.diagrams) for (const r of d.refs) expect(bundle.diagramsFor[r]).toContain(d.id);
  });

  it('card and question ids are unique (spaced-repetition progress is keyed on them)', () => {
    expect(new Set(bundle.cards.map((c) => c.id)).size).toBe(bundle.cards.length);
    expect(new Set(bundle.questions.map((q) => q.id)).size).toBe(bundle.questions.length);
  });

  it('every question has exactly one correct option and at least 3 options, all distinct', () => {
    for (const q of bundle.questions) {
      expect(q.options.filter((o) => o.correct), q.id).toHaveLength(1);
      expect(q.options.length, q.id).toBeGreaterThanOrEqual(3);
      expect(new Set(q.options.map((o) => o.text.toLowerCase())).size, q.id).toBe(q.options.length);
    }
  });

  it('generated reverse prompts do not give away the answer', () => {
    for (const c of bundle.cards.filter((x) => x.kind === 'reverse')) {
      expect(c.front.toLowerCase(), c.id).not.toContain(c.back.toLowerCase());
    }
    for (const q of bundle.questions.filter((x) => x.generated && /fits this description|Which drug does this|Which term matches/.test(x.stem))) {
      const answer = q.options.find((o) => o.correct)!.text.toLowerCase();
      expect(q.stem.toLowerCase(), q.id).not.toContain(answer);
    }
  });

  it('occlusion cards point at a hotspot that exists on their diagram', () => {
    for (const c of bundle.cards.filter((x) => x.kind === 'occlusion')) {
      const d = bundle.diagrams.find((x) => x.id === c.diagram);
      expect(d?.refs, c.id).toContain(c.target);
    }
  });

  it('every corrected item cites a correction that exists', () => {
    for (const c of bundle.cards) if (c.source === 'corrected') expect(c.corrections.length, c.id).toBeGreaterThan(0);
    for (const q of bundle.questions) q.corrections.forEach((id) => expect(bundle.corrections[id], q.id).toBeDefined());
  });

  it('lesson links on questions resolve to a lesson', () => {
    const ids = new Set(bundle.lessons.map((l) => l.id));
    for (const q of bundle.questions) if (q.lesson) expect(ids.has(q.lesson.split('#')[0]), q.id).toBe(true);
  });

  it('parses all corrections from CORRECTIONS.md', () => {
    expect(Object.keys(bundle.corrections).length).toBeGreaterThanOrEqual(82);
    expect(bundle.corrections['C-069'].fixed).toMatch(/Semantic/);
    expect(Object.keys(bundle.flags).length).toBeGreaterThanOrEqual(18);
  });

  it('only ready topics get generated content', () => {
    const ready = new Set(bundle.topics.filter((t) => t.status === 'ready').map((t) => t.id));
    for (const c of bundle.cards.filter((x) => x.generated)) expect(ready.has(c.topic), c.id).toBe(true);
  });
});
