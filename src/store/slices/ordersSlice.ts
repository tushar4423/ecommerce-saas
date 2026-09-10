import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Order } from '../../types';
import { api } from '../../services/api';

interface OrdersState {
  items: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
}

const initialState: OrdersState = {
  items: [],
  currentOrder: null,
  loading: false,
  error: null,
};

export const fetchOrders = createAsyncThunk('orders/fetchAll', async () => {
  const data = await api.getOrders();
  return data;
});

export const createOrder = createAsyncThunk(
  'orders/create',
  async (orderData: Parameters<typeof api.createOrder>[0]) => {
    const data = await api.createOrder(orderData);
    return data;
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch orders';
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.currentOrder = action.payload;
      });
  },
});

export default ordersSlice.reducer;
