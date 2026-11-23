/** Reads hotspot ids (data-ref) and layers (data-layer) out of a hand-drawn SVG. */

export interface SvgScan {
  /** layer id ('' = base) -> refs */
  layerRefs: Record<string, string[]>;
  layers: string[];
  /** projection paths: data-from / data-to ids */
  links: string[];
  problems: string[];
}

export function scanSvg(svg: string): SvgScan {
  const layerRefs: Record<string, string[]> = { '': [] };
  const layers: string[] = [];
  const links: string[] = [];
  const problems: string[] = [];
  const stack: (string | null)[] = [];
  svg = svg.replace(/<!--[\s\S]*?-->/g, '');
  const tagRe = /<(\/?)([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g;
  let m: RegExpExecArray | null;
  const attr = (attrs: string, name: string) => attrs.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
  while ((m = tagRe.exec(svg))) {
    const [, closing, tag, attrs, selfClosing] = m;
    if (closing) {
      if (tag === 'g') stack.pop();
      continue;
    }
    const layer = attr(attrs, 'data-layer');
    if (tag === 'g' && !selfClosing) stack.push(layer ?? null);
    if (layer) {
      if (!layers.includes(layer)) layers.push(layer);
      layerRefs[layer] ??= [];
    }
    const current = [...stack].reverse().find((l) => l) ?? '';
    const ref = attr(attrs, 'data-ref');
    if (ref) {
      layerRefs[current] ??= [];
      if (!layerRefs[current].includes(ref)) layerRefs[current].push(ref);
    }
    for (const a of ['data-from', 'data-to']) {
      const v = attr(attrs, a);
      if (v) v.split(/\s+/).forEach((x) => links.push(x));
    }
    if (/\son[a-z]+=/i.test(attrs) || tag === 'script') problems.push(`<${tag}> contains a script or event handler`);
  }
  if (stack.length) problems.push('unbalanced <g> tags');
  return { layerRefs, layers, links, problems };
}
