// docs: linking-and-navigating#how-navigation-works
"use client";

import { useRouter } from "next/navigation";

// Чем это отличается от <Link>:
//  - <Link> рендерит настоящий якорь: он индексируется, открывается средней
//    кнопкой мыши и автоматически префетчится при попадании во вьюпорт.
//  - useRouter() переходит императивно из JS. Ничего не префетчится, якоря в
//    DOM нет, поэтому это уместно, только когда навигация — побочный эффект
//    другого действия (результат формы, таймер, гард).
//  - router.push() добавляет запись в историю (Back вернёт сюда).
//  - router.replace() заменяет текущую запись (Back эту страницу пропустит).
export default function RouterButtons() {
  const router = useRouter();

  return (
    <div className="row">
      <button onClick={() => router.push("/about")}>router.push(/about)</button>
      <button onClick={() => router.replace("/about")}>
        router.replace(/about)
      </button>
      <button onClick={() => router.back()}>router.back()</button>
    </div>
  );
}
