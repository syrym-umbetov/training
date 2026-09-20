# 01 — Structural typing, assignability, excess property checks

## Теория

**Structural typing** (структурная типизация) — тип совместим с другим не по имени, а по форме.
`A` присваиваем к `B`, если у `A` есть всё, что требует `B`. Лишнее в `A` не мешает.

**Assignability** (совместимость по присваиванию) — направленное отношение. `Point3D → Point2D`
проходит, обратно нет. Всегда спрашивай себя: «кто источник, кто приёмник».

**Excess property check** (проверка лишних свойств) — исключение из правила выше. Оно срабатывает
только для *свежего* объектного литерала (freshness), присваиваемого напрямую. Стоит завести
промежуточную переменную — проверка не срабатывает, и лишнее свойство проходит. Это не баг,
а осознанный компромисс: литерал почти всегда опечатка, переменная — переиспользование.

**Номинальность через `private`** — единственный встроенный способ сломать структурность:
класс с `private`/`#`-полем совместим только сам с собой, по месту объявления.

## Документация

- [Handbook: Type Compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)
- [Handbook: Object Types → Excess Property Checks](https://www.typescriptlang.org/docs/handbook/2/objects.html#excess-property-checks)
- [Handbook: Interfaces vs Type Aliases](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces)
- [Handbook: Classes → Relationships Between Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html#relationships-between-classes)

## Как работать

```bash
npm run check   # tsc --noEmit — стартовое состояние красное, это нормально
npm test        # vitest run --typecheck
```

Задания в `exercise.ts`, проверки в `exercise.test.ts`. Тесты не трогай.
