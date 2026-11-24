/**
 * Lesson compiler. Lessons are Markdown with a few directives (see CONTENT_GUIDE.md):
 *
 *   ::diagram{id="nt-overlay" highlight="locus-coeruleus" layers="ne" caption="…"}
 *   ::focus{highlight="substantia-nigra,striatum" layers="da"}
 *   ::check{q="q-nt-cocaine"}
 *   ::pathway{id="catecholamine-synthesis"}
 *   :::added            (beginner context, not from the notes)
 *   …markdown…
 *   :::
 *
 * Inline: [[entity-id]] or [[label|entity-id]] links an entity; {{C-022}} / {{F-07}} cite a
 * correction or flag (validated, not rendered). Known terms are auto-linked to hover definitions.
 */
import { Marked } from 'marked';
import YAML from 'yaml';
import { LessonFront } from '../../src/content/schema';
import type { LessonBlock, Lesson } from '../../src/content/types';
import { escapeHtml, escapeRegExp, list, parseAttrs, slugify, type ContentErrors } from './util';

export interface LessonContext {
  entityName: (id: string) => string | undefined;
  hasCorrection: (id: string) => boolean;
  hasFlag: (id: string) => boolean;
  termIndex: [string, string, boolean][];
}

const marked = new Marked({ gfm: true, breaks: false });

/**
 * A bare [[id]] shows the entity's name. Mid-sentence, a common-noun name is lowercased
 * ("the [[dermatome]]" → "the dermatome"); sentence starts, acronyms and names with
 * other capitals (Brown-Séquard syndrome, Organ of Corti) keep their capitals.
 */
