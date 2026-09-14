import { useDispatch, useSelector, useStore } from 'react-redux';
import type { AppDispatch, AppStore, RootState } from './store';

// Типизированные обёртки. Пишутся один раз и используются везде вместо базовых.
//
// ЧТО ЛОМАЕТСЯ БЕЗ НИХ:
// 1. useSelector((state) => state.counter.value) — state имеет тип unknown,
//    придётся в каждом компоненте писать (state: RootState). Легко ошибиться
//    в имени слайса и узнать об этом только в рантайме.
// 2. const dispatch = useDispatch(); dispatch(login(creds));
//    → ошибка компиляции: "Argument of type 'AsyncThunkAction' is not assignable
//      to parameter of type 'UnknownAction'".
//    Потому что базовый Dispatch не знает про thunk-middleware — про него знает
//    только тип, выведенный из конкретного стора.
//    И самое неприятное: dispatch(login(creds)).unwrap() не типизируется вообще,
//    так как базовый dispatch возвращает сам экшен, а не промис.

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();
