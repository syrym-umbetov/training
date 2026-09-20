import type { Lesson } from '../types.ts';

export const recursiveTypes: Lesson = {
  slug: '16-recursive-types',
  block: 3,
  order: 16,
  title: 'Рекурсивные типы и их пределы',
  shortTitle: 'Рекурсия в типах',
  summary: 'Обход кортежей и деревьев на уровне типов — и где компилятор скажет «хватит».',
  theory: [
    'Тип может ссылаться на себя: `type Json = string | number | boolean | null | Json[] | { [k: string]: Json }`. Для описания деревьев этого достаточно, и ограничений по глубине тут нет — тип ленив.',
    'Рекурсия с вычислением — другое дело. Каждый шаг `T extends [infer Head, ...infer Rest]` разворачивается компилятором, и у него стоит ограничитель: около 50 уровней для обычной рекурсии и до 1000 для **tail-recursive** форм (TS 4.5), где рекурсивный вызов стоит последним и результат накапливается в параметре-аккумуляторе.',
    'Отсюда приём: вместо `[Head, ...Reverse<Rest>]` пишут `Reverse<Rest, [Head, ...Acc]>`. Первый вариант достраивает результат после возврата — это не хвостовая рекурсия; второй передаёт накопленное дальше и укладывается в больший лимит.',
    'Ошибка при переполнении звучит как «Type instantiation is excessively deep and possibly infinite» (TS2589). Она означает не «так нельзя», а «перепиши через аккумулятор или ограничь глубину».',
    'Практическая мера: рекурсивные типы стоят времени компиляции всего проекта. Для путей вложенных объектов ограничивают глубину явным счётчиком, иначе автодополнение в IDE начинает подвисать.',
  ],
  docs: [
    {
      label: 'Handbook: Recursive conditional types',
      href: 'https://www.typescriptlang.org/docs/handbook/2/conditional-types.html',
    },
    {
      label: 'TS 4.5: Tail-recursion elimination on conditional types',
      href: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-5.html#tail-recursion-elimination-on-conditional-types',
    },
  ],
  experiments: [
    {
      id: 'self-reference',
      title: 'Тип, ссылающийся на себя',
      question:
        'Предскажи, какие значения подойдут под рекурсивный тип JSON.',
      variants: [
        {
          id: 'json-tree',
          label: 'Дерево JSON',
          code: `type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json };

const ok: Json = { a: [1, 'два', { b: null }] };
const bad: Json = { a: () => 1 };

console.log(ok, bad);
`,
          verdict:
            'Одна ошибка — на bad: функция не входит ни в один член union. Рекурсивная ссылка на себя работает без ограничений по глубине, потому что тип не вычисляется заранее — он раскрывается по мере проверки значения.',
          expect: [2322],
        },
        {
          id: 'readonly-deep',
          label: 'Рекурсивный mapped type',
          code: `type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

type State = { user: { name: string; tags: string[] } };

const state: DeepReadonly<State> = {
  user: { name: 'Сырым', tags: ['a'] },
};

state.user.name = 'другое';

console.log(state);
`,
          verdict:
            'Одна ошибка TS2540: свойство только для чтения. Рекурсия прошла вглубь — readonly добрался до вложенного объекта. Обрати внимание: массив тоже попал под object, и его элементы стали readonly.',
          expect: [2540],
        },
      ],
      takeaway:
        'Ссылка на себя в объединении или mapped type — обычный приём и стоит дёшево. Дорого стоит рекурсия с вычислением на каждом шаге.',
    },
    {
      id: 'tail-recursion',
      title: 'Хвостовая рекурсия и лимиты',
      question:
        'Два способа развернуть кортеж. Предскажи, какой из них упрётся в ограничитель раньше.',
      variants: [
        {
          id: 'naive-reverse',
          label: 'Без аккумулятора',
          code: `type Reverse<T extends readonly unknown[]> = T extends readonly [
  infer Head,
  ...infer Rest,
]
  ? [...Reverse<Rest>, Head]
  : [];

type Row = Reverse<[1, 2, 3]>;

const row: Row = [3, 2, 1];
const wrong: Row = [1, 2, 3];

console.log(row, wrong);
`,
          verdict:
            'Две диагностики, обе на строке wrong: Row это [3, 2, 1], и компилятор сравнивает поэлементно — не сошлись первый и третий. Форма рабочая, но не хвостовая: результат достраивается после возврата из рекурсии, поэтому на длинных кортежах она упирается в ограничитель раньше.',
          expect: [2322, 2322],
        },
        {
          id: 'tail-reverse',
          label: 'С аккумулятором',
          code: `type Reverse<
  T extends readonly unknown[],
  Acc extends readonly unknown[] = [],
> = T extends readonly [infer Head, ...infer Rest]
  ? Reverse<Rest, [Head, ...Acc]>
  : Acc;

type Row = Reverse<[1, 2, 3]>;

const row: Row = [3, 2, 1];
const wrong: Row = [1, 2, 3];

console.log(row, wrong);
`,
          verdict:
            'Те же две диагностики и тот же результат [3, 2, 1] — но рекурсивный вызов здесь последнее выражение, и компилятор разворачивает его без роста стека. На коротких кортежах разницы не видно, на длинных первая форма падает с TS2589, а эта работает.',
          expect: [2322, 2322],
        },
      ],
      takeaway:
        'Если рекурсивный вызов стоит последним, а результат копится в параметре — компилятор выдержит на порядок большую глубину. Это единственное отличие двух почти одинаковых типов.',
    },
  ],
  tasks: [
    {
      id: 'deep-partial',
      title: 'DeepPartial',
      brief: 'Сделай все поля необязательными рекурсивно, включая вложенные объекты.',
      constraints: ['Через рекурсивный mapped type', 'Без any'],
      starter: `type DeepPartial<T> = T;

type Config = { server: { host: string; port: number }; debug: boolean };

const patch: DeepPartial<Config> = { server: { host: 'localhost' } };

console.log(patch);
`,
      starterExpect: [2741],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'DeepPartial<T\\[K\\]>', message: 'Нужна рекурсия' },
        { kind: 'forbid', pattern: '\\bany\\b', message: 'any запрещён условием задания' },
      ],
      hints: [
        'Начни с обычного Partial: [K in keyof T]?: T[K].',
        'Для значения-объекта нужно применить то же преобразование ещё раз.',
        '{ [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] }',
      ],
      solution: `type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

type Config = { server: { host: string; port: number }; debug: boolean };

const patch: DeepPartial<Config> = { server: { host: 'localhost' } };

console.log(patch);
`,
    },
    {
      id: 'tuple-length',
      title: 'Длина кортежа рекурсией',
      brief:
        'Посчитай количество элементов кортежа, не обращаясь к свойству length.',
      constraints: ['Без T["length"]', 'Через рекурсию с аккумулятором'],
      starter: `type Count<T extends readonly unknown[]> = number;

type Three = Count<['a', 'b', 'c']>;

const three: Three = 3;
// @ts-expect-error должно быть ровно 3
const wrong: Three = 4;

console.log(three, wrong);
`,
      starterExpect: [2578],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: "T\\['length'\\]", message: "Обращение к T['length'] запрещено условием" },
        { kind: 'require', pattern: 'Acc extends', message: 'Нужен аккумулятор' },
      ],
      hints: [
        'Считать будем, накапливая элементы в аккумуляторе-кортеже.',
        'На каждом шаге откусывай голову и добавляй что-нибудь в аккумулятор.',
        'Длину аккумулятора в конце всё же можно взять через Acc["length"] — запрещено только T["length"].',
      ],
      solution: `type Count<
  T extends readonly unknown[],
  Acc extends readonly unknown[] = [],
> = T extends readonly [unknown, ...infer Rest]
  ? Count<Rest, [unknown, ...Acc]>
  : Acc['length'];

type Three = Count<['a', 'b', 'c']>;

const three: Three = 3;
// @ts-expect-error должно быть ровно 3
const wrong: Three = 4;

console.log(three, wrong);
`,
    },
    {
      id: 'json-type',
      title: 'Тип JSON',
      brief: 'Опиши тип, описывающий любое валидное JSON-значение.',
      constraints: ['Через ссылку на себя'],
      starter: `type Json = unknown;

const ok: Json = { a: [1, 'два', { b: null }] };

// @ts-expect-error функции в JSON не бывает
const bad: Json = { a: () => 1 };

console.log(ok, bad);
`,
      starterExpect: [2578],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'Json\\[\\]', message: 'Массив JSON должен ссылаться на сам тип' },
        { kind: 'require', pattern: 'key: string\\]: Json', message: 'Объект должен ссылаться на сам тип' },
      ],
      hints: [
        'Перечисли примитивы, которые бывают в JSON.',
        'Добавь два составных случая: массив и объект.',
        'type Json = string | number | boolean | null | Json[] | { [key: string]: Json };',
      ],
      solution: `type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json };

const ok: Json = { a: [1, 'два', { b: null }] };

// @ts-expect-error функции в JSON не бывает
const bad: Json = { a: () => 1 };

console.log(ok, bad);
`,
    },
  ],
};
