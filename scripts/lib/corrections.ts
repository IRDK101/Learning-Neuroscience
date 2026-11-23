/** Parses CORRECTIONS.md so badges can show the original wording and the reason. */
import type { Correction, Flag } from '../../src/content/types';

function stripMd(s: string): string {
  return s.replace(/\*\*/g, '').replace(/`/g, '').trim();
}

export function parseCorrections(md: string): { corrections: Record<string, Correction>; flags: Record<string, Flag> } {
  const corrections: Record<string, Correction> = {};
  const flags: Record<string, Flag> = {};

  // Corrections: a "**C-001 · Where**" header followed by "- Notes:", "- Fixed:", "- Why:" bullets.
  // "Fixed:" may continue on indented sub-bullets.
  const blocks = md.split(/\n(?=\*\*C-\d{3} )/);
  for (const block of blocks) {
    const head = block.match(/^\*\*(C-\d{3}) · (.+?)\*\*/);
    if (!head) continue;
    const field = (name: string) => {
      // Not multiline: "$" must mean end of block, or multi-line values get cut at their first line.
      const m = block.match(new RegExp(`(?:^|\\n)- ${name}:\\s*([\\s\\S]*?)(?=\\n- [A-Z][a-z]+:|\\n\\n|$)`));
      if (!m) return '';
      return stripMd(
        m[1]
          .split('\n')
          .map((l) => l.replace(/^\s*- /, '• ').trim())
          .join('\n'),
      );
    };
    corrections[head[1]] = {
      id: head[1],
      where: stripMd(head[2]),
      notes: field('Notes').replace(/^"|"$/g, ''),
      fixed: field('Fixed'),
      why: field('Why'),
    };
  }

  // Flags: markdown table rows "| F-01 | where | notes | why |"
  for (const line of md.split('\n')) {
    const m = line.match(/^\|\s*(F-\d{2})\s*\|(.+?)\|(.+?)\|(.+?)\|\s*$/);
    if (m) flags[m[1]] = { id: m[1], where: stripMd(m[2]), notes: stripMd(m[3]), why: stripMd(m[4]) };
  }
  return { corrections, flags };
}
