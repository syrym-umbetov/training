import type { Lesson } from '../types.ts';

export const typePredicates: Lesson = {
  slug: '04-type-predicates',
  block: 1,
  order: 4,
  title: 'Type predicates и assertion functions',
  shortTitle: 'Предикаты и asserts',
  summary: 'Как научить компилятор сужать по твоей проверке — и чем за это платишь.',
  theory: [
    '**Type predicate** (предикат типа) — возвращаемый тип вида `x is T`. Функция возвращает boolean, а компилятор трактует `true` как доказательство, что аргумент имеет тип `T`, и сужает его в вызывающем коде.',
    'Без предиката обычная функция-проверка бесполезна для сужения: компилятор видит только `boolean` и не связывает его с аргументом. Самый заметный случай — `filter`: без предиката он не умеет убрать `undefined` из типа.',
    '**Assertion function** (функция-утверждение) — возвращаемый тип `asserts x is T`. Она ничего не возвращает: либо бросает, либо после её вызова компилятор считает тип суженным до конца области видимости.',
    'У `asserts` есть жёсткое требование: вызываемое значение должно иметь явную аннотацию типа. Присвоенная через `const check = assertIsString` функция сужать не будет — компилятор требует, чтобы это было объявление с явным типом.',
    'Цена обоих инструментов одна: компилятор **верит на слово**. Предикат с неверной проверкой внутри компилируется молча и ломает типобезопасность в месте вызова — ошибка всплывёт в рантайме, далеко от причины.',
  ],
  docs: [
    {
      label: 'Handbook: Using type predicates',
      href: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates',
    },
    {
      label: 'Handbook: Assertion functions',
      href: 'https://www.typescriptlang.org/docs/handbook/2/classes.html#assertion-functions',
    },
    {
      label: 'TS 5.5: Inferred type predicates',
      href: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html',
    },
  ],
  experiments: [
    {
      id: 'filter-narrowing',
      title: 'Почему filter не убирает undefined',
      question:
        'Во всех трёх вариантах фильтруется один и тот же массив. Предскажи тип результата и где будет ошибка.',
      variants: [
        {
          id: 'plain-filter',
          label: 'filter с обычной стрелкой',
          code: `const raw: Array<string | undefined> = ['a', undefined, 'b'];

const filtered = raw.filter((item) => item !== undefined);

const lengths: number[] = filtered.map((item) => item.length);

console.log(lengths);
`,
          verdict:
            'С TypeScript 5.5 ошибки нет: компилятор сам вывел предикат для стрелки, тело которой — проверка параметра. До 5.5 этот код падал, и приходилось писать предикат руками. Наведи курсор на filtered — увидишь string[].',
          expect: [],
        },
        {
          id: 'filter-boolean',
          label: 'filter через отдельную функцию с boolean',
          code: `const raw: Array<string | undefined> = ['a', undefined, 'b'];

function isDefined(item: string | undefined): boolean {
  return item !== undefined;
}

const filtered = raw.filter(isDefined);

const lengths: number[] = filtered.map((item) => item.length);

console.log(lengths);
`,
          verdict:
            'Ошибка TS18048: item может быть undefined. Явный возвращаемый тип boolean перекрыл автоматический вывод предиката — компилятор увидел просто «булево» и не связал его с аргументом. Тип filtered остался Array<string | undefined>.',
          expect: [18048],
        },
        {
          id: 'filter-predicate',
          label: 'filter с предикатом',
          code: `const raw: Array<string | undefined> = ['a', undefined, 'b'];

function isDefined(item: string | undefined): item is string {
  return item !== undefined;
}

const filtered = raw.filter(isDefined);

const lengths: number[] = filtered.map((item) => item.length);

console.log(lengths);
`,
          verdict:
            'Чисто. item is string — то самое доказательство, которого не хватало: filter объявлен с перегрузкой под предикат и возвращает string[]. Это работает в любой версии TS, в отличие от автовывода.',
          expect: [],
        },
      ],
      takeaway:
        'Предикат нужен там, где проверка вынесена из места использования. Автовывод 5.5 закрывает только простейший случай — стрелку, которая прямо проверяет свой параметр.',
    },
    {
      id: 'predicate-lies',
      title: 'Компилятор верит предикату на слово',
      question:
        'Предикат внутри проверяет не то, что обещает в сигнатуре. Предскажи: поймает ли это компилятор?',
      variants: [
        {
          id: 'lying-predicate',
          label: 'Врущий предикат',
          code: `type User = { id: number; email: string };

function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null;
}

const input: unknown = { id: 1 };

if (isUser(input)) {
  console.log(input.email.toUpperCase());
}
`,
          verdict:
            'Ноль ошибок компилятора — и падение в рантайме: email отсутствует, toUpperCase вызовется на undefined. Предикат проверил только «объект и не null», но пообещал целый User, и компилятор принял обещание без проверки.',
          expect: [],
        },
        {
          id: 'honest-predicate',
          label: 'Честный предикат',
          code: `type User = { id: number; email: string };

function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'number' &&
    'email' in value &&
    typeof value.email === 'string'
  );
}

const input: unknown = { id: 1 };

if (isUser(input)) {
  console.log(input.email.toUpperCase());
}
`,
          verdict:
            'Тоже ноль ошибок — но теперь обещание подкреплено проверкой каждого поля, и в рантайме ветка просто не выполнится. Разница между вариантами невидима компилятору целиком: отвечает за неё автор предиката.',
          expect: [],
        },
        {
          id: 'asserts-needs-annotation',
          label: 'asserts и требование аннотации',
          code: `function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error('не строка');
  }
}

const input: unknown = 'привет';

// прямой вызов объявленной функции — сужение работает
assertIsString(input);
console.log(input.toUpperCase());

// та же функция через переменную без аннотации
const check = assertIsString;
const other: unknown = 'мир';
check(other);
console.log(other.toUpperCase());
`,
          verdict:
            'Две ошибки, и вторая следует из первой. TS2775 на вызове check: утверждающие функции вызываются только через идентификатор с явной аннотацией типа. Раз сужения не произошло, other остался unknown — отсюда TS18046 на следующей строке. Прямой вызов assertIsString при этом отработал.',
          expect: [2775, 18046],
        },
      ],
      takeaway:
        'Предикат и asserts переносят ответственность с компилятора на тебя. Пиши их редко, держи рядом с типом, который они подтверждают, и проверяй каждое поле, которое обещаешь.',
    },
  ],
  tasks: [
    {
      id: 'write-predicate',
      title: 'Написать предикат для filter',
      brief:
        'Отфильтруй массив так, чтобы результат имел тип Item[], а не Array<Item | null>. Проверка вынесена в отдельную функцию — почини её сигнатуру.',
      constraints: ['Без as', 'Без any', 'filter должен остаться'],
      starter: `type Item = { id: number; title: string };

function isItem(value: Item | null): boolean {
  return value !== null;
}

const raw: Array<Item | null> = [{ id: 1, title: 'первый' }, null];

const items = raw.filter(isItem);
const titles: string[] = items.map((item) => item.title);

console.log(titles);
`,
      starterExpect: [18047],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bas\\s+\\w', message: 'Ассерты запрещены условием задания' },
        { kind: 'require', pattern: 'value is Item', message: 'Нужен предикат value is Item' },
      ],
      hints: [
        'Компилятор видит у isItem тип boolean. Что он знает про связь этого boolean с аргументом?',
        'Возвращаемый тип может утверждать факт об аргументе.',
        'Замени boolean на value is Item.',
      ],
      solution: `type Item = { id: number; title: string };

function isItem(value: Item | null): value is Item {
  return value !== null;
}

const raw: Array<Item | null> = [{ id: 1, title: 'первый' }, null];

const items = raw.filter(isItem);
const titles: string[] = items.map((item) => item.title);

console.log(titles);
`,
    },
    {
      id: 'assert-defined',
      title: 'Функция-утверждение',
      brief:
        'assertDefined должна убирать undefined из типа после вызова. Сейчас компилятор её не понимает.',
      constraints: ['Сигнатура должна использовать asserts', 'Без as'],
      starter: `function assertDefined<T>(value: T | undefined): boolean {
  if (value === undefined) {
    throw new Error('значение обязательно');
  }
  return true;
}

function upper(input: string | undefined): string {
  assertDefined(input);
  return input.toUpperCase();
}

console.log(upper('да'));
`,
      starterExpect: [18048],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bas\\s+\\w', message: 'Ассерты запрещены условием задания' },
        { kind: 'require', pattern: 'asserts value is T', message: 'Нужна сигнатура asserts value is T' },
      ],
      hints: [
        'Функция бросает, если значения нет. Как сказать об этом компилятору, чтобы он сузил тип после вызова?',
        'Возвращаемый тип asserts x is T описывает ровно такую функцию — она ничего не возвращает.',
        'function assertDefined<T>(value: T | undefined): asserts value is T',
      ],
      solution: `function assertDefined<T>(value: T | undefined): asserts value is T {
  if (value === undefined) {
    throw new Error('значение обязательно');
  }
}

function upper(input: string | undefined): string {
  assertDefined(input);
  return input.toUpperCase();
}

console.log(upper('да'));
`,
    },
    {
      id: 'honest-guard',
      title: 'Сделать предикат честным',
      brief:
        'Предикат обещает Config с двумя полями, а проверяет только одно. Код компилируется и падает в рантайме — закрой разрыв.',
      constraints: ['Сигнатуру не менять', 'Без as', 'Проверить оба поля'],
      starter: `type Config = { host: string; port: number };

function isConfig(value: unknown): value is Config {
  return typeof value === 'object' && value !== null && 'host' in value;
}

const input: unknown = { host: 'localhost' };

if (isConfig(input)) {
  const port: number = input.port;
  console.log(port.toFixed(0));
}

// @ts-expect-error без проверки сюда попасть нельзя
const broken: Config = { host: 'localhost' };
`,
      starterExpect: [],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: "'port' in value", message: 'Проверь наличие поля port' },
        { kind: 'require', pattern: "typeof value.port === 'number'", message: 'Проверь тип port' },
        { kind: 'require', pattern: "typeof value.host === 'string'", message: 'Проверь тип host' },
      ],
      hints: [
        'Компилятор молчит, потому что доверяет сигнатуре. Что реально доказывает тело функции?',
        '«Объект, не null, есть ключ host» — это не то же самое, что «есть host: string и port: number».',
        'Добавь проверки in и typeof для каждого поля из Config.',
      ],
      solution: `type Config = { host: string; port: number };

function isConfig(value: unknown): value is Config {
  return (
    typeof value === 'object' &&
    value !== null &&
    'host' in value &&
    typeof value.host === 'string' &&
    'port' in value &&
    typeof value.port === 'number'
  );
}

const input: unknown = { host: 'localhost' };

if (isConfig(input)) {
  const port: number = input.port;
  console.log(port.toFixed(0));
}

// @ts-expect-error без проверки сюда попасть нельзя
const broken: Config = { host: 'localhost' };
`,
    },
  ],
};
