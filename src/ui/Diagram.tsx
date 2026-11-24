/**
 * Renders one of the hand-drawn SVG diagrams and makes its hotspots interactive.
 * The SVG file stays pure markup; everything dynamic (colors, focus, hatch overlays, labels,
 * layers, keyboard access) is applied here by walking [data-ref] elements.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { diagram as getDiagram, entity } from '../content';
import type { Entity } from '../content/types';
import { useSvgs } from '../content/lazy';
import { useProgress } from '../progress/store';
import { Icon } from './bits';

export interface DiagramProps {
  id: string;
  layers?: string[];
  /** Pulsing highlight (lesson focus, pathway step, occlusion target). Dims everything else. */
  focus?: string[];
  /** Solid outline (clicked). */
  selected?: string | null;
  /** Dashed outline ("everything connected to X"). */
  related?: string[];
  /** Emphasize projection paths from/to these ids; dims the rest. */
  projectionsFor?: string[];
  onSelect?: (id: string) => void;
  showLabels?: boolean;
  /** Hide all labels (image-occlusion cards, Find-the-region). */
  occlusion?: boolean;
  caption?: ReactNode;
  toolbar?: ReactNode;
  /** Show the labels/zoom buttons. */
  controls?: boolean;
  /** Which hotspots respond to clicks (default: all). */
  clickable?: (id: string) => boolean;
  ariaLabel?: string;
  className?: string;
}

const MOLECULE_COLOR: Record<string, string> = {
  receptor: 'var(--mol-receptor)',
  transporter: 'var(--mol-transporter)',
  enzyme: 'var(--mol-enzyme)',
  channel: 'var(--mol-channel)',
  protein: 'var(--mol-protein)',
};

export function colorFor(e: Entity | undefined): string {
  if (!e) return 'var(--sys-cortex)';
  if (e.type === 'region') return `var(--sys-${e.system})`;
  if (e.type === 'molecule') return MOLECULE_COLOR[e.kind] ?? 'var(--mol-other)';
  return 'var(--sys-cortex)';
}

const PATTERN_SYSTEMS = ['frontal', 'parietal', 'temporal', 'occipital', 'limbic', 'basal-ganglia', 'diencephalon', 'brainstem', 'cerebellum'];

/** Shared <pattern> defs (hatch for highlights + one texture per system for "patterns" mode). */
export function SvgDefs() {
  const d = 'M0 0';
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        {shadeFilter('nm-shade', 7, 5)}
        {shadeFilter('nm-shade-sm', 2.6, 1.8)}
        <marker id="nm-dot" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="5" markerHeight="5" markerUnits="strokeWidth">
          <circle cx="4" cy="4" r="3" style={{ fill: 'var(--label)', stroke: 'var(--label-halo)', strokeWidth: 1 }} />
        </marker>
        <pattern id="nm-hatch" patternUnits="userSpaceOnUse" width="9" height="9" patternTransform="rotate(45)">
          <rect width="9" height="9" fill="transparent" />
          <line x1="0" y1="0" x2="0" y2="9" style={{ stroke: 'var(--hatch)' }} strokeWidth="3" />
        </pattern>
        {PATTERN_SYSTEMS.map((s, i) => (
          <pattern key={s} id={`nm-pat-${s}`} patternUnits="userSpaceOnUse" width="12" height="12" patternTransform={`rotate(${[0, 45, 90, 135, 0, 45, 90, 135, 0][i]})`}>
            {i < 4 ? (
              <line x1="0" y1="0" x2="0" y2="12" stroke="rgba(0,0,0,.45)" strokeWidth={i % 2 ? 1.5 : 3} />
            ) : i < 8 ? (
              <circle cx="6" cy="6" r={i % 2 ? 1.6 : 2.6} fill="rgba(0,0,0,.45)" />
            ) : (
              <path d={`${d} M0 6 L12 6 M6 0 L6 12`} stroke="rgba(0,0,0,.4)" strokeWidth="1.5" />
            )}
          </pattern>
        ))}
      </defs>
    </svg>
  );
}

