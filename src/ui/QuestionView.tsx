import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import type { Question } from '../content/types';
import { usePractice } from '../content/lazy';
import { shuffle } from '../lib/random';
import { Icon, SourceBadges } from './bits';

export function lessonHref(lesson: string): string {
  const [path, anchor] = lesson.split('#');
  return `/learn/${path}${anchor ? `?s=${anchor}` : ''}`;
}

/**
 * One multiple-choice question. Number keys 1–4 answer; wrong answers explain why
 * and link to the lesson section.
 */
export function QuestionView({
  q,
  onAnswer,
  onNext,
  nextLabel = 'Next',
  showLessonLink = true,
}: {
  q: Question;
  onAnswer?: (correct: boolean) => void;
  onNext?: () => void;
  nextLabel?: string;
  showLessonLink?: boolean;
}) {
  const ready = usePractice();
  const options = useMemo(() => shuffle(q.options), [q, ready]); // eslint-disable-line react-hooks/exhaustive-deps
  const [picked, setPicked] = useState<number | null>(null);
  useEffect(() => setPicked(null), [q]);

  const answered = picked !== null;
  const correct = answered && options[picked!].correct;

  const choose = (i: number) => {
    if (answered) return;
    setPicked(i);
    onAnswer?.(options[i].correct);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      const n = Number(e.key);
      if (!answered && n >= 1 && n <= options.length) choose(n - 1);
      else if (answered && (e.key === 'Enter' || e.key === 'ArrowRight') && onNext) onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!ready || options.length === 0) return <div className="question loading" aria-busy="true" />;

  return (
    <div className="question">
      <div className="q-stem">
        {q.stem}
        <SourceBadges corrections={q.corrections} />
      </div>
      <div className="options" role="group" aria-label="Answer options">
        {options.map((o, i) => {
          const state = answered ? (o.correct ? 'correct' : i === picked ? 'wrong' : '') : '';
          return (
            <button key={i} type="button" className={`option ${state}`} disabled={answered} onClick={() => choose(i)} aria-label={`${i + 1}. ${o.text}`}>
              <span className="key">{state === 'correct' ? <Icon name="check" size={14} /> : state === 'wrong' ? <Icon name="x" size={14} /> : i + 1}</span>
              <span>
                {o.text}
                {answered && o.why && (state === 'wrong' || (!o.correct && picked !== null)) && <span className="why">{o.why}</span>}
              </span>
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={`feedback notice ${correct ? 'ok' : 'bad'}`} role="status">
          <b>{correct ? 'Correct!' : 'Not quite.'}</b> {q.explain}
          {!correct && showLessonLink && q.lesson && (
            <div style={{ marginTop: '0.4rem' }}>
              <Link to={lessonHref(q.lesson)}>Review this in the lesson</Link>
            </div>
          )}
          {onNext && (
            <div style={{ marginTop: '0.6rem' }}>
              <button type="button" className="btn primary small" onClick={onNext} autoFocus>
                {nextLabel}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
