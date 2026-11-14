// The data files are bundled by wrangler (esbuild). Declared as unknown so TypeScript does not infer a type from the
// 1 MB index; src/worker/data.ts casts them to their checked shapes.
declare module '*/data/signbank/index.json' {
  const value: unknown;
  export default value;
}
declare module '*/data/overrides.json' {
  const value: unknown;
  export default value;
}
