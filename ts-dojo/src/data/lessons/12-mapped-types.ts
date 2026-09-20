import type { Lesson } from '../types.ts';

export const mappedTypes: Lesson = {
  slug: '12-mapped-types',
  block: 3,
  order: 12,
  title: 'Mapped types, модификаторы и key remapping',
  shortTitle: 'Mapped types',
  summary: 'Цикл по ключам в мире типов: добавить readonly, снять optional, переименовать ключ.',
  theory: [
    '**Mapped type** (отображённый тип) — `{ [K in Keys]: Value }`. Это цикл по union ключей: для каждого `K` создаётся свойство. Источником ключей обычно служит `keyof T`.',
    '**Homomorphic mapped type** (гомоморфный) — частный случай `{ [K in keyof T]: … }`. Он сохраняет модификаторы исходного типа (`readonly`, `?`) и не ломает массивы и кортежи: именно поэтому `Partial<T>` на массиве даёт массив. Свойство сохраняется и при `as K`, но теряется, как только ключ переименован.',
    'Модификаторы добавляют и снимают явно: `readonly [K in keyof T]` добавит, `-readonly` снимет; `[K in keyof T]?` добавит необязательность, `-?` снимет. `-?` заодно убирает `undefined` из типа значения — это важно для `Required`.',
    '**Key remapping** (переименование ключей, TS 4.1) — `[K in keyof T as NewKey]`. Если выражение даёт `never`, ключ выбрасывается: так реализуются `Omit`-подобные фильтры прямо в mapped type.',
    'Ключи в `as` обычно собирают через template literal types: `` `get${Capitalize<K & string>}` ``. Пересечение `K & string` нужно, потому что `keyof T` может содержать `symbol`, а шаблон работает со строками.',
  ],
  docs: [
    {
      label: 'Handbook: Mapped types',
      href: 'https://www.typescriptlang.org/docs/handbook/2/mapped-types.html',
    },
    {
      label: 'Handbook: Key remapping via as',
      href: 'https://www.typescriptlang.org/docs/handbook/2/mapped-types.html#key-remapping-via-as',
    },
  ],
  experiments: [
    {
      id: 'modifiers',
      title: 'Модификаторы и гомоморфность',
      question:
        'Предскажи, что произойдёт с readonly и optional в каждом преобразовании.',
      variants: [
        {
          id: 'add-remove',
          label: 'Добавить и снять модификаторы',
          code: `type Source = {
  readonly id: number;
  title?: string;
};

type Mutable<T> = { -readonly [K in keyof T]: T[K] };
type Frozen<T> = { readonly [K in keyof T]: T[K] };
type Complete<T> = { [K in keyof T]-?: T[K] };

const a: Mutable<Source> = { id: 1 };
a.id = 2;

const b: Frozen<Source> = { id: 1 };
b.id = 2;

const c: Complete<Source> = { id: 1 };

console.log(a, b, c);
`,
          verdict:
            'Две ошибки. На b.id — TS2540: Frozen добавил readonly. На c — title стал обязательным из-за -?, и объект без него не подходит. Mutable снял readonly, поэтому a.id = 2 прошло.',
          expect: [2540, 2741],
        },
        {
          id: 'homomorphic',
          label: 'Гомоморфность и массивы',
          code: `type Keyed<T> = { [K in keyof T]: T[K] };
type SameKeys<T> = { [K in keyof T as K]: T[K] };
type Renamed<T> = { [K in keyof T as Uppercase<K & string>]: T[K] };

type Original = string[];

const a: Keyed<Original> = ['x'];
const b: SameKeys<Original> = ['x'];
const c: Renamed<Original> = ['x'];

console.log(a, b, c);
`,
          verdict:
            'Одна ошибка — только на c. Тонкость: гомоморфность ломает не сам as, а переименование. as K оставляет ключи прежними, и массив остаётся массивом. Uppercase переименовал их, и тип превратился в объект с ключами LENGTH, TOSTRING, POP и ещё тремя десятками членов Array — сообщение их перечисляет.',
          expect: [2740],
        },
        {
          id: 'optional-undefined',
          label: '-? убирает и undefined',
          code: `type Source = { note?: string };

type WithoutOptional<T> = { [K in keyof T]-?: T[K] };
type OnlyRequired<T> = { [K in keyof T]: T[K] };

type A = WithoutOptional<Source>['note'];
type B = OnlyRequired<Source>['note'];

const a: A = undefined;
const b: B = undefined;

console.log(a, b);
`,
          verdict:
            'Одна ошибка — на a. Модификатор -? не просто делает ключ обязательным: он снимает undefined и с типа значения, поэтому A это string. B остался string | undefined. Это и есть разница между «ключ обязателен» и «значение определено».',
          expect: [2322],
        },
      ],
      takeaway:
        'Гомоморфный mapped type сохраняет модификаторы и форму, включая массивы и кортежи. Свойство держится, пока ключи не переименованы: as K безопасен, as `${K}Suffix` уже превращает массив в объект.',
    },
    {
      id: 'remapping',
      title: 'Переименование и отбрасывание ключей',
      question:
        'Предскажи, какие ключи окажутся в результате, если выражение в as иногда даёт never.',
      variants: [
        {
          id: 'never-drops',
          label: 'never выбрасывает ключ',
          code: `type Source = { id: number; title: string; count: number };

type OnlyStrings<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};

type Result = OnlyStrings<Source>;

const ok: Result = { title: 'заголовок' };
const bad: Result = { title: 'заголовок', id: 1 };

console.log(ok, bad);
`,
          verdict:
            'Одна ошибка — на bad, TS2353: id в Result отсутствует. Когда выражение в as даёт never, ключ не создаётся вовсе. Так фильтруют поля по типу значения, не прибегая к Omit со списком имён.',
          expect: [2353],
        },
        {
          id: 'template-keys',
          label: 'Ключи из шаблона',
          code: `type Source = { id: number; title: string };

type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<K & string>}\`]: () => T[K];
};

type Result = Getters<Source>;

const api: Result = {
  getId: () => 1,
  getTitle: () => 'заголовок',
};

const wrong: Result = { id: () => 1 };

console.log(api, wrong);
`,
          verdict:
            'Одна ошибка — на wrong: ключа id больше нет, есть getId и getTitle. Capitalize — встроенный intrinsic-тип, а K & string нужен потому, что keyof T может включать symbol, для которого шаблон не определён.',
          expect: [2353],
        },
      ],
      takeaway:
        'as превращает mapped type в полноценное преобразование ключей: переименование через шаблон и отбрасывание через never покрывают большинство задач, для которых раньше писали Omit и Pick вручную.',
    },
  ],
  tasks: [
    {
      id: 'make-mutable',
      title: 'Снять readonly',
      brief: 'Напиши Mutable<T>, снимающий readonly со всех полей.',
      constraints: ['Без any', 'Одним mapped type'],
      starter: `type Config = {
  readonly host: string;
  readonly port: number;
};

type Mutable<T> = T;

const config: Mutable<Config> = { host: 'localhost', port: 80 };
config.port = 8080;

console.log(config);
`,
      starterExpect: [2540],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: '-readonly', message: 'Нужен модификатор -readonly' },
      ],
      hints: [
        'Ошибка говорит, что свойство только для чтения. Где это объявлено и как это снять?',
        'Mapped type умеет не только добавлять модификаторы, но и убирать их знаком минус.',
        'type Mutable<T> = { -readonly [K in keyof T]: T[K] };',
      ],
      solution: `type Config = {
  readonly host: string;
  readonly port: number;
};

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

const config: Mutable<Config> = { host: 'localhost', port: 80 };
config.port = 8080;

console.log(config);
`,
    },
    {
      id: 'filter-by-type',
      title: 'Оставить только функции',
      brief:
        'Собери из типа только те поля, значения которых — функции. Остальные ключи должны исчезнуть.',
      constraints: ['Через key remapping', 'Без Omit и Pick'],
      starter: `type Widget = {
  id: number;
  title: string;
  onClick: () => void;
  onHover: (x: number) => void;
};

type Handlers<T> = T;

const handlers: Handlers<Widget> = {
  onClick: () => undefined,
  onHover: () => undefined,
};

console.log(handlers);
`,
      starterExpect: [2739],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'as T\\[K\\] extends', message: 'Нужен key remapping через as' },
        { kind: 'forbid', pattern: '\\bOmit<|\\bPick<', message: 'Omit и Pick запрещены условием' },
      ],
      hints: [
        'Ключ можно выбросить, если выражение после as даст never.',
        'Условие «значение является функцией» пишется как T[K] extends (...args: never[]) => unknown.',
        '[K in keyof T as T[K] extends (...args: never[]) => unknown ? K : never]: T[K]',
      ],
      solution: `type Widget = {
  id: number;
  title: string;
  onClick: () => void;
  onHover: (x: number) => void;
};

type Handlers<T> = {
  [K in keyof T as T[K] extends (...args: never[]) => unknown ? K : never]: T[K];
};

const handlers: Handlers<Widget> = {
  onClick: () => undefined,
  onHover: () => undefined,
};

console.log(handlers);
`,
    },
    {
      id: 'build-getters',
      title: 'Сгенерировать геттеры',
      brief:
        'Из типа данных собери тип объекта с методами getX для каждого поля.',
      constraints: ['Имена ключей строить шаблоном', 'Без any'],
      starter: `type State = { count: number; label: string };

type Getters<T> = T;

const store: Getters<State> = {
  getCount: () => 0,
  getLabel: () => 'подпись',
};

console.log(store.getCount(), store.getLabel());
`,
      starterExpect: [2353, 2339, 2339],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'Capitalize', message: 'Нужен Capitalize для имени ключа' },
        { kind: 'require', pattern: 'K & string', message: 'keyof может включать symbol — нужно пересечение с string' },
      ],
      hints: [
        'Ключи собирают в as через template literal type.',
        'Первую букву поднимает встроенный Capitalize, но он требует строку.',
        '[K in keyof T as `get${Capitalize<K & string>}`]: () => T[K]',
      ],
      solution: `type State = { count: number; label: string };

type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<K & string>}\`]: () => T[K];
};

const store: Getters<State> = {
  getCount: () => 0,
  getLabel: () => 'подпись',
};

console.log(store.getCount(), store.getLabel());
`,
    },
  ],
};
