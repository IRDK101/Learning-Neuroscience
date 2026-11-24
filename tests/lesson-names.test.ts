import { describe, expect, it } from 'vitest';
import { inSentenceName } from '../scripts/lib/lessons';

describe('inSentenceName', () => {
  it('lowercases common nouns mid-sentence', () => {
    expect(inSentenceName('Dermatome', 'one strip of skin, a ')).toBe('dermatome');
    expect(inSentenceName('Neurotransmitter', 'a **')).toBe('neurotransmitter');
  });
  it('keeps capitals at sentence and list starts', () => {
    expect(inSentenceName('Dermatome', '')).toBe('Dermatome');
    expect(inSentenceName('Dermatome', 'Done. ')).toBe('Dermatome');
    expect(inSentenceName('Dermatome', 'intro\n- ')).toBe('Dermatome');
  });
  it('keeps proper nouns and acronyms', () => {
    expect(inSentenceName('ALS', 'has ')).toBe('ALS');
    expect(inSentenceName('Brown-Séquard syndrome', 'this is ')).toBe('Brown-Séquard syndrome');
    expect(inSentenceName("Broca's area", 'in ')).toBe("Broca's area");
  });
});
