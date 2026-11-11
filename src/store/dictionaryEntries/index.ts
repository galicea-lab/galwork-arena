import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { dictionaryEntriesApi } from '@/api/dictionaryEntries';
import { extractApiError } from '@/api/client';
import {
  DictionaryCatalogEntry,
  DictionaryEntryCreate,
  DictionaryEntryFilterParams,
  DictionaryEntryRead,
  DictionaryEntryUpdate,
} from '@/types/dictionaryEntries';

export interface DictionaryEntriesState {
  catalog: DictionaryCatalogEntry[];
  catalogLoading: boolean;
  selectedDictionaryKey: string | null;
  items: DictionaryEntryRead[];
  total: number;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: DictionaryEntriesState = {
  catalog: [],
  catalogLoading: false,
  selectedDictionaryKey: null,
  items: [],
  total: 0,
  loading: false,
  saving: false,
  error: null,
};

export const fetchDictionaryCatalog = createAsyncThunk(
  'dictionaryEntries/fetchCatalog',
  async (_: void | undefined, { rejectWithValue }) => {
    try {
      return await dictionaryEntriesApi.listCatalog();
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const fetchDictionaryEntries = createAsyncThunk(
  'dictionaryEntries/fetchList',
  async (params: DictionaryEntryFilterParams, { rejectWithValue }) => {
    try {
      return await dictionaryEntriesApi.listEntries(params);
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const createDictionaryEntry = createAsyncThunk(
  'dictionaryEntries/create',
  async (data: DictionaryEntryCreate, { rejectWithValue, dispatch }) => {
    try {
      const created = await dictionaryEntriesApi.createEntry(data);
      dispatch(fetchDictionaryEntries({ dictionary_key: data.dictionary_key }));
      return created;
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const updateDictionaryEntry = createAsyncThunk(
  'dictionaryEntries/update',
  async (
    { id, data, dictionaryKey }: { id: string; data: DictionaryEntryUpdate; dictionaryKey: string },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const updated = await dictionaryEntriesApi.updateEntry(id, data);
      dispatch(fetchDictionaryEntries({ dictionary_key: dictionaryKey }));
      return updated;
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const deleteDictionaryEntry = createAsyncThunk(
  'dictionaryEntries/delete',
  async ({ id, dictionaryKey }: { id: string; dictionaryKey: string }, { rejectWithValue, dispatch }) => {
    try {
      await dictionaryEntriesApi.deleteEntry(id);
      dispatch(fetchDictionaryEntries({ dictionary_key: dictionaryKey }));
      return id;
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const dictionaryEntriesSlice = createSlice({
  name: 'dictionaryEntries',
  initialState,
  reducers: {
    setSelectedDictionaryKey: (state, action: PayloadAction<string | null>) => {
      state.selectedDictionaryKey = action.payload;
      state.items = [];
      state.total = 0;
    },
    clearDictionaryEntriesError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchDictionaryCatalog.pending, (state) => {
      state.catalogLoading = true;
    });
    builder.addCase(fetchDictionaryCatalog.fulfilled, (state, action) => {
      state.catalogLoading = false;
      state.catalog = action.payload;
    });
    builder.addCase(fetchDictionaryCatalog.rejected, (state, action) => {
      state.catalogLoading = false;
      state.error = (action.payload as string) || 'Błąd pobierania katalogu słowników';
    });

    builder.addCase(fetchDictionaryEntries.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDictionaryEntries.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload.items;
      state.total = action.payload.total;
    });
    builder.addCase(fetchDictionaryEntries.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) || 'Błąd pobierania wierszy słownika';
    });

    builder.addCase(createDictionaryEntry.pending, (state) => {
      state.saving = true;
      state.error = null;
    });
    builder.addCase(createDictionaryEntry.fulfilled, (state) => {
      state.saving = false;
    });
    builder.addCase(createDictionaryEntry.rejected, (state, action) => {
      state.saving = false;
      state.error = (action.payload as string) || 'Błąd tworzenia wiersza słownika';
    });

    builder.addCase(updateDictionaryEntry.pending, (state) => {
      state.saving = true;
      state.error = null;
    });
    builder.addCase(updateDictionaryEntry.fulfilled, (state) => {
      state.saving = false;
    });
    builder.addCase(updateDictionaryEntry.rejected, (state, action) => {
      state.saving = false;
      state.error = (action.payload as string) || 'Błąd aktualizacji wiersza słownika';
    });

    builder.addCase(deleteDictionaryEntry.pending, (state) => {
      state.saving = true;
      state.error = null;
    });
    builder.addCase(deleteDictionaryEntry.fulfilled, (state) => {
      state.saving = false;
    });
    builder.addCase(deleteDictionaryEntry.rejected, (state, action) => {
      state.saving = false;
      state.error = (action.payload as string) || 'Błąd usuwania wiersza słownika';
    });
  },
});

export const { setSelectedDictionaryKey, clearDictionaryEntriesError } = dictionaryEntriesSlice.actions;

export default dictionaryEntriesSlice.reducer;
