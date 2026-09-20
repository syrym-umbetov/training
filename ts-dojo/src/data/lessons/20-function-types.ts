import type { Lesson } from '../types.ts';

export const functionTypes: Lesson = {
  slug: '20-function-types',
  block: 4,
  order: 20,
  title: 'Function types и типизация this',
  shortTitle: 'Функции и this',
  summary: 'Лишние аргументы, необязательные параметры и параметр this, которого нет в рантайме.',
  theory: [
    'Функция с **меньшим** числом параметров присваивается туда, где ждут функцию с большим: `() => void` годится вместо `(a: string) => void`. Это отражает JavaScript, где лишние аргументы просто игнорируются, и делает возможным `items.map(() => 0)`.',
    'Возвращаемый тип `void` особенный: функция, возвращающая что угодно, присваивается в `() => void`. Иначе `arr.forEach(() => arr.push(1))` не компилировался бы. Но результат такой функции считается `void` и использовать его нельзя.',
    '**this-параметр** — фиктивный первый параметр `function f(this: Ctx, …)`. В рантайме его нет, он стирается; он лишь объявляет, с каким `this` функцию разрешено вызывать. Флаг `noImplicitThis` (входит в `strict`) заставляет объявлять его там, где `this` иначе был бы `any`.',
    'Стрелочные функции собственного `this` не имеют, поэтому `this`-параметр им объявить нельзя — и это одна из причин, по которой обработчики в классах пишут стрелками.',
    '`ThisParameterType<T>` и `OmitThisParameter<T>` — встроенные утилиты для работы с этим параметром; они нужны, когда функцию с `this` надо передать дальше или привязать.',
  ],
  docs: [
    {
      label: 'Handbook: Declaring this in a function',
      href: 'https://www.typescriptlang.org/docs/handbook/2/functions.html#declaring-this-in-a-function',
    },
    {
      label: 'Handbook: Assignability of functions',
      href: 'https://www.typescriptlang.org/docs/handbook/2/functions.html#assignability-of-functions',
    },
  ],
  experiments: [
    {
      id: 'arity',
      title: 'Меньше параметров — это нормально',
      question:
        'Предскажи, какие присваивания функций пройдут, а какие нет.',
      variants: [
        {
          id: 'fewer-params',
          label: 'Разное число параметров',
          code: `type Callback = (value: string, index: number) => void;

const both: Callback = (value, index) => console.log(value, index);
const onlyFirst: Callback = (value) => console.log(value);
const none: Callback = () => console.log('без аргументов');

const extra: Callback = (value, index, third: boolean) => console.log(value, index, third);

console.log(both, onlyFirst, none, extra);
`,
          verdict:
            'Три диагностики, и все на extra. Главная — TS2322: «Target signature provides too few arguments». Функция может принимать меньше параметров, чем объявлено в типе — лишние аргументы в JavaScript игнорируются. Требовать больше нельзя: третьего аргумента ей никто не передаст. Две TS7006 — следствие: раз присваивание провалилось, контекстная типизация не сработала и value с index остались без типов.',
          expect: [2322, 7006, 7006],
        },
        {
          id: 'void-return',
          label: 'Возврат в void',
          code: `type Handler = () => void;

const returnsNumber: Handler = () => 42;
const returnsString: Handler = () => 'строка';

const result = returnsNumber();
const used: number = result;

console.log(returnsString, used);
`,
          verdict:
            'Одна ошибка — на used, не на присваиваниях. Функция, возвращающая значение, присваивается в () => void: без этого не работал бы forEach с однострочными стрелками. Но снаружи результат считается void и использовать его нельзя.',
          expect: [2322],
        },
      ],
      takeaway:
        'Совместимость функций несимметрична по параметрам и по результату: меньше параметров — можно, больше — нет; вернуть лишнее в void — можно, прочитать его — нет.',
    },
    {
      id: 'this-param',
      title: 'Параметр this',
      question:
        'Предскажи, где компилятор потребует объявить this и где запретит вызов.',
      variants: [
        {
          id: 'implicit-this',
          label: 'this без объявления',
          code: `function describe(): string {
  return 'элемент ' + this.id;
}

console.log(describe);
`,
          verdict:
            'Ошибка TS2683: «this неявно имеет тип any». Флаг noImplicitThis входит в strict и требует объявить контекст явно. Сними в тумблерах strict — ошибка исчезнет, и вместе с ней исчезнет проверка.',
          expect: [2683],
        },
        {
          id: 'explicit-this',
          label: 'this объявлен',
          code: `type Widget = { id: number };

function describe(this: Widget): string {
  return 'элемент ' + this.id;
}

const widget: Widget = { id: 1 };

const bound = describe.bind(widget);
console.log(bound());

describe();
`,
          verdict:
            'Одна ошибка — на последнем вызове describe(). Параметр this объявлен, поэтому вызывать функцию без контекста запрещено: TS2684 прямо пишет, что void не подходит вместо Widget. При этом bind вернул функцию уже без this-параметра — OmitThisParameter сработал внутри типов стандартной библиотеки.',
          expect: [2684],
        },
      ],
      takeaway:
        'this-параметр существует только в типах: он ничего не добавляет в рантайм, но превращает «забыл привязать контекст» в ошибку компиляции.',
    },
  ],
  tasks: [
    {
      id: 'declare-this',
      title: 'Объявить контекст',
      brief:
        'Функция использует this, компилятор считает его any. Объяви контекст явно.',
      constraints: ['Без any', 'Функцию оставить обычной, не стрелкой'],
      starter: `type Counter = { count: number };

function increment(): number {
  this.count += 1;
  return this.count;
}

const counter: Counter = { count: 0 };
console.log(increment.call(counter));
`,
      starterExpect: [2683, 2683],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bany\\b', message: 'any запрещён условием задания' },
        { kind: 'require', pattern: 'this: Counter', message: 'Нужен параметр this: Counter' },
      ],
      hints: [
        'Прочитай ошибку: компилятор не знает, чем окажется this при вызове.',
        'Контекст объявляют фиктивным первым параметром.',
        'function increment(this: Counter): number',
      ],
      solution: `type Counter = { count: number };

function increment(this: Counter): number {
  this.count += 1;
  return this.count;
}

const counter: Counter = { count: 0 };
console.log(increment.call(counter));
`,
    },
    {
      id: 'callback-arity',
      title: 'Сузить колбэк',
      brief:
        'Колбэк требует третий аргумент, которого источник не передаёт. Исправь его.',
      constraints: ['Тип Subscriber не менять'],
      starter: `type Subscriber = (message: string, at: number) => void;

function subscribe(fn: Subscriber): void {
  fn('привет', Date.now());
}

const listener = (message: string, at: number, extra: boolean): void => {
  console.log(message, at, extra);
};

subscribe(listener);
`,
      starterExpect: [2345],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: 'extra: boolean', message: 'Лишний параметр нужно убрать' },
      ],
      hints: [
        'Функция может принимать меньше параметров, чем объявлено в типе. А больше?',
        'Третий аргумент ей никто не передаст, поэтому такой колбэк не подходит.',
        'Убери параметр extra.',
      ],
      solution: `type Subscriber = (message: string, at: number) => void;

function subscribe(fn: Subscriber): void {
  fn('привет', Date.now());
}

const listener = (message: string, at: number): void => {
  console.log(message, at);
};

subscribe(listener);
`,
    },
  ],
};
