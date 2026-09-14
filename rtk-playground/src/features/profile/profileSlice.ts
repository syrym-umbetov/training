import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { logout } from '../auth/authSlice';

interface ProfileState {
  displayName: string;
  city: string;
  visits: number;
}

const initialState: ProfileState = { displayName: 'Гость', city: 'Алматы', visits: 0 };

export const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    nameChanged(state, action: PayloadAction<string>) {
      state.displayName = action.payload;
    },
    visited(state) {
      state.visits += 1;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, () => initialState);
  },
});

export const { nameChanged, visited } = profileSlice.actions;
export default profileSlice.reducer;
