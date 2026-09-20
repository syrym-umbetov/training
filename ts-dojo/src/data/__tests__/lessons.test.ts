import { describe, expect, test } from 'vitest';
import { lessons } from '../index.ts';
import { check, describeDiagnostics } from '../compile.ts';
import type { Check } from '../types.ts';

function checksPass(code: string, codes: number[], checks: Check[]): string[] {
  const failures: string[] = [];
  for (const c of checks) {
    switch (c.kind) {
      case 'noErrors':
        if (codes.length > 0) failures.push(`ожидалось 0 ошибок, получено ${codes.join(', ')}`);
        break;
      case 'errorCodes': {
        const missing = c.codes.filter((x) => !codes.includes(x));
        if (missing.length > 0) failures.push(`не хватает кодов ${missing.join(', ')}`);
        break;
      }
      case 'forbid':
        if (new RegExp(c.pattern).test(code)) failures.push(`решение нарушает запрет: ${c.message}`);
        break;
      case 'require':
        if (!new RegExp(c.pattern).test(code)) failures.push(`решение не выполняет: ${c.message}`);
        break;
    }
  }
  return failures;
}

describe.each(lessons.map((l) => [l.slug, l] as const))('%s', (_slug, lesson) => {
  test('урок зарегистрирован с уникальным порядковым номером', () => {
    const sameOrder = lessons.filter((l) => l.order === lesson.order);
    expect(sameOrder).toHaveLength(1);
  });

  describe.each(lesson.experiments.map((e) => [e.title, e] as const))(
    'эксперимент: %s',
    (_title, experiment) => {
      test.each(experiment.variants.map((v) => [v.label, v] as const))(
        'вариант «%s» даёт заявленные ошибки',
        (_label, variant) => {
          const actual = check(variant.code);
          expect(
            actual,
            `фактические диагностики:\n${describeDiagnostics(variant.code).join('\n')}`,
          ).toEqual(variant.expect);
        },
      );
    },
  );

  describe.each(lesson.tasks.map((t) => [t.title, t] as const))('задание: %s', (_title, task) => {
    test('стартовый код падает ровно так, как заявлено', () => {
      const actual = check(task.starter);
      expect(
        actual,
        `фактические диагностики:\n${describeDiagnostics(task.starter).join('\n')}`,
      ).toEqual(task.starterExpect);
    });

    test('эталонное решение проходит все проверки задания', () => {
      const codes = check(task.solution);
      const failures = checksPass(task.solution, codes, task.checks);
      expect(
        failures,
        `диагностики решения:\n${describeDiagnostics(task.solution).join('\n')}`,
      ).toEqual([]);
    });

    test('подсказки идут от направления к коду', () => {
      expect(task.hints.length).toBeGreaterThanOrEqual(2);
    });
  });
});
