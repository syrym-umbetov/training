// docs: linking-and-navigating#dynamic-routes-without-loadingtsx
// Без этого файла переход на динамический роут завис бы на белом экране до
// ответа сервера. С ним роут можно ЧАСТИЧНО префетчить: общие layout'ы плюс
// этот скелетон приезжают заранее, и переход начинается сразу.
import { PostSkeleton } from "@/app/ui/skeletons";

export default function Loading() {
  return <PostSkeleton />;
}
