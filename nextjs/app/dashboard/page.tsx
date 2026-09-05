// docs: fetching-data#with-suspense
import { Suspense } from "react";
import { getRecentActivity } from "@/lib/dashboard";
import { getUser } from "@/lib/user";
import { LineSkeleton, PostListSkeleton } from "@/app/ui/skeletons";

// docs: fetching-data#reusing-data-with-reactcache
// Два независимых компонента вызывают getUser(). Функция обёрнута в
// React.cache, поэтому работа выполняется ОДИН раз за запрос: token ниже
// совпадает у обоих, а в терминале строка
// "[lib/user] getUser() actually executed" печатается единожды.
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

// Сам компонент страницы ничего не ждёт, поэтому всё, что находится вне границ
// <Suspense>, улетает в браузер немедленно. Каждая граница дострименивается
// сама по себе, по мере готовности своих данных.
export default function Page() {
  return (
    <>
      <h3>Overview</h3>
      <p className="muted">
        This heading is not inside any boundary — it is flushed to the client
        before any data request finishes.
      </p>

      {/*<Suspense fallback={<LineSkeleton width="45%" />}>*/}
        <UserGreeting />
      {/*</Suspense>*/}

      <Suspense fallback={<LineSkeleton width="30%" />}>
        <UserRoleBadge />
      </Suspense>

      <h4>Recent activity (slow: 2s)</h4>
      <Suspense fallback={<PostListSkeleton rows={3} />}>
        <RecentActivity />
      </Suspense>
    </>
  );
}
