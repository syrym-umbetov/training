// docs: server-and-client-components#third-party-components
import Carousel from "@/app/ui/carousel";
import Gallery from "@/app/ui/gallery";

// lib/acme-carousel.tsx играет роль npm-пакета, который использует useState, но
// забыл опубликовать директиву "use client". Импорт его сюда напрямую упал бы:
// Next.js неоткуда узнать, что компонент клиентский.
//
// Два выхода:
//  1. app/ui/carousel.tsx — обёртка в одну строку, которая добавляет директиву и
//     реэкспортирует компонент; после этого его могут рендерить серверные компоненты.
//  2. app/ui/gallery.tsx — использовать его из компонента, который и так уже
//     клиентский, то есть находится внутри клиентского модульного графа.
export default function Page() {
  return (
    <>
      <h1>Wrapping a client-only third-party component</h1>

      <div className="frame">
        <h3>1. Re-exported behind our own boundary</h3>
        <Carousel />
      </div>

      <div className="frame">
        <h3>2. Used from inside an existing Client Component</h3>
        <Gallery />
      </div>

      <p className="muted">
        Library authors: ship the directive on the entry points that need it, so
        your users do not have to write wrappers.
      </p>
    </>
  );
}
