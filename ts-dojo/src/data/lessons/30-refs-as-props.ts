import type { Lesson } from '../types.ts';

export const refsAsProps: Lesson = {
  slug: '30-refs-as-props',
  block: 5,
  order: 30,
  title: 'ref как обычный prop и судьба forwardRef',
  shortTitle: 'ref в React 19',
  summary: 'В React 19 обёртка больше не нужна — и типы это отражают.',
  theory: [
    'До React 19 функциональный компонент не мог принять `ref`: он не является экземпляром, и React перехватывал этот проп. Обходились `forwardRef`, который принимал `(props, ref)` и возвращал компонент с добавленным `ref`.',
    'В React 19 `ref` передаётся как обычный проп. Компонент объявляет его в своих пропсах — `ref?: Ref<HTMLInputElement>` — и получает как любое другое поле. `forwardRef` остался ради совместимости, но новый код в нём не нуждается.',
    'Типы для этого: `Ref<T>` — то, что можно передать в проп (объект-ссылка, колбэк или `null`); `RefObject<T>` — то, что возвращает `useRef`. В пропсах объявляют `Ref<T>`, потому что потребитель может передать и колбэк.',
    '`ComponentPropsWithRef<"input">` включает `ref` нужного типа, `ComponentPropsWithoutRef<"input">` — исключает. Для обёртки над нативным тегом, прокидывающей ref, берут первый.',
    'Колбэк-`ref` в React 19 умеет возвращать функцию очистки — как `useEffect`. Типы это учитывают: возвращаемое значение стало значимым, и случайная стрелка с телом-выражением (`ref={(el) => (this.node = el)}`) теперь ошибка.',
  ],
  docs: [
    {
      label: 'React 19: ref as a prop',
      href: 'https://react.dev/blog/2024/12/05/react-19#ref-as-a-prop',
    },
    {
      label: 'React: forwardRef',
      href: 'https://react.dev/reference/react/forwardRef',
    },
  ],
  experiments: [
    {
      id: 'ref-prop',
      title: 'ref в пропсах',
      question:
        'Предскажи, примет ли компонент ref без forwardRef.',
      variants: [
        {
          id: 'ref-as-prop',
          label: 'ref объявлен в пропсах',
          code: `import { useRef } from 'react';
import type { Ref } from 'react';

type InputProps = {
  label: string;
  ref?: Ref<HTMLInputElement>;
};

function Input({ label, ref }: InputProps) {
  return (
    <label>
      {label}
      <input ref={ref} />
    </label>
  );
}

function Form() {
  const inputRef = useRef<HTMLInputElement>(null);
  return <Input label="Имя" ref={inputRef} />;
}

console.log(Form);
`,
          verdict:
            'Чисто. В React 19 ref — обычный проп: объявил в типе, принял в деструктуризации, прокинул дальше. Никакой обёртки не потребовалось, и тип HTMLInputElement дошёл до места использования.',
          expect: [],
        },
        {
          id: 'ref-not-declared',
          label: 'ref не объявлен',
          code: `import { useRef } from 'react';

type InputProps = { label: string };

function Input({ label }: InputProps) {
  return <input placeholder={label} />;
}

function Form() {
  const inputRef = useRef<HTMLInputElement>(null);
  return <Input label="Имя" ref={inputRef} />;
}

console.log(Form);
`,
          verdict:
            'Ошибка: компонент не объявлял ref, и передать его нельзя. React 19 снял ограничение на приём ref, но не отменил проверку пропсов — если хочешь принимать, объяви.',
          expect: [2322],
        },
        {
          id: 'with-props-with-ref',
          label: 'ComponentPropsWithRef',
          code: `import { useRef } from 'react';
import type { ComponentPropsWithRef } from 'react';

type InputProps = ComponentPropsWithRef<'input'> & { label: string };

function Input({ label, ...rest }: InputProps) {
  return (
    <label>
      {label}
      <input {...rest} />
    </label>
  );
}

function Form() {
  const inputRef = useRef<HTMLInputElement>(null);
  return <Input label="Имя" ref={inputRef} type="text" />;
}

console.log(Form);
`,
          verdict:
            'Чисто, и это самый короткий способ. ComponentPropsWithRef принёс и ref нужного типа, и все нативные атрибуты — остаётся добавить свои и прокинуть остальное через spread.',
          expect: [],
        },
      ],
      takeaway:
        'React 19: ref объявляется в пропсах как Ref<T> или приходит из ComponentPropsWithRef. forwardRef нужен только для совместимости со старым кодом.',
    },
  ],
  tasks: [
    {
      id: 'accept-ref',
      title: 'Принять ref без forwardRef',
      brief:
        'Компонент должен принимать ref на внутренний input и прокидывать его.',
      constraints: ['Без forwardRef', 'Без any'],
      starter: `import { useRef } from 'react';

type FieldProps = { label: string };

function Field({ label }: FieldProps) {
  return (
    <label>
      {label}
      <input />
    </label>
  );
}

function Form() {
  const fieldRef = useRef<HTMLInputElement>(null);
  return <Field label="Почта" ref={fieldRef} />;
}

console.log(Form);
`,
      starterExpect: [2322],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: 'forwardRef', message: 'forwardRef запрещён условием задания' },
        { kind: 'forbid', pattern: '\\bany\\b', message: 'any запрещён условием задания' },
        { kind: 'require', pattern: 'ref\\?: Ref<HTMLInputElement>', message: 'ref нужно объявить в пропсах' },
      ],
      hints: [
        'Ошибка говорит, что компонент не принимает ref. В React 19 это решается объявлением.',
        'Тип для пропса — Ref<T>, а не RefObject<T>: потребитель может передать и колбэк.',
        'type FieldProps = { label: string; ref?: Ref<HTMLInputElement> }',
      ],
      solution: `import { useRef } from 'react';
import type { Ref } from 'react';

type FieldProps = { label: string; ref?: Ref<HTMLInputElement> };

function Field({ label, ref }: FieldProps) {
  return (
    <label>
      {label}
      <input ref={ref} />
    </label>
  );
}

function Form() {
  const fieldRef = useRef<HTMLInputElement>(null);
  return <Field label="Почта" ref={fieldRef} />;
}

console.log(Form);
`,
    },
    {
      id: 'wrapper-with-ref',
      title: 'Обёртка, прокидывающая ref',
      brief:
        'Обёртка над textarea должна принимать все его атрибуты вместе с ref, не перечисляя их.',
      constraints: ['Атрибуты не перечислять', 'Без forwardRef'],
      starter: `import { useRef } from 'react';

type NoteProps = { hint: string };

function Note({ hint }: NoteProps) {
  return <textarea placeholder={hint} />;
}

function Editor() {
  const noteRef = useRef<HTMLTextAreaElement>(null);
  return <Note hint="Заметка" ref={noteRef} rows={4} />;
}

console.log(Editor);
`,
      starterExpect: [2322],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: 'forwardRef', message: 'forwardRef запрещён условием задания' },
        { kind: 'require', pattern: "ComponentPropsWithRef<'textarea'>", message: 'Нужен ComponentPropsWithRef' },
      ],
      hints: [
        'Нужны и нативные атрибуты (rows), и ref — есть тип, дающий сразу всё.',
        "ComponentPropsWithRef<'textarea'> в отличие от WithoutRef включает ref.",
        'Пересеките его со своими пропсами и прокиньте остальное через spread.',
      ],
      solution: `import { useRef } from 'react';
import type { ComponentPropsWithRef } from 'react';

type NoteProps = ComponentPropsWithRef<'textarea'> & { hint: string };

function Note({ hint, ...rest }: NoteProps) {
  return <textarea placeholder={hint} {...rest} />;
}

function Editor() {
  const noteRef = useRef<HTMLTextAreaElement>(null);
  return <Note hint="Заметка" ref={noteRef} rows={4} />;
}

console.log(Editor);
`,
    },
  ],
};
