import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { ApiError } from '../auth/types';

// Страница про unwrap: форма, которой после успеха надо показать тост и очистить поля.

export const createPost = createAsyncThunk<
  { id: number; title: string },
  { title: string; body: string },
  { rejectValue: ApiError }
>('form/createPost', async (draft, { rejectWithValue }) => {
  const res = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  });
  if (!res.ok) return rejectWithValue((await res.json()) as ApiError);
  return res.json();
});

interface FormState {
  created: { id: number; title: string }[];
  serverError: string | null;
}

const initialState: FormState = { created: [], serverError: null };

export const formSlice = createSlice({
  name: 'form',
  initialState,
  reducers: {
    clearForm: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPost.fulfilled, (state, action) => {
        state.created.unshift(action.payload);
        state.serverError = null;
      })
      .addCase(createPost.rejected, (state, action) => {
        state.serverError = action.payload?.message ?? 'Ошибка';
      });
  },
});

export const { clearForm } = formSlice.actions;
export default formSlice.reducer;
