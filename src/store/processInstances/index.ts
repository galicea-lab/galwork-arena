import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Draft } from '@reduxjs/toolkit';
import { processInstancesApi } from '@/api/processInstances';
import { formsApi } from '@/api/forms';
import { extractApiError } from '@/api/client';
import {
  ProcessInstanceRead,
  ProcessInstanceCreate,
  ProcessInstanceAction,
  ProcessInstanceStatus,
  ProcessInstanceFilterParams,
} from '@/types/processInstances';
import { ProcessFormRead } from '@/types/forms';

export interface ProcessInstancesState {
  items: ProcessInstanceRead[];
  total: number;
  limit: number;
  offset: number;
  selectedInstance: ProcessInstanceRead | null;
  startForm: ProcessFormRead | null;
  startFormLoading: boolean;
  startFormError: string | null;
  startFormRequestId: string | null;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  filters: {
    status: ProcessInstanceStatus | null;
    process_model_key: string | null;
  };
}

const initialState: ProcessInstancesState = {
  items: [],
  total: 0,
  limit: 20,
  offset: 0,
  selectedInstance: null,
  startForm: null,
  startFormLoading: false,
  startFormError: null,
  startFormRequestId: null,
  loading: false,
  actionLoading: false,
  error: null,
  filters: {
    status: null,
    process_model_key: null,
  },
};

