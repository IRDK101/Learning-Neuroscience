import { describe, expect, it } from 'vitest';
import { scanSvg } from '../scripts/lib/svg';
import { parseCorrections } from '../scripts/lib/corrections';
import { linkTerms } from '../scripts/lib/lessons';
import { mask } from '../scripts/lib/generate';
import { parseAttrs, shuffled } from '../scripts/lib/util';
import type { Entity } from '../src/content/schema';

describe('scanSvg', () => {
  it('finds hotspots per layer and ignores comments', () => {
    const svg = `<svg><!-- <g data-layer="fake"> --><path data-ref="a"/><g data-layer="x"><g><ellipse data-ref="b"/></g></g><path class="proj" data-from="b" data-to="a"/></svg>`;
    const s = scanSvg(svg);
    expect(s.layerRefs['']).toEqual(['a']);
    expect(s.layerRefs.x).toEqual(['b']);
    expect(s.layers).toEqual(['x']);
    expect(s.links).toEqual(['b', 'a']);
    expect(s.problems).toEqual([]);
  });
  it('flags scripts and unbalanced groups', () => {
    expect(scanSvg('<svg><g><path onclick="x()"/></svg>').problems.length).toBe(2);
  });
});

describe('parseCorrections', () => {
  it('reads corrections and flag rows', () => {
    const md = `**C-001 · Topic › Thing**\n- Notes: "old"\n- Fixed: new\n  - sub point\n- Why: because\n\n| F-01 | Where | notes | why |`;
    const { corrections, flags } = parseCorrections(md);
    expect(corrections['C-001']).toMatchObject({ where: 'Topic › Thing', notes: 'old', why: 'because' });
    expect(corrections['C-001'].fixed).toContain('sub point');
    expect(flags['F-01'].why).toBe('why');
  });
});

describe('linkTerms', () => {
  const ctx = {
    entityName: () => undefined,
    hasCorrection: () => true,
    hasFlag: () => true,
    termIndex: [
      ['Dopamine', 'dopamine', false],
      ['DA', 'dopamine', true],
      ['VTA', 'vta', true],
    ] as [string, string, boolean][],
  };
  it('links the first mention only, case rules respected, and skips headings', () => {
    const seen = new Set<string>();
    const out = linkTerms('<h2>Dopamine</h2><p>dopamine and DA and da. The VTA.</p>', ctx, seen, new Set());
    expect(out).toContain('<h2>Dopamine</h2>');
    expect(out.match(/data-ref="dopamine"/g)).toHaveLength(1);
    expect(out).toContain('<dfn class="term" data-ref="vta" tabindex="0">VTA</dfn>');
    expect(out).toContain(' da.');
  });
});

describe('generator helpers', () => {
  it('masks an entity name and aliases', () => {
    const e = { name: 'Ventral tegmental area', aliases: ['VTA'] } as unknown as Entity;
    expect(mask('The VTA, or ventral tegmental area, sends dopamine', e, 'it')).toBe('The it, or it, sends dopamine');
  });
  it('seeded shuffle is deterministic', () => {
    expect(shuffled([1, 2, 3, 4, 5], 'seed')).toEqual(shuffled([1, 2, 3, 4, 5], 'seed'));
  });
  it('parses directive attributes', () => {
    expect(parseAttrs(`id="nt-overlay" highlight='a,b' n=3`)).toEqual({ id: 'nt-overlay', highlight: 'a,b', n: '3' });
  });
});