/** Inner shading: a dark rim on the lower right and a light rim on the upper left. */
function shadeFilter(id: string, blur: number, off: number) {
  return (
    <filter id={id} x="-3%" y="-3%" width="106%" height="106%" colorInterpolationFilters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation={blur} result="blur" />
      <feOffset in="blur" dx={-off} dy={-off * 1.2} result="o1" />
      <feComposite in="SourceAlpha" in2="o1" operator="arithmetic" k2={1} k3={-1} result="rim1" />
      <feFlood floodColor="#061230" floodOpacity={0.42} />
      <feComposite in2="rim1" operator="in" result="shadow" />
      <feOffset in="blur" dx={off * 0.8} dy={off} result="o2" />
      <feComposite in="SourceAlpha" in2="o2" operator="arithmetic" k2={1} k3={-1} result="rim2" />
      <feFlood floodColor="#ffffff" floodOpacity={0.5} />
      <feComposite in2="rim2" operator="in" result="light" />
      <feMerge>
        <feMergeNode in="SourceGraphic" />
        <feMergeNode in="shadow" />
        <feMergeNode in="light" />
      </feMerge>
    </filter>
  );
}

export function Diagram({
  id,
  layers,
  focus = [],
  selected = null,
  related = [],
  projectionsFor,
  onSelect,
  showLabels,
  occlusion = false,
  caption,
  toolbar,
  controls = true,
  clickable,
  ariaLabel,
  className = '',
}: DiagramProps) {
  const d = getDiagram(id);
  const hostRef = useRef<HTMLDivElement>(null);
  const [labelsLocal, setLabelsLocal] = useState(true);
  const [zoomed, setZoomed] = useState(false);
  const { settings } = useProgress();
  const labelsOn = showLabels ?? labelsLocal;
  const visibleLayers = layers ?? d?.defaultLayers ?? [];
  const svgsReady = useSvgs();
  const svg = useMemo(() => d?.svg ?? '', [d, svgsReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // One-time setup per SVG: colors, a11y, keyboard.
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host || !d) return;
    const root = host.querySelector('svg');
    if (!root) return;
    root.setAttribute('role', 'group');
    root.setAttribute('aria-label', ariaLabel ?? d.title);
    root.removeAttribute('width');
    root.removeAttribute('height');
    host.querySelectorAll<SVGElement>('[data-ref]').forEach((el) => {
      const e = entity(el.dataset.ref);
      el.style.setProperty('--c', el.dataset.fill ?? colorFor(e));
      const canClick = !clickable || clickable(el.dataset.ref!);
      if (canClick && onSelect) {
        el.setAttribute('tabindex', '0');
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', occlusion ? 'Diagram region' : e?.name ?? el.dataset.ref!);
      } else {
        el.removeAttribute('tabindex');
        el.removeAttribute('role');
        el.setAttribute('aria-hidden', 'true');
        el.style.cursor = onSelect ? 'default' : 'default';
      }
      if (e?.type === 'region') el.dataset.system = e.system;
    });
    // The whole <g> of a layer is hidden by CSS unless it has .layer-on.
  }, [svg, d, onSelect, occlusion, ariaLabel, clickable]);

  // Dynamic state: layers, focus, selection, related, hatch clones, labels.
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host || !d) return;
    host.querySelectorAll('.hatch-clone, .pattern-clone').forEach((n) => n.remove());
    host.querySelectorAll<SVGGElement>('[data-layer]').forEach((g) => g.classList.toggle('layer-on', visibleLayers.includes(g.dataset.layer!)));

    const focusSet = new Set(focus);
    const relatedSet = new Set(related);
    const labelOn = new Set([...focus, ...(selected ? [selected] : [])]);
    host.querySelectorAll<SVGElement>('[data-ref]').forEach((el) => {
      const ref = el.dataset.ref!;
      el.classList.toggle('is-focus', focusSet.has(ref));
      el.classList.toggle('is-selected', ref === selected);
      el.classList.toggle('is-related', relatedSet.has(ref) && !focusSet.has(ref) && ref !== selected);
      el.setAttribute('aria-pressed', ref === selected ? 'true' : 'false');
      const hidden = el.closest('[data-layer]:not(.layer-on)');
      if (settings.patterns && !hidden && el.dataset.system && PATTERN_SYSTEMS.includes(el.dataset.system)) {
        const clone = el.cloneNode(true) as SVGElement;
        stripClone(clone);
        clone.setAttribute('class', 'pattern-clone');
        clone.style.fill = `url(#nm-pat-${el.dataset.system})`;
        el.after(clone);
      }
      if ((focusSet.has(ref) || ref === selected) && !hidden) {
        const clone = el.cloneNode(true) as SVGElement;
        stripClone(clone);
        clone.setAttribute('class', 'hatch-clone');
        el.after(clone);
      }
    });
    host.querySelectorAll<SVGElement>('[data-label-for]').forEach((l) => {
      l.classList.toggle('label-on', !occlusion && labelOn.has(l.dataset.labelFor!));
      l.classList.toggle('label-sel', l.dataset.labelFor === selected);
    });
    const projSet = new Set(projectionsFor ?? []);
    host.querySelectorAll<SVGElement>('.proj').forEach((p) => {
      p.classList.toggle('proj-on', projSet.has(p.dataset.from ?? '') || projSet.has(p.dataset.to ?? ''));
    });
  }, [svg, d, visibleLayers.join(','), focus.join(','), selected, related.join(','), occlusion, settings.patterns, projectionsFor?.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll the focused region into view when zoomed.
  useEffect(() => {
    if (!zoomed || !focus[0]) return;
    hostRef.current?.querySelector(`[data-ref="${focus[0]}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [zoomed, focus]);

  if (!d) return <div className="notice bad">Unknown diagram “{id}”.</div>;

  const pick = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return;
    // Tapping a label (or its leader line) selects the part it names.
    const el = target.closest<SVGElement>('[data-ref], [data-label-for]');
    const ref = el?.dataset.ref ?? el?.dataset.labelFor;
    if (ref && onSelect && (!clickable || clickable(ref))) onSelect(ref);
  };

  const classes = [
    'diagram',
    d.overlay && visibleLayers.some((l) => l !== 'deep') ? 'overlay' : '',
    focus.length || related.length ? 'has-focus' : '',
    projectionsFor?.length ? 'dim-proj' : '',
    labelsOn && !occlusion ? 'show-labels' : '',
    occlusion ? 'occlusion' : '',
    onSelect ? 'interactive' : '',
    zoomed ? 'zoomed' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <figure className={classes} style={{ margin: 0 }}>
      <div className="diagram-scroll">
        <div
          ref={hostRef}
          className={svg ? 'diagram-svg' : 'diagram-svg loading'}
          aria-busy={!svg || undefined}
          onClick={(e) => pick(e.target)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              pick(e.target);
            }
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
      {(controls || toolbar) && (
        <div className="diagram-toolbar">
          {toolbar}
          {controls && (
            <>
              <span className="spacer" />
              {showLabels === undefined && !occlusion && (
                <button type="button" className="chip" aria-pressed={labelsLocal} onClick={() => setLabelsLocal((v) => !v)}>
                  <Icon name="tag" size={15} /> Labels
                </button>
              )}
              <button type="button" className="chip" aria-pressed={zoomed} onClick={() => setZoomed((v) => !v)} title="Zoom in (scroll to pan)">
                <Icon name="zoom" size={15} /> Zoom
              </button>
            </>
          )}
        </div>
      )}
      {caption && <figcaption className="diagram-caption">{caption}</figcaption>}
    </figure>
  );
}

function stripClone(el: Element) {
  el.removeAttribute('data-ref');
  el.removeAttribute('tabindex');
  el.removeAttribute('role');
  el.removeAttribute('aria-label');
  el.removeAttribute('aria-pressed');
  el.removeAttribute('id');
  el.setAttribute('aria-hidden', 'true');
  el.querySelectorAll('[data-ref]').forEach((c) => c.removeAttribute('data-ref'));
}
