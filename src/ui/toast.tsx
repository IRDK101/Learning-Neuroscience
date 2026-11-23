import { useEffect, useState } from 'react';

type Listener = (msg: string) => void;
const listeners = new Set<Listener>();

export function toast(msg: string) {
  listeners.forEach((l) => l(msg));
}

export function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let timer: number | undefined;
    const l: Listener = (m) => {
      setMsg(m);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setMsg(null), 2200);
    };
    listeners.add(l);
    return () => {
      listeners.delete(l);
      window.clearTimeout(timer);
    };
  }, []);
  return msg ? (
    <div className="toast" role="status" aria-live="polite">
      {msg}
    </div>
  ) : null;
}

/** Copy a deep link (hash route) to the clipboard. */
export async function copyLink(hashPath: string) {
  const url = `${window.location.origin}${window.location.pathname}#${hashPath.startsWith('/') ? hashPath : `/${hashPath}`}`;
  try {
    await navigator.clipboard.writeText(url);
    toast('Link copied');
  } catch {
    window.prompt('Copy this link:', url);
  }
}
