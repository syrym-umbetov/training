import type { Lesson } from '../types.ts';

export const tsconfigFlags: Lesson = {
  slug: '22-tsconfig-flags',
  block: 4,
  order: 22,
  title: 'Флаги tsconfig, меняющие систему типов',
  shortTitle: 'Флаги tsconfig',
  summary: 'strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes — что каждый реально ловит.',
  theory: [
    'В этом уроке тумблеры сверху — главный инструмент. Каждый эксперимент написан так, чтобы ошибка появлялась и исчезала от одного флага: сними его и посмотри, что перестанет проверяться.',
    '`strict` — не отдельная проверка, а набор: `strictNullChecks`, `strictFunctionTypes`, `noImplicitAny`, `noImplicitThis`, `strictBindCallApply`, `strictPropertyInitialization`, `useUnknownInCatchVariables`, `alwaysStrict`. Включать их по одному имеет смысл только при миграции.',
    '`noUncheckedIndexedAccess` добавляет `| undefined` к результату доступа по индексу: `arr[0]` и `dict[key]`. Это честно — массив может быть пуст, ключа может не быть, — и это самый шумный из флагов, потому что требует проверок там, где раньше их не было.',
    '`exactOptionalPropertyTypes` разделяет «ключа нет» и «ключ есть со значением undefined». Без него `{ a?: number }` принимает `{ a: undefined }`; с ним — нет, и приходится писать `{ a?: number | undefined }`, если явный undefined действительно нужен.',
    'Ни один из этих флагов не меняет генерируемый JavaScript. Они меняют только то, что компилятор считает ошибкой — поэтому включать их можно постепенно, файл за файлом.',
  ],
  docs: [
    {
      label: 'tsconfig: strict',
      href: 'https://www.typescriptlang.org/tsconfig/#strict',
    },
    {
      label: 'tsconfig: noUncheckedIndexedAccess',
      href: 'https://www.typescriptlang.org/tsconfig/#noUncheckedIndexedAccess',
    },
    {
      label: 'tsconfig: exactOptionalPropertyTypes',
      href: 'https://www.typescriptlang.org/tsconfig/#exactOptionalPropertyTypes',
    },
  ],
  experiments: [
    {
      id: 'indexed-access',
      title: 'noUncheckedIndexedAccess',
      question:
        'Предскажи, где появится undefined. Потом сними флаг в тумблерах и посмотри, сколько ошибок исчезнет.',
      variants: [
        {
          id: 'array-index',
          label: 'Доступ к элементу массива',
          code: `const items: string[] = ['первый'];

const first: string = items[0];
const upper = items[0].toUpperCase();

const safe = items[0] ?? 'запасной';
const checked = items.at(0);

console.log(first, upper, safe, checked);
`,
          verdict:
            'Две ошибки: items[0] имеет тип string | undefined, поэтому не присваивается в string и не пускает к toUpperCase. Строки с ?? и с at() проходят. Сними noUncheckedIndexedAccess — обе ошибки исчезнут, а риск получить undefined останется.',
          expect: [2322, 2532],
        },
        {
          id: 'dict-access',
          label: 'Доступ по ключу словаря',
          code: `const translations: Record<string, string> = { hello: 'привет' };

const known: string = translations.hello;
const dynamic: string = translations['unknown-key'];

console.log(known, dynamic);
`,
          verdict:
            'Две ошибки — и на известном ключе тоже. Флаг не различает «ключ точно есть» и «ключа может не быть»: у Record<string, string> любой доступ даёт string | undefined. Это плата за честность, и именно поэтому для фиксированного набора ключей лучше объявлять объектный тип, а не Record.',
          expect: [2322, 2322],
        },
      ],
      takeaway:
        'noUncheckedIndexedAccess не умеет отличать безопасный доступ от опасного. Он делает честным весь индексный доступ сразу — поэтому фиксированные наборы ключей описывают точным типом, а не словарём.',
    },
    {
      id: 'exact-optional',
      title: 'exactOptionalPropertyTypes',
      question:
        'Предскажи разницу между «ключа нет» и «ключ равен undefined».',
      variants: [
        {
          id: 'explicit-undefined',
          label: 'Явный undefined в необязательном поле',
          code: `type Options = { timeout?: number };

const absent: Options = {};
const explicit: Options = { timeout: undefined };

const allowed: { timeout?: number | undefined } = { timeout: undefined };

console.log(absent, explicit, allowed);
`,
          verdict:
            'Одна ошибка — на explicit. С exactOptionalPropertyTypes знак вопроса значит только «ключа может не быть», но не «значение может быть undefined». Чтобы разрешить явный undefined, его пишут в тип — как в третьей строке. Сними флаг, и разница между вторым и третьим объявлением исчезнет.',
          expect: [2375],
        },
        {
          id: 'delete-vs-assign',
          label: 'Почему это важно',
          code: `type Options = { timeout?: number };

// частичное обновление: копируем поле из одного объекта в другой
function applyPatch(target: Options, patch: Options): void {
  target.timeout = patch.timeout;
}

// слияние настроек через spread
declare const fromEnv: { timeout: number | undefined };
const merged: Options = { ...fromEnv };

console.log(applyPatch, merged);
`,
          verdict:
            'Две ошибки, и обе — реальные сценарии. TS2412 на присваивании: patch.timeout имеет тип number | undefined, а целевое поле объявлено как необязательное без undefined. TS2375 на слиянии: spread принёс ключ со значением undefined, что для exactOptionalPropertyTypes не то же самое, что отсутствие ключа. Сообщения прямо советуют, что делать — добавить undefined в тип поля.',
          expect: [2412, 2375],
        },
      ],
      takeaway:
        'Флаг разделяет отсутствие ключа и значение undefined. Это важно везде, где объект патчат частично: JSON.stringify, PATCH-запросы, слияние настроек.',
    },
  ],
  tasks: [
    {
      id: 'safe-index',
      title: 'Пережить noUncheckedIndexedAccess',
      brief:
        'Функция берёт первый элемент и обязана вернуть строку. Сделай доступ безопасным, не отключая флаг.',
      constraints: ['Без as', 'Без !', 'Флаг не трогать'],
      starter: `function firstUpper(items: string[]): string {
  return items[0].toUpperCase();
}

console.log(firstUpper(['первый']));
console.log(firstUpper([]));
`,
      starterExpect: [2532],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bas\\s+\\w', message: 'Ассерты запрещены условием задания' },
        { kind: 'forbid', pattern: '\\]!', message: 'Оператор ! запрещён условием задания' },
      ],
      hints: [
        'Тип items[0] это string | undefined — массив может быть пуст.',
        'Нужно решить, что вернуть для пустого массива.',
        'const first = items[0]; if (first === undefined) return ""; — или воспользуйся ??',
      ],
      solution: `function firstUpper(items: string[]): string {
  const first = items[0];
  if (first === undefined) {
    return '';
  }
  return first.toUpperCase();
}

console.log(firstUpper(['первый']));
console.log(firstUpper([]));
`,
    },
    {
      id: 'exact-optional-fix',
      title: 'Разрешить явный undefined',
      brief:
        'API должен принимать { timeout: undefined } как «сбросить таймаут». Сейчас exactOptionalPropertyTypes это запрещает.',
      constraints: ['Флаг не отключать', 'Без as'],
      starter: `type RequestOptions = {
  url: string;
  timeout?: number;
};

const reset: RequestOptions = { url: '/api', timeout: undefined };

console.log(reset);
`,
      starterExpect: [2375],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bas\\s+\\w', message: 'Ассерты запрещены условием задания' },
        { kind: 'require', pattern: 'timeout\\?: number \\| undefined', message: 'undefined нужно разрешить явно' },
      ],
      hints: [
        'Знак вопроса говорит «ключа может не быть», а не «значение может быть undefined».',
        'Если явный undefined осмыслен, его надо объявить в типе значения.',
        'timeout?: number | undefined',
      ],
      solution: `type RequestOptions = {
  url: string;
  timeout?: number | undefined;
};

const reset: RequestOptions = { url: '/api', timeout: undefined };

console.log(reset);
`,
    },
    {
      id: 'record-to-shape',
      title: 'Убрать лишний undefined',
      brief:
        'Словарь с фиксированным набором ключей объявлен через Record, и каждый доступ даёт undefined. Опиши его точным типом.',
      constraints: ['Без Record', 'Флаг не отключать'],
      starter: `const labels: Record<string, string> = {
  save: 'Сохранить',
  cancel: 'Отмена',
};

const saveLabel: string = labels.save;

console.log(saveLabel);
`,
      starterExpect: [2322],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bRecord<', message: 'Record запрещён условием задания' },
        { kind: 'forbid', pattern: '\\bas\\s+\\w', message: 'Ассерты запрещены условием задания' },
      ],
      hints: [
        'Флаг считает, что у словаря может не быть любого ключа — и он прав относительно Record.',
        'Если набор ключей известен заранее, тип должен это отражать.',
        'Объяви { save: string; cancel: string } — или убери аннотацию и дай компилятору вывести тип.',
      ],
      solution: `const labels: { save: string; cancel: string } = {
  save: 'Сохранить',
  cancel: 'Отмена',
};

const saveLabel: string = labels.save;

console.log(saveLabel);
`,
    },
  ],
};
