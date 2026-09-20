import type { Lesson } from '../types.ts';

export const reactProps: Lesson = {
  slug: '25-react-props',
  block: 5,
  order: 25,
  title: 'Типизация props, children и ComponentProps',
  shortTitle: 'Props и children',
  summary: 'Как не описывать пропсы руками и что не так с FC.',
  theory: [
    'Пропсы — обычный объектный тип, и компонент — обычная функция. Никакой специальной обёртки не требуется: `function Button(props: ButtonProps)` достаточно.',
    '`React.FC<Props>` добавляет немного и отнимает больше: он мешает generic-компонентам, а `children` в него больше не входит (с React 18 типы перестали добавлять его неявно). Современный совет из самих типов React — не использовать `FC`.',
    '`children` объявляют явно: `children: React.ReactNode`. `ReactNode` включает строки, числа, элементы, массивы, `null` и `undefined` — почти всё, что React умеет рендерить. `ReactElement` строже и подходит, когда нужен именно один элемент.',
    '`ComponentProps<typeof X>` вытаскивает пропсы существующего компонента — удобно для обёрток. `ComponentPropsWithoutRef<"button">` даёт пропсы DOM-элемента без `ref`, и это то, что нужно, когда свой компонент расширяет нативный тег.',
    'Приём для обёрток: `type Props = ComponentPropsWithoutRef<"button"> & { variant: "primary" | "ghost" }`. Все нативные атрибуты приходят бесплатно и остаются типизированными.',
  ],
  docs: [
    {
      label: 'React TypeScript Cheatsheet: Function Components',
      href: 'https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/function_components',
    },
    {
      label: 'React: TypeScript с компонентами',
      href: 'https://react.dev/learn/typescript',
    },
  ],
  experiments: [
    {
      id: 'children-typing',
      title: 'children и ReactNode',
      question:
        'Предскажи, какие значения примет children в каждом объявлении.',
      variants: [
        {
          id: 'explicit-children',
          label: 'children объявлен явно',
          code: `import type { ReactNode } from 'react';

type CardProps = { title: string; children: ReactNode };

function Card({ title, children }: CardProps) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

const a = <Card title="A">текст</Card>;
const b = <Card title="B">{42}</Card>;
const c = <Card title="C">{null}</Card>;
const d = <Card title="D" />;

console.log(a, b, c, d);
`,
          verdict:
            'Одна ошибка — на d. ReactNode принимает строки, числа и null, поэтому первые три варианта прошли. Но children объявлен обязательным, и компонент без детей не подходит: чтобы разрешить такое, поле помечают необязательным.',
          expect: [2741],
        },
        {
          id: 'no-implicit-children',
          label: 'children не объявлен',
          code: `type CardProps = { title: string };

function Card({ title }: CardProps) {
  return <h2>{title}</h2>;
}

const withChildren = <Card title="A">текст</Card>;

console.log(withChildren);
`,
          verdict:
            'Ошибка TS2322, и её последняя строка — суть: «Property children does not exist». Компонент не принимает children. С React 18 типы перестали добавлять children автоматически — раньше его молча приносил FC, и это скрывало ошибки. Теперь либо объявляешь явно, либо передавать нельзя.',
          expect: [2322],
        },
      ],
      takeaway:
        'children — обычное поле пропсов, и его надо объявлять. Неявного children больше нет ни у функции, ни у FC.',
    },
    {
      id: 'component-props',
      title: 'Пропсы существующего компонента',
      question:
        'Предскажи, какие атрибуты окажутся доступны обёртке над нативной кнопкой.',
      variants: [
        {
          id: 'extend-native',
          label: 'Расширение нативного тега',
          code: `import type { ComponentPropsWithoutRef } from 'react';

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant: 'primary' | 'ghost';
};

function Button({ variant, ...rest }: ButtonProps) {
  return <button data-variant={variant} {...rest} />;
}

const ok = <Button variant="primary" type="submit" disabled onClick={() => undefined} />;
const wrong = <Button variant="primary" href="/somewhere" />;

console.log(ok, wrong);
`,
          verdict:
            'Одна ошибка — на wrong: href принадлежит ссылке, а не кнопке. Все нативные атрибуты кнопки — type, disabled, onClick — пришли бесплатно и типизированы точно, включая сигнатуру обработчика.',
          expect: [2322],
        },
        {
          id: 'reuse-props',
          label: 'ComponentProps от своего компонента',
          code: `import type { ComponentProps } from 'react';

function Input({ label, value }: { label: string; value: string }) {
  return (
    <label>
      {label}
      <input value={value} readOnly />
    </label>
  );
}

type InputProps = ComponentProps<typeof Input>;

function Field(props: InputProps) {
  return <Input {...props} />;
}

const ok = <Field label="Имя" value="Сырым" />;
const wrong = <Field label="Имя" />;

console.log(ok, wrong);
`,
          verdict:
            'Одна ошибка — на wrong: value обязателен. ComponentProps<typeof Input> достал пропсы компонента, и обёртка осталась синхронизированной с оригиналом — при изменении Input типы Field поедут за ним автоматически.',
          expect: [2741],
        },
      ],
      takeaway:
        'Не описывай пропсы повторно: ComponentPropsWithoutRef для нативных тегов, ComponentProps<typeof X> для своих компонентов.',
    },
  ],
  tasks: [
    {
      id: 'add-children',
      title: 'Разрешить children',
      brief: 'Компонент должен принимать вложенное содержимое, и оно должно быть необязательным.',
      constraints: ['Без any', 'Без FC'],
      starter: `type PanelProps = { title: string };

function Panel({ title }: PanelProps) {
  return <section><h3>{title}</h3></section>;
}

const withKids = <Panel title="A">содержимое</Panel>;
const without = <Panel title="B" />;

console.log(withKids, without);
`,
      starterExpect: [2322],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bany\\b', message: 'any запрещён условием задания' },
        { kind: 'forbid', pattern: '\\bFC<', message: 'FC запрещён условием задания' },
        { kind: 'require', pattern: 'children\\?:', message: 'children должен быть необязательным' },
      ],
      hints: [
        'Ошибка говорит, что компонент не принимает children.',
        'children — обычное поле пропсов; тип для «всего, что рендерится» называется ReactNode.',
        'children?: ReactNode — и не забудь импортировать тип.',
      ],
      solution: `import type { ReactNode } from 'react';

type PanelProps = { title: string; children?: ReactNode };

function Panel({ title, children }: PanelProps) {
  return (
    <section>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

const withKids = <Panel title="A">содержимое</Panel>;
const without = <Panel title="B" />;

console.log(withKids, without);
`,
    },
    {
      id: 'extend-button',
      title: 'Обёртка над нативной кнопкой',
      brief:
        'Компонент должен принимать все атрибуты button плюс свой variant, не перечисляя их руками.',
      constraints: ['Атрибуты не перечислять', 'ref не включать'],
      starter: `type ButtonProps = {
  variant: 'primary' | 'ghost';
};

function Button({ variant, ...rest }: ButtonProps) {
  return <button data-variant={variant} {...rest} />;
}

const ok = <Button variant="ghost" type="button" disabled onClick={() => undefined} />;

console.log(ok);
`,
      starterExpect: [2322],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: "ComponentPropsWithoutRef<'button'>", message: 'Нужен ComponentPropsWithoutRef' },
      ],
      hints: [
        'Ошибка говорит, что type, disabled и onClick компоненту неизвестны.',
        'React предоставляет тип, отдающий все пропсы нативного тега.',
        "ComponentPropsWithoutRef<'button'> — и пересечь его со своими пропсами.",
      ],
      solution: `import type { ComponentPropsWithoutRef } from 'react';

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant: 'primary' | 'ghost';
};

function Button({ variant, ...rest }: ButtonProps) {
  return <button data-variant={variant} {...rest} />;
}

const ok = <Button variant="ghost" type="button" disabled onClick={() => undefined} />;

console.log(ok);
`,
    },
  ],
};
