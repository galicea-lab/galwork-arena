import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { processModelsApi } from '@/api/processModels';
import { extractApiError } from '@/api/client';
import {
  ProcessModelRead,
  ProcessModelCreate,
  ProcessModelUpdate,
  ProcessModelVersionRead,
  ProcessModelVersionCreate,
  ProcessModelFilterParams,
  ProcessModelSyncResult,
} from '@/types/processModels';

export interface ProcessModelsState {
  items: ProcessModelRead[];
  selectedModel: ProcessModelRead | null;
  versions: Record<string, ProcessModelVersionRead[]>;
  /** Treść plików wersji (zob. fetchProcessModelFileContent), kluczowana
   * po file.id - listy wersji nie noszą `content`, dociąga się go na
   * żądanie (np. podgląd formularza w Narzędziach twórcy). */
  fileContents: Record<string, string>;
  /** Wynik ostatniej synchronizacji z dysku (zob. syncProcessModelsFromDisk). */
  lastSyncResults: ProcessModelSyncResult[] | null;
  syncing: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
  filterActiveOnly: boolean;
}

const initialState: ProcessModelsState = {
  items: [],
  selectedModel: null,
  versions: {},
  fileContents: {},
  lastSyncResults: null,
  syncing: false,
  loading: false,
  saving: false,
  error: null,
  filterActiveOnly: true,
};

