/** Small helpers for putting entity names into sentences. Shared by the content generator and the app. */

/** "Dendrites", "Raphe nuclei", "SNARE proteins" are plural; "Corpus callosum" and "Nucleus" are not. */
export const isPlural = (name: string) => /(?<![sui])s$|nuclei$|glia$/i.test(name.split(' (')[0].trim());
/** Name inside a sentence: lowercase common nouns, keep proper nouns and abbreviations, add "the" when natural. */
export function the(name: string): string {
  if (/'s\b/.test(name)) return name; // Broca's area
  const words = name.split(' ');
  const first = words[0];
  const keep = /^[A-Z0-9-]{2,}$/.test(first) || /^[A-Z][a-z]+(?: of| [A-Z])/.test(name) && /[A-Z]/.test(words.slice(1).join(' ').charAt(0));
  const lowered = keep ? name : first.charAt(0).toLowerCase() + first.slice(1) + (words.length > 1 ? ' ' + words.slice(1).join(' ') : '');
  return `the ${lowered}`;
}

