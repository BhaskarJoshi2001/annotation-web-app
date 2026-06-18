// Ambient declarations for side-effect CSS imports (e.g. `import './ds.css'`).
// Next.js handles CSS at the bundler level; this satisfies the TypeScript
// language server (TS2882) under moduleResolution: "bundler".
declare module '*.css';
