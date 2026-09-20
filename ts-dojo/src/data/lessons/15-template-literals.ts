import type { Lesson } from '../types.ts';

export const templateLiterals: Lesson = {
  slug: '15-template-literals',
  block: 3,
  order: 15,
  title: 'Template literal types',
  shortTitle: 'Шаблонные типы',
  summary: 'Строковые шаблоны на уровне типов: комбинаторный взрыв и как его не устроить.',
  theory: [
    '**Template literal type** — `` `prefix-${T}` ``. Если `T` это union, шаблон раскрывается по каждому члену: получается union всех комбинаций.',
    'Комбинации перемножаются. Два union по десять членов в одном шаблоне дают сто типов, три — тысячу. У компилятора есть предел (около ста тысяч членов), после которого он остановится с ошибкой — и правильно сделает: такой тип бесполезен для человека.',
    'Встроенные intrinsic-типы: `Uppercase`, `Lowercase`, `Capitalize`, `Uncapitalize`. Они реализованы внутри компилятора, а не на TypeScript, поэтому работают быстро и только со строками.',
    'Шаблон умеет и разбирать строку — в паре с `infer`. Так типизируют пути роутера, ключи вложенных объектов и формат идентификаторов.',
    'Практическая граница: шаблоны хороши для конечных, небольших наборов — префиксы событий, имена CSS-переменных, методы `get*`. Для разбора произвольных строк они превращаются в медленные рекурсивные типы, и цена растёт быстрее пользы.',
  ],
  docs: [
    {
      label: 'Handbook: Template literal types',
      href: 'https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html',
    },
    {
      label: 'Handbook: Intrinsic string types',
      href: 'https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html#intrinsic-string-manipulation-types',
    },
  ],
  experiments: [
    {
      id: 'combinations',
      title: 'Как раскрывается union в шаблоне',
      question:
        'Предскажи, сколько членов окажется в каждом типе и какие значения подойдут.',
      variants: [
        {
          id: 'single-union',
          label: 'Один union',
          code: `type Size = 'small' | 'large';
type ClassName = \`btn-\${Size}\`;

const a: ClassName = 'btn-small';
const b: ClassName = 'btn-large';
const c: ClassName = 'btn-medium';

console.log(a, b, c);
`,
          verdict:
            'Одна ошибка — на c. ClassName это union из двух членов: "btn-small" | "btn-large". Сообщение перечисляет их целиком, поэтому опечатки в именах классов ловятся сразу.',
          expect: [2322],
        },
        {
          id: 'two-unions',
          label: 'Два union — произведение',
          code: `type Size = 'sm' | 'md' | 'lg';
type Side = 'top' | 'right' | 'bottom' | 'left';

type Spacing = \`m\${Side}-\${Size}\`;

const a: Spacing = 'mtop-sm';
const b: Spacing = 'mleft-lg';
const c: Spacing = 'mcenter-sm';

console.log(a, b, c);
`,
          verdict:
            'Одна ошибка — на c. Spacing содержит 4 × 3 = 12 членов: шаблон перемножает union, а не складывает. На двух-трёх небольших наборах это удобно, но именно отсюда растут неподъёмные типы.',
          expect: [2322],
        },
        {
          id: 'intrinsics',
          label: 'Uppercase и друзья',
          code: `type UiEvent = 'click' | 'focus';

type Handler = \`on\${Capitalize<UiEvent>}\`;
type Constant = Uppercase<UiEvent>;

const a: Handler = 'onClick';
const b: Constant = 'FOCUS';
const c: Handler = 'onclick';

console.log(a, b, c);
`,
          verdict:
            'Одна ошибка — на c: регистр важен, нужен onClick. Capitalize и Uppercase встроены в компилятор и применяются к каждому члену union по отдельности.',
          expect: [2820],
        },
      ],
      takeaway:
        'Шаблон — это декартово произведение. Считай размер результата до того, как напишешь третий union в одну строку.',
    },
    {
      id: 'parsing',
      title: 'Разбор строки шаблоном',
      question:
        'Шаблон в паре с infer разбирает путь. Предскажи, что он вынет.',
      variants: [
        {
          id: 'split-once',
          label: 'Одно разделение',
          code: `type After<T> = T extends \`\${string}/\${infer Rest}\` ? Rest : never;

type A = After<'api/users'>;
type B = After<'api/users/list'>;

const a: A = 'users';
const b: B = 'users/list';
const c: B = 'list';

console.log(a, b, c);
`,
          verdict:
            'Одна ошибка — на c. Шаблон жадный слева: ${string} захватил минимум, поэтому Rest для "api/users/list" стал "users/list", а не "list". Знать направление жадности обязательно — иначе разбор даёт не тот кусок.',
          expect: [2322],
        },
        {
          id: 'recursive-split',
          label: 'Рекурсивный разбор',
          code: `type Split<T> = T extends \`\${infer Head}/\${infer Rest}\`
  ? [Head, ...Split<Rest>]
  : [T];

type Parts = Split<'api/users/list'>;

const parts: Parts = ['api', 'users', 'list'];
const wrong: Parts = ['api', 'users'];

console.log(parts, wrong);
`,
          verdict:
            'Одна ошибка — на wrong. Рекурсия разобрала строку в кортеж ["api", "users", "list"] ровно из трёх элементов. Так типизируют пути и ключи вложенных объектов — но каждый уровень стоит компилятору времени.',
          expect: [2322],
        },
      ],
      takeaway:
        'Шаблон и infer вместе дают разбор строк на уровне типов. Помни о жадности образца и о том, что рекурсия здесь не бесплатна.',
    },
  ],
  tasks: [
    {
      id: 'css-vars',
      title: 'Имена CSS-переменных',
      brief:
        'Собери тип имён CSS-переменных вида --color-primary из набора токенов.',
      constraints: ['Через template literal type', 'Литералы руками не перечислять'],
      starter: `type Token = 'primary' | 'danger';

type CssVar = string;

const a: CssVar = '--color-primary';
// @ts-expect-error такого токена нет
const b: CssVar = '--color-muted';

console.log(a, b);
`,
      starterExpect: [2578],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: '--color-\\$\\{Token\\}', message: 'Нужен шаблон с Token' },
      ],
      hints: [
        'Сейчас CssVar это string, поэтому @ts-expect-error не сработал.',
        'Шаблонный тип раскроется по каждому члену union Token.',
        'type CssVar = `--color-${Token}`;',
      ],
      solution: `type Token = 'primary' | 'danger';

type CssVar = \`--color-\${Token}\`;

const a: CssVar = '--color-primary';
// @ts-expect-error такого токена нет
const b: CssVar = '--color-muted';

console.log(a, b);
`,
    },
    {
      id: 'event-handlers',
      title: 'Имена обработчиков',
      brief:
        'Из union событий собери тип имён обработчиков: click становится onClick.',
      constraints: ['Через Capitalize', 'Без перечисления руками'],
      starter: `type DomEvent = 'click' | 'change' | 'submit';

type HandlerName = string;

const a: HandlerName = 'onSubmit';
// @ts-expect-error регистр важен
const b: HandlerName = 'onsubmit';

console.log(a, b);
`,
      starterExpect: [2578],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'Capitalize<DomEvent>', message: 'Нужен Capitalize' },
      ],
      hints: [
        'Нужно поднять первую букву каждого члена union.',
        'В компилятор встроен тип, который делает ровно это.',
        'type HandlerName = `on${Capitalize<DomEvent>}`;',
      ],
      solution: `type DomEvent = 'click' | 'change' | 'submit';

type HandlerName = \`on\${Capitalize<DomEvent>}\`;

const a: HandlerName = 'onSubmit';
// @ts-expect-error регистр важен
const b: HandlerName = 'onsubmit';

console.log(a, b);
`,
    },
    {
      id: 'route-params',
      title: 'Все параметры пути',
      brief:
        'Из пути вида /users/:userId/posts/:postId собери union имён параметров.',
      constraints: ['Через рекурсию и infer'],
      starter: `type Params<T> = never;

type A = Params<'/users/:userId/posts/:postId'>;

const a: A = 'userId';
const b: A = 'postId';
// @ts-expect-error такого параметра нет
const c: A = 'slug';

console.log(a, b, c);
`,
      starterExpect: [2322, 2322],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'Params<', message: 'Нужна рекурсия — тип должен вызывать сам себя' },
        { kind: 'require', pattern: 'infer', message: 'Нужен infer' },
      ],
      hints: [
        'Разбирай строку по двоеточию: слева мусор, справа — имя параметра и остаток пути.',
        'Имя параметра заканчивается на слэше, поэтому нужен второй образец.',
        'Два случая: `${string}:${infer P}/${infer Rest}` и `${string}:${infer P}`.',
      ],
      solution: `type Params<T> = T extends \`\${string}:\${infer P}/\${infer Rest}\`
  ? P | Params<\`/\${Rest}\`>
  : T extends \`\${string}:\${infer P}\`
    ? P
    : never;

type A = Params<'/users/:userId/posts/:postId'>;

const a: A = 'userId';
const b: A = 'postId';
// @ts-expect-error такого параметра нет
const c: A = 'slug';

console.log(a, b, c);
`,
    },
  ],
};
