// docs: fetching-data#with-suspense
// Намеренно медленный запрос, чтобы гранулярный <Suspense> на дашборде было
// видно: заголовок уходит сразу, этот список — позже.
import { delay } from "./delay";

export type Activity = { id: number; label: string; at: string };

export async function getRecentActivity(): Promise<Activity[]> {
  await delay(5000);
  return [
    { id: 1, label: "Deployed build #482", at: "09:12" },
    { id: 2, label: "Merged PR #77", at: "10:48" },
    { id: 3, label: "Rotated API key", at: "14:03" },
  ];
}
