import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { contactsApi } from '@/api/contacts';
import { extractApiError } from '@/api/client';
import {
  ContactAddressCreate,
  ContactAddressUpdate,
  ContactCreate,
  ContactFilterParams,
  ContactRead,
  ContactUpdate,
} from '@/types/contacts';

export interface ContactsState {
  items: ContactRead[];
  total: number;
  selectedContact: ContactRead | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: ContactsState = {
  items: [],
  total: 0,
  selectedContact: null,
  loading: false,
  saving: false,
  error: null,
};

export const fetchContacts = createAsyncThunk(
  'contacts/fetchList',
  async (params: ContactFilterParams | undefined, { rejectWithValue }) => {
    try {
      return await contactsApi.listContacts(params);
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const fetchContact = createAsyncThunk(
  'contacts/fetchSingle',
  async (id: string, { rejectWithValue }) => {
    try {
      return await contactsApi.getContact(id);
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const createContact = createAsyncThunk(
  'contacts/create',
  async (data: ContactCreate, { rejectWithValue }) => {
    try {
      return await contactsApi.createContact(data);
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const updateContact = createAsyncThunk(
  'contacts/update',
  async ({ id, data }: { id: string; data: ContactUpdate }, { rejectWithValue }) => {
    try {
      return await contactsApi.updateContact(id, data);
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const deleteContact = createAsyncThunk(
  'contacts/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await contactsApi.deleteContact(id);
      return id;
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const createContactAddress = createAsyncThunk(
  'contacts/createAddress',
  async (
    { contactId, data }: { contactId: string; data: ContactAddressCreate },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const address = await contactsApi.createAddress(contactId, data);
      dispatch(fetchContact(contactId));
      return address;
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const updateContactAddress = createAsyncThunk(
  'contacts/updateAddress',
  async (
    { addressId, data, contactId }: { addressId: string; data: ContactAddressUpdate; contactId: string },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const address = await contactsApi.updateAddress(addressId, data);
      dispatch(fetchContact(contactId));
      return address;
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const deleteContactAddress = createAsyncThunk(
  'contacts/deleteAddress',
  async (
    { addressId, contactId }: { addressId: string; contactId: string },
    { rejectWithValue, dispatch }
  ) => {
    try {
      await contactsApi.deleteAddress(addressId);
      dispatch(fetchContact(contactId));
      return addressId;
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  }
);

export const contactsSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    setSelectedContact: (state, action: PayloadAction<ContactRead | null>) => {
      state.selectedContact = action.payload;
    },
    clearContactsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchContacts.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchContacts.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload.items;
      state.total = action.payload.total;
    });
    builder.addCase(fetchContacts.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) || 'Błąd pobierania kontrahentów';
    });

    builder.addCase(fetchContact.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchContact.fulfilled, (state, action) => {
      state.loading = false;
      state.selectedContact = action.payload;
    });
    builder.addCase(fetchContact.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) || 'Błąd pobierania kontrahenta';
    });

    builder.addCase(createContact.pending, (state) => {
      state.saving = true;
      state.error = null;
    });
    builder.addCase(createContact.fulfilled, (state) => {
      state.saving = false;
    });
    builder.addCase(createContact.rejected, (state, action) => {
      state.saving = false;
      state.error = (action.payload as string) || 'Błąd tworzenia kontrahenta';
    });

    builder.addCase(updateContact.pending, (state) => {
      state.saving = true;
      state.error = null;
    });
    builder.addCase(updateContact.fulfilled, (state, action) => {
      state.saving = false;
      state.selectedContact = action.payload;
    });
    builder.addCase(updateContact.rejected, (state, action) => {
      state.saving = false;
      state.error = (action.payload as string) || 'Błąd aktualizacji kontrahenta';
    });

    builder.addCase(deleteContact.pending, (state) => {
      state.saving = true;
      state.error = null;
    });
    builder.addCase(deleteContact.fulfilled, (state) => {
      state.saving = false;
    });
    builder.addCase(deleteContact.rejected, (state, action) => {
      state.saving = false;
      state.error = (action.payload as string) || 'Błąd usuwania kontrahenta';
    });

    for (const thunk of [createContactAddress, updateContactAddress, deleteContactAddress]) {
      builder.addCase(thunk.pending, (state) => {
        state.saving = true;
        state.error = null;
      });
      builder.addCase(thunk.fulfilled, (state) => {
        state.saving = false;
      });
      builder.addCase(thunk.rejected, (state, action) => {
        state.saving = false;
        state.error = (action.payload as string) || 'Błąd zapisu adresu';
      });
    }
  },
});

export const { setSelectedContact, clearContactsError } = contactsSlice.actions;

export default contactsSlice.reducer;
