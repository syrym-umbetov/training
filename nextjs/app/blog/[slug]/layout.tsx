// docs: layouts-and-pages#creating-a-dynamic-segment
// Layout, вложенный ВНУТРЬ динамического сегмента. Как и страницы, он получает
// params — асинхронно, поэтому обязан быть async-компонентом и ждать их.
export default async function BlogPostLayout(
  props: LayoutProps<"/blog/[slug]">
) {
  const { slug } = await props.params;

  return (
    <section className="frame">
      <p className="muted">
        blog layout → [slug] layout (slug = <code>{slug}</code>) → page
      </p>
      {props.children}
    </section>
  );
}
