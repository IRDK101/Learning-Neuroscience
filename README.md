# NeuroMap

An interactive site for learning and reviewing introductory neuroscience (PSYC 6), built from course notes
(`notes/PSYC6_notes.pdf`). Clickable brain diagrams, short lessons, FSRS spaced-repetition flashcards and games.
Static site; progress is saved in the browser.

## Run it

```bash
npm install
npm run dev        # local dev server; edits to content/ reload automatically
npm run validate   # check all content (schemas, IDs, diagram hotspots, corrections)
npm test           # unit tests
npm run build      # validate + type-check + production build into dist/
npm run content:report nt-systems   # print every generated card/question for a topic
```

## Where things live

- `content/`: all learning content (YAML entities, Markdown lessons, SVG diagrams). See `PLAN.md` §2–3.
- `CORRECTIONS.md`: every place the site differs from the notes, and why.
- `scripts/lib/`: the content build (validation, cross-references, card/question generation).
- `src/`: the React app.

Pushing to `main` runs `.github/workflows/deploy.yml`: validate → type-check → test → build → GitHub Pages.
