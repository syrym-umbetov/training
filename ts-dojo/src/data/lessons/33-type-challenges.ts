import type { Lesson } from '../types.ts';

export const typeChallenges: Lesson = {
  slug: '33-type-challenges',
  block: 6,
  order: 33,
  title: 'Задачи в стиле type-challenges',
  shortTitle: 'type-challenges',
  summary: 'Четыре задачи от простой к сложной — и приёмы, которыми их решают.',
  theory: [
    'Весь инструментарий уже пройден: mapped types, conditional types, `infer`, template literals, рекурсия с аккумулятором. Задачи этого урока — тренировка их комбинирования.',
    'Универсальный подход к такой задаче: определить, что перебираем (ключи, элементы кортежа, символы строки), чем отличается базовый случай от рекурсивного, и где нужен `infer`.',
    'Проверять решение удобно равенством типов. Простое `A extends B ? true : false` даёт ложноположительный результат для `any` и для одностороннего наследования — поэтому в type-challenges используют двойную обёртку, которая сравнивает типы строго.',
    'Частая ошибка — забыть про дистрибуцию: условный тип по голому параметру разбирает union по одному. Если нужно проверить union целиком, оборачивай в кортеж, как в уроке 13.',
    'Вторая частая ошибка — не хвостовая рекурсия. При обходе длинных кортежей накапливай результат в параметре, иначе упрёшься в ограничитель глубины.',
  ],
  docs: [
    {
      label: 'type-challenges на GitHub',
      href: 'https://github.com/type-challenges/type-challenges',
    },
    {
      label: 'Handbook: Conditional types',
      href: 'https://www.typescriptlang.org/docs/handbook/2/conditional-types.html',
    },
  ],
  experiments: [
    {
      id: 'strict-equality',
      title: 'Как строго сравнить два типа',
      question:
        'Предскажи, какая из проверок отличит any от string, а какая — нет.',
      variants: [
        {
          id: 'naive-equals',
          label: 'Наивная проверка',
          code: `type NaiveEquals<A, B> = A extends B ? (B extends A ? true : false) : false;

type A = NaiveEquals<string, string>;
type C = NaiveEquals<any, string>;

const a: A = true;

// для any проходят ОБА присваивания — наведи курсор на C
const c1: C = true;
const c2: C = false;

// а для честного сравнения так нельзя
const wrong: A = false;

console.log(a, c1, c2, wrong);
`,
          verdict:
            'Одна ошибка — на wrong, и интересна не она, а строки выше. NaiveEquals<any, string> дал не true и не false, а boolean: условный тип с any раскрывается в обе ветки сразу, поэтому туда присваивается что угодно. Наивное сравнение не просто ошибается на any — оно возвращает бесполезный результат.',
          expect: [2322],
        },
        {
          id: 'strict-equals',
          label: 'Строгая проверка',
          code: `type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

type A = Equals<string, string>;
type B = Equals<any, string>;
type C = Equals<{ a: string }, { a: string }>;

const a: A = true;
const b: B = false;
const c: C = true;

console.log(a, b, c);
`,
          verdict:
            'Чисто. Приём опирается на то, что компилятор сравнивает отложенные условные типы по их структуре: две сигнатуры совпадут, только если A и B идентичны. Это стандартная проверка из type-challenges, и any она отличает.',
          expect: [],
        },
      ],
      takeaway:
        'Для проверки решений нужен строгий Equals. Наивное двустороннее extends пропускает any и не различает некоторые пары типов.',
    },
  ],
  tasks: [
    {
      id: 'challenge-first',
      title: 'easy: First<T>',
      brief: 'Верни тип первого элемента кортежа, а для пустого — never.',
      constraints: ['Без обращения к T[0] напрямую'],
      starter: `type First<T extends readonly unknown[]> = unknown;

type A = First<[3, 2, 1]>;
type B = First<[]>;

const a: A = 3;
// @ts-expect-error для пустого кортежа нет первого элемента
const b: B = 1;

console.log(a, b);
`,
      starterExpect: [2578],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'infer', message: 'Нужен infer' },
        { kind: 'forbid', pattern: 'T\\[0\\]', message: 'Прямое обращение к T[0] запрещено условием' },
      ],
      hints: [
        'Образец описывает кортеж, у которого есть хотя бы один элемент.',
        'Остаток можно поймать rest-элементом и проигнорировать.',
        'type First<T> = T extends readonly [infer Head, ...unknown[]] ? Head : never;',
      ],
      solution: `type First<T extends readonly unknown[]> = T extends readonly [infer Head, ...unknown[]]
  ? Head
  : never;

type A = First<[3, 2, 1]>;
type B = First<[]>;

const a: A = 3;
// @ts-expect-error для пустого кортежа нет первого элемента
const b: B = 1;

console.log(a, b);
`,
    },
    {
      id: 'challenge-tuple-to-union',
      title: 'medium: TupleToUnion<T>',
      brief: 'Преврати кортеж в union его элементов.',
      constraints: ['Без готовых утилит'],
      starter: `type TupleToUnion<T extends readonly unknown[]> = unknown;

type A = TupleToUnion<['a', 'b', 'c']>;

const a: A = 'b';
// @ts-expect-error такого элемента в кортеже нет
const b: A = 'd';

console.log(a, b);
`,
      starterExpect: [2578],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'T\\[number\\]', message: 'Проще всего через indexed access' },
      ],
      hints: [
        'Кортеж — это массив с известными индексами. Какой ключ даёт тип элемента?',
        'Приём из урока 09.',
        'type TupleToUnion<T extends readonly unknown[]> = T[number];',
      ],
      solution: `type TupleToUnion<T extends readonly unknown[]> = T[number];

type A = TupleToUnion<['a', 'b', 'c']>;

const a: A = 'b';
// @ts-expect-error такого элемента в кортеже нет
const b: A = 'd';

console.log(a, b);
`,
    },
    {
      id: 'challenge-deep-readonly',
      title: 'medium: DeepReadonly<T>',
      brief:
        'Сделай readonly рекурсивно, но не трогай функции — иначе они станут неприменимы.',
      constraints: ['Функции должны остаться как есть'],
      starter: `type DeepReadonly<T> = T;

type State = {
  user: { name: string; tags: string[] };
  update: (name: string) => void;
};

const state: DeepReadonly<State> = {
  user: { name: 'Сырым', tags: ['a'] },
  update: () => undefined,
};

state.user.name = 'другое';

state.update('вызов работает');

console.log(state);
`,
      starterExpect: [],
      checks: [
        { kind: 'errorCodes', codes: [2540] },
        { kind: 'require', pattern: 'DeepReadonly<T\\[K\\]>', message: 'Нужна рекурсия' },
        { kind: 'require', pattern: 'never\\[\\]\\) => unknown|Function', message: 'Функции нужно исключить из обхода' },
      ],
      hints: [
        'Начни с readonly [K in keyof T]: T[K].',
        'Для значения-объекта примени тот же тип рекурсивно — но сначала отдели функции.',
        'T[K] extends (...args: never[]) => unknown ? T[K] : T[K] extends object ? DeepReadonly<T[K]> : T[K]',
      ],
      solution: `type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends (...args: never[]) => unknown
    ? T[K]
    : T[K] extends object
      ? DeepReadonly<T[K]>
      : T[K];
};

type State = {
  user: { name: string; tags: string[] };
  update: (name: string) => void;
};

const state: DeepReadonly<State> = {
  user: { name: 'Сырым', tags: ['a'] },
  update: () => undefined,
};

state.user.name = 'другое';

state.update('вызов работает');

console.log(state);
`,
    },
    {
      id: 'challenge-camelcase',
      title: 'hard: ключи в camelCase',
      brief:
        'Преврати snake_case-ключи объекта в camelCase, оставив типы значений.',
      constraints: ['Через key remapping и рекурсию по строке'],
      starter: `type CamelCase<S extends string> = S;
type CamelKeys<T> = T;

type ApiUser = { user_id: number; first_name: string };

type User = CamelKeys<ApiUser>;

const user: User = { userId: 1, firstName: 'Сырым' };

console.log(user);
`,
      starterExpect: [2561],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'Capitalize', message: 'Нужен Capitalize' },
        { kind: 'require', pattern: 'CamelCase<', message: 'Нужна отдельная трансформация строки' },
        { kind: 'require', pattern: 'as CamelCase', message: 'Ключи переименовываются через as' },
      ],
      hints: [
        'Сначала научись превращать строку: user_id в userId.',
        'Образец `${infer Head}_${infer Rest}` разбивает по подчёркиванию, дальше Capitalize и рекурсия по остатку.',
        'Потом переименуй ключи: [K in keyof T as CamelCase<K & string>]: T[K]',
      ],
      solution: `type CamelCase<S extends string> = S extends \`\${infer Head}_\${infer Rest}\`
  ? \`\${Head}\${Capitalize<CamelCase<Rest>>}\`
  : S;

type CamelKeys<T> = {
  [K in keyof T as CamelCase<K & string>]: T[K];
};

type ApiUser = { user_id: number; first_name: string };

type User = CamelKeys<ApiUser>;

const user: User = { userId: 1, firstName: 'Сырым' };

console.log(user);
`,
    },
  ],
};
