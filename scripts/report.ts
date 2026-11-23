/** npm run content:report [topic] — prints every generated card and question so you can eyeball them. */
import { buildContent } from './lib/build';

const topic = process.argv[2];
const { bundle, errors } = buildContent();
if (errors.length) console.error(`(${errors.length} validation errors — run npm run validate)`);
const cards = bundle.cards.filter((c) => !topic || c.topic === topic);
const qs = bundle.questions.filter((q) => !topic || q.topic === topic);
console.log(`# Cards (${cards.length})\n`);
for (const c of cards) console.log(`[${c.id}] (${c.kind}${c.generated ? ', generated' : ''})\n  Q: ${c.front}\n  A: ${c.back}\n`);
console.log(`# Questions (${qs.length})\n`);
for (const q of qs) {
  console.log(`[${q.id}]${q.generated ? ' (generated)' : ''}\n  ${q.stem}`);
  for (const o of q.options) console.log(`   ${o.correct ? '✓' : '·'} ${o.text}`);
  console.log(`  lesson: ${q.lesson ?? '—'}\n`);
}
