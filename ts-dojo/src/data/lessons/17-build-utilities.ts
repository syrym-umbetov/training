import type { Lesson } from '../types.ts';

export const buildUtilities: Lesson = {
  slug: '17-build-utilities',
  block: 3,
  order: 17,
  title: 'Написать встроенные утилиты самому',
  shortTitle: 'Свои утилиты',
  summary: 'Partial, Pick, Omit, Exclude, ReturnType, Awaited — и что внутри каждой.',
  theory: [
    'Все утилиты из `lib.es5.d.ts` написаны на тех же четырёх приёмах, что мы прошли: mapped type, conditional type, `infer` и key remapping. Ни одной магии — кроме `Uppercase` и родственников, реализованных внутри компилятора.',
    '`Partial`, `Required`, `Readonly` — гомоморфные mapped types с модификаторами `?`, `-?`, `readonly`.',
    '`Pick<T, K>` — mapped type по union ключей: `{ [P in K]: T[P] }`. `Omit<T, K>` в стандартной библиотеке выражен через `Pick<T, Exclude<keyof T, K>>`, но его можно написать и напрямую через key remapping.',
    '`Exclude` и `Extract` целиком держатся на дистрибуции условных типов. `NonNullable<T>` в современных версиях определён как `T & {}` — пересечение с пустым объектом отбрасывает `null` и `undefined` без всякого условия.',
    'Важная деталь `Omit`: он **не гомоморфен** и не проверяет, что ключи существуют. `Omit<User, "phon">` с опечаткой молча вернёт исходный тип — поэтому в строгих кодовых базах пишут свой `StrictOmit` с ограничением `K extends keyof T`.',
  ],
  docs: [
    {
      label: 'Handbook: Utility types',
      href: 'https://www.typescriptlang.org/docs/handbook/utility-types.html',
    },
    {
      label: 'lib.es5.d.ts в исходниках TypeScript',
      href: 'https://github.com/microsoft/TypeScript/blob/main/src/lib/es5.d.ts',
    },
  ],
  experiments: [
    {
      id: 'omit-is-loose',
      title: 'Omit не проверяет ключи',
      question:
        'В обоих вызовах ключ написан с опечаткой. Предскажи, где компилятор это заметит.',
      variants: [
        {
          id: 'builtin-omit',
          label: 'Встроенный Omit',
          code: `type User = { id: number; email: string; phone: string };

type WithTypo = Omit<User, 'phon'>;

const value: WithTypo = { id: 1, email: 'a@b.c', phone: '+7' };

console.log(value);
`,
          verdict:
            'Чисто — и это ловушка. Omit объявлен как Omit<T, K extends keyof never>, то есть принимает любую строку. Опечатка прошла, ничего не удалилось, и тип остался прежним: phone на месте.',
          expect: [],
        },
        {
          id: 'strict-omit',
          label: 'Свой StrictOmit',
          code: `type User = { id: number; email: string; phone: string };

type StrictOmit<T, K extends keyof T> = {
  [P in keyof T as P extends K ? never : P]: T[P];
};

type WithTypo = StrictOmit<User, 'phon'>;

const value: WithTypo = { id: 1, email: 'a@b.c' };

console.log(value);
`,
          verdict:
            'Две ошибки, и первая — главная. TS2344 прямо на подстановке: "phon" не удовлетворяет keyof User. Вторая (TS2741) — следствие: раз ключ не распознан, phone не удалился и объект без него не подошёл. Ограничение K extends keyof T — единственное отличие от встроенного Omit, и именно оно превращает опечатку в ошибку сборки.',
          expect: [2344, 2741],
        },
      ],
      takeaway:
        'Встроенный Omit намеренно допускает лишние ключи ради обратной совместимости. Свой строгий вариант — три строки и ловит целый класс опечаток.',
    },
    {
      id: 'nonnullable-trick',
      title: 'Как устроен NonNullable',
      question:
        'Предскажи, что даст пересечение с пустым объектом.',
      variants: [
        {
          id: 'intersection-trick',
          label: 'T & {}',
          code: `type MyNonNullable<T> = T & {};

type A = MyNonNullable<string | null | undefined>;

const a: A = 'строка';
const b: A = null;

console.log(a, b);
`,
          verdict:
            'Одна ошибка — на b. Пересечение с {} отбрасывает null и undefined: они единственные типы, у которых нет свойств вообще, поэтому пересечение с «объектом хоть с чем-то» даёт never для них. Именно так NonNullable определён в современной стандартной библиотеке.',
          expect: [2322],
        },
      ],
      takeaway:
        'T & {} — идиома, а не случайность. Знать её полезно: она встречается в чужом коде там, где ждёшь условный тип.',
    },
  ],
  tasks: [
    {
      id: 'my-partial',
      title: 'Partial и Required',
      brief: 'Реализуй обе утилиты через модификаторы mapped type.',
      constraints: ['Без готовых Partial и Required'],
      starter: `type MyPartial<T> = T;
type MyRequired<T> = T;

type Source = { id: number; note?: string };

const a: MyPartial<Source> = {};
const b: MyRequired<Source> = { id: 1, note: 'есть' };
// @ts-expect-error note обязателен
const c: MyRequired<Source> = { id: 1 };

console.log(a, b, c);
`,
      starterExpect: [2741, 2578],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bPartial<|\\bRequired<', message: 'Готовые утилиты запрещены' },
        { kind: 'require', pattern: '\\]\\?:', message: 'Нужен модификатор ?' },
        { kind: 'require', pattern: '\\]-\\?:', message: 'Нужен модификатор -?' },
      ],
      hints: [
        'Оба типа — гомоморфные mapped types по keyof T.',
        'Один добавляет модификатор, другой снимает его знаком минус.',
        '{ [K in keyof T]?: T[K] } и { [K in keyof T]-?: T[K] }',
      ],
      solution: `type MyPartial<T> = { [K in keyof T]?: T[K] };
type MyRequired<T> = { [K in keyof T]-?: T[K] };

type Source = { id: number; note?: string };

const a: MyPartial<Source> = {};
const b: MyRequired<Source> = { id: 1, note: 'есть' };
// @ts-expect-error note обязателен
const c: MyRequired<Source> = { id: 1 };

console.log(a, b, c);
`,
    },
    {
      id: 'my-pick-omit',
      title: 'Pick и строгий Omit',
      brief:
        'Реализуй Pick через mapped type, а Omit — через key remapping, с проверкой ключей.',
      constraints: ['Без готовых Pick, Omit, Exclude', 'Ключи должны проверяться'],
      starter: `type MyPick<T, K> = T;
type MyOmit<T, K> = T;

type User = { id: number; email: string; phone: string };

const picked: MyPick<User, 'id' | 'email'> = { id: 1, email: 'a@b.c' };
const omitted: MyOmit<User, 'phone'> = { id: 1, email: 'a@b.c' };

console.log(picked, omitted);
`,
      starterExpect: [2741, 2741],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bPick<|\\bOmit<|\\bExclude<', message: 'Готовые утилиты запрещены' },
        { kind: 'require', pattern: 'K extends keyof T', message: 'Ключи нужно ограничить' },
        { kind: 'require', pattern: 'as P extends K', message: 'Omit пишется через key remapping' },
      ],
      hints: [
        'Pick — цикл по переданным ключам, а не по keyof T.',
        'Omit — цикл по keyof T, где ненужные ключи превращаются в never.',
        'type MyPick<T, K extends keyof T> = { [P in K]: T[P] };',
      ],
      solution: `type MyPick<T, K extends keyof T> = { [P in K]: T[P] };
type MyOmit<T, K extends keyof T> = {
  [P in keyof T as P extends K ? never : P]: T[P];
};

type User = { id: number; email: string; phone: string };

const picked: MyPick<User, 'id' | 'email'> = { id: 1, email: 'a@b.c' };
const omitted: MyOmit<User, 'phone'> = { id: 1, email: 'a@b.c' };

console.log(picked, omitted);
`,
    },
    {
      id: 'my-awaited',
      title: 'Awaited с вложенностью',
      brief:
        'Разверни промис любой глубины вложенности: Promise<Promise<number>> должен дать number.',
      constraints: ['Без готового Awaited', 'Через рекурсию'],
      starter: `type MyAwaited<T> = T;

type A = MyAwaited<Promise<Promise<number>>>;
type B = MyAwaited<string>;

const a: A = 42;
const b: B = 'строка';

console.log(a, b);
`,
      starterExpect: [2322],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bAwaited<', message: 'Готовый Awaited запрещён' },
        { kind: 'require', pattern: 'MyAwaited<Value>', message: 'Нужна рекурсия' },
      ],
      hints: [
        'Начни с одного уровня: T extends Promise<infer Value> ? Value : T.',
        'Что делать, если Value сам оказался промисом?',
        'Применить к нему тот же тип: MyAwaited<Value>.',
      ],
      solution: `type MyAwaited<T> = T extends Promise<infer Value> ? MyAwaited<Value> : T;

type A = MyAwaited<Promise<Promise<number>>>;
type B = MyAwaited<string>;

const a: A = 42;
const b: B = 'строка';

console.log(a, b);
`,
    },
    {
      id: 'my-parameters',
      title: 'Parameters',
      brief: 'Достань кортеж типов параметров функции.',
      constraints: ['Без готового Parameters', 'Через infer'],
      starter: `type MyParameters<T> = never;

declare function send(url: string, retries: number): void;

type Args = MyParameters<typeof send>;

const args: Args = ['/api', 3];
// @ts-expect-error порядок и типы важны
const wrong: Args = [3, '/api'];

console.log(args, wrong);
`,
      starterExpect: [2322],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bParameters<', message: 'Готовый Parameters запрещён' },
        { kind: 'require', pattern: 'infer', message: 'Нужен infer' },
      ],
      hints: [
        'Образец описывает функцию, но вынуть надо не результат, а список параметров.',
        'Список параметров — это кортеж, его можно поймать через rest-элемент.',
        'type MyParameters<T> = T extends (...args: infer A) => unknown ? A : never;',
      ],
      solution: `type MyParameters<T> = T extends (...args: infer A) => unknown ? A : never;

declare function send(url: string, retries: number): void;

type Args = MyParameters<typeof send>;

const args: Args = ['/api', 3];
// @ts-expect-error порядок и типы важны
const wrong: Args = [3, '/api'];

console.log(args, wrong);
`,
    },
  ],
};
