import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['lessons/**/*.test.ts'],
    typecheck: {
      enabled: true,
      include: ['lessons/**/*.test.ts'],
      tsconfig: './tsconfig.json',
    },
  },
});
