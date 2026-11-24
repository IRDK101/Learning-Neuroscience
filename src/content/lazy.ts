/**
 * The two heavy parts of the content bundle load as separate chunks after the first paint:
 * diagram SVG markup, and card/question text. Each is filled into the bundle objects in place,
 * so the rest of the app keeps reading d.svg, card.front, q.stem as before; components that
 * need them call useSvgs() / usePractice() to re-render once they arrive.
 */
import { useEffect, useSyncExternalStore } from 'react';
import { content } from './index';

function lazyPart(load: () => Promise<void>) {
  let ready = false;
  let promise: Promise<void> | null = null;
  const listeners = new Set<() => void>();
  const start = () => {
    if (!promise) {
      promise = load().then(() => {
        ready = true;
        listeners.forEach((l) => l());
      });
    }
    return promise;
  };
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };
  const useReady = () => {
    const r = useSyncExternalStore(subscribe, () => ready, () => ready);
    useEffect(() => {
      void start();
    }, []);
    return r;
  };
  return { start, useReady, isReady: () => ready };
}

const svgPart = lazyPart(async () => {
  const { default: svgs } = await import('virtual:content-svgs');
  for (const d of content.diagrams) if (d.svgKey !== undefined) d.svg = svgs[d.svgKey];
});

const practicePart = lazyPart(async () => {
  const { default: p } = await import('virtual:content-practice');
  for (const c of content.cards) {
    const t = p.cards[c.id];
    if (t) [c.front, c.back] = t;
  }
  for (const q of content.questions) {
    const t = p.questions[q.id];
    if (t) Object.assign(q, t);
  }
});

const lessonPart = lazyPart(async () => {
  const { default: blocks } = await import('virtual:content-lessons');
  for (const l of content.lessons) l.blocks = blocks[l.id] ?? [];
});

/** True once lesson bodies are available. */
export const useLessons = lessonPart.useReady;
/** True once diagram SVGs are available. */
export const useSvgs = svgPart.useReady;
/** True once card and question text is available. */
export const usePractice = practicePart.useReady;

/** Start both downloads without waiting (called once the app has painted). */
export function prefetchContent() {
  void svgPart.start();
  void practicePart.start();
  void lessonPart.start();
}
