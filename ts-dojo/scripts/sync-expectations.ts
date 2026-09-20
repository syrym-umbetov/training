/**
 * Fills in the `expect` / `starterExpect` fields of every lesson from what the
 * compiler actually reports, and prints each snippet's diagnostics so the
 * written verdict can be compared against reality.
 *
 * Run: node --experimental-strip-types scripts/sync-expectations.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { lessons } from '../src/data/index.ts';
import { check, describeDiagnostics } from '../src/data/compile.ts';

const only = process.argv[2];

for (const lesson of lessons) {
  if (only !== undefined && !lesson.slug.includes(only)) continue;

  const path = new URL(`../src/data/lessons/${lesson.slug}.ts`, import.meta.url);
  let source = readFileSync(path, 'utf8');
  let changed = 0;

  const put = (anchorId: string, field: string, codes: number[]) => {
    const pattern = new RegExp(`(id: '${anchorId}',[\\s\\S]*?${field}: )\\[[^\\]]*\\]`);
    if (!pattern.test(source)) throw new Error(`${lesson.slug}: не найден ${field} у «${anchorId}»`);
    const next = source.replace(pattern, (_m, head: string) => `${head}[${codes.join(', ')}]`);
    if (next !== source) changed += 1;
    source = next;
  };

  console.log(`\n=== ${lesson.slug} ===`);

  for (const experiment of lesson.experiments) {
    for (const variant of experiment.variants) {
      const codes = check(variant.code);
      put(variant.id, 'expect', codes);
      console.log(`  [${experiment.id}/${variant.id}] ${codes.length === 0 ? 'чисто' : codes.join(', ')}`);
      for (const line of describeDiagnostics(variant.code)) console.log(`      ${line}`);
    }
  }

  for (const task of lesson.tasks) {
    const starterCodes = check(task.starter);
    put(task.id, 'starterExpect', starterCodes);
    const solutionCodes = check(task.solution);
    console.log(
      `  [task/${task.id}] стартовый: ${starterCodes.join(', ') || 'ЧИСТО — задание бессмысленно'}` +
        ` | решение: ${solutionCodes.join(', ') || 'чисто'}`,
    );
    if (solutionCodes.length > 0) {
      for (const line of describeDiagnostics(task.solution)) console.log(`      РЕШЕНИЕ ПАДАЕТ: ${line}`);
    }
  }

  writeFileSync(path, source);
  console.log(`  обновлено полей: ${changed}`);
}
