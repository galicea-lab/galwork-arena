import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { eventsApi } from '@/api/events';
import { extractApiError } from '@/api/client';
import { EventItem, EventsFilterParams } from '@/types/events';

export interface EventsState {
  events: EventItem[];
  code: number | null;
  message: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: EventsState = {
  events: [],
  code: null,
  message: null,
  loading: false,
  error: null,
};

export const fetchWorkflowEvents = createAsyncThunk(
  'events/fetchList',
  async (params: EventsFilterParams, { rejectWithValue }) => {
    try {
      return await eventsApi.getEvents(params);
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    clearEventsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchWorkflowEvents.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchWorkflowEvents.fulfilled, (state, action) => {
      state.loading = false;
      state.events = action.payload.events || [];
      state.code = action.payload.code ?? null;
      state.message = action.payload.message ?? null;
    });
    builder.addCase(fetchWorkflowEvents.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) || 'Błąd pobierania zdarzeń';
    });
  },
});

export const { clearEventsError } = eventsSlice.actions;

export default eventsSlice.reducer;
