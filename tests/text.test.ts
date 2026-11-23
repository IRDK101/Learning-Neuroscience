import { describe, expect, it } from 'vitest';
import { isPlural, the } from '../src/lib/text';

describe('names in sentences', () => {
  it('lowercases common names and keeps proper nouns and abbreviations', () => {
    expect(the('Thalamus')).toBe('the thalamus');
    expect(the("Broca's area")).toBe("Broca's area");
    expect(the('Basal nucleus of Meynert')).toBe('the basal nucleus of Meynert');
    expect(the('PMT complex')).toBe('the PMT complex');
  });
  it('detects plural names', () => {
    expect(isPlural('Dendrites')).toBe(true);
    expect(isPlural('Raphe nuclei')).toBe(true);
    expect(isPlural('Basal ganglia')).toBe(true);
    expect(isPlural('Corpus callosum')).toBe(false);
    expect(isPlural('Circle of Willis')).toBe(false);
    expect(isPlural('Locus coeruleus')).toBe(false);
  });
});
