import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'sanity',
    'styled-components',
    '@sanity/ui',
    '@portabletext/react',
  ],
  noExternal: ['sanity-hermes-shared'],
});
