import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { buildContent } from './scripts/lib/build';

/** Serves the validated content bundle as `virtual:content` and reloads when content/ changes. */
function contentPlugin(): Plugin {
  const id = 'virtual:content';
  const resolved = '\0' + id;
  return {
    name: 'neuromap-content',
    resolveId: (source) => (source === id ? resolved : undefined),
    load(loadId) {
      if (loadId !== resolved) return;
      const { bundle, errors, warnings, files } = buildContent(process.cwd());
      files.forEach((f) => this.addWatchFile(f));
      warnings.forEach((w) => this.warn(w));
      if (errors.length) throw new Error(`Content errors (run npm run validate):\n${errors.join('\n')}`);
      return `export default JSON.parse(${JSON.stringify(JSON.stringify(bundle))});`;
    },
    configureServer(server) {
      const root = path.resolve('content');
      const reload = (file: string) => {
        if (!file.startsWith(root) && !file.endsWith('CORRECTIONS.md')) return;
        const mod = server.moduleGraph.getModuleById(resolved);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.add([root, path.resolve('CORRECTIONS.md')]);
      server.watcher.on('change', reload);
      server.watcher.on('add', reload);
      server.watcher.on('unlink', reload);
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
