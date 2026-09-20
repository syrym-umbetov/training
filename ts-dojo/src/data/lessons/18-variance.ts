import type { Lesson } from '../types.ts';

export const variance: Lesson = {
  slug: '18-variance',
  block: 4,
  order: 18,
  title: 'Variance: ковариантность, контравариантность и бивариантность методов',
  shortTitle: 'Variance',
  summary: 'Почему Dog[] сходит за Animal[], а (d: Dog) => void не сходит за (a: Animal) => void.',
  theory: [
    '**Variance** (вариантность) — правило, по которому совместимость `Container<A>` и `Container<B>` выводится из совместимости `A` и `B`.',
    '**Covariance** (ковариантность) — «в ту же сторону»: если `Dog` подходит вместо `Animal`, то `Dog[]` подходит вместо `Animal[]`. Так ведут себя возвращаемые значения и свойства только для чтения.',
    '**Contravariance** (контравариантность) — «в обратную»: функция, принимающая `Animal`, годится там, где ждут функцию, принимающую `Dog` — она справится и с более узким входом. Обратное небезопасно: обработчик собак не переварит произвольное животное.',
    '`strictFunctionTypes` включает контравариантную проверку параметров, но **только для функций, записанных как свойство** (`fn: (a: A) => void`). Методы (`fn(a: A): void`) остаются **бивариантными** — намеренная дыра ради совместимости с `Array`, `Promise` и остальной стандартной библиотекой.',
    'Массивы в TypeScript ковариантны и потому небезопасны: `Dog[]` присваивается в `Animal[]`, после чего в массив можно положить кошку. Компилятор знает об этом и всё равно разрешает — это осознанный компромисс ради удобства.',
    'Аннотации `in` и `out` (TS 4.7) позволяют задать вариантность параметра типа явно: `interface Box<out T>` — ковариантный, `in T` — контравариантный. Это ускоряет проверку и документирует намерение.',
  ],
  docs: [
    {
      label: 'TS 2.6: strictFunctionTypes',
      href: 'https://www.typescriptlang.org/tsconfig/#strictFunctionTypes',
    },
    {
      label: 'TS 4.7: Optional variance annotations',
      href: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html#optional-variance-annotations-for-type-parameters',
    },
    {
      label: 'Handbook: Type Compatibility',
      href: 'https://www.typescriptlang.org/docs/handbook/type-compatibility.html',
    },
  ],
  experiments: [
    {
      id: 'function-variance',
      title: 'Параметры функций идут в обратную сторону',
      question:
        'Предскажи, какое из двух присваиваний пройдёт: обработчик животных вместо обработчика собак или наоборот.',
      variants: [
        {
          id: 'contravariant',
          label: 'Функция как свойство',
          code: `type Animal = { name: string };
type Dog = { name: string; breed: string };

type HandleAnimal = (value: Animal) => void;
type HandleDog = (value: Dog) => void;

declare const handleAnimal: HandleAnimal;
declare const handleDog: HandleDog;

const a: HandleDog = handleAnimal;
const b: HandleAnimal = handleDog;

console.log(a, b);
`,
          verdict:
            'Одна ошибка — на b. Обработчик животных годится вместо обработчика собак: он умеет меньше требовать и справится с любой собакой. Обратное опасно — handleDog читает breed, а ему могли передать животное без породы. Это и есть контравариантность параметров.',
          expect: [2322],
        },
        {
          id: 'method-bivariance',
          label: 'То же, но методом',
          code: `type Animal = { name: string };
type Dog = { name: string; breed: string };

type WithMethod = { handle(value: Animal): void };
type WithProperty = { handle: (value: Animal) => void };

declare const dogMethod: { handle(value: Dog): void };
declare const dogProperty: { handle: (value: Dog) => void };

const a: WithMethod = dogMethod;
const b: WithProperty = dogProperty;

console.log(a, b);
`,
          verdict:
            'Одна ошибка — на b. Единственное отличие в синтаксисе: handle(value) — метод, handle: (value) => void — свойство. strictFunctionTypes проверяет контравариантно только свойства, а методы остались бивариантными. Дыра намеренная: без неё не типизируется Array.prototype и половина стандартной библиотеки.',
          expect: [2322],
        },
        {
          id: 'array-covariance',
          label: 'Массивы ковариантны и небезопасны',
          code: `type Animal = { name: string };
type Dog = { name: string; breed: string };

const dogs: Dog[] = [{ name: 'Рекс', breed: 'овчарка' }];

const animals: Animal[] = dogs;

animals.push({ name: 'Барсик' });

const breed: string = dogs[1]?.breed ?? 'нет';

console.log(breed);
`,
          verdict:
            'Чисто — и это дыра, о которой нужно знать. Dog[] присвоился в Animal[], после чего в тот же массив легло животное без породы. Компилятор разрешил осознанно: строгая проверка сделала бы массивы почти непригодными. Защита — readonly-массивы там, где менять не нужно.',
          expect: [],
        },
      ],
      takeaway:
        'Контравариантность параметров — не каприз, а условие безопасности. Метод и свойство с одинаковой сигнатурой проверяются по-разному: свойство строго, метод бивариантно.',
    },
    {
      id: 'variance-annotations',
      title: 'Аннотации in и out',
      question:
        'Параметру типа явно назначили вариантность. Предскажи, что станет ошибкой.',
      variants: [
        {
          id: 'out-covariant',
          label: 'out — только на выход',
          code: `interface Producer<out T> {
  get(): T;
}

// T на входе, но записан методом
interface WithMethod<out T> {
  get(): T;
  set(value: T): void;
}

// то же самое, но свойством
interface WithProperty<out T> {
  get(): T;
  set: (value: T) => void;
}

declare const dogs: Producer<{ name: string; breed: string }>;
const animals: Producer<{ name: string }> = dogs;

console.log(animals.get().name);
`,
          verdict:
            'Одна ошибка — на WithProperty, TS2636, и это прямое продолжение первого эксперимента. Аннотация out обещает, что T стоит только в выходных позициях. WithProperty обещание нарушает и ловится. WithMethod нарушает ровно так же — но методы бивариантны, поэтому компилятор претензий не предъявляет. Дыра бивариантности пробивает и проверку аннотаций.',
          expect: [2636],
        },
        {
          id: 'in-contravariant',
          label: 'in — только на вход',
          code: `interface Consumer<in T> {
  accept(value: T): void;
}

declare const animalConsumer: Consumer<{ name: string }>;

const dogConsumer: Consumer<{ name: string; breed: string }> = animalConsumer;

const wrong: Consumer<{ name: string }> = dogConsumer;

console.log(dogConsumer, wrong);
`,
          verdict:
            'Одна ошибка — на wrong. in задаёт контравариантность: потребитель животных годится вместо потребителя собак, но не наоборот. Аннотация не меняет правила, а фиксирует их и позволяет компилятору проверять быстрее, без вывода по структуре.',
          expect: [2322],
        },
      ],
      takeaway:
        'in и out — документация, которую проверяет компилятор в точке объявления. Но проверяет он её теми же правилами: метод остаётся бивариантным и проскакивает мимо out. Пиши функции свойствами там, где важна строгость.',
    },
  ],
  tasks: [
    {
      id: 'fix-handler',
      title: 'Починить несовместимый обработчик',
      brief:
        'Обработчик объявлен слишком узко и не подходит под требуемый тип. Исправь его сигнатуру, не меняя тип EventHandler.',
      constraints: ['Тип EventHandler не менять', 'Без any', 'Без as'],
      starter: `type Payload = { id: number };
type DetailedPayload = { id: number; source: string };

type EventHandler = (payload: Payload) => void;

const handler = (payload: DetailedPayload): void => {
  console.log(payload.id, payload.source);
};

const registered: EventHandler = handler;

console.log(registered);
`,
      starterExpect: [2322],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bany\\b', message: 'any запрещён условием задания' },
        { kind: 'forbid', pattern: '\\bas\\s+\\w', message: 'Ассерты запрещены условием задания' },
        { kind: 'require', pattern: 'payload: Payload', message: 'Обработчик должен принимать Payload' },
      ],
      hints: [
        'Прочитай ошибку с конца: чего не хватает у Payload по сравнению с DetailedPayload?',
        'Обработчик не может требовать от входа больше, чем обещает тип. Требовать меньше — можно.',
        'Сделай параметр типа Payload и убери обращение к source.',
      ],
      solution: `type Payload = { id: number };

type EventHandler = (payload: Payload) => void;

const handler = (payload: Payload): void => {
  console.log(payload.id);
};

const registered: EventHandler = handler;

console.log(registered);
`,
    },
    {
      id: 'close-array-hole',
      title: 'Закрыть дыру ковариантности',
      brief:
        'Функция принимает массив и не должна иметь возможности его изменить. Сейчас она может добавить чужой элемент.',
      constraints: ['Без any', 'Сохранить возможность читать элементы'],
      starter: `type Animal = { name: string };
type Dog = { name: string; breed: string };

function countNames(animals: Animal[]): number {
  animals.push({ name: 'подкидыш' });
  return animals.length;
}

const dogs: Dog[] = [{ name: 'Рекс', breed: 'овчарка' }];

console.log(countNames(dogs));
`,
      starterExpect: [],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'readonly Animal\\[\\]', message: 'Параметр должен быть readonly-массивом' },
        { kind: 'forbid', pattern: 'animals\\.push', message: 'Изменять массив нельзя' },
      ],
      hints: [
        'Компилятор молчит, потому что массивы ковариантны — и в Animal[] можно положить не-собаку.',
        'Если функция только читает, скажи это типом.',
        'readonly Animal[] запрещает push на уровне типов.',
      ],
      solution: `type Animal = { name: string };
type Dog = { name: string; breed: string };

function countNames(animals: readonly Animal[]): number {
  return animals.length;
}

const dogs: Dog[] = [{ name: 'Рекс', breed: 'овчарка' }];

console.log(countNames(dogs));
`,
    },
    {
      id: 'annotate-variance',
      title: 'Расставить in и out',
      brief:
        'Добавь аннотации вариантности так, чтобы компилятор проверил обещание в точке объявления.',
      constraints: ['Обе аннотации обязательны'],
      starter: `interface Reader<T> {
  read(): T;
}

interface Writer<T> {
  write(value: T): void;
}

declare const dogReader: Reader<{ name: string; breed: string }>;
const animalReader: Reader<{ name: string }> = dogReader;

declare const animalWriter: Writer<{ name: string }>;
const dogWriter: Writer<{ name: string; breed: string }> = animalWriter;

console.log(animalReader, dogWriter);
`,
      starterExpect: [],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'Reader<out T>', message: 'Reader должен быть помечен out' },
        { kind: 'require', pattern: 'Writer<in T>', message: 'Writer должен быть помечен in' },
      ],
      hints: [
        'В какой позиции T встречается у Reader, а в какой у Writer?',
        'Только на выходе — ковариантность, только на входе — контравариантность.',
        'interface Reader<out T> и interface Writer<in T>',
      ],
      solution: `interface Reader<out T> {
  read(): T;
}

interface Writer<in T> {
  write(value: T): void;
}

declare const dogReader: Reader<{ name: string; breed: string }>;
const animalReader: Reader<{ name: string }> = dogReader;

declare const animalWriter: Writer<{ name: string }>;
const dogWriter: Writer<{ name: string; breed: string }> = animalWriter;

console.log(animalReader, dogWriter);
`,
    },
  ],
};