export const fetchProcessInstances = createAsyncThunk(
  'processInstances/fetchList',
  async (params: ProcessInstanceFilterParams | undefined, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { processInstances: ProcessInstancesState };
      const current = state.processInstances;
      const effectiveParams: ProcessInstanceFilterParams = {
        limit: params?.limit ?? current.limit,
        offset: params?.offset ?? current.offset,
        status: params?.status !== undefined ? params.status : current.filters.status,
        process_model_key:
          params?.process_model_key !== undefined
            ? params.process_model_key
            : current.filters.process_model_key,
      };
      return await processInstancesApi.listProcessInstances(effectiveParams);
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const fetchProcessInstance = createAsyncThunk(
  'processInstances/fetchSingle',
  async (id: string, { rejectWithValue }) => {
    try {
      return await processInstancesApi.getProcessInstance(id);
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const startProcessInstance = createAsyncThunk(
  'processInstances/start',
  async (data: ProcessInstanceCreate, { rejectWithValue, dispatch }) => {
    try {
      const created = await processInstancesApi.startProcessInstance(data);
      dispatch(fetchProcessInstances());
      return created;
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const cancelProcessInstance = createAsyncThunk(
  'processInstances/cancel',
  async (
    { id, action }: { id: string; action: ProcessInstanceAction },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const res = await processInstancesApi.cancelProcessInstance(id, action);
      dispatch(fetchProcessInstance(id));
      return res;
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const suspendProcessInstance = createAsyncThunk(
  'processInstances/suspend',
  async (
    { id, action }: { id: string; action: ProcessInstanceAction },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const res = await processInstancesApi.suspendProcessInstance(id, action);
      dispatch(fetchProcessInstance(id));
      return res;
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const resumeProcessInstance = createAsyncThunk(
  'processInstances/resume',
  async (
    { id, action }: { id: string; action: ProcessInstanceAction },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const res = await processInstancesApi.resumeProcessInstance(id, action);
      dispatch(fetchProcessInstance(id));
      return res;
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const fetchStartForm = createAsyncThunk(
  'processInstances/fetchStartForm',
  async (processModelKey: string, { rejectWithValue }) => {
    try {
      return await formsApi.getStartForm(processModelKey);
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const processInstancesSlice = createSlice({
  name: 'processInstances',
  initialState,
  reducers: {
    setSelectedInstance: (state, action: PayloadAction<ProcessInstanceRead | null>) => {
      state.selectedInstance = action.payload;
    },
    setFilters: (
      state,
      action: PayloadAction<{
        status?: ProcessInstanceStatus | null;
        process_model_key?: string | null;
      }>
    ) => {
      if (action.payload.status !== undefined) {
        state.filters.status = action.payload.status;
      }
      if (action.payload.process_model_key !== undefined) {
        state.filters.process_model_key = action.payload.process_model_key;
      }
      state.offset = 0;
    },
    setPagination: (state, action: PayloadAction<{ limit?: number; offset?: number }>) => {
      if (action.payload.limit !== undefined) state.limit = action.payload.limit;
      if (action.payload.offset !== undefined) state.offset = action.payload.offset;
    },
    clearProcessInstanceError: (state) => {
      state.error = null;
    },
    clearStartForm: (state) => {
      state.startForm = null;
      state.startFormLoading = false;
      state.startFormError = null;
      state.startFormRequestId = null;
    },
  },
  extraReducers: (builder) => {
    // List
    builder.addCase(fetchProcessInstances.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchProcessInstances.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload.items;
      state.total = action.payload.total;
      state.limit = action.payload.limit;
      state.offset = action.payload.offset;
    });
    builder.addCase(fetchProcessInstances.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) || 'Błąd pobierania listy instancji';
    });

    // Single
    builder.addCase(fetchProcessInstance.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchProcessInstance.fulfilled, (state, action) => {
      state.loading = false;
      state.selectedInstance = action.payload;
      // also update in items array if present
      const idx = state.items.findIndex((item) => item.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = action.payload;
      }
    });
    builder.addCase(fetchProcessInstance.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) || 'Błąd pobierania instancji';
    });

    // Formularz startowy procesu (RJSF); brak schematu (404) = edytor JSON
    builder.addCase(fetchStartForm.pending, (state, action) => {
      state.startFormRequestId = action.meta.arg;
      state.startForm = null;
      state.startFormLoading = true;
      state.startFormError = null;
    });
    builder.addCase(fetchStartForm.fulfilled, (state, action) => {
      state.startFormLoading = false;
      if (state.startFormRequestId !== action.payload.process_model_key) {
        return;
      }
      state.startForm = action.payload as Draft<ProcessFormRead>;
    });
    builder.addCase(fetchStartForm.rejected, (state, action) => {
      if (state.startFormRequestId !== action.meta.arg) {
        return;
      }
      state.startFormLoading = false;
      state.startForm = null;
      state.startFormError = (action.payload as string) || null;
    });

    // Actions (start, cancel, suspend, resume)
    const actionPending = (state: ProcessInstancesState) => {
      state.actionLoading = true;
      state.error = null;
    };
    const actionFulfilled = (
      state: ProcessInstancesState,
      action: PayloadAction<ProcessInstanceRead>
    ) => {
      state.actionLoading = false;
      state.selectedInstance = action.payload;
      const idx = state.items.findIndex((item) => item.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = action.payload;
      }
    };
    const actionRejected = (state: ProcessInstancesState, action: { payload?: unknown }) => {
      state.actionLoading = false;
      state.error = (action.payload as string) || 'Błąd wykonywania operacji na instancji';
    };

    builder.addCase(startProcessInstance.pending, actionPending);
    builder.addCase(startProcessInstance.fulfilled, actionFulfilled);
    builder.addCase(startProcessInstance.rejected, actionRejected);

    builder.addCase(cancelProcessInstance.pending, actionPending);
    builder.addCase(cancelProcessInstance.fulfilled, actionFulfilled);
    builder.addCase(cancelProcessInstance.rejected, actionRejected);

    builder.addCase(suspendProcessInstance.pending, actionPending);
    builder.addCase(suspendProcessInstance.fulfilled, actionFulfilled);
    builder.addCase(suspendProcessInstance.rejected, actionRejected);

    builder.addCase(resumeProcessInstance.pending, actionPending);
    builder.addCase(resumeProcessInstance.fulfilled, actionFulfilled);
    builder.addCase(resumeProcessInstance.rejected, actionRejected);
  },
});

export const {
  setSelectedInstance,
  setFilters,
  setPagination,
  clearProcessInstanceError,
  clearStartForm,
} = processInstancesSlice.actions;

export default processInstancesSlice.reducer;
