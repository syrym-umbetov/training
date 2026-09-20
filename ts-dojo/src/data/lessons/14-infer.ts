import type { Lesson } from '../types.ts';

export const inferKeyword: Lesson = {
  slug: '14-infer',
  block: 3,
  order: 14,
  title: 'infer — как достать тип изнутри типа',
  shortTitle: 'infer',
  summary: 'Объявление переменной типа прямо в условии: элемент массива, результат функции, ключи.',
  theory: [
    '`infer X` объявляет переменную типа внутри `extends`-условия. Компилятор подбирает `X` так, чтобы проверяемый тип совпал с образцом, и делает `X` доступным в ветке `true`.',
    'Так устроены почти все встроенные утилиты: `ReturnType<T> = T extends (...args: never[]) => infer R ? R : never`. Образец описывает форму, `infer` вынимает нужный кусок.',
    'Если образцу соответствует несколько вариантов, компилятор объединяет кандидатов: в ковариантной позиции — в union, в контравариантной (параметры функции) — в intersection. Отсюда странные `A & B` при выводе из перегруженных функций.',
    'Несколько `infer` в одном образце работают одновременно: `T extends [infer First, ...infer Rest]` разбирает кортеж на голову и хвост — основа рекурсивных типов.',
    '`infer X extends Y` (TS 4.8) добавляет ограничение прямо в объявление: удобно, когда нужно сразу получить, например, строковый литерал, а не `unknown`.',
  ],
  docs: [
    {
      label: 'Handbook: Inferring within conditional types',
      href: 'https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#inferring-within-conditional-types',
    },
    {
      label: 'TS 4.8: infer extends',
      href: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-8.html',
    },
  ],
  experiments: [
    {
      id: 'infer-basics',
      title: 'Что можно вынуть образцом',
      question:
        'Предскажи, чем окажется выведённый тип в каждом случае.',
      variants: [
        {
          id: 'element-and-return',
          label: 'Элемент массива и результат функции',
          code: `type ElementOf<T> = T extends Array<infer Item> ? Item : never;
type ResultOf<T> = T extends (...args: never[]) => infer R ? R : never;

type A = ElementOf<string[]>;
type B = ResultOf<() => number>;
type C = ElementOf<string>;

const a: A = 'строка';
const b: B = 42;
const c: A = 42;

console.log(a, b, c);
`,
          verdict:
            'Одна ошибка — на c. A это string, B это number. C оказался never: строка не подошла под образец Array<infer Item>, и вернулась ветка false. Образец — это форма, которой тип должен соответствовать целиком.',
          expect: [2322],
        },
        {
          id: 'tuple-head-tail',
          label: 'Голова и хвост кортежа',
          code: `type Head<T> = T extends [infer First, ...infer _Rest] ? First : never;
type Tail<T> = T extends [infer _First, ...infer Rest] ? Rest : never;

type Row = [string, number, boolean];

const head: Head<Row> = 'строка';
const tail: Tail<Row> = [42, true];
const wrongTail: Tail<Row> = ['строка', true];

console.log(head, tail, wrongTail);
`,
          verdict:
            'Одна ошибка — на wrongTail. Два infer в одном образце сработали одновременно: Head дал string, Tail дал [number, boolean]. Именно так рекурсивные типы обходят кортежи — по одному элементу за шаг.',
          expect: [2322],
        },
        {
          id: 'infer-positions',
          label: 'Несколько кандидатов',
          code: `type FromUnion<T> = T extends Array<infer Item> ? Item : never;
type FromParams<T> = T extends (a: infer P, b: infer P) => unknown ? P : never;

type A = FromUnion<string[] | number[]>;
type B = FromParams<(a: string, b: number) => void>;

const a1: A = 'строка';
const a2: A = 42;
const b1: B = 'строка';

console.log(a1, a2, b1);
`,
          verdict:
            'Одна ошибка — на b1. A собрал union string | number: дистрибуция прошла по членам, кандидаты объединились. B — параметры функции, это контравариантная позиция, поэтому кандидаты пересеклись: string & number даёт never, и присвоить туда нельзя ничего.',
          expect: [2322],
        },
      ],
      takeaway:
        'infer читается как «подбери тип, при котором образец совпадёт». Направление объединения кандидатов зависит от позиции: значения объединяются в union, параметры — в intersection.',
    },
    {
      id: 'infer-extends',
      title: 'infer с ограничением',
      question:
        'Предскажи, что даст infer без ограничения и с ним при разборе строкового шаблона.',
      variants: [
        {
          id: 'without-constraint',
          label: 'Без ограничения',
          code: `type VersionOf<T> = T extends \`v\${infer N}\` ? N : never;

type Raw = VersionOf<'v12'>;

const asString: Raw = '12';
const asNumber: Raw = 12;

console.log(asString, asNumber);
`,
          verdict:
            'Одна ошибка — на asNumber. N вывелось как строковый литерал "12", а не число: infer из шаблона всегда даёт строку, даже когда внутри одни цифры. Поэтому разбор версий и путей упирается в приведение типа.',
          expect: [2322],
        },
        {
          id: 'with-constraint',
          label: 'infer extends number',
          code: `type VersionOf<T> = T extends \`v\${infer N extends number}\` ? N : never;

type Parsed = VersionOf<'v12'>;

const value: Parsed = 12;
const wrong: Parsed = '12';

console.log(value, wrong);
`,
          verdict:
            'Одна ошибка — на wrong. infer N extends number не просто ограничил: компилятор преобразовал строковый литерал "12" в числовой литерал 12. Это стандартный способ получить число из строкового шаблона на уровне типов.',
          expect: [2322],
        },
      ],
      takeaway:
        'infer extends задаёт и проверку, и приведение: из шаблона можно получить число, а не только строку.',
    },
  ],
  tasks: [
    {
      id: 'write-returntype',
      title: 'Написать ReturnType',
      brief: 'Реализуй извлечение возвращаемого типа функции.',
      constraints: ['Без готового ReturnType', 'Через infer'],
      starter: `type MyReturnType<T> = unknown;

declare function handler(): { id: number };

type Result = MyReturnType<typeof handler>;

const value: Result = { id: 1 };
// @ts-expect-error строка не подходит
const wrong: Result = 'строка';

console.log(value, wrong);
`,
      starterExpect: [2578],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bReturnType<', message: 'Готовый ReturnType запрещён' },
        { kind: 'require', pattern: 'infer', message: 'Нужен infer' },
      ],
      hints: [
        'Опиши образец «это функция» и пометь в нём место, которое хочешь вынуть.',
        'Параметры удобно принимать как (...args: never[]).',
        'type MyReturnType<T> = T extends (...args: never[]) => infer R ? R : never;',
      ],
      solution: `type MyReturnType<T> = T extends (...args: never[]) => infer R ? R : never;

declare function handler(): { id: number };

type Result = MyReturnType<typeof handler>;

const value: Result = { id: 1 };
// @ts-expect-error строка не подходит
const wrong: Result = 'строка';

console.log(value, wrong);
`,
    },
    {
      id: 'unwrap-promise',
      title: 'Развернуть Promise',
      brief:
        'Достань тип, которым разрешается промис. Для не-промиса верни сам тип.',
      constraints: ['Без готового Awaited', 'Один уровень вложенности достаточно'],
      starter: `type Unwrap<T> = T;

type A = Unwrap<Promise<number>>;
type B = Unwrap<string>;

const a: A = 42;
const b: B = 'строка';

console.log(a, b);
`,
      starterExpect: [2322],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bAwaited<', message: 'Готовый Awaited запрещён' },
        { kind: 'require', pattern: 'infer', message: 'Нужен infer' },
      ],
      hints: [
        'Образец — Promise<чего-то>. Что поставить вместо «чего-то»?',
        'В ветке false нужно вернуть исходный тип, а не never.',
        'type Unwrap<T> = T extends Promise<infer Value> ? Value : T;',
      ],
      solution: `type Unwrap<T> = T extends Promise<infer Value> ? Value : T;

type A = Unwrap<Promise<number>>;
type B = Unwrap<string>;

const a: A = 42;
const b: B = 'строка';

console.log(a, b);
`,
    },
    {
      id: 'parse-route',
      title: 'Достать параметр из пути',
      brief:
        'Из строкового литерала вида /users/:id вынь имя параметра.',
      constraints: ['Через infer в template literal type'],
      starter: `type ParamOf<T> = never;

type A = ParamOf<'/users/:id'>;

const a: A = 'id';
// @ts-expect-error другого параметра там нет
const b: A = 'slug';

console.log(a, b);
`,
      starterExpect: [2322],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'infer', message: 'Нужен infer' },
        { kind: 'require', pattern: '\\$\\{infer', message: 'infer должен быть внутри шаблона' },
      ],
      hints: [
        'Образец — строковый шаблон с двоеточием.',
        'Всё, что после двоеточия, нужно поймать в переменную типа.',
        "type ParamOf<T> = T extends `${string}:${infer Param}` ? Param : never;",
      ],
      solution: `type ParamOf<T> = T extends \`\${string}:\${infer Param}\` ? Param : never;

type A = ParamOf<'/users/:id'>;

const a: A = 'id';
// @ts-expect-error другого параметра там нет
const b: A = 'slug';

console.log(a, b);
`,
    },
  ],
};
