import type { Lesson } from '../types.ts';

export const constTypeParameters: Lesson = {
  slug: '10-const-type-parameters',
  block: 2,
  order: 10,
  title: 'const type parameters',
  shortTitle: 'const-параметры',
  summary: 'Как сохранить литеральные типы аргумента, не требуя as const от вызывающего.',
  theory: [
    'Проблема: вызывающий передаёт массив или объект, а компилятор расширяет литералы — `["a", "b"]` становится `string[]`, и точность теряется до того, как функция успела что-то сделать.',
    'Классическое лечение — попросить `as const` на месте вызова. Оно работает, но это требование к пользователю API: забудет — молча получит расширенный тип.',
    '**const type parameter** (TypeScript 5.0) переносит это требование в объявление: `function f<const T>(value: T)` заставляет компилятор выводить `T` так, будто аргумент написан с `as const`.',
    'Важная граница: `const` влияет только на **вывод из литерального выражения**. Если передать переменную, объявленную заранее, её тип уже расширен — и `const`-параметр ничего не вернёт.',
    'Ограничение управляет тем, каким выйдет результат: с `<const T extends string[]>` выводится изменяемый кортеж `["a", "b"]`, с `<const T extends readonly string[]>` — `readonly ["a", "b"]`. Оба варианта рабочие, и выбирать надо по тому, что функция делает с аргументом дальше.',
  ],
  docs: [
    {
      label: 'TS 5.0: const type parameters',
      href: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#const-type-parameters',
    },
    {
      label: 'Handbook: const assertions',
      href: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions',
    },
  ],
  experiments: [
    {
      id: 'const-param',
      title: 'Что меняет const у параметра типа',
      question:
        'Две одинаковые функции, отличие в одном слове. Предскажи типы результатов.',
      variants: [
        {
          id: 'without-const',
          label: 'Без const',
          code: `function listOf<T>(items: T[]): T[] {
  return items;
}

const result = listOf(['чтение', 'запись']);

const exact: Array<'чтение' | 'запись'> = result;

console.log(exact);
`,
          verdict:
            'Ошибка TS2322: выведено string[], а требуется Array<"чтение" | "запись">. Литералы расширились при выводе — обычное поведение, из-за которого приходится просить as const на месте вызова.',
          expect: [2322],
        },
        {
          id: 'with-const',
          label: 'С const',
          code: `function listOf<const T>(items: T[]): T[] {
  return items;
}

const result = listOf(['чтение', 'запись']);

const exact: Array<'чтение' | 'запись'> = result;

console.log(exact);
`,
          verdict:
            'Чисто. const у параметра типа заставил выводить литерально, как если бы вызывающий написал as const. Требование переехало из места вызова в объявление функции — там ему и место.',
          expect: [],
        },
        {
          id: 'const-and-variable',
          label: 'const не помогает переменной',
          code: `function listOf<const T>(items: T[]): T[] {
  return items;
}

const permissions = ['чтение', 'запись'];
const result = listOf(permissions);

const exact: Array<'чтение' | 'запись'> = result;

console.log(exact);
`,
          verdict:
            'Ошибка снова есть. Граница, которую важно знать: const влияет на вывод из литерального выражения в месте вызова. permissions объявлен заранее и уже имеет тип string[] — возвращать литералы неоткуда.',
          expect: [2322],
        },
      ],
      takeaway:
        'const-параметр — это as const, перенесённый в сигнатуру. Он работает по выражению аргумента, а не по типу переменной.',
    },
    {
      id: 'const-constraint',
      title: 'const вместе с ограничением',
      question:
        'Ограничение отличается одним словом readonly. Предскажи, каким выйдет тип результата в каждом случае.',
      variants: [
        {
          id: 'mutable-constraint',
          label: 'Ограничение string[]',
          code: `function tags<const T extends string[]>(items: T): T {
  return items;
}

const result = tags(['новое', 'важное']);

const mutable: ['новое', 'важное'] = result;
const frozen: readonly ['новое', 'важное'] = result;

console.log(mutable, frozen);
`,
          verdict:
            'Чисто — оба присваивания прошли. Ограничение string[] потребовало изменяемый тип, и const вывел изменяемый кортеж ["новое", "важное"], сохранив литералы. Изменяемый кортеж присваивается и в readonly-версию, поэтому вторая строка тоже легальна.',
          expect: [],
        },
        {
          id: 'readonly-constraint',
          label: 'Ограничение readonly string[]',
          code: `function tags<const T extends readonly string[]>(items: T): T {
  return items;
}

const result = tags(['новое', 'важное']);

const frozen: readonly ['новое', 'важное'] = result;
const mutable: ['новое', 'важное'] = result;

console.log(frozen, mutable);
`,
          verdict:
            'Одна ошибка — на mutable. Ограничение readonly позволило вывести readonly-кортеж, а он в изменяемый уже не присваивается: readonly снимать нельзя. Выбор ограничения решает, сможет ли вызывающий положить результат в изменяемую структуру.',
          expect: [4104],
        },
      ],
      takeaway:
        'const сохраняет литералы, а изменяемость результата задаёт ограничение. readonly в ограничении — не обязанность, а решение: он защищает аргумент от изменения, но закрывает вызывающему путь в изменяемые структуры.',
    },
  ],
  tasks: [
    {
      id: 'route-builder',
      title: 'Сохранить литералы без as const',
      brief:
        'defineSteps должна возвращать точные литеральные типы шагов, а вызывающий не должен писать as const.',
      constraints: ['as const в месте вызова запрещён', 'Без any'],
      starter: `function defineSteps<T extends readonly string[]>(steps: T): T {
  return steps;
}

const steps = defineSteps(['выбор', 'оплата', 'готово']);

type Step = (typeof steps)[number];

const current: Step = 'оплата';
// @ts-expect-error такого шага нет
const wrong: Step = 'отмена';

console.log(current, wrong);
`,
      starterExpect: [2578],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: '<const T extends readonly string\\[\\]>', message: 'Нужен const-параметр типа' },
        { kind: 'forbid', pattern: "\\] as const", message: 'as const в месте вызова запрещён' },
      ],
      hints: [
        'Сейчас Step это string, поэтому директива @ts-expect-error не сработала.',
        'Нужно, чтобы вывод сохранил литералы, но требовать as const от вызывающего нельзя.',
        'Добавь const перед T в объявлении: <const T extends readonly string[]>',
      ],
      solution: `function defineSteps<const T extends readonly string[]>(steps: T): T {
  return steps;
}

const steps = defineSteps(['выбор', 'оплата', 'готово']);

type Step = (typeof steps)[number];

const current: Step = 'оплата';
// @ts-expect-error такого шага нет
const wrong: Step = 'отмена';

console.log(current, wrong);
`,
    },
    {
      id: 'fix-constraint',
      title: 'Починить конфликт const и ограничения',
      brief:
        'freeze обязана возвращать неизменяемый кортеж — сейчас результат можно положить в изменяемый массив. Закрой эту возможность через ограничение.',
      constraints: ['const у параметра типа оставить', 'Без as'],
      starter: `function freeze<const T extends object[]>(items: T): T {
  return items;
}

const result = freeze([{ id: 1 }, { id: 2 }]);

// @ts-expect-error результат должен быть неизменяемым
const mutable: [{ id: 1 }, { id: 2 }] = result;

console.log(mutable);
`,
      starterExpect: [2578],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'const T extends readonly object\\[\\]', message: 'Ограничение должно быть readonly' },
      ],
      hints: [
        'Директива @ts-expect-error не сработала — значит результат сейчас изменяемый. Что это определяет?',
        'Каким выйдет T, решает ограничение: изменяемое ограничение даёт изменяемый кортеж.',
        'Допиши readonly в ограничение.',
      ],
      solution: `function freeze<const T extends readonly object[]>(items: T): T {
  return items;
}

const result = freeze([{ id: 1 }, { id: 2 }]);

// @ts-expect-error результат неизменяем
const mutable: [{ id: 1 }, { id: 2 }] = result;

console.log(mutable);
`,
    },
  ],
};
