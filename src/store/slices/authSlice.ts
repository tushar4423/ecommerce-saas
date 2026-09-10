import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, UserAddress } from '../../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
}

const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem('nandita_current_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const initialUser = getStoredUser();

const initialState: AuthState = {
  user: initialUser,
  isAuthenticated: Boolean(initialUser),
  token: typeof window !== 'undefined' ? localStorage.getItem('nandita_auth_token') : null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem('nandita_current_user', JSON.stringify(action.payload));
      }
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.token = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('nandita_current_user');
        localStorage.removeItem('nandita_auth_token');
      }
    },
    addAddress: (state, action: PayloadAction<UserAddress>) => {
      if (state.user) {
        state.user.addresses = [action.payload, ...(state.user.addresses || [])];
        if (typeof window !== 'undefined') {
          localStorage.setItem('nandita_current_user', JSON.stringify(state.user));
        }
      }
    },
    updateAddress: (state, action: PayloadAction<UserAddress>) => {
      if (state.user && state.user.addresses) {
        const index = state.user.addresses.findIndex((a) => a.id === action.payload.id);
        if (index >= 0) {
          state.user.addresses[index] = action.payload;
          if (typeof window !== 'undefined') {
            localStorage.setItem('nandita_current_user', JSON.stringify(state.user));
          }
        }
      }
    },
    deleteAddress: (state, action: PayloadAction<string>) => {
      if (state.user && state.user.addresses) {
        state.user.addresses = state.user.addresses.filter((a) => a.id !== action.payload);
        if (typeof window !== 'undefined') {
          localStorage.setItem('nandita_current_user', JSON.stringify(state.user));
        }
      }
    },
  },
});

export const { setUser, logout, addAddress, updateAddress, deleteAddress } = authSlice.actions;
export default authSlice.reducer;
