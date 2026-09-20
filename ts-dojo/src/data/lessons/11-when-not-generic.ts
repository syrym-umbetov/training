import type { Lesson } from '../types.ts';

export const whenNotGeneric: Lesson = {
  slug: '11-when-not-generic',
  block: 2,
  order: 11,
  title: 'Когда generic не нужен',
  shortTitle: 'Generic не нужен',
  summary: 'Параметр типа, встречающийся один раз, — это any с лишним синтаксисом.',
  theory: [
    'Правило одной строки: **параметр типа обязан встречаться минимум дважды**. Он существует, чтобы связать две позиции — вход с выходом, аргумент с аргументом, поле с методом. Один раз — связывать нечего.',
    'Одиночный `T` в позиции аргумента эквивалентен ограничению или `unknown`: `function log<T>(value: T)` — это `function log(value: unknown)`, только длиннее.',
    'Одиночный `T` в позиции результата опаснее: он передаёт вызывающему право назвать возвращаемое значение любым типом. Компилятор не проверит ничего — ровно поведение `any`, но выглядит как типобезопасность.',
    'Обратная ошибка — убрать generic там, где он нёс информацию: тогда функция сузит возвращаемый тип до объявленного, и вызывающий потеряет знание о своих полях.',
    'Проверка при код-ревью: посчитай вхождения параметра типа в сигнатуре. Одно — удаляй. Два и больше — оставляй и убедись, что связь между ними именно та, которая нужна.',
  ],
  docs: [
    {
      label: 'Handbook: Guidelines for writing good generic functions',
      href: 'https://www.typescriptlang.org/docs/handbook/2/functions.html#guidelines-for-writing-good-generic-functions',
    },
  ],
  experiments: [
    {
      id: 'single-use',
      title: 'Параметр типа, встречающийся один раз',
      question:
        'Три сигнатуры. Предскажи, какие из них дают вызывающему реальную типобезопасность, а какие только её вид.',
      variants: [
        {
          id: 'single-in-argument',
          label: 'Один раз в аргументе',
          code: `function logGeneric<T>(value: T): void {
  console.log(value);
}

function logUnknown(value: unknown): void {
  console.log(value);
}

logGeneric('строка');
logGeneric(42);
logUnknown('строка');
logUnknown(42);
`,
          verdict:
            'Чисто в обоих случаях — функции полностью эквивалентны. T выводится, нигде больше не используется и немедленно забывается. Generic здесь только усложняет чтение сигнатуры.',
          expect: [],
        },
        {
          id: 'single-in-return',
          label: 'Один раз в результате',
          code: `function readStorage<T>(key: string): T {
  return JSON.parse(localStorage.getItem(key) ?? 'null');
}

const count = readStorage<number>('count');
const list = readStorage<string[]>('count');

const sum = count + 1;
const joined = list.join(',');

console.log(sum, joined);
`,
          verdict:
            'Ноль ошибок — и обе переменные читают один и тот же ключ, объявляя разные типы. Компилятор согласился с обоими, потому что проверять нечего: T назначает вызывающий. Это any, замаскированный под generic.',
          expect: [],
        },
        {
          id: 'honest-version',
          label: 'Честная версия того же',
          code: `function readStorage(key: string): unknown {
  return JSON.parse(localStorage.getItem(key) ?? 'null');
}

const count = readStorage('count');

const sum = count + 1;

console.log(sum);
`,
          verdict:
            'Ошибка TS18046: count имеет тип unknown. Функция вернула честное «я не знаю» и вынудила вызывающего проверить данные. Меньше синтаксиса, больше гарантий.',
          expect: [18046],
        },
      ],
      takeaway:
        'Считай вхождения параметра типа. Одно вхождение в аргументе — лишний синтаксис; одно в результате — дыра в типобезопасности.',
    },
    {
      id: 'generic-earns-keep',
      title: 'Где generic действительно нужен',
      question:
        'Тот же код с generic и без. Предскажи, где вызывающий потеряет информацию о своём типе.',
      variants: [
        {
          id: 'without-generic',
          label: 'Без generic',
          code: `function withTimestamp(entity: { id: number }): { id: number; at: number } {
  return { ...entity, at: Date.now() };
}

const result = withTimestamp({ id: 1, title: 'первый' });

const title: string = result.title;

console.log(title);
`,
          verdict:
            'Две ошибки. TS2353 — excess property check на аргументе: свежий литерал с лишним title отвергнут (урок 01). TS2339 — у результата нет title: функция сузила тип до объявленного, и поле исчезло, хотя в рантайме spread его сохранил. Типы разошлись с реальностью в обе стороны.',
          expect: [2353, 2339],
        },
        {
          id: 'with-generic',
          label: 'С generic',
          code: `function withTimestamp<T extends { id: number }>(entity: T): T & { at: number } {
  return { ...entity, at: Date.now() };
}

const result = withTimestamp({ id: 1, title: 'первый' });

const title: string = result.title;
const at: number = result.at;

console.log(title, at);
`,
          verdict:
            'Чисто. T встречается дважды — в аргументе и в результате — и связывает их: полная форма входа доезжает до выхода, а пересечение добавляет новое поле. Вот случай, когда generic оправдан.',
          expect: [],
        },
      ],
      takeaway:
        'Generic оправдан, когда он переносит тип из одной позиции в другую. Если функция возвращает фиксированную форму — обычные параметры честнее.',
    },
  ],
  tasks: [
    {
      id: 'remove-useless-generic',
      title: 'Убрать бесполезный параметр типа',
      brief:
        'В сигнатуре есть T, который встречается ровно один раз. Убери его, не меняя поведения для вызывающих.',
      constraints: ['Вызовы внизу менять нельзя', 'Без any'],
      starter: `function serialize<T>(value: T): string {
  return JSON.stringify(value);
}

console.log(serialize({ id: 1 }));
console.log(serialize('строка'));
console.log(serialize([1, 2, 3]));
`,
      starterExpect: [],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: 'function serialize<', message: 'Параметр типа нужно убрать' },
        { kind: 'forbid', pattern: '\\bany\\b', message: 'any запрещён условием задания' },
        { kind: 'require', pattern: 'value: unknown', message: 'Параметр должен стать unknown' },
      ],
      hints: [
        'Сколько раз T встречается в сигнатуре и что он связывает?',
        'Ничего: он выводится и сразу забывается. Значит его можно заменить типом, который принимает всё.',
        'function serialize(value: unknown): string',
      ],
      solution: `function serialize(value: unknown): string {
  return JSON.stringify(value);
}

console.log(serialize({ id: 1 }));
console.log(serialize('строка'));
console.log(serialize([1, 2, 3]));
`,
    },
    {
      id: 'add-needed-generic',
      title: 'Добавить generic там, где он нужен',
      brief:
        'pickFirst теряет тип элемента: вызывающий получает объявленную форму вместо своей. Верни связь между входом и выходом.',
      constraints: ['Без any', 'Без as'],
      starter: `function pickFirst(items: Array<{ id: number }>): { id: number } | undefined {
  return items[0];
}

const first = pickFirst([{ id: 1, title: 'первый' }]);

const title: string | undefined = first?.title;

console.log(title);
`,
      starterExpect: [2353, 2339],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bany\\b', message: 'any запрещён условием задания' },
        { kind: 'require', pattern: 'function pickFirst<', message: 'Функция должна стать generic' },
      ],
      hints: [
        'Ошибка говорит, что у результата нет title. Где потерялась эта информация?',
        'Объявленный тип результата фиксирован, поэтому форма аргумента до него не доезжает.',
        'function pickFirst<T extends { id: number }>(items: T[]): T | undefined',
      ],
      solution: `function pickFirst<T extends { id: number }>(items: T[]): T | undefined {
  return items[0];
}

const first = pickFirst([{ id: 1, title: 'первый' }]);

const title: string | undefined = first?.title;

console.log(title);
`,
    },
  ],
};
