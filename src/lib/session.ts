/** Builds a flashcard study session: due reviews first (oldest due first), then a capped number of new cards. */
import type { Card } from '../content/types';
import type { StoredCard } from '../progress/store';
import { shuffle } from './random';

export interface SessionPlan {
  due: Card[];
  fresh: Card[];
  queue: Card[];
}

export function planSession(
  cards: Card[],
  stored: Record<string, StoredCard>,
  opts: { now?: Date; newLimit?: number; cram?: boolean; random?: () => number } = {},
): SessionPlan {
  const now = (opts.now ?? new Date()).getTime();
  const newLimit = opts.newLimit ?? 15;
  if (opts.cram) {
    const queue = shuffle(cards, opts.random);
    return { due: [], fresh: [], queue };
  }
  const due = cards
    .filter((c) => stored[c.id] && new Date(stored[c.id].due).getTime() <= now)
    .sort((a, b) => new Date(stored[a.id].due).getTime() - new Date(stored[b.id].due).getTime());
  // New cards: hand-written and easier ones first, so beginners start gently.
  const fresh = cards
    .filter((c) => !stored[c.id])
    .sort((a, b) => Number(a.generated) - Number(b.generated) || a.difficulty - b.difficulty)
    .slice(0, newLimit);
  return { due, fresh, queue: [...due, ...shuffle(fresh, opts.random)] };
}

export function dueCount(cards: Card[], stored: Record<string, StoredCard>, now = new Date()): number {
  const t = now.getTime();
  return cards.reduce((n, c) => n + (stored[c.id] && new Date(stored[c.id].due).getTime() <= t ? 1 : 0), 0);
}
