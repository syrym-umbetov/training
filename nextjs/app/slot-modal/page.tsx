// docs: server-and-client-components#interleaving-server-and-client-components
import Cart from "@/app/ui/cart";
import Modal from "@/app/ui/modal";

// Страница — серверный компонент. Она рендерит КЛИЕНТСКИЙ компонент (Modal) и
// заполняет его слот children СЕРВЕРНЫМ компонентом (Cart).
//
// Почему Cart не попадает в клиентский граф: "use client" задаёт границу для
// собственных ИМПОРТОВ модуля. modal.tsx никогда не импортирует cart.tsx — его
// импортирует этот файл, а он выполняется на сервере. Cart рендерится здесь, и
// Modal получает через children уже готовый результат (в виде RSC payload).
// Обращение к базе и отброшенные строки остаются на сервере.
//
// Антипаттерн, который это заменяет: сделать Modal клиентским и импортировать
// Cart внутри него — тогда lib/db.ts уехал бы в браузерный бандл.
export default function Page() {
  return (
    <>
      <h1>Server Component in a Client Component slot</h1>
      <Modal>
        <Cart />
      </Modal>
      <p className="muted">
        The open/close state is client-side. The cart contents were rendered on
        the server before the modal ever opened.
      </p>
    </>
  );
}
