import { createSlice } from '@reduxjs/toolkit';

// Слайс, которого НЕТ в главном бандле.
// Он приезжает вместе с чанком страницы и добавляется в работающий стор
// через rootReducer.inject(). До этого момента state.lazyStats === undefined —
// именно поэтому в типе LazySlices это поле опциональное.

export const lazyStatsSlice = createSlice({
  name: 'lazyStats',
  initialState: { loadedAt: '', hits: 0 },
  reducers: {
    markLoaded(state) {
      state.loadedAt = new Date().toLocaleTimeString('ru-RU');
    },
    hit(state) {
      state.hits += 1;
    },
  },
});

export const { markLoaded, hit } = lazyStatsSlice.actions;
