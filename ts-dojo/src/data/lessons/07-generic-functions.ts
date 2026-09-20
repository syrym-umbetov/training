import type { Lesson } from '../types.ts';

export const genericFunctions: Lesson = {
  slug: '07-generic-functions',
  block: 2,
  order: 7,
  title: 'Generic-функции и вывод типов из аргументов',
  shortTitle: 'Generic-функции',
  summary: 'Откуда компилятор берёт T и почему иногда получает не то, что ты ждал.',
  theory: [
    '**Type parameter** (параметр типа) — переменная в мире типов. Функция `identity<T>(value: T): T` связывает вход и выход: компилятор подставляет вместо `T` тип аргумента в каждом вызове отдельно.',
    '**Inference** (вывод) идёт от аргументов к параметрам типа. Если `T` встречается в нескольких позициях, компилятор собирает кандидатов и берёт их общий тип — а при конфликте выбирает по приоритету позиций, а не «первый попавшийся».',
    'Аргумент-литерал выводится как **widening literal type**: `identity("a")` даёт `"a"`, но с пометкой «можно расширить». Расширение срабатывает позже — при присваивании в `let` или в изменяемое свойство. Поэтому `const a = identity("a")` сохраняет `"a"`, а `let b = identity("a")` даёт `string`.',
    'Generic имеет смысл только когда параметр типа **связывает** две позиции: вход с выходом, аргумент с аргументом. Если `T` встречается ровно один раз, это замаскированный `any` — и об этом отдельный урок 11.',
    'Явная подстановка `fn<string>(x)` отключает вывод для всех параметров сразу: указал один — обязан указать все, кроме тех, у которых есть значение по умолчанию.',
  ],
  docs: [
    {
      label: 'Handbook: Generics',
      href: 'https://www.typescriptlang.org/docs/handbook/2/generics.html',
    },
    {
      label: 'Handbook: Inference',
      href: 'https://www.typescriptlang.org/docs/handbook/2/generics.html#type-argument-inference',
    },
  ],
  experiments: [
    {
      id: 'inference-sources',
      title: 'Откуда берётся T',
      question:
        'Наведи курсор на каждый вызов и предскажи, чем окажется T. Где компилятор выведет литерал, а где расширит?',
      variants: [
        {
          id: 'basic-inference',
          label: 'Вывод из одного аргумента',
          code: `function identity<T>(value: T): T {
  return value;
}

const viaConst = identity('строка');
let viaLet = identity('строка');

const a: 'строка' = viaConst;
const b: 'строка' = viaLet;

console.log(a, b);
`,
          verdict:
            'Одна ошибка — на b, не на a. Вывод дал литеральный тип "строка" в обоих случаях, но с пометкой «расширяемый». const пометку не трогает, а let расширяет до string — потому что переменную можно переприсвоить. Расширяет не вызов, а место, куда кладут результат.',
          expect: [2322],
        },
        {
          id: 'constrained-literal',
          label: 'Constraint сохраняет литерал',
          code: `function plain<T>(value: T): T {
  return value;
}

function constrained<T extends string>(value: T): T {
  return value;
}

let fromPlain = plain('строка');
let fromConstrained = constrained('строка');

const a: 'строка' = fromPlain;
const b: 'строка' = fromConstrained;

console.log(a, b);
`,
          verdict:
            'Одна ошибка — на a. Оба результата положили в let, но расширился только первый. T extends string убирает пометку «расширяемый»: компилятор видит верхнюю границу и понимает, что расширять литерал бессмысленно. Это стандартный приём, когда точные ключи нужны даже в изменяемой переменной.',
          expect: [2322],
        },
        {
          id: 'two-positions',
          label: 'T в двух позициях сразу',
          code: `function pair<T>(first: T, second: T): T[] {
  return [first, second];
}

const same = pair(1, 2);
const mixed = pair(1, 'два');

console.log(same, mixed);
`,
          verdict:
            'Одна ошибка TS2345 — на втором аргументе mixed. Важный факт: при нескольких кандидатах компилятор не строит union, а выбирает по приоритету позиций — здесь первый аргумент зафиксировал T = number, и строка во вторую позицию уже не легла. Если нужен union, его объявляют явно: pair<string | number>(1, "два").',
          expect: [2345],
        },
        {
          id: 'explicit-breaks',
          label: 'Явная подстановка отключает вывод',
          code: `function convert<Input, Output>(value: Input, map: (input: Input) => Output): Output {
  return map(value);
}

const inferred = convert(5, (n) => n.toFixed(2));

const partial = convert<number>(5, (n) => n.toFixed(2));

console.log(inferred, partial);
`,
          verdict:
            'Одна ошибка TS2558 на partial: указан один аргумент типа, а объявлено два. Правило жёсткое — либо выводятся все, либо перечисляются все. Половинчатой подстановки нет, поэтому параметры типа стоит упорядочивать так, чтобы редко указываемые шли последними и имели значения по умолчанию.',
          expect: [2558],
        },
      ],
      takeaway:
        'Вывод идёт от значений и по умолчанию расширяет литералы. Constraint — это не только ограничение, но и указание компилятору, насколько точно выводить.',
    },
    {
      id: 'inference-fails',
      title: 'Где вывод ломается',
      question:
        'Два способа написать одно и то же. Предскажи, в каком случае компилятор потеряет связь между аргументом и результатом.',
      variants: [
        {
          id: 'lost-link',
          label: 'T только в возвращаемом типе',
          code: `function parse<T>(raw: string): T {
  return JSON.parse(raw);
}

const user = parse('{"id":1}');
const asNumber: number = user;
const asString: string = user;

console.log(asNumber, asString);
`,
          verdict:
            'Две ошибки TS2322. T не встречается среди аргументов, выводить его неоткуда — и компилятор подставляет unknown, поэтому оба присваивания падают. Опасность не здесь, а в том, что вызывающий может написать parse<{ id: number }>(raw) и получить полное доверие без единой проверки: ровно это разбирается в третьем задании.',
          expect: [2322, 2322],
        },
        {
          id: 'honest-unknown',
          label: 'Честная сигнатура',
          code: `function parse(raw: string): unknown {
  return JSON.parse(raw);
}

const user = parse('{"id":1}');
const asNumber: number = user;

console.log(asNumber);
`,
          verdict:
            'Ошибка TS2322: unknown не присваивается в number. Функция честно говорит «я не знаю, что вернул JSON.parse», и заставляет вызывающего сузить. Ровно та же работа, но без обмана.',
          expect: [2322],
        },
      ],
      takeaway:
        'Параметр типа, который не участвует в аргументах, ничего не связывает — он только даёт вызывающему право назвать результат как угодно. Это подпись под чужим обещанием.',
    },
  ],
  tasks: [
    {
      id: 'infer-map',
      title: 'Связать вход и выход',
      brief:
        'mapValues должна принимать массив и функцию, а возвращать массив того типа, который вернула функция. Сейчас связь потеряна.',
      constraints: ['Без any', 'Без as'],
      starter: `function mapValues(items: unknown[], fn: (item: unknown) => unknown): unknown[] {
  return items.map(fn);
}

const lengths: number[] = mapValues(['a', 'bb'], (item) => item.length);

console.log(lengths);
`,
      starterExpect: [2322, 18046],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bany\\b', message: 'any запрещён условием задания' },
        { kind: 'forbid', pattern: '\\bas\\s+\\w', message: 'Ассерты запрещены условием задания' },
        { kind: 'require', pattern: 'function mapValues<', message: 'Функция должна стать generic' },
      ],
      hints: [
        'Сколько разных типов участвует: тип элемента на входе и тип результата функции. Они независимы?',
        'Нужны два параметра типа: один связывает items с параметром fn, второй — результат fn с результатом mapValues.',
        'function mapValues<Item, Result>(items: Item[], fn: (item: Item) => Result): Result[]',
      ],
      solution: `function mapValues<Item, Result>(items: Item[], fn: (item: Item) => Result): Result[] {
  return items.map(fn);
}

const lengths: number[] = mapValues(['a', 'bb'], (item) => item.length);

console.log(lengths);
`,
    },
    {
      id: 'keep-literal-generic',
      title: 'Сохранить литеральный тип при выводе',
      brief:
        'Результат кладут в let, и литеральный тип расширяется до string. Сделай так, чтобы точность сохранилась даже в изменяемой переменной.',
      constraints: ['Без as const в месте вызова', 'Без as', 'let оставить'],
      starter: `function tag<T>(value: T): T {
  return value;
}

let result = tag('success');

const exact: 'success' = result;

console.log(exact);
`,
      starterExpect: [2322],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: 'as const', message: 'as const в этом задании запрещён' },
        { kind: 'require', pattern: 'T extends string', message: 'Нужен constraint T extends string' },
      ],
      hints: [
        'Наведи курсор на result. Вывод дал литерал — почему он не дожил до присваивания?',
        'Литерал был помечен как расширяемый, и let этим воспользовался. Пометку снимает верхняя граница у параметра типа.',
        'Объяви T extends string.',
      ],
      solution: `function tag<T extends string>(value: T): T {
  return value;
}

let result = tag('success');

const exact: 'success' = result;

console.log(exact);
`,
    },
    {
      id: 'no-lying-generic',
      title: 'Убрать generic, который врёт',
      brief:
        'fetchJson позволяет вызывающему назвать результат любым типом без всякой проверки. Сделай сигнатуру честной.',
      constraints: ['Без any', 'Параметр типа убрать'],
      starter: `function fetchJson<T>(raw: string): T {
  return JSON.parse(raw);
}

const value = fetchJson<{ id: number }>('{"id":"не число"}');

// компилятор уверен, что тут число, хотя в строке текст
const id: number = value.id;

console.log(id);
`,
      starterExpect: [],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bany\\b', message: 'any запрещён условием задания' },
        { kind: 'forbid', pattern: 'function fetchJson<', message: 'Параметр типа нужно убрать' },
        { kind: 'require', pattern: 'raw: string\\): unknown', message: 'Возвращать нужно unknown' },
      ],
      hints: [
        'Стартовый код компилируется. Что именно проверил компилятор, разрешив T = { id: number }?',
        'Ничего: T ниоткуда не выводится, вызывающий просто объявляет желаемое. Функция должна сказать правду о том, что знает.',
        'Убери <T> и верни unknown — тогда вызывающий обязан сузить сам.',
      ],
      solution: `function fetchJson(raw: string): unknown {
  return JSON.parse(raw);
}

const value = fetchJson('{"id":"не число"}');

// теперь компилятор требует проверку, и она ловит реальные данные
let id = 0;
if (typeof value === 'object' && value !== null && 'id' in value && typeof value.id === 'number') {
  id = value.id;
}

console.log(id);
`,
    },
  ],
};
