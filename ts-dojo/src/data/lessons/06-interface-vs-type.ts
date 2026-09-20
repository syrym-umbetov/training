import type { Lesson } from '../types.ts';

export const interfaceVsType: Lesson = {
  slug: '06-interface-vs-type',
  block: 1,
  order: 6,
  title: 'interface против type и declaration merging',
  shortTitle: 'interface vs type',
  summary: 'Что умеет только interface, что только type, и почему их ошибки читаются по-разному.',
  theory: [
    '`interface` и `type` описывают объектную форму почти одинаково: оба расширяются, оба реализуются классом, оба участвуют в структурной совместимости.',
    '**Только interface**: **declaration merging** (слияние объявлений). Два одноимённых интерфейса в одной области видимости сливаются в один. На этом держится расширение чужих типов — от `Window` до модулей библиотек.',
    '**Только type**: union, кортежи, mapped и conditional types, примитивные псевдонимы. `type Id = string | number` интерфейсом не выразить.',
    'Практическое следствие открытости интерфейса — то, что мы видели в уроке 01: у `interface` нет implicit index signature, потому что его набор ключей не закрыт. У `type` закрыт, поэтому он присваивается в `Record<string, …>`.',
    'Ошибки читаются по-разному: `interface X extends Y` проверяет совместимость сразу и указывает на конкретное несовпадающее свойство, а пересечение `A & B` с конфликтующими полями молча даёт `never` в этом поле — и падает позже, в месте присваивания.',
  ],
  docs: [
    {
      label: 'Handbook: Interfaces vs Type Aliases',
      href: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces',
    },
    {
      label: 'Handbook: Declaration merging',
      href: 'https://www.typescriptlang.org/docs/handbook/declaration-merging.html',
    },
    {
      label: 'Handbook: Intersection types',
      href: 'https://www.typescriptlang.org/docs/handbook/2/objects.html#intersection-types',
    },
  ],
  experiments: [
    {
      id: 'merging',
      title: 'Слияние объявлений',
      question:
        'Один и тот же приём записан через interface и через type. Предскажи, где будет ошибка и какая.',
      variants: [
        {
          id: 'interface-merge',
          label: 'Два interface с одним именем',
          code: `interface Settings {
  theme: string;
}

interface Settings {
  locale: string;
}

const settings: Settings = { theme: 'dark', locale: 'ru' };

console.log(settings.theme, settings.locale);
`,
          verdict:
            'Чисто. Объявления слились: Settings содержит оба поля, и объект обязан иметь оба. Это и есть declaration merging — интерфейс открыт для дополнения.',
          expect: [],
        },
        {
          id: 'type-merge',
          label: 'Два type с одним именем',
          code: `type Settings = {
  theme: string;
};

type Settings = {
  locale: string;
};

const settings: Settings = { theme: 'dark' };

console.log(settings);
`,
          verdict:
            'Две ошибки TS2300 — по одной на каждое объявление: «Duplicate identifier». Псевдоним типа закрыт: имя занимается один раз, повторное объявление запрещено.',
          expect: [2300, 2300],
        },
        {
          id: 'union-only-type',
          label: 'Union интерфейсом не выразить',
          code: `type Id = string | number;

const a: Id = 'abc';
const b: Id = 42;

interface BadId extends Id {}

console.log(a, b);
`,
          verdict:
            'Одна ошибка TS2312 на interface BadId: интерфейс может расширять только объектный тип со статически известными членами, а union таким не является. Union, кортежи и примитивные псевдонимы — территория type.',
          expect: [2312],
        },
      ],
      takeaway:
        'interface открыт и сливается, type закрыт и выразительнее. Для публичного API библиотеки открытость — плюс; для внутренней модели данных закрытость честнее.',
    },
    {
      id: 'extends-vs-intersection',
      title: 'extends против пересечения при конфликте',
      question:
        'В обоих вариантах два типа объявляют одно поле с несовместимыми типами. Предскажи, где ошибка появится сразу и где она вообще появится.',
      variants: [
        {
          id: 'interface-extends',
          label: 'interface extends',
          code: `interface Base {
  id: string;
}

interface Derived extends Base {
  id: number;
}

const value: Derived = { id: 1 };

console.log(value);
`,
          verdict:
            'Ошибка TS2430 прямо на объявлении Derived: интерфейс не может некорректно расширять Base, поле id несовместимо. Конфликт пойман в точке объявления — читать легко.',
          expect: [2430],
        },
        {
          id: 'intersection',
          label: 'Пересечение через &',
          code: `type Base = { id: string };
type Derived = Base & { id: number };

const value: Derived = { id: 1 };

const probe: Derived['id'] = 1;

console.log(value, probe);
`,
          verdict:
            'Две ошибки, но ни одной на объявлении Derived. Пересечение string & number дало never, и падают только присваивания. Наведи курсор на Derived["id"] — увидишь never. Конфликт всплыл далеко от причины: так пересечения и отлаживают.',
          expect: [2322, 2322],
        },
      ],
      takeaway:
        'extends проверяет совместимость в точке объявления, пересечение вычисляет её молча и роняет позже. При наследовании объектных форм interface обычно диагностичнее.',
    },
  ],
  tasks: [
    {
      id: 'merge-window',
      title: 'Дополнить существующий интерфейс',
      brief:
        'Аналитика кладёт объект в глобальный контейнер. Опиши поле так, чтобы обращение к нему типизировалось, не меняя исходное объявление AppGlobals.',
      constraints: ['Исходный интерфейс AppGlobals не редактировать', 'Без as', 'Без any'],
      starter: `interface AppGlobals {
  version: string;
}

declare const globals: AppGlobals;

console.log(globals.version);
console.log(globals.analytics.track('open'));
`,
      starterExpect: [2339],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bany\\b', message: 'any запрещён условием задания' },
        { kind: 'require', pattern: 'interface AppGlobals \\{[\\s\\S]*interface AppGlobals \\{', message: 'Нужно второе объявление AppGlobals' },
      ],
      hints: [
        'Интерфейс можно объявить повторно — что при этом произойдёт с его членами?',
        'Объяви ещё один interface AppGlobals с недостающим полем, не трогая первый.',
        'Поле analytics должно иметь тип с методом track(event: string): void.',
      ],
      solution: `interface AppGlobals {
  version: string;
}

interface AppGlobals {
  analytics: { track(event: string): void };
}

declare const globals: AppGlobals;

console.log(globals.version);
console.log(globals.analytics.track('open'));
`,
    },
    {
      id: 'type-only-shape',
      title: 'Там, где interface не справится',
      brief:
        'Result — это либо успех, либо ошибка. Сейчас он объявлен интерфейсом и поэтому не выражает выбор. Перепиши его так, чтобы сужение по полю ok работало.',
      constraints: ['Result должен стать type', 'Без any'],
      starter: `interface Result {
  ok: boolean;
  data?: string;
  error?: string;
}

function unwrap(result: Result): string {
  if (result.ok) {
    return result.data;
  }
  return result.error;
}

console.log(unwrap({ ok: true, data: 'готово' }));
`,
      starterExpect: [2322, 2322],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'type Result =', message: 'Result должен стать псевдонимом типа' },
        { kind: 'forbid', pattern: '\\bany\\b', message: 'any запрещён условием задания' },
      ],
      hints: [
        'Сейчас ok: boolean и оба поля необязательные — проверка if (result.ok) не доказывает наличие data.',
        'Нужен union двух форм с литеральным дискриминантом: ok: true и ok: false.',
        'type Result = { ok: true; data: string } | { ok: false; error: string };',
      ],
      solution: `type Result = { ok: true; data: string } | { ok: false; error: string };

function unwrap(result: Result): string {
  if (result.ok) {
    return result.data;
  }
  return result.error;
}

console.log(unwrap({ ok: true, data: 'готово' }));
`,
    },
    {
      id: 'index-signature-iface',
      title: 'Закрыть интерфейс для словаря',
      brief:
        'Та же проблема, что в уроке 01, но с другой стороны: функция ждёт словарь, интерфейс не подходит. Реши это, не добавляя index signature вручную.',
      constraints: ['SensorReadings остаётся interface', 'Без index signature в теле', 'Без as'],
      starter: `type NumberDict = Record<string, number>;

interface SensorReadings {
  temp: number;
  humidity: number;
}

function sum(dict: NumberDict): number {
  return Object.values(dict).reduce((acc, n) => acc + n, 0);
}

const readings: SensorReadings = { temp: 21, humidity: 40 };

console.log(sum(readings));
`,
      starterExpect: [2345],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'interface SensorReadings extends', message: 'Интерфейс должен что-то расширять' },
        { kind: 'forbid', pattern: '\\[key: string\\]', message: 'Ручная index signature запрещена условием' },
      ],
      hints: [
        'Ошибка та же: «Index signature for type string is missing». Почему у interface её нет, а у type есть?',
        'Интерфейс можно объявить расширяющим тип, у которого индексная сигнатура уже есть.',
        'interface SensorReadings extends Record<string, number> { … }',
      ],
      solution: `type NumberDict = Record<string, number>;

interface SensorReadings extends Record<string, number> {
  temp: number;
  humidity: number;
}

function sum(dict: NumberDict): number {
  return Object.values(dict).reduce((acc, n) => acc + n, 0);
}

const readings: SensorReadings = { temp: 21, humidity: 40 };

console.log(sum(readings));
`,
    },
  ],
};
