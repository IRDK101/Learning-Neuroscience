import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { buildContent } from './scripts/lib/build';

/**
 * Serves the validated content bundle as three virtual modules:
 *   virtual:content           metadata the app needs on every page (loaded up front)
 *   virtual:content-svgs      diagram SVG markup, deduplicated (lazy chunk)
 *   virtual:content-practice  card and question text (lazy chunk)
 *   virtual:content-lessons   lesson bodies (lazy chunk)
 * src/content/lazy.ts loads the two lazy chunks and fills them into the bundle in place.
 */
function contentPlugin(): Plugin {
  const ids = ['virtual:content', 'virtual:content-svgs', 'virtual:content-practice', 'virtual:content-lessons'];
  let cache: Record<string, unknown> | null = null;

  function split(ctx: { addWatchFile: (f: string) => void; warn: (w: string) => void }) {
    if (cache) return cache;
    const { bundle, errors, warnings, files } = buildContent(process.cwd());
    files.forEach((f) => ctx.addWatchFile(f));
    warnings.forEach((w) => ctx.warn(w));
    if (errors.length) throw new Error(`Content errors (run npm run validate):\n${errors.join('\n')}`);

    const svgs: string[] = [];
    const svgIndex = new Map<string, number>();
    const diagrams = bundle.diagrams.map((d) => {
      if (!svgIndex.has(d.svg)) {
        svgIndex.set(d.svg, svgs.length);
        svgs.push(d.svg);
      }
      return { ...d, svg: '', svgKey: svgIndex.get(d.svg)! };
    });
    const cardText: Record<string, [string, string]> = {};
    const cards = bundle.cards.map((c) => {
      cardText[c.id] = [c.front, c.back];
      return { ...c, front: '', back: '' };
    });
    const questionText: Record<string, Pick<typeof bundle.questions[number], 'stem' | 'options' | 'explain'>> = {};
    const questions = bundle.questions.map((q) => {
      questionText[q.id] = { stem: q.stem, options: q.options, explain: q.explain };
      return { ...q, stem: '', options: [], explain: undefined };
    });
    const lessonBlocks: Record<string, unknown> = {};
    const lessons = bundle.lessons.map((l) => {
      lessonBlocks[l.id] = l.blocks;
      return { ...l, blocks: [] };
    });
    cache = {
      'virtual:content': { ...bundle, diagrams, cards, questions, lessons },
      'virtual:content-lessons': lessonBlocks,
      'virtual:content-svgs': svgs,
      'virtual:content-practice': { cards: cardText, questions: questionText },
    };
    return cache;
  }

  return {
    name: 'neuromap-content',
    resolveId: (source) => (ids.includes(source) ? '\0' + source : undefined),
    load(loadId) {
      const id = loadId.startsWith('\0') ? loadId.slice(1) : loadId;
      if (!ids.includes(id)) return;
      const data = split(this)[id];
      return `export default JSON.parse(${JSON.stringify(JSON.stringify(data))});`;
    },
    configureServer(server) {
      const root = path.resolve('content');
      const reload = (file: string) => {
        if (!file.startsWith(root) && !file.endsWith('CORRECTIONS.md')) return;
        cache = null;
        for (const id of ids) {
          const mod = server.moduleGraph.getModuleById('\0' + id);
          if (mod) server.moduleGraph.invalidateModule(mod);
        }
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.add([root, path.resolve('CORRECTIONS.md')]);
      server.watcher.on('change', reload);
      server.watcher.on('add', reload);
      server.watcher.on('unlink', reload);
    },
    buildStart() {
      cache = null;
    },
  };
}

export default defineConfig({
  // Relative base + hash routing = works on GitHub Pages at any repo path.
  base: './',
  plugins: [react(), contentPlugin()],
  build: {
    chunkSizeWarningLimit: 900,
  },
});
