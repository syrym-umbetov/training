import { useSyncExternalStore } from 'react';

/**
 * Подписка на внешнее (не-Redux) хранилище.
 *
 * useSyncExternalStore — официальный способ подписаться на что-то за пределами React.
 * Именно его react-redux использует внутри себя для useSelector.
 * До React 18 это делали через useState + useEffect, и в конкурентном режиме
 * возникал «tearing»: разные компоненты в одном кадре видели разные версии данных.
 *
 * getSnapshot ОБЯЗАН возвращать одно и то же значение по ссылке, пока данные не менялись,
 * иначе React уйдёт в бесконечный цикл рендеров.
 */
export function useExternalStore<T>(
  subscribe: (cb: () => void) => () => void,
  getSnapshot: () => T,
): T {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
