/// <reference types="vite/client" />
declare module 'virtual:content' {
  /** The compiled ContentBundle (see src/content/types.ts); typed in src/content/index.ts. */
  const bundle: unknown;
  export default bundle;
}
declare module 'virtual:content-svgs' {
  /** Deduplicated diagram SVG markup; Diagram.svgKey indexes into it. */
  const svgs: string[];
  export default svgs;
}
declare module 'virtual:content-lessons' {
  /** Lesson blocks, keyed by lesson id. */
  const lessons: Record<string, import('./content/types').LessonBlock[]>;
  export default lessons;
}
declare module 'virtual:content-practice' {
  /** Card and question text, keyed by id. */
  const practice: {
    cards: Record<string, [string, string]>;
    questions: Record<string, { stem: string; options: import('./content/types').QuestionOption[]; explain?: string }>;
  };
  export default practice;
}
