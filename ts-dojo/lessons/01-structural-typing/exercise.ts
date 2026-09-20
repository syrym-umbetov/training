// Lesson 01 — structural typing, assignability, excess property checks.
// Fill in every TODO. Do not edit exercise.test.ts.

// ---------------------------------------------------------------------------
// Exercise 1 — assignability
//
// `logId` must accept any object that carries a numeric `id`, no matter what
// else it holds. It must reject an object whose `id` is a string, and reject
// an object with no `id` at all.
//
// TODO: replace `unknown` with the narrowest type that makes this work.
// ---------------------------------------------------------------------------

export type HasId = unknown;

export function logId(entity: HasId): number {
  return entity.id;
}

// ---------------------------------------------------------------------------
// Exercise 2 — excess property check, and the hole in it
//
// `Options` describes what the library reads. We want to keep `timeout` in the
// actual runtime value (some older build reads it), but `options` must still be
// typed as `Options`.
//
// Constraints: do not change `Options`, do not use `as`, do not use `any`.
//
// TODO: make this compile while `timeout: 1000` survives at runtime.
// ---------------------------------------------------------------------------

export type Options = { retries: number };

export const options: Options = { retries: 3, timeout: 1000 };

// ---------------------------------------------------------------------------
// Exercise 3 — excess property check against a union
//
// `Shape` is a union. The literal below is rejected. Before you fix it, be able
// to say WHICH member TS compared it against and why the extra key is fatal
// here but merely "excess" elsewhere.
//
// TODO: make `shape` a valid `Circle` with radius 1. Keep the annotation `Shape`.
// ---------------------------------------------------------------------------

export type Circle = { kind: 'circle'; radius: number };
export type Square = { kind: 'square'; size: number };
export type Shape = Circle | Square;

export const shape: Shape = { kind: 'circle', radius: 1, size: 2 };

// ---------------------------------------------------------------------------
// Exercise 4 — implicit index signature
//
// `readAll` takes a string-keyed dictionary of numbers. Passing `SensorAlias`
// works. Passing `SensorIface` does not — even though the two describe the
// exact same shape.
//
// Constraints: do not touch `Dict`, do not touch `readAll`, and `SensorIface`
// must stay an `interface`.
//
// TODO: change the declaration of `SensorIface` so `readAll(iface)` compiles.
// ---------------------------------------------------------------------------

export type Dict = { [key: string]: number };

export type SensorAlias = { temp: number; humidity: number };

export interface SensorIface {
  temp: number;
  humidity: number;
}

export function readAll(d: Dict): number[] {
  return Object.values(d);
}

// ---------------------------------------------------------------------------
// Exercise 5 — breaking structural typing on purpose
//
// Both classes hold a single number, so today they are freely interchangeable —
// which is exactly the bug: a Fahrenheit reading silently passes as Celsius.
//
// Constraints: keep both as classes, keep `value` public and readable,
// keep `new Celsius(20).value === 20` working. No extra runtime field may be
// required by the constructor.
//
// TODO: make `Celsius` and `Fahrenheit` mutually incompatible.
// ---------------------------------------------------------------------------

export class Celsius {
  constructor(public value: number) {}
}

export class Fahrenheit {
  constructor(public value: number) {}
}
