import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { logout } from '../auth/authSlice';

// Один из трёх слайсов, которые сбрасываются по общему экшену logout.

interface CartState {
  items: { id: number; name: string; priceKzt: number; qty: number }[];
}

const initialState: CartState = {
  items: [
    { id: 1, name: 'Подписка Pro', priceKzt: 12_000, qty: 1 },
    { id: 2, name: 'Курс по Redux', priceKzt: 45_000, qty: 2 },
  ],
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    qtyChanged(state, action: PayloadAction<{ id: number; qty: number }>) {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (item) item.qty = Math.max(0, action.payload.qty);
    },
  },
  // Слайс cart ничего не знает про auth — он знает только про экшен logout.
  // Это и есть смысл "кросс-слайсовой реакции": связь через экшен, а не через импорт слайса.
  extraReducers: (builder) => {
    builder.addCase(logout, () => initialState);
  },
});

export const { qtyChanged } = cartSlice.actions;
export default cartSlice.reducer;
