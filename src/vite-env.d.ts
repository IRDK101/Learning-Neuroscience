/// <reference types="vite/client" />
declare module 'virtual:content' {
  /** The compiled ContentBundle (see src/content/types.ts); typed in src/content/index.ts. */
  const bundle: unknown;
  export default bundle;
}
