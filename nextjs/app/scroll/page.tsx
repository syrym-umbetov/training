// docs: linking-and-navigating#client-side-transitions
import Link from "next/link";
import ScrollPaddingToggle from "@/app/ui/scroll-padding-toggle";

// Проблема: Next.js скроллит к цели клиентского перехода, но про хедер с
// position: sticky он ничего не знает. Заголовок, к которому проскроллили,
// оказывается спрятан под ним.
//
// Лечится это CSS, а не JS — см. globals.css:
//   html { scroll-padding-top: calc(var(--header-h) + 1rem) }
// Кнопка ниже вешает и снимает класс .no-scroll-padding на <html>, чтобы одну и
// ту же навигацию можно было увидеть и сломанной, и починенной.
const sections = [1, 2, 3, 4, 5];

export default function Page() {
  return (
    <>
      <h1>Sticky header and scroll position</h1>

      <ScrollPaddingToggle />

      <div className="row" style={{ marginTop: "0.75rem" }}>
        {sections.map((n) => (
          <Link key={n} href={`/scroll#section-${n}`}>
            Go to section {n}
          </Link>
        ))}
      </div>

      <p className="muted">
        The header is <code>position: sticky; top: 0</code> and 4rem tall. With
        the padding off, the section heading scrolls to y=0 — behind the header.
      </p>

      {sections.map((n) => (
        <section key={n} id={`section-${n}`} className="tall-section">
          <h2>Section {n}</h2>
          <p className="muted">
            If you can read this heading, scroll-padding-top is doing its job.
          </p>
        </section>
      ))}
    </>
  );
}
