import { describe, expect, it } from 'vitest';
import { Rating } from 'ts-fsrs';
import { cardStrength, getProgress, mastery, mergeProgress, Progress, recordAnswer, review, streak, today } from '../src/progress/store';
import { planSession, dueCount } from '../src/lib/session';
import { filterToQuery, matchCard, parseFilter } from '../src/lib/filters';
import type { Card, ContentBundle } from '../src/content/types';

const empty = () => Progress.parse({ version: 1, cards: {} });

describe('streak', () => {
  it('counts consecutive days ending today or yesterday', () => {
    const now = new Date(2026, 10, 20);
    const d = (offset: number) => today(new Date(2026, 10, 20 - offset));
    expect(streak([d(0), d(1), d(2)], now)).toBe(3);
    expect(streak([d(1), d(2)], now)).toBe(2);
    expect(streak([d(2), d(3)], now)).toBe(0);
  });
});

describe('spaced repetition', () => {
  it('schedules a reviewed card into the future and Good > Again', () => {
    const now = new Date('2026-01-01T10:00:00Z');
    review('c-test-a', Rating.Good, now);
    review('c-test-b', Rating.Again, now);
    const p = getProgress();
    expect(new Date(p.cards['c-test-a'].due).getTime()).toBeGreaterThan(now.getTime());
    expect(new Date(p.cards['c-test-a'].due).getTime()).toBeGreaterThanOrEqual(new Date(p.cards['c-test-b'].due).getTime());
    expect(p.reviews).toBe(2);
    expect(cardStrength(undefined)).toBe(0);
  });
});

describe('mastery', () => {
  it('blends card strength and quiz accuracy', () => {
    recordAnswer('t1', 'q1', true);
    recordAnswer('t1', 'q2', false);
    const m = mastery(getProgress(), [], 't1');
    expect(m).toBeGreaterThan(0);
    expect(m).toBeLessThan(1);
    expect(getProgress().misses.q2).toBe(1);
  });
});

describe('mergeProgress', () => {
  it('keeps the newer review per card and unions days/lessons', () => {
    const a = { ...empty(), days: ['2026-01-01'], lessons: { x: { at: '1' } } };
    const b = { ...empty(), days: ['2026-01-02'], lessons: { y: { at: '2' } } };
    a.cards.k = { due: '2026-01-05', stability: 1, difficulty: 5, elapsed_days: 0, scheduled_days: 1, learning_steps: 0, reps: 1, lapses: 0, state: 2, last_review: '2026-01-01' };
    b.cards.k = { ...a.cards.k, stability: 9, last_review: '2026-01-03' };
    const m = mergeProgress(a, b);
    expect(m.cards.k.stability).toBe(9);
    expect(m.days).toEqual(['2026-01-01', '2026-01-02']);
    expect(Object.keys(m.lessons).sort()).toEqual(['x', 'y']);
  });
});

const card = (id: string, extra: Partial<Card> = {}): Card => ({
  id, kind: 'basic', front: 'f', back: 'b', refs: [], topic: 'nt-systems', unit: 'foundations', difficulty: 2, source: 'notes', corrections: [], generated: true, ...extra,
});

describe('session planning', () => {
  it('puts due reviews first (oldest first) and caps new cards', () => {
    const now = new Date('2026-02-01T00:00:00Z');
    const stored = {
      a: { ...empty().cards, due: '2026-01-30T00:00:00Z', stability: 1, difficulty: 5, elapsed_days: 0, scheduled_days: 1, learning_steps: 0, reps: 1, lapses: 0, state: 2 },
      b: { due: '2026-01-20T00:00:00Z', stability: 1, difficulty: 5, elapsed_days: 0, scheduled_days: 1, learning_steps: 0, reps: 1, lapses: 0, state: 2 },
      c: { due: '2026-03-01T00:00:00Z', stability: 1, difficulty: 5, elapsed_days: 0, scheduled_days: 1, learning_steps: 0, reps: 1, lapses: 0, state: 2 },
    };
    const cards = ['a', 'b', 'c', 'n1', 'n2', 'n3'].map((id) => card(id));
    const plan = planSession(cards, stored, { now, newLimit: 2 });
    expect(plan.due.map((c) => c.id)).toEqual(['b', 'a']);
    expect(plan.fresh).toHaveLength(2);
    expect(dueCount(cards, stored, now)).toBe(2);
  });
});

describe('filters', () => {
  it('round-trips through the URL', () => {
    const f = parseFilter(new URLSearchParams('topic=nt-systems&type=neurotransmitter,drug&n=15'));
    expect(f).toMatchObject({ topics: ['nt-systems'], types: ['neurotransmitter', 'drug'], n: 15 });
    expect(parseFilter(new URLSearchParams(filterToQuery(f).slice(1)))).toEqual(f);
  });
  it('matches cards by topic, kind and entity type', () => {
    const bundle = { entities: { dopamine: { type: 'neurotransmitter' } } } as unknown as ContentBundle;
    const c = card('x', { refs: ['dopamine'] });
    expect(matchCard(c, parseFilter(new URLSearchParams('type=neurotransmitter')), bundle)).toBe(true);
    expect(matchCard(c, parseFilter(new URLSearchParams('type=drug')), bundle)).toBe(false);
    expect(matchCard(c, parseFilter(new URLSearchParams('kind=occlusion')), bundle)).toBe(false);
    expect(matchCard(c, parseFilter(new URLSearchParams('topic=memory')), bundle)).toBe(false);
  });
});
