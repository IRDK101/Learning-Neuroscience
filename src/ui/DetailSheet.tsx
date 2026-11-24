/**
 * The card that opens when you tap a labelled part of a diagram: what it is, what it does,
 * what it connects to, and where it is taught. Sits beside/below the diagram on wide screens
 * and slides up from the bottom on phones. Escape or the close button dismisses it.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router';
import { entity } from '../content';
import { Icon } from './bits';
import { InfoPanel } from './InfoPanel';

export function DetailSheet({
  id,
  onClose,
  onShowConnected,
  connectedOn,
  extra,
  mapLink,
  className = '',
}: {
  id: string | null | undefined;
  onClose: () => void;
  onShowConnected?: () => void;
  connectedOn?: boolean;
  extra?: ReactNode;
  /** Show an "open in the map" link (off on the map page itself). */
  mapLink?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const e = entity(id ?? undefined);

  useEffect(() => {
    if (!e) return;
    const onKey = (ev: KeyboardEvent) => ev.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    ref.current?.scrollTo({ top: 0 });
    return () => window.removeEventListener('keydown', onKey);
  }, [e, onClose]);

  if (!e) return null;
  return (
    <div ref={ref} className={`detail-sheet panel ${className}`} role="region" aria-label={`About ${e.name}`}>
      <div className="detail-sheet-bar">
        <span className="detail-sheet-grip" aria-hidden="true" />
        {mapLink && (
          <Link className="small" to={mapLink}>
            <Icon name="map" size={15} /> Open in the map
          </Link>
        )}
        <span className="spacer" />
        <button type="button" className="chip" onClick={onClose} aria-label={`Close details for ${e.name}`}>
          Close
        </button>
      </div>
      <InfoPanel id={e.id} onShowConnected={onShowConnected} connectedOn={connectedOn} extra={extra} />
    </div>
  );
}
