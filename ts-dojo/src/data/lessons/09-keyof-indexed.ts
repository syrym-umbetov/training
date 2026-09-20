import type { Lesson } from '../types.ts';

export const keyofIndexed: Lesson = {
  slug: '09-keyof-indexed',
  block: 2,
  order: 9,
  title: 'keyof, indexed access и typeof в позиции типа',
  shortTitle: 'keyof и T[K]',
  summary: 'Три оператора, которыми типы выводят из значений, а не пишут руками.',
  theory: [
    '`keyof T` — union ключей типа. Для `{ id: number; email: string }` это `"id" | "email"`. Тонкость, о которой почти никто не знает: `keyof Record<string, V>` даёт ровно `string`, а `keyof { [k: string]: V }` — `string | number`. Record — mapped type и переносит тип ключа как есть; явная индексная сигнатура добавляет `number`, потому что `obj[42]` и `obj["42"]` в JS один и тот же ключ.',
    '**Indexed access type** (тип по индексу) — `T[K]`: тип значения по ключу. `K` может быть union: `User["id" | "email"]` даёт `number | string`. Приём `T[keyof T]` собирает union всех значений типа.',
    'Для массивов ключ `number` даёт тип элемента: `Items[number]`. Это тот же приём, что превращает `as const`-массив в union литералов.',
    '`typeof` в позиции типа берёт тип существующего значения. Не путать с рантайм-оператором: `typeof x` в выражении даёт строку, а в аннотации — тип. Связка `(typeof config)[keyof typeof config]` — стандартный способ вывести union значений из объекта.',
    'Все три работают в одну сторону: значение → тип. Поэтому список ролей, карту маршрутов и словарь переводов держат как значение и выводят типы из него, а не дублируют руками.',
  ],
  docs: [
    {
      label: 'Handbook: keyof',
      href: 'https://www.typescriptlang.org/docs/handbook/2/keyof-types.html',
    },
    {
      label: 'Handbook: Indexed access types',
      href: 'https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html',
    },
    {
      label: 'Handbook: typeof type operator',
      href: 'https://www.typescriptlang.org/docs/handbook/2/typeof-types.html',
    },
  ],
  experiments: [
    {
      id: 'keyof-shapes',
      title: 'Что именно даёт keyof',
      question:
        'Предскажи результат keyof для каждого типа. Один из них удивит.',
      variants: [
        {
          id: 'keyof-object',
          label: 'keyof обычного объекта',
          code: `type User = { id: number; email: string };

type UserKeys = keyof User;

const a: UserKeys = 'id';
const b: UserKeys = 'email';
const c: UserKeys = 'phone';

console.log(a, b, c);
`,
          verdict:
            'Одна ошибка — на c, TS2322. keyof User это union "id" | "email". Сообщение перечисляет допустимые ключи целиком, поэтому такие ошибки читаются мгновенно.',
          expect: [2322],
        },
        {
          id: 'keyof-record',
          label: 'keyof словаря',
          code: `type ViaRecord = keyof Record<string, number>;
type ViaIndexSignature = keyof { [key: string]: number };

const a: ViaRecord = 'что угодно';
const b: ViaIndexSignature = 'что угодно';

const c: ViaRecord = 42;
const d: ViaIndexSignature = 42;

console.log(a, b, c, d);
`,
          verdict:
            'Одна ошибка — на c, и это неочевидно. keyof Record<string, number> даёт ровно string: Record — mapped type, он переносит объявленный тип ключа без изменений. А keyof у явной индексной сигнатуры даёт string | number, потому что в JavaScript obj[42] и obj["42"] — один ключ, и система типов это отражает. Два способа записать «словарь» ведут себя по-разному.',
          expect: [2322],
        },
        {
          id: 'indexed-union',
          label: 'T[K] с union и T[keyof T]',
          code: `type User = { id: number; email: string; active: boolean };

type Id = User['id'];
type Contact = User['id' | 'email'];
type AnyValue = User[keyof User];

const a: Id = 1;
const b: Contact = 'почта';
const c: AnyValue = true;
const d: Id = 'строка';

console.log(a, b, c, d);
`,
          verdict:
            'Одна ошибка — на d. Id это number. Contact собрал union number | string по двум ключам. AnyValue через keyof собрал union всех значений: number | string | boolean, поэтому true прошло.',
          expect: [2322],
        },
        {
          id: 'typeof-bridge',
          label: 'typeof как мост от значения к типу',
          code: `const theme = {
  primary: '#0F6B4A',
  danger: '#9A3B2E',
} as const;

type ThemeKey = keyof typeof theme;
type ThemeValue = (typeof theme)[ThemeKey];

const key: ThemeKey = 'primary';
const value: ThemeValue = '#0F6B4A';
const wrong: ThemeValue = '#000000';

console.log(key, value, wrong);
`,
          verdict:
            'Одна ошибка — на wrong. as const сделал значения литеральными, поэтому ThemeValue это "#0F6B4A" | "#9A3B2E", и произвольный цвет не подходит. Без as const значения были бы string и ошибки не было бы.',
          expect: [2322],
        },
      ],
      takeaway:
        'keyof + indexed access + typeof — способ держать единственный источник правды в значении. Список меняется в одном месте, типы следуют за ним.',
    },
    {
      id: 'keyof-pitfalls',
      title: 'Ловушки keyof',
      question:
        'Предскажи, что даст keyof для массива и для типа с необязательными полями.',
      variants: [
        {
          id: 'keyof-array',
          label: 'keyof массива',
          code: `type Items = string[];

type ItemKeys = keyof Items;
type Item = Items[number];

const a: Item = 'строка';
const b: ItemKeys = 'length';
const c: ItemKeys = 'map';
const d: Item = 42;

console.log(a, b, c, d);
`,
          verdict:
            'Одна ошибка — на d. keyof массива это не индексы, а все его члены: number, "length", "map", "filter" и остальные методы — поэтому b и c прошли. Тип элемента берут через Items[number] — здесь это Item, и обычно нужно только оно.',
          expect: [2322],
        },
        {
          id: 'keyof-optional',
          label: 'keyof с необязательными полями',
          code: `type Form = { login: string; note?: string };

type FormKeys = keyof Form;
type NoteType = Form['note'];

const key: FormKeys = 'note';
const value: NoteType = undefined;
const strict: string = value;

console.log(key, value, strict);
`,
          verdict:
            'Одна ошибка — на strict. Необязательный ключ попадает в keyof наравне с остальными, а вот его тип включает undefined: Form["note"] это string | undefined. Отсюда классическая ошибка «string | undefined не присваивается в string» при переборе ключей.',
          expect: [2322],
        },
      ],
      takeaway:
        'keyof отвечает «какие ключи разрешены», а не «какие поля объявлены»: у массива это методы, у Record — string | number, у optional-поля тип значения тянет undefined.',
    },
  ],
  tasks: [
    {
      id: 'typed-get',
      title: 'Типобезопасный доступ по ключу',
      brief:
        'pluck должна возвращать массив значений по указанному ключу, сохраняя их тип.',
      constraints: ['Без any', 'Без as'],
      starter: `function pluck(items: object[], key: string): unknown[] {
  return items.map((item) => item[key]);
}

const users = [
  { id: 1, email: 'a@b.c' },
  { id: 2, email: 'd@e.f' },
];

const ids: number[] = pluck(users, 'id');

// @ts-expect-error такого ключа нет
pluck(users, 'phone');
`,
      starterExpect: [7053, 2322, 2578],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bany\\b', message: 'any запрещён условием задания' },
        { kind: 'forbid', pattern: '\\bas\\s+\\w', message: 'Ассерты запрещены условием задания' },
        { kind: 'require', pattern: 'K extends keyof T', message: 'Ключ нужно ограничить через keyof' },
      ],
      hints: [
        'Нужны два параметра типа: элемент массива и ключ, принадлежащий этому элементу.',
        'Возвращаемый тип описывается через indexed access.',
        'function pluck<T, K extends keyof T>(items: T[], key: K): T[K][]',
      ],
      solution: `function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}

const users = [
  { id: 1, email: 'a@b.c' },
  { id: 2, email: 'd@e.f' },
];

const ids: number[] = pluck(users, 'id');

// @ts-expect-error такого ключа нет
pluck(users, 'phone');
`,
    },
    {
      id: 'union-from-object',
      title: 'Union значений из объекта',
      brief:
        'Словарь кодов ошибок задан значением. Выведи из него тип допустимых кодов, не переписывая их руками.',
      constraints: ['Литералы в типе не перечислять', 'Объект остаётся источником правды'],
      starter: `const ERROR_CODES = {
  notFound: 404,
  serverError: 500,
} as const;

type ErrorCode = number;

function report(code: ErrorCode): string {
  return 'код ' + code;
}

report(404);
// @ts-expect-error такого кода нет в словаре
report(418);

console.log(ERROR_CODES);
`,
      starterExpect: [2578],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'typeof ERROR_CODES', message: 'Тип должен выводиться из значения' },
        { kind: 'require', pattern: 'keyof typeof ERROR_CODES', message: 'Нужен keyof typeof' },
      ],
      hints: [
        'Сейчас ErrorCode это number, поэтому проходит любое число и @ts-expect-error не срабатывает.',
        'Нужен union значений объекта. Как из типа получить все его значения?',
        'type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];',
      ],
      solution: `const ERROR_CODES = {
  notFound: 404,
  serverError: 500,
} as const;

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

function report(code: ErrorCode): string {
  return 'код ' + code;
}

report(404);
// @ts-expect-error такого кода нет в словаре
report(418);

console.log(ERROR_CODES);
`,
    },
    {
      id: 'element-type',
      title: 'Тип элемента массива',
      brief:
        'Выведи тип элемента из типа массива, не повторяя его описание.',
      constraints: ['Не писать { id: number; title: string } второй раз'],
      starter: `type Posts = Array<{ id: number; title: string }>;

type Post = unknown;

function titleOf(post: Post): string {
  return post.title;
}

console.log(titleOf({ id: 1, title: 'первый' }));
`,
      starterExpect: [18046],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'Posts\\[number\\]', message: 'Нужен indexed access Posts[number]' },
      ],
      hints: [
        'У массива есть ключ, по которому лежит элемент. Какой тип у этого ключа?',
        'Indexed access с number даёт тип элемента.',
        'type Post = Posts[number];',
      ],
      solution: `type Posts = Array<{ id: number; title: string }>;

type Post = Posts[number];

function titleOf(post: Post): string {
  return post.title;
}

console.log(titleOf({ id: 1, title: 'первый' }));
`,
    },
  ],
};
