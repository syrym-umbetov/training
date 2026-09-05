// docs: fetching-data#with-loadingjs
// Контраст к /dashboard: границ <Suspense> нет, данные ждёт сам Page.
// Весь роут закрыт одним loading.tsx и появляется целиком.
import { getRecentActivity } from "@/lib/dashboard";
import { getUser } from "@/lib/user";

async function UserGreeting() {
    const user = await getUser();
    return (
        <p>
            Signed in as <strong>{user.name}</strong> (token{" "}
            <code>{user.token}</code>)
        </p>
    );
}

async function UserRoleBadge() {
    const user = await getUser();
    return (
        <p>
            Role: <strong>{user.role}</strong> (token <code>{user.token}</code>)
        </p>
    );
}

async function RecentActivity() {
    const activity = await getRecentActivity();
    return (
        <ul>
            {activity.map((item) => (
                <li key={item.id}>
                    {item.at} — {item.label}
                </li>
            ))}
        </ul>
    );
}

export default async function Page() {
    return (
        <>
            <h3>Overview</h3>
            <p className="muted">
                No Suspense boundaries here — this heading waits for everything below.
            </p>

            <UserGreeting />
            <UserRoleBadge />

            <h4>Recent activity (slow: 2s)</h4>
            <RecentActivity />
        </>
    );
}