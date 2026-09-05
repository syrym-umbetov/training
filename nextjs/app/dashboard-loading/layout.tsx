// docs: fetching-data#with-loadingjs
// Layout сам ждёт данные. loading.tsx этого сегмента его НЕ покрывает:
// он оборачивает только page, поэтому скелет не появится, а навигация
// заблокируется, пока layout не дорендерится.
import { getUser } from "@/lib/user";

export default async function Layout(props: LayoutProps<"/dashboard-loading">) {
    const user = await getUser();

    return (
        <section className="frame">
            <h2>Dashboard layout — {user.name}</h2>
            {props.children}
        </section>
    );
}