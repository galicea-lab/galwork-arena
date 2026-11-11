import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { commentsApi } from '@/api/comments';
import { extractApiError } from '@/api/client';
import { CommentRead, CommentCreate } from '@/types/comments';

export interface CommentsState {
  byInstanceId: Record<string, CommentRead[]>;
  loading: boolean;
  submitting: boolean;
  error: string | null;
}

const initialState: CommentsState = {
  byInstanceId: {},
  loading: false,
  submitting: false,
  error: null,
};

export const fetchComments = createAsyncThunk(
  'comments/fetchByInstance',
  async (instanceId: string, { rejectWithValue }) => {
    try {
      const items = await commentsApi.listComments(instanceId);
      return { instanceId, items };
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const createComment = createAsyncThunk(
  'comments/create',
  async (
    { instanceId, data }: { instanceId: string; data: CommentCreate },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const comment = await commentsApi.createComment(instanceId, data);
      dispatch(fetchComments(instanceId));
      return { instanceId, comment };
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    clearCommentsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchComments.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchComments.fulfilled, (state, action) => {
      state.loading = false;
      state.byInstanceId[action.payload.instanceId] = action.payload.items;
    });
    builder.addCase(fetchComments.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) || 'Błąd pobierania komentarzy';
    });

    builder.addCase(createComment.pending, (state) => {
      state.submitting = true;
      state.error = null;
    });
    builder.addCase(createComment.fulfilled, (state) => {
      state.submitting = false;
    });
    builder.addCase(createComment.rejected, (state, action) => {
      state.submitting = false;
      state.error = (action.payload as string) || 'Błąd dodawania komentarza';
    });
  },
});

export const { clearCommentsError } = commentsSlice.actions;

export default commentsSlice.reducer;
