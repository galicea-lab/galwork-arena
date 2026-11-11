import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { notificationsApi } from '@/api/notifications';
import { extractApiError } from '@/api/client';
import {
  NotificationRead,
  NotificationMarkRead,
  NotificationFilterParams,
} from '@/types/notifications';

export interface NotificationsState {
  items: NotificationRead[];
  unreadCount: number;
  loading: boolean;
  markingRead: boolean;
  error: string | null;
  unreadOnly: boolean;
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
  loading: false,
  markingRead: false,
  error: null,
  unreadOnly: false,
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchList',
  async (params: NotificationFilterParams | undefined, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { notifications: NotificationsState };
      const unread_only =
        params?.unread_only !== undefined ? params.unread_only : state.notifications.unreadOnly;
      return await notificationsApi.listNotifications({
        unread_only,
        limit: params?.limit ?? 50,
      });
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const markNotificationsRead = createAsyncThunk(
  'notifications/markRead',
  async (data: NotificationMarkRead, { rejectWithValue, dispatch }) => {
    try {
      const res = await notificationsApi.markNotificationsRead(data);
      dispatch(fetchNotifications());
      return res;
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setUnreadOnly: (state, action: PayloadAction<boolean>) => {
      state.unreadOnly = action.payload;
    },
    clearNotificationsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchNotifications.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchNotifications.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload;
      state.unreadCount = action.payload.filter((n) => !n.read_at).length;
    });
    builder.addCase(fetchNotifications.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) || 'Błąd pobierania powiadomień';
    });

    builder.addCase(markNotificationsRead.pending, (state) => {
      state.markingRead = true;
    });
    builder.addCase(markNotificationsRead.fulfilled, (state) => {
      state.markingRead = false;
    });
    builder.addCase(markNotificationsRead.rejected, (state, action) => {
      state.markingRead = false;
      state.error = (action.payload as string) || 'Błąd oznaczania powiadomień jako przeczytane';
    });
  },
});

export const { setUnreadOnly, clearNotificationsError } = notificationsSlice.actions;

export default notificationsSlice.reducer;
