// docs: server-and-client-components#third-party-components
"use client";

// Вся обёртка целиком: помечаем файл как клиентскую границу и реэкспортируем
// сторонний компонент. После этого серверные компоненты могут рендерить
// Carousel, хотя сам пакет директиву "use client" так и не завёз.
import { Carousel } from "@/lib/acme-carousel";

export default Carousel;
