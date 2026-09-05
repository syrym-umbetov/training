// docs: layouts-and-pages#route-props-helpers
// Полностью статический роут: динамических сегментов в его пути нет.
//
// PageProps<'/about'> — ГЛОБАЛЬНЫЙ тип-хелпер, импорта для него не существует.
// Типы генерируются командами next dev, next build или next typegen и попадают
// в .next/types, который уже подключён в tsconfig.json.
//
// Для статического роута params резолвится в {} (пустой объект). Это по-прежнему
// промис, так что его всё равно нужно ждать: params и searchParams в Next 16
// асинхронные, и синхронное чтение — ошибка.
export default async function Page(props: PageProps<"/about">) {
  const params = await props.params;

  return (
    <>
      <h1>About (static route)</h1>
      <p>
        <code>await props.params</code> resolved to{" "}
        <code>{JSON.stringify(params)}</code> — an empty object, because this
        route has no dynamic segments.
          {new Date().toISOString()}
      </p>
      <p className="muted">
        You most likely arrived here through the plain <code>&lt;a&gt;</code> in
        the header, which caused a full document reload instead of a
        client-side transition.
      </p>
    </>
  );
}
