import type { Lesson } from '../types.ts';

export const overloads: Lesson = {
  slug: '19-overloads',
  block: 4,
  order: 19,
  title: 'Overloads против union-параметров и generics',
  shortTitle: 'Overloads',
  summary: 'Три способа описать функцию с разными формами вызова и цена каждого.',
  theory: [
    '**Overload** (перегрузка) — несколько сигнатур перед одной реализацией. Компилятор выбирает первую подходящую **сверху вниз** и на этом останавливается, поэтому порядок сигнатур меняет поведение.',
    'Сигнатура реализации не участвует в выборе и снаружи не видна. Она должна быть совместима со всеми объявленными, но проверяется слабо — расхождение между ней и перегрузками компилятор часто пропускает.',
    'Главный недостаток перегрузок: они не связывают вход с выходом при **union-аргументе**. Если передать `string | number` туда, где перегрузки объявлены для `string` и для `number` по отдельности, ни одна не подойдёт.',
    '**Union-параметр** (`(value: string | number) => string | number`) принимает всё, но теряет связь: вызывающему придётся сужать результат самому.',
    '**Generic с conditional type** связывает вход и выход и работает с union, но делает сигнатуру сложнее для чтения и требует ассерта внутри реализации. Практическое правило: две-три фиксированные формы — перегрузки; связь «какой вход, такой выход» — generic; всё остальное — разные функции с разными именами.',
  ],
  docs: [
    {
      label: 'Handbook: Function overloads',
      href: 'https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads',
    },
    {
      label: 'Handbook: Writing good overloads',
      href: 'https://www.typescriptlang.org/docs/handbook/2/functions.html#writing-good-overloads',
    },
  ],
  experiments: [
    {
      id: 'three-ways',
      title: 'Три способа, одна задача',
      question:
        'Функция удваивает строку или число. Предскажи, какой из трёх вариантов не примет union-аргумент.',
      variants: [
        {
          id: 'with-overloads',
          label: 'Перегрузки',
          code: `function double(value: string): string;
function double(value: number): number;
function double(value: string | number): string | number {
  return typeof value === 'string' ? value + value : value * 2;
}

const a: string = double('ха');
const b: number = double(2);

declare const mixed: string | number;
const c = double(mixed);

console.log(a, b, c);
`,
          verdict:
            'Одна ошибка TS2769 на double(mixed): «No overload matches this call». Перегрузки проверяются по одной, и union не подходит ни под string, ни под number целиком. Это главное ограничение перегрузок, и обходится оно только добавлением третьей сигнатуры.',
          expect: [2769],
        },
        {
          id: 'with-union',
          label: 'Union-параметр',
          code: `function double(value: string | number): string | number {
  return typeof value === 'string' ? value + value : value * 2;
}

declare const mixed: string | number;
const c = double(mixed);

const a: string = double('ха');

console.log(a, c);
`,
          verdict:
            'Одна ошибка — на a. Union-аргумент прошёл, но связь потеряна: результат всегда string | number, даже когда на входе точно строка. Вызывающий обязан сужать сам — цена простоты.',
          expect: [2322],
        },
        {
          id: 'with-generic',
          label: 'Generic с conditional type',
          code: `type Doubled<T> = T extends string ? string : number;

declare function double<T extends string | number>(value: T): Doubled<T>;

const a: string = double('ха');
const b: number = double(2);

declare const mixed: string | number;
const c = double(mixed);

const d: string = c;

console.log(a, b, c, d);
`,
          verdict:
            'Одна ошибка — на d. Generic справился со всеми тремя вызовами: для строки вывел string, для числа number, а для union — благодаря дистрибуции — string | number, который в string уже не кладётся. Это единственный из трёх вариантов, который и связывает типы, и принимает union.',
          expect: [2322],
        },
      ],
      takeaway:
        'Перегрузки читаются лучше всех и ломаются на union. Generic с условным типом мощнее, но сложнее. Union-параметр проще всех и ничего не гарантирует.',
    },
    {
      id: 'overload-order',
      title: 'Порядок перегрузок решает',
      question:
        'Две одинаковые перегрузки переставлены местами. Предскажи, что вернёт вызов.',
      variants: [
        {
          id: 'wrong-order',
          label: 'Широкая сигнатура первой',
          code: `function find(input: unknown): undefined;
function find(input: string): string;
function find(input: unknown): unknown {
  return typeof input === 'string' ? input : undefined;
}

const result: string = find('искомое');

console.log(result);
`,
          verdict:
            'Ошибка TS2322: результат оказался undefined. Компилятор идёт сверху вниз и берёт первую подходящую сигнатуру — unknown принимает строку, поэтому до второй перегрузки дело не дошло. Широкие сигнатуры всегда ставят последними.',
          expect: [2322],
        },
        {
          id: 'right-order',
          label: 'Узкая сигнатура первой',
          code: `function find(input: string): string;
function find(input: unknown): undefined;
function find(input: unknown): unknown {
  return typeof input === 'string' ? input : undefined;
}

const result: string = find('искомое');
const other: undefined = find(42);

console.log(result, other);
`,
          verdict:
            'Чисто. Узкая сигнатура стоит первой, строка попала в неё, число дошло до второй. Порядок перегрузок — не стилистика, а часть поведения.',
          expect: [],
        },
      ],
      takeaway:
        'Выбор перегрузки — линейный поиск сверху вниз до первого совпадения. Сортируй от самой узкой к самой широкой.',
    },
  ],
  tasks: [
    {
      id: 'order-overloads',
      title: 'Переставить перегрузки',
      brief:
        'Вызов с конкретным типом попадает не в ту перегрузку. Исправь порядок, ничего больше не меняя.',
      constraints: ['Сигнатуры не редактировать, только переставить'],
      starter: `function parse(input: unknown): null;
function parse(input: string): string[];
function parse(input: unknown): unknown {
  return typeof input === 'string' ? input.split(',') : null;
}

const parts: string[] = parse('a,b,c');
const nothing: null = parse(42);

console.log(parts, nothing);
`,
      starterExpect: [2322],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'function parse\\(input: string\\): string\\[\\];[\\s\\S]*function parse\\(input: unknown\\): null;', message: 'Узкая сигнатура должна идти первой' },
      ],
      hints: [
        'В каком порядке компилятор просматривает перегрузки?',
        'Сверху вниз, до первого совпадения. unknown принимает всё, поэтому перекрывает остальные.',
        'Поставь сигнатуру со string первой.',
      ],
      solution: `function parse(input: string): string[];
function parse(input: unknown): null;
function parse(input: unknown): unknown {
  return typeof input === 'string' ? input.split(',') : null;
}

const parts: string[] = parse('a,b,c');
const nothing: null = parse(42);

console.log(parts, nothing);
`,
    },
    {
      id: 'overload-to-generic',
      title: 'Заменить перегрузки на generic',
      brief:
        'Перегрузки не принимают union-аргумент. Перепиши сигнатуру через generic с условным типом.',
      constraints: ['Перегрузки убрать', 'Без any'],
      starter: `type Wrapped<T> = unknown;

declare function wrap(value: string): { kind: 'text'; value: string };
declare function wrap(value: number): { kind: 'num'; value: number };

const a = wrap('строка');
const b = wrap(42);

declare const mixed: string | number;
const c = wrap(mixed);

const aKind: 'text' = a.kind;
const bKind: 'num' = b.kind;

console.log(a, b, c, aKind, bKind);
`,
      starterExpect: [2769],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bany\\b', message: 'any запрещён условием задания' },
        { kind: 'require', pattern: 'T extends string', message: 'Нужен условный тип' },
        { kind: 'require', pattern: 'declare function wrap<', message: 'Функция должна стать generic' },
      ],
      hints: [
        'Ошибка возникает на union-аргументе: ни одна перегрузка ему не подходит.',
        'Нужен один параметр типа и условный тип, различающий строку и число.',
        "type Wrapped<T> = T extends string ? { kind: 'text'; value: string } : { kind: 'num'; value: number };",
      ],
      solution: `type Wrapped<T> = T extends string
  ? { kind: 'text'; value: string }
  : { kind: 'num'; value: number };

declare function wrap<T extends string | number>(value: T): Wrapped<T>;

const a = wrap('строка');
const b = wrap(42);

declare const mixed: string | number;
const c = wrap(mixed);

const aKind: 'text' = a.kind;
const bKind: 'num' = b.kind;

console.log(a, b, c, aKind, bKind);
`,
    },
  ],
};
