import type { Lesson } from '../types.ts';

export const structuralTyping: Lesson = {
  slug: '01-structural-typing',
  block: 1,
  order: 1,
  title: 'Structural typing, assignability, excess property checks',
  shortTitle: 'Structural typing',
  summary: 'Почему объект с лишним полем проходит через переменную и падает литералом.',
  theory: [
    '**Structural typing** (структурная типизация) — совместимость по форме, не по имени. `A` присваиваем к `B`, если у `A` есть всё, что требует `B`. Лишнее в `A` не мешает никогда.',
    '**Assignability** (совместимость по присваиванию) — отношение направленное. `Point3D → Point2D` проходит, обратно нет. Всегда спрашивай: кто источник, кто приёмник.',
    '**Excess property check** (проверка лишних свойств) — отдельная проверка поверх assignability. У неё есть условие срабатывания: **freshness** (свежесть). Свежесть — свойство выражения, а не типа: объектный литерал свеж ровно до присваивания переменной.',
    'Отсюда вся асимметрия урока: `draw(cube)` проходит, `draw({ x, y, z })` падает, хотя форма одна. Это эвристика удобства, а не гарантия системы типов — один `const` между литералом и приёмником её отключает.',
    'Единственный встроенный способ сломать структурность — `private` или `#`-поле в классе: такой класс совместим только сам с собой, по месту объявления.',
  ],
  docs: [
    {
      label: 'Handbook: Type Compatibility',
      href: 'https://www.typescriptlang.org/docs/handbook/type-compatibility.html',
    },
    {
      label: 'Handbook: Excess Property Checks',
      href: 'https://www.typescriptlang.org/docs/handbook/2/objects.html#excess-property-checks',
    },
    {
      label: 'Handbook: Relationships Between Classes',
      href: 'https://www.typescriptlang.org/docs/handbook/2/classes.html#relationships-between-classes',
    },
  ],
  experiments: [
    {
      id: 'freshness',
      title: 'Где срабатывает excess property check',
      question:
        'Во всех четырёх вариантах объект одной и той же формы попадает в один и тот же приёмник. Предскажи для каждого: будет ошибка или нет.',
      variants: [
        {
          id: 'literal',
          label: 'Литерал прямо в аргументе',
          code: `type Point2D = { x: number; y: number };

function draw(p: Point2D): void {
  console.log(p.x, p.y);
}

draw({ x: 1, y: 2, z: 3 });
`,
          verdict:
            'Ошибка TS2353. Литерал написан прямо в позиции аргумента — он свежий, проверка срабатывает.',
        },
        {
          id: 'variable',
          label: 'Через переменную',
          code: `type Point2D = { x: number; y: number };

function draw(p: Point2D): void {
  console.log(p.x, p.y);
}

const cube = { x: 1, y: 2, z: 3 };
draw(cube);
`,
          verdict:
            'Ошибки нет. Литерал присвоили переменной — свежесть потеряна, остаётся только structural assignability, а ей лишнее поле не мешает.',
        },
        {
          id: 'return',
          label: 'В позиции return',
          code: `type User = { id: number };

function makeA(): User {
  return { id: 1, name: 'Syrym' };
}

const raw = { id: 1, name: 'Syrym' };

function makeB(): User {
  return raw;
}

console.log(makeA(), makeB());
`,
          verdict:
            'Ошибка только в makeA. Return — такая же позиция присваивания: свежий литерал проверяется, переменная нет.',
        },
        {
          id: 'spread',
          label: 'Через spread',
          code: `type Options = { retries: number };

// (a) прямой литерал
const a: Options = { retries: 1, timeout: 5 };

// (b) spread литерала
const b: Options = { ...{ retries: 1, timeout: 5 } };

// (c) spread плюс собственный ключ
const c: Options = { ...{ retries: 1 }, timeout: 5 };

// (d) какой тип у самого spread-выражения? наведи курсор
const probe = { ...{ retries: 1, timeout: 5 } };

console.log(a, b, c, probe);
`,
          verdict:
            'Ошибки в (a) и (c), в (b) нет. Свойства, пришедшие из ...obj, свежести не несут — но в типе остаются: наведи на probe и увидишь { retries: number; timeout: number }. Собственный ключ рядом со spread остаётся свежим.',
        },
      ],
      takeaway:
        'Работают две независимые проверки. Assignability — структурная, лишнее ей не мешает никогда. Excess property check — надстройка, срабатывает только на свежем литерале. Смешивать их и есть главная ошибка.',
    },
    {
      id: 'nominal',
      title: 'Как сломать структурность',
      question:
        'Два класса хранят по одному number. Предскажи: пройдёт ли присваивание Celsius в Fahrenheit? А если раскомментировать private-поле?',
      variants: [
        {
          id: 'plain',
          label: 'Просто два класса',
          code: `class Celsius {
  constructor(public value: number) {}
}

class Fahrenheit {
  constructor(public value: number) {}
}

const c = new Celsius(20);
const f: Fahrenheit = c;

console.log(f.value);
`,
          verdict:
            'Ошибки нет — и это баг в проекте. Структурно классы идентичны, поэтому показания по Фаренгейту молча пройдут как Цельсий.',
        },
        {
          id: 'private',
          label: 'С private-полем',
          code: `class Celsius {
  private readonly unit = 'C';
  constructor(public value: number) {}
}

class Fahrenheit {
  private readonly unit = 'F';
  constructor(public value: number) {}
}

const c = new Celsius(20);
const f: Fahrenheit = c;

console.log(f.value);
`,
          verdict:
            'Ошибка TS2322: типы имеют раздельные объявления private-свойства unit. private делает класс номинальным — совместимым только с самим собой, по месту объявления. Два класса с одинаковым private-полем всё равно несовместимы.',
        },
      ],
      takeaway:
        'private / #field — единственная встроенная номинальность в TypeScript. Всё остальное (branded types) строится руками, до этого дойдём в уроке 21.',
    },
  ],
  tasks: [
    {
      id: 'has-id',
      title: 'Направление assignability',
      brief:
        'logId должен принимать любой объект с числовым id — сколько бы лишних полей в нём ни было. И обязан отвергать объект со строковым id и объект без id.',
      constraints: ['Замени unknown на самый узкий тип, который это даёт.'],
      starter: `type HasId = unknown;

function logId(entity: HasId): number {
  return entity.id;
}

// должно проходить
const user = { id: 7, name: 'Syrym', role: 'admin' };
logId(user);

// должно падать
const stringId = { id: 'seven' };
// @ts-expect-error id должен быть числом
logId(stringId);

const noId = { name: 'Syrym' };
// @ts-expect-error id обязателен
logId(noId);
`,
      checks: [{ kind: 'noErrors' }],
      hints: [
        'Что именно читает функция из entity? Ровно это и требуй, не больше.',
        'unknown — это top type: у него нет ни одного свойства. Тебе нужен объектный тип.',
        'type HasId = { id: ??? }',
      ],
      solution: `type HasId = { id: number };

function logId(entity: HasId): number {
  return entity.id;
}

const user = { id: 7, name: 'Syrym', role: 'admin' };
logId(user);

const stringId = { id: 'seven' };
// @ts-expect-error id должен быть числом
logId(stringId);

const noId = { name: 'Syrym' };
// @ts-expect-error id обязателен
logId(noId);
`,
    },
    {
      id: 'freshness-hole',
      title: 'Дыра во freshness',
      brief:
        'options должен иметь тип Options, но timeout обязан дожить до рантайма — его читает старая сборка.',
      constraints: ['Не меняй Options', 'Без as', 'Без any'],
      starter: `type Options = { retries: number };

const options: Options = { retries: 3, timeout: 1000 };

console.log(options);
`,
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bas\\s+\\w', message: 'Ассерты запрещены условием задания' },
        { kind: 'forbid', pattern: '\\bany\\b', message: 'any запрещён условием задания' },
        {
          kind: 'require',
          pattern: 'timeout',
          message: 'timeout должен остаться в значении, а не исчезнуть',
        },
      ],
      hints: [
        'Проверка срабатывает только на свежем литерале. Что снимает свежесть?',
        'Ровно то, что ты видел в эксперименте: промежуточная переменная.',
        'const raw = { retries: 3, timeout: 1000 };  const options: Options = raw;',
      ],
      solution: `type Options = { retries: number };

const raw = { retries: 3, timeout: 1000 };
const options: Options = raw;

console.log(options);
`,
    },
    {
      id: 'union-excess',
      title: 'Лишнее свойство против union',
      brief:
        'Сделай shape валидным кругом с radius 1. Аннотацию Shape оставь. Прежде чем чинить — пойми, с каким членом union компилятор сравнивал литерал.',
      constraints: ['Аннотация остаётся Shape', 'Без as'],
      starter: `type Circle = { kind: 'circle'; radius: number };
type Square = { kind: 'square'; size: number };
type Shape = Circle | Square;

const shape: Shape = { kind: 'circle', radius: 1, size: 2 };

console.log(shape);
`,
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bas\\s+\\w', message: 'Ассерты запрещены условием задания' },
        { kind: 'require', pattern: "kind:\\s*'circle'", message: 'shape должен остаться кругом' },
      ],
      hints: [
        'kind: "circle" уже выбрал конкретного кандидата из union. Что теперь значит size?',
        'Против union литерал обязан быть совместим хотя бы с одним членом — и лишним считается ключ, которого нет ни у кого из подходящих.',
        'Просто убери size.',
      ],
      solution: `type Circle = { kind: 'circle'; radius: number };
type Square = { kind: 'square'; size: number };
type Shape = Circle | Square;

const shape: Shape = { kind: 'circle', radius: 1 };

console.log(shape);
`,
    },
    {
      id: 'implicit-index',
      title: 'Implicit index signature',
      brief:
        'readAll принимает словарь. SensorAlias проходит, SensorIface — нет, хотя форма идентична. Почини интерфейс.',
      constraints: ['Не трогай Dict', 'Не трогай readAll', 'SensorIface остаётся interface'],
      starter: `type Dict = { [key: string]: number };

type SensorAlias = { temp: number; humidity: number };

interface SensorIface {
  temp: number;
  humidity: number;
}

function readAll(d: Dict): number[] {
  return Object.values(d);
}

const alias: SensorAlias = { temp: 21, humidity: 40 };
const iface: SensorIface = { temp: 21, humidity: 40 };

readAll(alias);
readAll(iface);
`,
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'interface\\s+SensorIface', message: 'SensorIface должен остаться interface' },
      ],
      hints: [
        'Прочитай вторую строку ошибки: «Index signature for type string is missing». Почему у alias она нашлась, а у interface нет?',
        'Интерфейс можно расширить объявлением в другом файле (declaration merging), поэтому TS не считает его набор ключей закрытым. У type alias набор ключей известен окончательно — отсюда implicit index signature.',
        'Объяви index signature явно или унаследуйся от Record<string, number>.',
      ],
      solution: `type Dict = { [key: string]: number };

type SensorAlias = { temp: number; humidity: number };

interface SensorIface {
  [key: string]: number;
  temp: number;
  humidity: number;
}

function readAll(d: Dict): number[] {
  return Object.values(d);
}

const alias: SensorAlias = { temp: 21, humidity: 40 };
const iface: SensorIface = { temp: 21, humidity: 40 };

readAll(alias);
readAll(iface);
`,
    },
    {
      id: 'nominal-units',
      title: 'Сломать структурность осознанно',
      brief:
        'Сейчас показания в Фаренгейтах молча проходят как Цельсий. Сделай классы взаимно несовместимыми.',
      constraints: [
        'Оба остаются классами',
        'value остаётся public и читаемым',
        'new Celsius(20).value === 20 продолжает работать',
        'Конструктор не должен требовать лишних аргументов',
      ],
      starter: `class Celsius {
  constructor(public value: number) {}
}

class Fahrenheit {
  constructor(public value: number) {}
}

const c = new Celsius(20);
const f = new Fahrenheit(68);

console.log(c.value, f.value);

// @ts-expect-error Цельсий не Фаренгейт
const wrong1: Fahrenheit = c;
// @ts-expect-error Фаренгейт не Цельсий
const wrong2: Celsius = f;

console.log(wrong1, wrong2);
`,
      checks: [{ kind: 'noErrors' }],
      hints: [
        'Структурность в TypeScript ломает ровно одна вещь. Ты её видел в эксперименте выше.',
        'private-поле делает класс совместимым только с самим собой.',
        'private readonly unit = "C"; — и такое же с другим значением во втором классе.',
      ],
      solution: `class Celsius {
  private readonly unit = 'C';
  constructor(public value: number) {}
}

class Fahrenheit {
  private readonly unit = 'F';
  constructor(public value: number) {}
}

const c = new Celsius(20);
const f = new Fahrenheit(68);

console.log(c.value, f.value);

// @ts-expect-error Цельсий не Фаренгейт
const wrong1: Fahrenheit = c;
// @ts-expect-error Фаренгейт не Цельсий
const wrong2: Celsius = f;

console.log(wrong1, wrong2);
`,
    },
  ],
};
