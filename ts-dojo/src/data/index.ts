import type { Lesson } from './types.ts';
import { structuralTyping } from './lessons/01-structural-typing.ts';
import { topBottomTypes } from './lessons/02-top-bottom-types.ts';
import { narrowing } from './lessons/03-narrowing.ts';
import { typePredicates } from './lessons/04-type-predicates.ts';
import { literalTypes } from './lessons/05-literal-types.ts';
import { interfaceVsType } from './lessons/06-interface-vs-type.ts';
import { genericFunctions } from './lessons/07-generic-functions.ts';
import { constraints } from './lessons/08-constraints.ts';
import { keyofIndexed } from './lessons/09-keyof-indexed.ts';
import { constTypeParameters } from './lessons/10-const-type-parameters.ts';
import { whenNotGeneric } from './lessons/11-when-not-generic.ts';
import { mappedTypes } from './lessons/12-mapped-types.ts';
import { conditionalTypes } from './lessons/13-conditional-types.ts';
import { inferKeyword } from './lessons/14-infer.ts';
import { templateLiterals } from './lessons/15-template-literals.ts';
import { recursiveTypes } from './lessons/16-recursive-types.ts';
import { buildUtilities } from './lessons/17-build-utilities.ts';
import { variance } from './lessons/18-variance.ts';
import { overloads } from './lessons/19-overloads.ts';
import { functionTypes } from './lessons/20-function-types.ts';
import { brandedTypes } from './lessons/21-branded-types.ts';
import { tsconfigFlags } from './lessons/22-tsconfig-flags.ts';
import { declarationFiles } from './lessons/23-declaration-files.ts';
import { modules } from './lessons/24-modules.ts';
import { reactProps } from './lessons/25-react-props.ts';
import { genericComponents } from './lessons/26-generic-components.ts';
import { polymorphic } from './lessons/27-polymorphic.ts';
import { hooks } from './lessons/28-hooks.ts';
import { context } from './lessons/29-context.ts';
import { refsAsProps } from './lessons/30-refs-as-props.ts';
import { nextAppRouter } from './lessons/31-next-app-router.ts';
import { runtimeValidation } from './lessons/32-runtime-validation.ts';
import { typeChallenges } from './lessons/33-type-challenges.ts';
import { eventEmitter } from './lessons/34-event-emitter.ts';
import { apiClient } from './lessons/35-api-client.ts';
import { monorepoTypes } from './lessons/36-monorepo-types.ts';
import { readingErrors } from './lessons/37-reading-errors.ts';

export const lessons: Lesson[] = [
  structuralTyping,
  topBottomTypes,
  narrowing,
  typePredicates,
  literalTypes,
  interfaceVsType,
  genericFunctions,
  constraints,
  keyofIndexed,
  constTypeParameters,
  whenNotGeneric,
  mappedTypes,
  conditionalTypes,
  inferKeyword,
  templateLiterals,
  recursiveTypes,
  buildUtilities,
  variance,
  overloads,
  functionTypes,
  brandedTypes,
  tsconfigFlags,
  declarationFiles,
  modules,
  reactProps,
  genericComponents,
  polymorphic,
  hooks,
  context,
  refsAsProps,
  nextAppRouter,
  runtimeValidation,
  typeChallenges,
  eventEmitter,
  apiClient,
  monorepoTypes,
  readingErrors,
];

export function findLesson(slug: string): Lesson | undefined {
  return lessons.find((l) => l.slug === slug);
}

export type CurriculumItem = {
  n: number;
  title: string;
  /** Present once the lesson is built. */
  slug?: string;
};

export type Block = {
  n: number;
  title: string;
  items: CurriculumItem[];
};

const built = new Map(lessons.map((l) => [l.order, l.slug]));

function item(n: number, title: string): CurriculumItem {
  const slug = built.get(n);
  return slug === undefined ? { n, title } : { n, title, slug };
}

export const curriculum: Block[] = [
  {
    n: 1,
    title: 'Фундамент',
    items: [
      item(1, 'Structural typing, assignability, excess property checks'),
      item(2, 'unknown vs any vs never, top/bottom types'),
      item(3, 'Narrowing и exhaustiveness через never'),
      item(4, 'Type predicates и assertion functions'),
      item(5, 'Literal types, widening, as const, satisfies'),
      item(6, 'interface vs type, declaration merging'),
    ],
  },
  {
    n: 2,
    title: 'Generics',
    items: [
      item(7, 'Generic functions, inference из аргументов'),
      item(8, 'Constraints, default type parameters'),
      item(9, 'keyof, indexed access, typeof в позиции типа'),
      item(10, 'const type parameters'),
      item(11, 'Когда generic не нужен'),
    ],
  },
  {
    n: 3,
    title: 'Трансформация типов',
    items: [
      item(12, 'Mapped types, модификаторы, key remapping'),
      item(13, 'Conditional types и дистрибуция'),
      item(14, 'infer'),
      item(15, 'Template literal types'),
      item(16, 'Recursive types'),
      item(17, 'Написать Partial, Pick, Omit, ReturnType самому'),
    ],
  },
  {
    n: 4,
    title: 'Глубже в компилятор',
    items: [
      item(18, 'Variance, strictFunctionTypes, in/out'),
      item(19, 'Overloads vs union parameters vs generics'),
      item(20, 'Function types, this-типизация'),
      item(21, 'Branded / nominal types'),
      item(22, 'Флаги tsconfig, влияющие на типы'),
      item(23, 'Declaration files, module augmentation'),
      item(24, 'ESM/CJS, verbatimModuleSyntax, import type'),
    ],
  },
  {
    n: 5,
    title: 'React / Next.js',
    items: [
      item(25, 'Props, children, ComponentProps'),
      item(26, 'Generic-компоненты'),
      item(27, 'Polymorphic components (as prop)'),
      item(28, 'Хуки: useState, useReducer, useRef'),
      item(29, 'Context с безопасным дефолтом'),
      item(30, 'forwardRef и ref как prop (React 19)'),
      item(31, 'App Router: params, searchParams, Server Actions'),
      item(32, 'Zod + z.infer на границах'),
    ],
  },
  {
    n: 6,
    title: 'Практика уровня Senior',
    items: [
      item(33, 'type-challenges: easy → hard'),
      item(34, 'Типизированный event emitter'),
      item(35, 'Типобезопасный API-клиент по схеме'),
      item(36, 'Shared-типы в монорепо'),
      item(37, 'Чтение длинных ошибок компилятора'),
    ],
  },
];
