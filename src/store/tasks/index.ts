import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Draft } from '@reduxjs/toolkit';
import { tasksApi } from '@/api/tasks';
import { formsApi } from '@/api/forms';
import { extractApiError } from '@/api/client';
import {
  HumanTaskRead,
  MyTaskItem,
  TaskClaimRequest,
  TaskCompleteRequest,
  MyTaskFilterParams,
} from '@/types/tasks';
import { TaskFormRead } from '@/types/forms';

export interface TasksState {
  items: MyTaskItem[];
  total: number;
  limit: number;
  offset: number;
  selectedTask: HumanTaskRead | null;
  taskForm: TaskFormRead | null;
  taskFormLoading: boolean;
  taskFormError: string | null;
  taskFormRequestId: string | null;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  filters: {
    only_claimed: boolean;
    overdue: boolean;
  };
}

const initialState: TasksState = {
  items: [],
  total: 0,
  limit: 20,
  offset: 0,
  selectedTask: null,
  taskForm: null,
  taskFormLoading: false,
  taskFormError: null,
  taskFormRequestId: null,
  loading: false,
  actionLoading: false,
  error: null,
  filters: {
    only_claimed: false,
    overdue: false,
  },
};

export const fetchMyTasks = createAsyncThunk(
  'tasks/fetchMyList',
  async (params: MyTaskFilterParams | undefined, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { tasks: TasksState };
      const current = state.tasks;
      const effectiveParams: MyTaskFilterParams = {
        limit: params?.limit ?? current.limit,
        offset: params?.offset ?? current.offset,
        only_claimed:
          params?.only_claimed !== undefined ? params.only_claimed : current.filters.only_claimed,
        overdue: params?.overdue !== undefined ? params.overdue : current.filters.overdue,
      };
      return await tasksApi.listMyTasks(effectiveParams);
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const fetchTask = createAsyncThunk(
  'tasks/fetchSingle',
  async (id: string, { rejectWithValue }) => {
    try {
      return await tasksApi.getTask(id);
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const fetchTaskForm = createAsyncThunk(
  'tasks/fetchForm',
  async (taskId: string, { rejectWithValue }) => {
    try {
      return await formsApi.getTaskForm(taskId);
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const claimTask = createAsyncThunk(
  'tasks/claim',
  async (
    { id, request }: { id: string; request: TaskClaimRequest },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const claimed = await tasksApi.claimTask(id, request);
      dispatch(fetchMyTasks());
      return claimed;
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const completeTask = createAsyncThunk(
  'tasks/complete',
  async (
    { id, request }: { id: string; request: TaskCompleteRequest },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const completed = await tasksApi.completeTask(id, request);
      dispatch(fetchMyTasks());
      return completed;
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setSelectedTask: (state, action: PayloadAction<HumanTaskRead | null>) => {
      state.selectedTask = action.payload;
    },
    setTaskFilters: (
      state,
      action: PayloadAction<{ only_claimed?: boolean; overdue?: boolean }>
    ) => {
      if (action.payload.only_claimed !== undefined) {
        state.filters.only_claimed = action.payload.only_claimed;
      }
      if (action.payload.overdue !== undefined) {
        state.filters.overdue = action.payload.overdue;
      }
      state.offset = 0;
    },
    setTaskPagination: (state, action: PayloadAction<{ limit?: number; offset?: number }>) => {
      if (action.payload.limit !== undefined) state.limit = action.payload.limit;
      if (action.payload.offset !== undefined) state.offset = action.payload.offset;
    },
    clearTaskError: (state) => {
      state.error = null;
    },
    clearTaskForm: (state) => {
      state.taskForm = null;
      state.taskFormLoading = false;
      state.taskFormError = null;
      state.taskFormRequestId = null;
    },
  },
  extraReducers: (builder) => {
    // List
    builder.addCase(fetchMyTasks.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchMyTasks.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload.items;
      state.total = action.payload.total;
      state.limit = action.payload.limit;
      state.offset = action.payload.offset;
    });
    builder.addCase(fetchMyTasks.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) || 'Błąd pobierania listy zadań';
    });

    // Single
    builder.addCase(fetchTask.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchTask.fulfilled, (state, action) => {
      state.loading = false;
      state.selectedTask = action.payload;
    });
    builder.addCase(fetchTask.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) || 'Błąd pobierania zadania';
    });

    // Formularz zadania (RJSF)
    builder.addCase(fetchTaskForm.pending, (state, action) => {
      state.taskFormRequestId = action.meta.arg;
      state.taskForm = null;
      state.taskFormLoading = true;
      state.taskFormError = null;
    });
    builder.addCase(fetchTaskForm.fulfilled, (state, action) => {
      state.taskFormLoading = false;
      if (state.taskFormRequestId !== action.payload.task_id) {
        return;
      }
      state.taskForm = action.payload as Draft<TaskFormRead>;
    });
    builder.addCase(fetchTaskForm.rejected, (state, action) => {
      if (state.taskFormRequestId !== action.meta.arg) {
        return;
      }
      state.taskFormLoading = false;
      state.taskForm = null;
      state.taskFormError = (action.payload as string) || 'Błąd pobierania formularza zadania';
    });

    // Claim
    builder.addCase(claimTask.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(claimTask.fulfilled, (state, action) => {
      state.actionLoading = false;
      state.selectedTask = action.payload;
    });
    builder.addCase(claimTask.rejected, (state, action) => {
      state.actionLoading = false;
      state.error = (action.payload as string) || 'Błąd podejmowania zadania';
    });

    // Complete
    builder.addCase(completeTask.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(completeTask.fulfilled, (state, action) => {
      state.actionLoading = false;
      state.selectedTask = action.payload;
    });
    builder.addCase(completeTask.rejected, (state, action) => {
      state.actionLoading = false;
      state.error = (action.payload as string) || 'Błąd kończenia zadania';
    });
  },
});

export const {
  setSelectedTask,
  setTaskFilters,
  setTaskPagination,
  clearTaskError,
  clearTaskForm,
} = tasksSlice.actions;

export default tasksSlice.reducer;