export function inSentenceName(name: string, before: string): string {
  const prev = before.replace(/[\s*_(["“]+$/, '');
  if (prev === '' || /[.!?:]$/.test(prev) || /(^|\n)\s*([-*+]|\d+\.|\|)$/.test(prev)) return name;
  const first = name.split(/\s/)[0];
  if (!/^[A-Z][a-z]/.test(first) || /[A-Z]/.test(name.slice(1)) || /['’]/.test(first)) return name;
  return name[0].toLowerCase() + name.slice(1);
}

function inline(md: string, ctx: LessonContext, where: string, errors: ContentErrors, mentions: Set<string>): string {
  return md
    .replace(/\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, (_, a: string, b: string | undefined, offset: number, whole: string) => {
      let id = (b ?? a).trim();
      let name = ctx.entityName(id);
      // [[Agoraphobia]] → id "agoraphobia", shown as typed.
      const slug = id.toLowerCase().replace(/\s+/g, '-');
      if (!name && !b && ctx.entityName(slug)) {
        id = slug;
        name = ctx.entityName(slug);
        b = slug;
      }
      if (!name) {
        errors.add(where, `[[${id}]] is not a known entity id`);
        return a;
      }
      mentions.add(id);
      const label = b ? a.trim() : inSentenceName(name, whole.slice(0, offset));
      return `<a class="ref" data-ref="${id}" href="#/entity/${id}">${escapeHtml(label)}</a>`;
    })
    .replace(/[ \t]*\{\{([CF]-\d{2,3})\}\}/g, (_, id: string) => {
      const isC = id.startsWith('C-');
      if (isC ? !ctx.hasCorrection(id) : !ctx.hasFlag(id)) {
        errors.add(where, `{{${id}}} is not in CORRECTIONS.md`);
        return '';
      }
      // Checked, but not rendered: corrections are listed on the Common misconceptions page instead.
      return '';
    });
}

/** Wrap the first mention of each known term in a hover definition. Skips headings, links, code, buttons. */
export function linkTerms(html: string, ctx: LessonContext, seen: Set<string>, mentions: Set<string>): string {
  const sensitive = ctx.termIndex.filter((t) => t[2]);
  const insensitive = ctx.termIndex.filter((t) => !t[2]);
  const build = (terms: [string, string, boolean][], flags: string) => {
    if (!terms.length) return null;
    const sorted = [...terms].sort((a, b) => b[0].length - a[0].length);
    const map = new Map(sorted.map(([form, id]) => [flags.includes('i') ? form.toLowerCase() : form, id]));
    const re = new RegExp(`(?<![\\w-])(${sorted.map(([f]) => escapeRegExp(f)).join('|')})(s|es)?(?![\\w-])`, flags);
    return { re, map };
  };
  const passes = [build(sensitive, 'g'), build(insensitive, 'gi')].filter(Boolean) as { re: RegExp; map: Map<string, string> }[];
  let out = html;
  for (const { re, map } of passes) {
    const parts = out.split(/(<[^>]+>)/);
    let skipDepth = 0;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (p.startsWith('<')) {
        if (/^<(a|h[1-6]|code|pre|button|dfn)[\s>]/i.test(p)) skipDepth++;
        else if (/^<\/(a|h[1-6]|code|pre|button|dfn)>/i.test(p)) skipDepth = Math.max(0, skipDepth - 1);
        continue;
      }
      if (skipDepth > 0 || !p.trim()) continue;
      parts[i] = p.replace(re, (whole: string, form: string) => {
        const id = map.get(re.flags.includes('i') ? form.toLowerCase() : form);
        if (!id || seen.has(id)) return whole;
        seen.add(id);
        mentions.add(id);
        return `<dfn class="term" data-ref="${id}" tabindex="0">${whole}</dfn>`;
      });
    }
    out = parts.join('');
  }
  return out;
}

export function compileLesson(
  file: string,
  raw: string,
  topic: string,
  ctx: LessonContext,
  errors: ContentErrors,
): (Lesson & {
  checkIds: string[];
  directiveRefs: { diagram: string; ids: string[] }[];
  pathwayIds: string[];
  anchorFor: Record<string, string>;
  sections: { anchor: string; text: string }[];
}) | null {
  const fm = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!fm) {
    errors.add(file, 'missing front matter (--- title / summary / minutes ---)');
    return null;
  }
  const front = LessonFront.safeParse(YAML.parse(fm[1]));
  if (!front.success) {
    errors.add(file, `front matter: ${front.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
    return null;
  }
  const base = file.split('/').pop()!.replace(/\.md$/, '');
  const orderMatch = base.match(/^(\d+)-/);
  const slug = base.replace(/^\d+-/, '');
  const blocks: LessonBlock[] = [];
  const mentions = new Set<string>();
  const seenTerms = new Set<string>();
  const checkIds: string[] = [];
  const pathwayIds: string[] = [];
  const directiveRefs: { diagram: string; ids: string[] }[] = [];
  const anchors: string[] = [];
  const anchorFor: Record<string, string> = {};
  let currentAnchor = '';
  let currentDiagram = '';
  const sections: { anchor: string; text: string }[] = [{ anchor: '', text: '' }];

  const noteMentions = (ids: Iterable<string>) => {
    for (const id of ids) if (!(id in anchorFor)) anchorFor[id] = currentAnchor;
  };

  const renderMd = (md: string) => {
    const before = new Set(mentions);
    const html = linkTerms(marked.parse(inline(md, ctx, file, errors, mentions)) as string, ctx, seenTerms, mentions);
    noteMentions([...mentions].filter((m) => !before.has(m)));
    return html;
  };

  const body = raw.slice(fm[0].length).split('\n');
  let chunk: string[] = [];
  const flush = () => {
    const md = chunk.join('\n').trim();
    chunk = [];
    if (md) blocks.push({ type: 'html', html: renderMd(md) });
  };

  for (let i = 0; i < body.length; i++) {
    const line = body[i];
    sections[sections.length - 1].text += line + '\n';
    const heading = line.match(/^(##|###)\s+(.+?)(?:\s+\{#([a-z0-9-]+)\})?\s*$/);
    const container = line.match(/^:::(added|note|tip)\s*$/);
    const directive = line.match(/^::([a-z]+)\{(.*)\}\s*$/);
    if (heading) {
      flush();
      const text = heading[2];
      const anchor = heading[3] ?? slugify(text);
      if (anchors.includes(anchor)) errors.add(file, `duplicate heading anchor #${anchor}`);
      anchors.push(anchor);
      currentAnchor = anchor;
      sections.push({ anchor, text: '' });
      blocks.push({ type: 'heading', level: heading[1] === '##' ? 2 : 3, text, anchor });
    } else if (container) {
      flush();
      const inner: string[] = [];
      i++;
      while (i < body.length && body[i].trim() !== ':::') {
        sections[sections.length - 1].text += body[i] + '\n';
        inner.push(body[i++]);
      }
      if (i >= body.length) errors.add(file, `:::${container[1]} block is never closed with :::`);
      blocks.push({ type: 'aside', kind: container[1] as 'added' | 'note' | 'tip', html: renderMd(inner.join('\n')) });
    } else if (directive) {
      flush();
      const [, name, attrSrc] = directive;
      const attrs = parseAttrs(attrSrc);
      if (name === 'diagram') {
        if (!attrs.id) errors.add(file, '::diagram needs id="…"');
        currentDiagram = attrs.id;
        const highlight = list(attrs.highlight);
        highlight.forEach((h) => mentions.add(h));
        noteMentions(highlight);
        directiveRefs.push({ diagram: attrs.id, ids: highlight });
        blocks.push({ type: 'diagram', diagram: attrs.id, highlight, layers: list(attrs.layers), caption: attrs.caption });
      } else if (name === 'focus') {
        if (!currentDiagram) errors.add(file, '::focus must come after a ::diagram');
        const highlight = list(attrs.highlight);
        highlight.forEach((h) => mentions.add(h));
        noteMentions(highlight);
        directiveRefs.push({ diagram: currentDiagram, ids: highlight });
        blocks.push({ type: 'focus', highlight, layers: attrs.layers !== undefined ? list(attrs.layers) : undefined });
      } else if (name === 'check') {
        if (!attrs.q) errors.add(file, '::check needs q="…"');
        checkIds.push(attrs.q);
        blocks.push({ type: 'check', question: attrs.q });
      } else if (name === 'pathway') {
        if (!attrs.id) errors.add(file, '::pathway needs id="…"');
        pathwayIds.push(attrs.id);
        mentions.add(attrs.id);
        noteMentions([attrs.id]);
        blocks.push({ type: 'pathway', pathway: attrs.id });
      } else {
        errors.add(file, `unknown directive ::${name}`);
      }
    } else {
      chunk.push(line);
    }
  }
  flush();

  if (checkIds.length < 1) errors.warn(file, 'lesson has no ::check questions');
  return {
    id: `${topic}/${slug}`,
    topic,
    slug,
    order: orderMatch ? Number(orderMatch[1]) : 99,
    title: front.data.title,
    summary: front.data.summary,
    minutes: front.data.minutes,
    blocks,
    anchors,
    mentions: [...mentions],
    checkIds,
    directiveRefs,
    pathwayIds,
    anchorFor,
    sections,
  };
}
