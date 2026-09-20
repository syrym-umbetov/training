import { test, expect, expectTypeOf } from 'vitest';
import {
  logId,
  options,
  shape,
  readAll,
  Celsius,
  Fahrenheit,
  type Options,
  type SensorAlias,
  type SensorIface,
} from './exercise.js';

test('ex1 — structural typing lets extra properties through', () => {
  const user = { id: 7, name: 'Syrym' };
  expect(logId(user)).toBe(7);

  const bare = { id: 1 };
  expect(logId(bare)).toBe(1);
});

test('ex1 — but the shape still has to match', () => {
  const stringId = { id: 'seven' };
  // @ts-expect-error `id` must be a number
  logId(stringId);

  const noId = { name: 'Syrym' };
  // @ts-expect-error `id` is required
  logId(noId);
});

test('ex2 — the extra property survives at runtime, the type stays narrow', () => {
  expectTypeOf(options).toEqualTypeOf<Options>();
  expect(options.retries).toBe(3);
  expect((options as Record<string, unknown>).timeout).toBe(1000);
});

test('ex3 — the union member is picked, the foreign key is gone', () => {
  expect(shape).toEqual({ kind: 'circle', radius: 1 });
});

test('ex4 — both the alias and the interface reach a Dict', () => {
  const alias: SensorAlias = { temp: 21, humidity: 40 };
  const iface: SensorIface = { temp: 21, humidity: 40 };

  expect(readAll(alias).sort((a, b) => a - b)).toEqual([21, 40]);
  expect(readAll(iface).sort((a, b) => a - b)).toEqual([21, 40]);
});

test('ex5 — the two units stopped being interchangeable', () => {
  const c = new Celsius(20);
  const f = new Fahrenheit(68);

  expect(c.value).toBe(20);
  expect(f.value).toBe(68);

  // @ts-expect-error a Celsius reading is not a Fahrenheit reading
  const wrong1: Fahrenheit = c;
  // @ts-expect-error a Fahrenheit reading is not a Celsius reading
  const wrong2: Celsius = f;

  expect(wrong1).toBeDefined();
  expect(wrong2).toBeDefined();
});
