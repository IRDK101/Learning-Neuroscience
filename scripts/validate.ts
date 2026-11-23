/** npm run validate — builds all content and fails on any schema or reference error. */
import { buildContent } from './lib/build';

const { bundle, errors, warnings } = buildContent();
for (const w of warnings) console.warn(`⚠  ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`✖  ${e}`);
  console.error(`\n${errors.length} content error(s). Fix them and run npm run validate again.`);
  process.exit(1);
}
const count = (t: string) => Object.values(bundle.entities).filter((e) => e.type === t).length;
console.log(
  `✔ content OK: ${Object.keys(bundle.entities).length} entities ` +
    `(${['region', 'neurotransmitter', 'drug', 'molecule', 'pathway', 'case', 'concept', 'term'].map((t) => `${count(t)} ${t}`).join(', ')}), ` +
    `${bundle.lessons.length} lessons, ${bundle.diagrams.length} diagrams, ` +
    `${bundle.cards.length} cards (${bundle.cards.filter((c) => !c.generated).length} hand-written), ` +
    `${bundle.questions.length} questions (${bundle.questions.filter((q) => !q.generated).length} hand-written), ` +
    `${Object.keys(bundle.corrections).length} corrections logged.`,
);
