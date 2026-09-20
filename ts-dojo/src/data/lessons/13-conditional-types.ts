import type { Lesson } from '../types.ts';

export const conditionalTypes: Lesson = {
  slug: '13-conditional-types',
  block: 3,
  order: 13,
  title: 'Conditional types и дистрибуция',
  shortTitle: 'Conditional types',
  summary: 'T extends U ? X : Y и то, почему он внезапно применяется к каждому члену union.',
  theory: [
    '**Conditional type** (условный тип) — `T extends U ? X : Y`. Проверка здесь — не наследование, а assignability: «совместим ли `T` с `U`».',
    '**Distributive conditional type** (дистрибутивный) — если проверяемый тип это **голый параметр типа** и в него подставили union, условие применяется к каждому члену по отдельности, а результаты объединяются. `ToArray<string | number>` даёт `string[] | number[]`, а не `(string | number)[]`.',
    'Дистрибуция отключается, если параметр обёрнут: `[T] extends [U] ? X : Y`. Квадратные скобки — стандартная идиома, и именно так написан встроенный `Extract`… нет, наоборот: `Exclude` и `Extract` дистрибуцию используют, а `NonNullable` в современных версиях — нет.',
    'Следствие, которое ловит всех: `never` — это пустой union. При дистрибуции цикл по нулю членов даёт `never`, поэтому `ToArray<never>` это `never`, а не `never[]`. Обёртка в скобки возвращает ожидаемое поведение.',
    'Условные типы вычисляются лениво: пока `T` не известен, тип остаётся отложенным, и компилятор не может доказать про него почти ничего. Поэтому внутри generic-функции условный результат обычно требует ассерта — это цена, а не ошибка.',
  ],
  docs: [
    {
      label: 'Handbook: Conditional types',
      href: 'https://www.typescriptlang.org/docs/handbook/2/conditional-types.html',
    },
    {
      label: 'Handbook: Distributive conditional types',
      href: 'https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types',
    },
  ],
  experiments: [
    {
      id: 'distribution',
      title: 'Дистрибуция по union',
      question:
        'Два условных типа отличаются квадратными скобками. Предскажи результат для union и для never.',
      variants: [
        {
          id: 'distributive',
          label: 'Голый параметр — дистрибуция',
          code: `type ToArray<T> = T extends unknown ? T[] : never;

type Mixed = ToArray<string | number>;
type Empty = ToArray<never>;

const a: Mixed = ['строка'];
const b: Mixed = [1, 2];
const c: Mixed = ['строка', 1];
const d: Empty = [];

console.log(a, b, c, d);
`,
          verdict:
            'Две ошибки. На c: Mixed это string[] | number[] — массив, где лежат и строка, и число, не подходит ни под один член. На d: ToArray<never> дал never, а не never[] — при дистрибуции never это пустой union, цикл по нулю членов возвращает never. Обе особенности ловят на собеседованиях.',
          expect: [2322, 2322],
        },
        {
          id: 'non-distributive',
          label: 'В скобках — без дистрибуции',
          code: `type ToArray<T> = [T] extends [unknown] ? T[] : never;

type Mixed = ToArray<string | number>;
type Empty = ToArray<never>;

const a: Mixed = ['строка', 1];
const b: Empty = [];

console.log(a, b);
`,
          verdict:
            'Чисто. Обёртка [T] сделала параметр не голым, дистрибуция выключилась: Mixed это (string | number)[], поэтому смешанный массив подошёл, а Empty стал never[], в который пустой массив кладётся.',
          expect: [],
        },
        {
          id: 'exclude-inside',
          label: 'Как устроен Exclude',
          code: `type MyExclude<T, U> = T extends U ? never : T;

type Colors = 'red' | 'green' | 'blue';
type Reduced = MyExclude<Colors, 'green'>;

const a: Reduced = 'red';
const b: Reduced = 'blue';
const c: Reduced = 'green';

console.log(a, b, c);
`,
          verdict:
            'Одна ошибка — на c. Дистрибуция здесь и есть механизм: условие применилось к каждому литералу отдельно, "green" превратился в never и выпал из union. Без дистрибуции Exclude не работал бы вовсе — проверка "red" | "green" | "blue" extends "green" дала бы false целиком.',
          expect: [2322],
        },
      ],
      takeaway:
        'Дистрибуция — не побочный эффект, а инструмент. Нужна фильтрация union — оставляй параметр голым; нужна проверка union целиком — оборачивай в скобки.',
    },
    {
      id: 'deferred',
      title: 'Отложенное вычисление внутри generic',
      question:
        'Условный тип зависит от неизвестного T. Предскажи, сможет ли компилятор проверить возврат.',
      variants: [
        {
          id: 'deferred-return',
          label: 'Возврат условного типа',
          code: `type Unwrap<T> = T extends Array<infer Item> ? Item : T;

function firstOrSelf<T>(value: T): Unwrap<T> {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

console.log(firstOrSelf([1, 2]), firstOrSelf('строка'));
`,
          verdict:
            'Одна ошибка — на втором return, «T не присваивается в Unwrap<T>». Первый прошёл случайно: после Array.isArray элемент оказался достаточно широким, чтобы подойти. Причина ошибки в том, что пока T не подставлен, Unwrap<T> остаётся отложенным и доказать соответствие нечем. Это известное ограничение: внутри таких функций пишут ассерт, а гарантию держат сигнатурой и тестами.',
          expect: [2322],
        },
        {
          id: 'resolved-outside',
          label: 'Снаружи всё вычисляется',
          code: `type Unwrap<T> = T extends Array<infer Item> ? Item : T;

declare function firstOrSelf<T>(value: T): Unwrap<T>;

const fromArray = firstOrSelf([1, 2]);
const fromValue = firstOrSelf('строка');

const a: number = fromArray;
const b: string = fromValue;
const c: string = fromArray;

console.log(a, b, c);
`,
          verdict:
            'Одна ошибка — на c. В месте вызова T известен, условный тип вычисляется до конца: для массива чисел получился number, для строки — string. Проблема предыдущего варианта только внутри тела функции.',
          expect: [2322],
        },
      ],
      takeaway:
        'Условный тип полезен на границе API: снаружи он точен. Внутри обобщённой реализации он отложен, и это нормальная цена — её платят ассертом в одном месте.',
    },
  ],
  tasks: [
    {
      id: 'write-exclude',
      title: 'Фильтр union',
      brief: 'Напиши тип, убирающий из union все строковые литералы, начинающиеся не на нужную роль.',
      constraints: ['Через conditional type', 'Без готового Exclude'],
      starter: `type Role = 'admin' | 'editor' | 'viewer';

type WithoutViewer<T> = T;

const a: WithoutViewer<Role> = 'admin';
// @ts-expect-error viewer должен быть исключён
const b: WithoutViewer<Role> = 'viewer';

console.log(a, b);
`,
      starterExpect: [2578],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bExclude<', message: 'Готовый Exclude запрещён условием' },
        { kind: 'require', pattern: "extends 'viewer'", message: 'Нужен conditional type' },
      ],
      hints: [
        'Условный тип по голому параметру применяется к каждому члену union отдельно.',
        'Что нужно вернуть для члена, который надо выбросить?',
        "type WithoutViewer<T> = T extends 'viewer' ? never : T;",
      ],
      solution: `type Role = 'admin' | 'editor' | 'viewer';

type WithoutViewer<T> = T extends 'viewer' ? never : T;

const a: WithoutViewer<Role> = 'admin';
// @ts-expect-error viewer должен быть исключён
const b: WithoutViewer<Role> = 'viewer';

console.log(a, b);
`,
    },
    {
      id: 'disable-distribution',
      title: 'Отключить дистрибуцию',
      brief:
        'IsUnion должен отвечать true только для union. Сейчас из-за дистрибуции он разбирает union по одному и всегда говорит false.',
      constraints: ['Дистрибуцию отключить скобками'],
      starter: `type IsNever<T> = T extends never ? true : false;

const a: IsNever<never> = true;
const b: IsNever<string> = false;

console.log(a, b);
`,
      starterExpect: [2322],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: '\\[T\\] extends \\[never\\]', message: 'Нужна обёртка в кортеж' },
      ],
      hints: [
        'Проверь, чем оказался IsNever<never>. Почему не true?',
        'never — пустой union, и при дистрибуции цикл по нулю членов даёт never, а не результат ветки.',
        'type IsNever<T> = [T] extends [never] ? true : false;',
      ],
      solution: `type IsNever<T> = [T] extends [never] ? true : false;

const a: IsNever<never> = true;
const b: IsNever<string> = false;

console.log(a, b);
`,
    },
    {
      id: 'conditional-api',
      title: 'Условный тип на границе API',
      brief:
        'Функция возвращает одно значение для одиночного аргумента и массив для массива. Опиши это типом.',
      constraints: ['Через conditional type', 'Без перегрузок'],
      starter: `type Normalized<T> = unknown;

declare function normalize<T>(input: T): Normalized<T>;

const one = normalize('строка');
const many = normalize(['a', 'b']);

const a: string = one;
const b: string[] = many;

console.log(a, b);
`,
      starterExpect: [2322, 2322],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'extends Array<', message: 'Нужна проверка на массив' },
        { kind: 'forbid', pattern: 'function normalize\\(', message: 'Перегрузки запрещены условием' },
      ],
      hints: [
        'Нужно различить два случая: массив и не массив.',
        'Условие пишется как T extends Array<unknown> ? … : …',
        'type Normalized<T> = T extends Array<unknown> ? T : T;  — а дальше подумай, что вернуть в каждой ветке.',
      ],
      solution: `type Normalized<T> = T extends Array<unknown> ? T : T;

declare function normalize<T>(input: T): Normalized<T>;

const one = normalize('строка');
const many = normalize(['a', 'b']);

const a: string = one;
const b: string[] = many;

console.log(a, b);
`,
    },
  ],
};
