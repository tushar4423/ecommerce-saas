import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import productsReducer from './slices/productsSlice';
import categoriesReducer from './slices/categoriesSlice';
import brandingReducer from './slices/brandingSlice';
import cartReducer from './slices/cartSlice';
import ordersReducer from './slices/ordersSlice';
import authReducer from './slices/authSlice';
import wishlistReducer from './slices/wishlistSlice';
import filterReducer from './slices/filterSlice';
import uiReducer from './slices/uiSlice';
import { ecommerceApi } from './api/ecommerceApi';

export const store = configureStore({
  reducer: {
    products: productsReducer,
    categories: categoriesReducer,
    branding: brandingReducer,
    cart: cartReducer,
    orders: ordersReducer,
    auth: authReducer,
    wishlist: wishlistReducer,
    filters: filterReducer,
    ui: uiReducer,
    [ecommerceApi.reducerPath]: ecommerceApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(ecommerceApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
