import { defineConfig } from 'tsup';

export default defineConfig({
  dts: true,
  entry: ['src/index.ts'],
  sourcemap: true,
  clean: true,
  format: ['cjs', 'esm'],
  minify: true,
  bundle: true,
  skipNodeModulesBundle: true,
  outDir: 'dist',
});
