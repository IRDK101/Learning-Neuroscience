/**
 * Progress lives in the browser (localStorage), wrapped in try/catch so the site still works in
 * private mode. Export/Import moves it between devices as a JSON file.
 */
import { useSyncExternalStore } from 'react';
import { z } from 'zod';
import { createEmptyCard, fsrs, Rating, State, type Card as FsrsCard, type Grade } from 'ts-fsrs';

export const STORAGE_KEY = 'neuromap:v1';

const StoredCard = z.object({
  due: z.string(),
  stability: z.number(),
  difficulty: z.number(),
  elapsed_days: z.number(),
  scheduled_days: z.number(),
  learning_steps: z.number().default(0),
  reps: z.number(),
  lapses: z.number(),
  state: z.number().int().min(0).max(3),
  last_review: z.string().optional(),
  last_rating: z.number().int().min(1).max(4).optional(),
});
export type StoredCard = z.infer<typeof StoredCard>;

const QuizStat = z.object({
  answered: z.number().int().nonnegative(),
  correct: z.number().int().nonnegative(),
  recent: z.array(z.union([z.literal(0), z.literal(1)])).max(50),
});

export const Progress = z.object({
  version: z.literal(1),
  cards: z.record(z.string(), StoredCard),
  reviews: z.number().int().nonnegative().default(0),
  quiz: z.record(z.string(), QuizStat).default({}),
  /** question id -> times answered wrong (for "review mistakes") */
  misses: z.record(z.string(), z.number().int()).default({}),
  days: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).default([]),
  lessons: z.record(z.string(), z.object({ at: z.string() })).default({}),
  games: z.record(z.string(), z.object({ best: z.number(), plays: z.number().int() })).default({}),
  settings: z
    .object({
      theme: z.enum(['system', 'light', 'dark']).default('system'),
      patterns: z.boolean().default(false),
      newPerSession: z.number().int().min(0).max(100).default(15),
    })
    .default({ theme: 'system', patterns: false, newPerSession: 15 }),
});
export type Progress = z.infer<typeof Progress>;

export const ExportFile = z.object({
  app: z.literal('neuromap'),
  exportedAt: z.string(),
  progress: Progress,
});

const empty = (): Progress => Progress.parse({ version: 1, cards: {} });

function load(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty();
    const parsed = Progress.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : empty();
  } catch {
    return empty();
  }
}

let state: Progress = typeof window === 'undefined' ? empty() : load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked: progress just won't persist this session */
  }
}

export function getProgress(): Progress {
  return state;
}

export function setProgress(next: Progress) {
  state = next;
  persist();
  listeners.forEach((l) => l());
}

export function updateProgress(fn: (p: Progress) => Progress) {
  setProgress(fn(state));
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, getProgress, getProgress);
}

// Keep tabs in sync.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      state = load();
      listeners.forEach((l) => l());
    }
  });
}

// ------------------------------------------------------------------ days & streaks

