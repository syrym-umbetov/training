import type { Lesson } from '../types.ts';

export const literalTypes: Lesson = {
  slug: '05-literal-types',
  block: 1,
  order: 5,
  title: 'Literal types, widening, as const и satisfies',
  shortTitle: 'Литералы и satisfies',
  summary: 'Почему const сохраняет точный тип, let теряет его — и что делает satisfies.',
  theory: [
    '**Literal type** (литеральный тип) — тип из одного значения: `"circle"`, `42`, `true`. Union литералов заменяет перечисления и делает дискриминанты возможными.',
    '**Widening** (расширение) — компилятор по умолчанию расширяет литерал до базового типа, если значение может измениться. `const x = "a"` имеет тип `"a"`, `let x = "a"` — уже `string`. То же происходит со свойствами объектного литерала: они изменяемы, поэтому расширяются.',
    '`as const` замораживает литерал целиком: свойства становятся `readonly`, а их типы — литеральными. Это способ получить из массива строк union: `typeof roles[number]`.',
    '`satisfies` проверяет, что значение подходит под тип, **не заменяя** выведенный тип на него. Аннотация `const c: Config = {…}` расширит поля до типов из `Config`; `const c = {…} satisfies Config` оставит точные литеральные типы и при этом поймает опечатку в ключе.',
    'Правило выбора: аннотация — когда нужен ровно объявленный тип; `satisfies` — когда нужна и проверка, и сохранённая точность; `as const` — когда значение должно стать источником типов.',
  ],
  docs: [
    {
      label: 'Handbook: Literal types',
      href: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types',
    },
    {
      label: 'TS 4.9: satisfies',
      href: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator',
    },
    {
      label: 'Handbook: const assertions',
      href: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions',
    },
  ],
  experiments: [
    {
      id: 'widening',
      title: 'Где теряется литеральный тип',
      question:
        'Наведи курсор на каждую переменную и предскажи её тип до того, как посмотришь. Где будет "circle", а где string?',
      variants: [
        {
          id: 'const-vs-let',
          label: 'const против let',
          code: `const direct = 'circle';
let mutable = 'circle';

const inObject = { kind: 'circle' };
const frozen = { kind: 'circle' } as const;

type Shape = { kind: 'circle' | 'square' };

const a: Shape = { kind: direct };
const b: Shape = { kind: mutable };
const c: Shape = { kind: inObject.kind };
const d: Shape = { kind: frozen.kind };

console.log(a, b, c, d);
`,
          verdict:
            'Две ошибки, на строках с mutable и inObject.kind. direct — тип "circle", потому что const не переприсвоить. mutable — string: значение может измениться, литерал расширен. inObject.kind тоже string: свойство объекта изменяемо. frozen.kind остался "circle" — as const сделал поле readonly, расширять нечего.',
          expect: [2322, 2322],
        },
        {
          id: 'as-const-array',
          label: 'as const как источник union',
          code: `const roles = ['admin', 'editor', 'viewer'] as const;

type Role = (typeof roles)[number];

function can(role: Role): boolean {
  return role === 'admin';
}

can('admin');
can('editor');
can('root');

console.log(roles.length);
`,
          verdict:
            'Одна ошибка — на can("root"), TS2345. as const превратил массив в readonly кортеж литералов, а (typeof roles)[number] собрал из него union "admin" | "editor" | "viewer". Теперь список ролей задан один раз и в рантайме, и в типах.',
          expect: [2345],
        },
        {
          id: 'annotation-vs-satisfies',
          label: 'Аннотация против satisfies',
          code: `type Palette = Record<string, string>;

const annotated: Palette = { primary: '#0F6B4A', danger: '#9A3B2E' };
const checked = { primary: '#0F6B4A', danger: '#9A3B2E' } satisfies Palette;

// аннотация стёрла знание о конкретных ключах
const fromAnnotated = annotated.primaryy;

// satisfies знание сохранил
const fromChecked = checked.primaryy;

console.log(fromAnnotated, fromChecked);
`,
          verdict:
            'Одна ошибка — только на checked.primaryy. Аннотация Palette заменила выведенный тип на Record<string, string>, где допустим любой ключ, и опечатка прошла. satisfies проверил соответствие, но оставил тип { primary: string; danger: string } — опечатка поймана.',
          expect: [2551],
        },
      ],
      takeaway:
        'Аннотация — это приказ «считай, что тип такой», и она умеет терять точность. satisfies — вопрос «подходит ли», и точность он сохраняет.',
    },
    {
      id: 'satisfies-limits',
      title: 'Что satisfies не делает',
      question:
        'satisfies проверяет соответствие. Предскажи, ловит ли он лишний ключ и отсутствующий ключ.',
      variants: [
        {
          id: 'satisfies-catches',
          label: 'Лишнее и недостающее',
          code: `type Route = { path: string; title: string };

const ok = { path: '/', title: 'Главная' } satisfies Route;

const extra = { path: '/a', title: 'А', icon: 'star' } satisfies Route;

const missing = { path: '/b' } satisfies Route;

console.log(ok, extra, missing);
`,
          verdict:
            'Две ошибки: на extra (лишний ключ icon — satisfies проверяет свежий литерал, excess property check работает) и на missing (нет обязательного title). Обе строки указывают на конкретный ключ.',
          expect: [2353, 1360],
        },
        {
          id: 'satisfies-keeps-literals',
          label: 'Литеральность после satisfies',
          code: `type Config = { mode: 'dev' | 'prod'; retries: number };

const annotated: Config = { mode: 'dev', retries: 3 };
const checked = { mode: 'dev', retries: 3 } satisfies Config;

// сравнение с другим литералом
const x: 'dev' = annotated.mode;
const y: 'dev' = checked.mode;

console.log(x, y);
`,
          verdict:
            'Одна ошибка — на строке с annotated.mode, TS2322. Аннотация дала полю тип всего union "dev" | "prod", и присвоить его в "dev" нельзя. После satisfies тип поля остался "dev" — ровно то, что написано в значении.',
          expect: [2322],
        },
        {
          id: 'satisfies-widens-anyway',
          label: 'Когда satisfies литерал НЕ сохраняет',
          code: `type WithString = Record<string, { path: string }>;
type WithUnion = { mode: 'dev' | 'prod' };

const routes = { home: { path: '/' } } satisfies WithString;
const config = { mode: 'dev' } satisfies WithUnion;

const p: '/' = routes.home.path;
const m: 'dev' = config.mode;

console.log(p, m);
`,
          verdict:
            'Одна ошибка — на p, не на m. Тонкость, которую пропускают: satisfies не отменяет widening, он задаёт контекстный тип. Контекст для path — string, литерал расширяется до string. Контекст для mode — union литералов, расширять некуда, и "dev" сохраняется. Если нужен именно "/", нужен as const на значении.',
          expect: [2322],
        },
      ],
      takeaway:
        'satisfies — это проверка без замены выведенного типа. Но литеральность он сохраняет только там, где контекстный тип сам литеральный: против string расширение всё равно произойдёт, и тогда нужен as const.',
    },
  ],
  tasks: [
    {
      id: 'keep-literal',
      title: 'Сохранить литеральный тип',
      brief:
        'Функция ждёт конкретный вариант, а переменная расширилась до string. Почини объявление, не трогая функцию и не используя as.',
      constraints: ['Без as (кроме as const)', 'Сигнатуру move не менять'],
      starter: `type Direction = 'up' | 'down';

function move(direction: Direction): string {
  return 'идём ' + direction;
}

let chosen = 'up';

console.log(move(chosen));
`,
      starterExpect: [2345],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bas\\s+Direction', message: 'Ассерт к Direction запрещён' },
        { kind: 'forbid', pattern: '\\blet chosen', message: 'chosen не должен быть let' },
      ],
      hints: [
        'Наведи курсор на chosen. Какой у него тип и почему именно такой?',
        'let означает «значение может смениться», поэтому литерал расширен до string.',
        'Сделай chosen константой — или допиши as const.',
      ],
      solution: `type Direction = 'up' | 'down';

function move(direction: Direction): string {
  return 'идём ' + direction;
}

const chosen = 'up';

console.log(move(chosen));
`,
    },
    {
      id: 'roles-union',
      title: 'Union из массива',
      brief:
        'Список статусов задан массивом. Выведи из него тип Status, чтобы список не пришлось дублировать.',
      constraints: ['Не перечисляй литералы руками в типе', 'Массив остаётся источником правды'],
      starter: `const statuses = ['draft', 'review', 'published'];

type Status = string;

function publish(status: Status): boolean {
  return status === 'published';
}

publish('draft');
// @ts-expect-error такого статуса нет
publish('deleted');

console.log(statuses.length);
`,
      starterExpect: [2578],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'as const', message: 'Массив нужно заморозить через as const' },
        { kind: 'require', pattern: '\\(typeof statuses\\)\\[number\\]', message: 'Тип выводится из массива' },
      ],
      hints: [
        'Сейчас Status — это string, поэтому любая строка проходит и @ts-expect-error не срабатывает.',
        'Чтобы массив стал источником литеральных типов, его надо заморозить.',
        'const statuses = [...] as const; type Status = (typeof statuses)[number];',
      ],
      solution: `const statuses = ['draft', 'review', 'published'] as const;

type Status = (typeof statuses)[number];

function publish(status: Status): boolean {
  return status === 'published';
}

publish('draft');
// @ts-expect-error такого статуса нет
publish('deleted');

console.log(statuses.length);
`,
    },
    {
      id: 'use-satisfies',
      title: 'Проверить, не потеряв точность',
      brief:
        'Словарь маршрутов проверяется аннотацией — и из-за неё обращение к несуществующему маршруту проходит молча. Сохрани проверку структуры, но верни компилятору знание о наборе ключей.',
      constraints: ['Тип Routes не менять', 'Без as', 'Аннотацию убрать'],
      starter: `type Routes = Record<string, { path: string; auth: boolean }>;

const routes: Routes = {
  home: { path: '/', auth: false },
  admin: { path: '/admin', auth: true },
};

// @ts-expect-error такого маршрута нет
const bad = routes.hom;

console.log(bad, routes.home.auth);
`,
      starterExpect: [2578, 18048],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bas\\s+\\w', message: 'Ассерты запрещены условием задания' },
        { kind: 'require', pattern: 'satisfies Routes', message: 'Нужен satisfies Routes' },
        { kind: 'forbid', pattern: 'routes: Routes', message: 'Аннотацию нужно убрать' },
      ],
      hints: [
        'Директива @ts-expect-error сейчас не сработала — значит routes.hom ошибкой не считается. Почему Record<string, …> это допускает?',
        'Аннотация заменила выведенный тип на объявленный, где допустим любой строковый ключ. Нужен оператор, который проверит соответствие, но оставит выведенный тип.',
        'Убери : Routes и добавь satisfies Routes после литерала.',
      ],
      solution: `type Routes = Record<string, { path: string; auth: boolean }>;

const routes = {
  home: { path: '/', auth: false },
  admin: { path: '/admin', auth: true },
} satisfies Routes;

// @ts-expect-error такого маршрута нет
const bad = routes.hom;

console.log(bad, routes.home.auth);
`,
    },
  ],
};
