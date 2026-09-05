// docs: layouts-and-pages#route-props-helpers
// LayoutProps<'/dashboard'> типизирует children и любые именованные слоты
// (папки parallel routes вроде @analytics) именно для этого роута. Глобальный
// хелпер, импорта нет — генерируется командами next dev / next build /
// next typegen.
export default function DashboardLayout(props: LayoutProps<"/dashboard">) {
  return (
    <section className="frame">
      <h2>Dashboard layout</h2>
      {props.children}
      {/* Если бы существовала папка app/dashboard/@analytics, слот приехал бы
          типизированным: {props.analytics} */}
    </section>
  );
}
