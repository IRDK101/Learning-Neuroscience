import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { content, entity } from '../../content';
import type { Pathway } from '../../content/types';
import { shuffle } from '../../lib/random';
import { recordGame } from '../../progress/store';
import { CopyLinkButton, Icon } from '../../ui/bits';

interface Item {
  id: string;
  index: number;
  label: string;
  via?: string;
}

function Row({ item, pos, total, state, hint, move }: { item: Item; pos: number; total: number; state?: 'correct' | 'wrong'; hint: boolean; move: (from: number, to: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`${isDragging ? 'dragging' : ''} ${state ?? ''}`}>
      <button type="button" className="handle" aria-label={`Drag ${item.label}. Press space to pick up, arrows to move.`} {...attributes} {...listeners}>
        <Icon name="grip" />
      </button>
      <span className="label">
        {item.label}
        {hint && item.via && <span className="via">made by {entity(item.via)?.name}</span>}
      </span>
      <span className="move">
        <button type="button" className="icon-btn" style={{ width: 34, height: 34 }} aria-label={`Move ${item.label} up`} disabled={pos === 0} onClick={() => move(pos, pos - 1)}>
          <Icon name="up" size={16} />
        </button>
        <button type="button" className="icon-btn" style={{ width: 34, height: 34 }} aria-label={`Move ${item.label} down`} disabled={pos === total - 1} onClick={() => move(pos, pos + 1)}>
          <Icon name="down" size={16} />
        </button>
      </span>
    </li>
  );
}

export function PathwayGame() {
  const [params, setParams] = useSearchParams();
  const pathways = Object.values(content.entities).filter((e): e is Pathway => e.type === 'pathway' && e.game && (!params.get('topic') || e.topics.includes(params.get('topic')!)));
  const p = (entity(params.get('id') ?? '') as Pathway | undefined) ?? pathways[0];
  const solution: Item[] = useMemo(() => (p ? p.steps.map((s, i) => ({ id: `s${i}`, index: i, label: s.label, via: s.via })) : []), [p]);
  const scramble = () => {
    let s = shuffle(solution);
    for (let k = 0; k < 5 && s.every((x, i) => x.index === i); k++) s = shuffle(solution);
    return s;
  };
  const [items, setItems] = useState<Item[]>(scramble);
  const [checked, setChecked] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState(false);
  const [pathwayId, setPathwayId] = useState(p?.id);
  if (p && p.id !== pathwayId) {
    setPathwayId(p.id);
    setItems(scramble());
    setChecked(false);
    setAttempts(0);
    setHint(false);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  if (!p) return <div className="panel">No pathways yet.</div>;

  const solved = checked && items.every((x, i) => x.index === i);
  const move = (from: number, to: number) => {
    setChecked(false);
    setItems((xs) => arrayMove(xs, from, to));
  };
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = items.findIndex((x) => x.id === e.active.id);
    const to = items.findIndex((x) => x.id === e.over!.id);
    move(from, to);
  };
  const check = () => {
    const ok = items.every((x, i) => x.index === i);
    setChecked(true);
    setAttempts((a) => a + 1);
    if (ok) recordGame('pathway', Math.max(1, 3 - attempts));
    else if (attempts >= 0) setHint(true);
  };

  return (
    <div className="stack" style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="crumbs">
        <Link to="/play">Play</Link> / Pathway builder
      </div>
      <div className="linklist">
        {pathways.map((x) => (
          <button key={x.id} type="button" className="chip" aria-pressed={x.id === p.id} onClick={() => setParams({ id: x.id }, { replace: true })}>
            {x.name}
          </button>
        ))}
      </div>
      <div className="panel stack">
        <div className="row">
          <h1 style={{ margin: 0, fontSize: '1.4rem' }}>{p.name}</h1>
          <span className="spacer" />
          <CopyLinkButton path={`/play/pathway?id=${p.id}`} label="Share" />
        </div>
        <p className="muted" style={{ margin: 0 }}>
          {p.short} Put the steps in order, first at the top.
        </p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((x) => x.id)} strategy={verticalListSortingStrategy}>
            <ol className="sortable" aria-label="Steps, in your order">
              {items.map((it, pos) => (
                <Row key={it.id} item={it} pos={pos} total={items.length} hint={hint} move={move} state={checked ? (it.index === pos ? 'correct' : 'wrong') : undefined} />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
        <div className="row">
          {!solved && (
            <button type="button" className="btn primary" onClick={check}>
              <Icon name="check" /> Check order
            </button>
          )}
          <button type="button" className="btn" onClick={() => { setItems(scramble()); setChecked(false); setAttempts(0); setHint(false); }}>
            Shuffle again
          </button>
          {!hint && !solved && (
            <button type="button" className="btn ghost" onClick={() => setHint(true)}>
              Show hints
            </button>
          )}
        </div>
        <div aria-live="polite">
          {checked && !solved && (
            <div className="notice bad">
              {items.filter((x, i) => x.index === i).length} of {items.length} in the right place. Green ones are correct; keep going.
            </div>
          )}
          {solved && (
            <div className="notice ok">
              <b>Solved{attempts === 1 ? ' on the first try!' : ` in ${attempts} tries.`}</b>
              <ol style={{ margin: '0.5rem 0 0' }}>
                {p.steps.map((s, i) => (
                  <li key={i}>
                    {s.label}
                    {s.via && <span className="muted small"> (via {entity(s.via)?.name})</span>}
                    {s.note && <div className="small muted">{s.note}</div>}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
