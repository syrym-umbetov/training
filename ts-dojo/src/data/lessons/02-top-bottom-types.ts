import type { Lesson } from '../types.ts';

export const topBottomTypes: Lesson = {
  slug: '02-top-bottom-types',
  block: 1,
  order: 2,
  title: 'unknown vs any vs never, top и bottom types',
  shortTitle: 'unknown / any / never',
  summary: 'Два верхних типа ведут себя противоположно, а нижний присваивается куда угодно.',
  theory: [
    '**Top type** (верхний тип) — тот, в который присваивается всё. Их два: `any` и `unknown`. Разница не в том, что в них кладут, а в том, что с ними разрешено делать дальше.',
    '`unknown` не даёт сделать с собой ничего, пока ты его не сузишь: ни обратиться к свойству, ни вызвать, ни присвоить в конкретный тип. Это честный «я не знаю, что тут».',
    '`any` отключает проверку в обе стороны. Он присваивается в любой тип — и в этом его опасность: одно `any` в цепочке снимает контроль со всего, что от него зависит, молча и без единой ошибки.',
    '**Bottom type** (нижний тип) — `never`, тип без значений. Он присваивается в любой тип, а в него — ничего. Он возникает сам: как тип функции, которая не возвращает управление, как результат невозможного пересечения, и как остаток в исчерпывающем разборе union.',
    'Практическое правило: на входе данных — `unknown` вместо `any`, а `never` читай как сигнал «сюда попасть нельзя», и если компилятор показывает `never` там, где ты ждал значение — он говорит, что твоя ветка недостижима.',
  ],
  docs: [
    {
      label: 'Handbook: The unknown type',
      href: 'https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown',
    },
    {
      label: 'Handbook: never',
      href: 'https://www.typescriptlang.org/docs/handbook/2/functions.html#never',
    },
    {
      label: 'Handbook: any',
      href: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#any',
    },
  ],
  experiments: [
    {
      id: 'top-types',
      title: 'Что разрешено делать с any, unknown и never',
      question:
        'В каждом варианте значение приходит снаружи. Предскажи, сколько ошибок даст компилятор и на каких строках.',
      variants: [
        {
          id: 'any-silent',
          label: 'any — тишина',
          code: `const raw: any = JSON.parse('{"count":"12"}');

const count: number = raw.count;
const doubled = count * 2;
const userName: string = raw.user.profile.name;

console.log(doubled, userName);
`,
          verdict:
            'Ноль ошибок — и все три строки опасны. raw.count на самом деле строка, count * 2 даст "1212", а raw.user.profile упадёт в рантайме. any присваивается в number и в string без единого вопроса: проверка отключена, а не пройдена.',
          expect: [],
        },
        {
          id: 'unknown-honest',
          label: 'unknown — всё запрещено',
          code: `const raw: unknown = JSON.parse('{"count":"12"}');

const count: number = raw;
const doubled = raw.count;

console.log(count, doubled);
`,
          verdict:
            'Две ошибки. TS2322: unknown не присваивается в number — в отличие от any. TS18046: у unknown нет свойств, пока он не сужен. Ровно те вопросы, которые any проглотил.',
          expect: [2322, 18046],
        },
        {
          id: 'unknown-narrowed',
          label: 'unknown после сужения',
          code: `const raw: unknown = JSON.parse('{"count":12}');

if (typeof raw === 'object' && raw !== null && 'count' in raw) {
  const value = raw.count;
  console.log(value);
}
`,
          verdict:
            'Чисто. После трёх проверок TS знает достаточно, чтобы пустить к свойству. Обрати внимание на тип value — наведи курсор: это unknown, а не number. Проверка `in` доказала наличие ключа, но не тип значения.',
          expect: [],
        },
        {
          id: 'never-bottom',
          label: 'never — нижний тип',
          code: `function fail(message: string): never {
  throw new Error(message);
}

// never присваивается куда угодно
const a: string = fail('нет строки');
const b: number = fail('нет числа');

// а в never не присваивается ничего
const c: never = 'строка';

console.log(a, b, c);
`,
          verdict:
            'Одна ошибка — только на последней строке, TS2322. Первые два присваивания легальны: never присваивается в любой тип, потому что значений этого типа не существует, и обещание «верну string» нарушить невозможно. Обратное запрещено.',
          expect: [2322],
        },
      ],
      takeaway:
        'any и unknown принимают одно и то же, но расходятся на выходе: any раздаёт себя в любой тип, unknown не отдаёт себя никуда. never — зеркало unknown: отдаётся всем, не принимает никого.',
    },
    {
      id: 'any-spreads',
      title: 'Как any расползается',
      question:
        'Одно any в самом низу цепочки. Предскажи, где компилятор остановит ошибку, а где пропустит.',
      variants: [
        {
          id: 'through-generic',
          label: 'Через generic и массив',
          code: `function first<T>(items: T[]): T | undefined {
  return items[0];
}

const parsed: any[] = JSON.parse('[1, 2, 3]');
const head = first(parsed);

const upper: string = head.toUpperCase();
const sum: number = head + 1;

console.log(upper, sum);
`,
          verdict:
            'Ноль ошибок. T вывелся в any, поэтому head — тоже any, и дальше он молча становится и string, и number. Заражение прошло сквозь generic: тип-параметр не защищает, он просто переносит any дальше.',
          expect: [],
        },
        {
          id: 'unknown-stops',
          label: 'То же, но unknown[]',
          code: `function first<T>(items: T[]): T | undefined {
  return items[0];
}

const parsed: unknown[] = JSON.parse('[1, 2, 3]');
const head = first(parsed);

const upper: string = head.toUpperCase();
const sum: number = head + 1;

console.log(upper, sum);
`,
          verdict:
            'Ошибки появились: с unknown[] тип head — unknown | undefined, и ни toUpperCase, ни сложение не проходят. Одна замена any на unknown в объявлении вернула контроль на всю цепочку.',
          expect: [18046, 18046],
        },
      ],
      takeaway:
        'any не локален: он течёт по выводу типов через generics, массивы и возвращаемые значения. Поэтому его место — не «временно заткнуть», а нигде; граница данных типизируется unknown.',
    },
  ],
  tasks: [
    {
      id: 'unknown-gate',
      title: 'Заменить any на честную границу',
      brief:
        'readRetries получает распарсенный JSON. Вход честно объявлен как unknown — и поэтому к свойству не пускает. Сузь его так, чтобы функция возвращала number, а на неверных данных бросала.',
      constraints: ['Сигнатуру не менять — вход остаётся unknown', 'Без any', 'Без as'],
      starter: `function readRetries(input: unknown): number {
  return input.retries;
}

console.log(readRetries({ retries: 3 }));
`,
      starterExpect: [18046],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bany\\b', message: 'any запрещён условием задания' },
        { kind: 'forbid', pattern: '\\bas\\s+\\w', message: 'Ассерты запрещены условием задания' },
        { kind: 'require', pattern: 'input: unknown', message: 'Параметр должен быть unknown' },
      ],
      hints: [
        'unknown ничего не даёт делать, пока не докажешь его форму. Что нужно доказать, чтобы прочитать input.retries?',
        'Три шага: это объект, он не null, в нём есть ключ. Дальше останется проверить тип самого значения.',
        'typeof input === "object" && input !== null && "retries" in input, а затем typeof input.retries === "number".',
      ],
      solution: `function readRetries(input: unknown): number {
  if (
    typeof input === 'object' &&
    input !== null &&
    'retries' in input &&
    typeof input.retries === 'number'
  ) {
    return input.retries;
  }
  throw new Error('retries отсутствует или не число');
}

console.log(readRetries({ retries: 3 }));
`,
    },
    {
      id: 'never-return',
      title: 'never как возвращаемый тип',
      brief:
        'fail всегда бросает исключение, но объявлен как void — и поэтому компилятор не знает, что код после него недостижим. Из-за этого во второй функции он требует return.',
      constraints: ['Менять можно только сигнатуру fail'],
      starter: `function fail(message: string): void {
  throw new Error(message);
}

function parsePort(raw: string): number {
  const port = Number(raw);
  if (Number.isNaN(port)) {
    fail('порт не число');
  } else {
    return port;
  }
}

console.log(parsePort('8080'));
`,
      starterExpect: [2366],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'fail\\(message: string\\): never', message: 'fail должна возвращать never' },
      ],
      hints: [
        'Прочитай ошибку: компилятор считает, что parsePort может дойти до конца и ничего не вернуть. Почему он так считает?',
        'void значит «вернёт undefined и управление придёт назад». Нужен тип, который говорит «управление не вернётся».',
        'Замени void на never.',
      ],
      solution: `function fail(message: string): never {
  throw new Error(message);
}

function parsePort(raw: string): number {
  const port = Number(raw);
  if (Number.isNaN(port)) {
    fail('порт не число');
  } else {
    return port;
  }
}

console.log(parsePort('8080'));
`,
    },
    {
      id: 'empty-object',
      title: '{} — не то, что ты думаешь',
      brief:
        'Тип {} принимает почти всё, кроме null и undefined, и поэтому бесполезен как «пустой объект». Сделай так, чтобы onlyObjects принимал объекты и массивы, но отвергал строку и число.',
      constraints: ['Не используй unknown в сигнатуре', 'Без any'],
      starter: `function onlyObjects(value: {}): string {
  return Object.keys(value).join(',');
}

onlyObjects({ a: 1 });
onlyObjects([1, 2]);

// @ts-expect-error строка не объект
onlyObjects('строка');
// @ts-expect-error число не объект
onlyObjects(42);
`,
      starterExpect: [2578, 2578],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bany\\b', message: 'any запрещён условием задания' },
        { kind: 'require', pattern: 'value: object', message: 'Нужен тип object' },
      ],
      hints: [
        'Директивы @ts-expect-error сейчас помечены как неиспользованные — значит строка и число проходят. Почему {} их пускает?',
        '{} значит «что угодно, у чего есть свойства», а у примитивов они есть — через обёртки. Нужен тип, который описывает именно нессылочные значения как чужие.',
        'Есть отдельный встроенный тип object (с маленькой буквы).',
      ],
      solution: `function onlyObjects(value: object): string {
  return Object.keys(value).join(',');
}

onlyObjects({ a: 1 });
onlyObjects([1, 2]);

// @ts-expect-error строка не объект
onlyObjects('строка');
// @ts-expect-error число не объект
onlyObjects(42);
`,
    },
  ],
};
