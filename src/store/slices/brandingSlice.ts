import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { StoreBranding } from '../../types';
import { api } from '../../services/api';
import { DEFAULT_BRANDING } from '../../context/BrandingContext';

interface BrandingState {
  config: StoreBranding;
  loading: boolean;
  error: string | null;
}

const initialState: BrandingState = {
  config: DEFAULT_BRANDING,
  loading: false,
  error: null,
};

export const fetchBranding = createAsyncThunk(
  'branding/fetch',
  async () => {
    const data = await api.getStoreBranding();
    return data;
  }
);

export const updateBranding = createAsyncThunk(
  'branding/update',
  async (updates: Partial<StoreBranding>) => {
    const data = await api.updateStoreBranding(updates);
    return data;
  }
);

const brandingSlice = createSlice({
  name: 'branding',
  initialState,
  reducers: {
    setLocalBranding: (state, action) => {
      state.config = { ...state.config, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBranding.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBranding.fulfilled, (state, action) => {
        state.loading = false;
        state.config = action.payload;
      })
      .addCase(fetchBranding.rejected, (state) => {
        state.loading = false;
      })
      .addCase(updateBranding.fulfilled, (state, action) => {
        state.config = action.payload;
      });
  },
});

export const { setLocalBranding } = brandingSlice.actions;
export default brandingSlice.reducer;