export const fetchProcessModels = createAsyncThunk(
  'processModels/fetchList',
  async (params: ProcessModelFilterParams | undefined, { rejectWithValue }) => {
    try {
      return await processModelsApi.listProcessModels(params);
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const fetchProcessModel = createAsyncThunk(
  'processModels/fetchSingle',
  async (id: string, { rejectWithValue }) => {
    try {
      return await processModelsApi.getProcessModel(id);
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const createProcessModel = createAsyncThunk(
  'processModels/create',
  async (data: ProcessModelCreate, { rejectWithValue, dispatch, getState }) => {
    try {
      const created = await processModelsApi.createProcessModel(data);
      const state = getState() as { processModels: ProcessModelsState };
      dispatch(fetchProcessModels({ active_only: state.processModels.filterActiveOnly }));
      return created;
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const updateProcessModel = createAsyncThunk(
  'processModels/update',
  async (
    { id, data }: { id: string; data: ProcessModelUpdate },
    { rejectWithValue, dispatch, getState }
  ) => {
    try {
      const updated = await processModelsApi.updateProcessModel(id, data);
      const state = getState() as { processModels: ProcessModelsState };
      dispatch(fetchProcessModels({ active_only: state.processModels.filterActiveOnly }));
      return updated;
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const fetchProcessModelVersions = createAsyncThunk(
  'processModels/fetchVersions',
  async (processModelId: string, { rejectWithValue }) => {
    try {
      const versions = await processModelsApi.listProcessModelVersions(processModelId);
      return { processModelId, versions };
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const fetchProcessModelFileContent = createAsyncThunk(
  'processModels/fetchFileContent',
  async (
    { processModelId, versionId, fileId }: { processModelId: string; versionId: string; fileId: string },
    { getState, rejectWithValue }
  ) => {
    const state = getState() as { processModels: ProcessModelsState };
    const cached = state.processModels.fileContents[fileId];
    if (cached !== undefined) {
      return { fileId, content: cached };
    }
    try {
      const file = await processModelsApi.getProcessModelFileContent(processModelId, versionId, fileId);
      return { fileId, content: file.content };
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const syncProcessModelsFromDisk = createAsyncThunk(
  'processModels/syncFromDisk',
  async (dryRun: boolean | undefined, { rejectWithValue, dispatch }) => {
    try {
      const results = await processModelsApi.syncProcessModelsFromDisk(dryRun ?? false);
      if (!dryRun) {
        // Mogły powstać nowe ProcessModel - odśwież listę, żeby się pokazały
        // w selektorach (tester formularzy, start instancji).
        dispatch(fetchProcessModels({ active_only: false }));
      }
      return results;
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const createProcessModelVersion = createAsyncThunk(
  'processModels/createVersion',
  async (
    {
      processModelId,
      data,
    }: {
      processModelId: string;
      data: ProcessModelVersionCreate;
    },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const version = await processModelsApi.createProcessModelVersion(processModelId, data);
      dispatch(fetchProcessModelVersions(processModelId));
      return version;
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const publishProcessModelVersion = createAsyncThunk(
  'processModels/publishVersion',
  async (
    {
      processModelId,
      versionId,
    }: {
      processModelId: string;
      versionId: string;
    },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const published = await processModelsApi.publishProcessModelVersion(processModelId, versionId);
      dispatch(fetchProcessModelVersions(processModelId));
      return published;
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const processModelsSlice = createSlice({
  name: 'processModels',
  initialState,
  reducers: {
    setSelectedModel: (state, action: PayloadAction<ProcessModelRead | null>) => {
      state.selectedModel = action.payload;
    },
    setFilterActiveOnly: (state, action: PayloadAction<boolean>) => {
      state.filterActiveOnly = action.payload;
    },
    clearProcessModelError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // List
    builder.addCase(fetchProcessModels.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchProcessModels.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload;
    });
    builder.addCase(fetchProcessModels.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) || 'Błąd pobierania modeli procesów';
    });

    // Single
    builder.addCase(fetchProcessModel.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchProcessModel.fulfilled, (state, action) => {
      state.loading = false;
      state.selectedModel = action.payload;
    });
    builder.addCase(fetchProcessModel.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) || 'Błąd pobierania modelu procesu';
    });

    // Create & Update
    builder.addCase(createProcessModel.pending, (state) => {
      state.saving = true;
      state.error = null;
    });
    builder.addCase(createProcessModel.fulfilled, (state, action) => {
      state.saving = false;
      state.selectedModel = action.payload;
    });
    builder.addCase(createProcessModel.rejected, (state, action) => {
      state.saving = false;
      state.error = (action.payload as string) || 'Błąd tworzenia modelu';
    });

    builder.addCase(updateProcessModel.pending, (state) => {
      state.saving = true;
      state.error = null;
    });
    builder.addCase(updateProcessModel.fulfilled, (state, action) => {
      state.saving = false;
      state.selectedModel = action.payload;
    });
    builder.addCase(updateProcessModel.rejected, (state, action) => {
      state.saving = false;
      state.error = (action.payload as string) || 'Błąd aktualizacji modelu';
    });

    // Versions
    builder.addCase(fetchProcessModelVersions.fulfilled, (state, action) => {
      state.versions[action.payload.processModelId] = action.payload.versions;
    });
    builder.addCase(fetchProcessModelFileContent.fulfilled, (state, action) => {
      state.fileContents[action.payload.fileId] = action.payload.content;
    });

    builder.addCase(syncProcessModelsFromDisk.pending, (state) => {
      state.syncing = true;
      state.error = null;
    });
    builder.addCase(syncProcessModelsFromDisk.fulfilled, (state, action) => {
      state.syncing = false;
      state.lastSyncResults = action.payload;
    });
    builder.addCase(syncProcessModelsFromDisk.rejected, (state, action) => {
      state.syncing = false;
      state.error = (action.payload as string) || 'Błąd synchronizacji z dyskiem';
    });

    builder.addCase(createProcessModelVersion.pending, (state) => {
      state.saving = true;
      state.error = null;
    });
    builder.addCase(createProcessModelVersion.fulfilled, (state) => {
      state.saving = false;
    });
    builder.addCase(createProcessModelVersion.rejected, (state, action) => {
      state.saving = false;
      state.error = (action.payload as string) || 'Błąd tworzenia wersji';
    });
    builder.addCase(publishProcessModelVersion.pending, (state) => {
      state.saving = true;
      state.error = null;
    });
    builder.addCase(publishProcessModelVersion.fulfilled, (state) => {
      state.saving = false;
    });
    builder.addCase(publishProcessModelVersion.rejected, (state, action) => {
      state.saving = false;
      state.error = (action.payload as string) || 'Błąd publikacji wersji';
    });
  },
});

export const { setSelectedModel, setFilterActiveOnly, clearProcessModelError } =
  processModelsSlice.actions;

export default processModelsSlice.reducer;