export const today = (d = new Date()) => {
  const z2 = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z2(d.getMonth() + 1)}-${z2(d.getDate())}`;
};

function withToday(p: Progress): Progress {
  const t = today();
  return p.days.includes(t) ? p : { ...p, days: [...p.days, t].slice(-400) };
}

export function streak(days: string[], now = new Date()): number {
  const set = new Set(days);
  const d = new Date(now);
  if (!set.has(today(d))) d.setDate(d.getDate() - 1); // today not done yet: count from yesterday
  let n = 0;
  while (set.has(today(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

// ------------------------------------------------------------------ spaced repetition (FSRS)

const scheduler = fsrs({ enable_fuzz: true, request_retention: 0.9 });

export function toFsrs(c: StoredCard | undefined, now = new Date()): FsrsCard {
  if (!c) return createEmptyCard(now);
  return {
    due: new Date(c.due),
    stability: c.stability,
    difficulty: c.difficulty,
    elapsed_days: c.elapsed_days,
    scheduled_days: c.scheduled_days,
    learning_steps: c.learning_steps,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state as State,
    last_review: c.last_review ? new Date(c.last_review) : undefined,
  };
}

function fromFsrs(c: FsrsCard, rating: Grade): StoredCard {
  return {
    due: c.due.toISOString(),
    stability: c.stability,
    difficulty: c.difficulty,
    elapsed_days: c.elapsed_days,
    scheduled_days: c.scheduled_days,
    learning_steps: c.learning_steps,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    last_review: c.last_review?.toISOString(),
    last_rating: rating,
  };
}

export const GRADES: { rating: Grade; label: string; key: string }[] = [
  { rating: Rating.Again, label: 'Again', key: '1' },
  { rating: Rating.Hard, label: 'Hard', key: '2' },
  { rating: Rating.Good, label: 'Good', key: '3' },
  { rating: Rating.Easy, label: 'Easy', key: '4' },
];

/** What each rating would schedule, for the button hints ("10m", "3d"). */
export function preview(stored: StoredCard | undefined, now = new Date()): Record<number, Date> {
  const out: Record<number, Date> = {};
  const rec = scheduler.repeat(toFsrs(stored, now), now);
  for (const g of GRADES) out[g.rating] = rec[g.rating].card.due;
  return out;
}

export function review(cardId: string, rating: Grade, now = new Date()) {
  updateProgress((p) => {
    const next = scheduler.next(toFsrs(p.cards[cardId], now), now, rating);
    return withToday({ ...p, reviews: p.reviews + 1, cards: { ...p.cards, [cardId]: fromFsrs(next.card, rating) } });
  });
}

export function isDue(c: StoredCard | undefined, now = new Date()) {
  return !!c && new Date(c.due).getTime() <= now.getTime();
}

export function formatInterval(due: Date, now = new Date()): string {
  const mins = Math.max(1, Math.round((due.getTime() - now.getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 31) return `${days}d`;
  const months = Math.round(days / 30);
  return months < 12 ? `${months}mo` : `${(days / 365).toFixed(1)}y`;
}

/** 0–1: how well a card is learned. New = 0; grows with FSRS stability (21 days ≈ fully learned). */
export function cardStrength(c: StoredCard | undefined): number {
  if (!c || c.state === State.New) return 0;
  const base = Math.min(1, c.stability / 21);
  return c.last_rating === Rating.Again ? base * 0.5 : base;
}

// ------------------------------------------------------------------ quizzes, lessons, games

export function recordAnswer(topic: string, questionId: string, correct: boolean) {
  updateProgress((p) => {
    const prev = p.quiz[topic] ?? { answered: 0, correct: 0, recent: [] };
    const misses = { ...p.misses };
    if (!correct) misses[questionId] = (misses[questionId] ?? 0) + 1;
    else if (misses[questionId]) delete misses[questionId];
    return withToday({
      ...p,
      misses,
      quiz: {
        ...p.quiz,
        [topic]: {
          answered: prev.answered + 1,
          correct: prev.correct + (correct ? 1 : 0),
          recent: [...prev.recent, correct ? 1 : 0].slice(-20) as (0 | 1)[],
        },
      },
    });
  });
}

export function completeLesson(id: string) {
  updateProgress((p) => (p.lessons[id] ? p : withToday({ ...p, lessons: { ...p.lessons, [id]: { at: new Date().toISOString() } } })));
}

export function recordGame(game: string, score: number) {
  updateProgress((p) => {
    const prev = p.games[game] ?? { best: 0, plays: 0 };
    return withToday({ ...p, games: { ...p.games, [game]: { best: Math.max(prev.best, score), plays: prev.plays + 1 } } });
  });
}

export function setSetting<K extends keyof Progress['settings']>(key: K, value: Progress['settings'][K]) {
  updateProgress((p) => ({ ...p, settings: { ...p.settings, [key]: value } }));
}

/** Topic mastery 0–1: card strength (60%) blended with recent quiz accuracy (40%). */
export function mastery(p: Progress, topicCardIds: string[], topicId: string): number {
  const cardScore = topicCardIds.length
    ? topicCardIds.reduce((s, id) => s + cardStrength(p.cards[id]), 0) / topicCardIds.length
    : 0;
  const q = p.quiz[topicId];
  if (!q || q.recent.length === 0) return cardScore;
  const quizScore = q.recent.reduce<number>((s, x) => s + x, 0) / q.recent.length;
  const quizWeight = Math.min(1, q.recent.length / 10) * 0.4;
  return cardScore * (1 - quizWeight) + quizScore * quizWeight;
}

// ------------------------------------------------------------------ export / import

export function exportProgress(): string {
  return JSON.stringify({ app: 'neuromap', exportedAt: new Date().toISOString(), progress: state }, null, 2);
}

/** Merge an exported file into current progress. Newer card reviews win; everything else is unioned. */
export function mergeProgress(current: Progress, incoming: Progress): Progress {
  const cards = { ...current.cards };
  for (const [id, c] of Object.entries(incoming.cards)) {
    const mine = cards[id];
    if (!mine || (c.last_review ?? '') > (mine.last_review ?? '')) cards[id] = c;
  }
  const quiz = { ...current.quiz };
  for (const [t, q] of Object.entries(incoming.quiz)) if (!quiz[t] || q.answered > quiz[t].answered) quiz[t] = q;
  const games = { ...current.games };
  for (const [g, v] of Object.entries(incoming.games)) {
    const mine = games[g];
    games[g] = mine ? { best: Math.max(mine.best, v.best), plays: Math.max(mine.plays, v.plays) } : v;
  }
  return {
    ...current,
    cards,
    quiz,
    games,
    reviews: Math.max(current.reviews, incoming.reviews),
    misses: { ...incoming.misses, ...current.misses },
    days: [...new Set([...current.days, ...incoming.days])].sort().slice(-400),
    lessons: { ...incoming.lessons, ...current.lessons },
  };
}

export function importProgress(json: string): { ok: true; cards: number } | { ok: false; error: string } {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' };
  }
  const parsed = ExportFile.safeParse(data);
  if (!parsed.success) return { ok: false, error: 'That file is not a NeuroMap progress export.' };
  setProgress(mergeProgress(state, parsed.data.progress));
  return { ok: true, cards: Object.keys(parsed.data.progress.cards).length };
}

export function resetProgress() {
  setProgress({ ...empty(), settings: state.settings });
}
