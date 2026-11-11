import { Dispatch } from 'redux'
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
// https://www.softkraft.co/how-to-setup-redux-with-redux-toolkit/

import { Item, api_items_lista, FormType, api_form_types } from 'src/api/jform'

// https://redux-toolkit.js.org/api/createAsyncThunk
export const fetchList = createAsyncThunk('jform/items/list',
async ({ email, token }: { email: string, token: string }) => {
  const response = api_items_lista(token,email,{})
  return (await response).list
})

export const fetchFormtypes = createAsyncThunk('jform/form_types',
async ({ token }: { token: string }) => {
  const response = await api_form_types(token)
  return (await response).result
})

export type JForm = {
  element : string;
  schema : any;
  uiSchema : any;
  cdata : any
}

export const JFormSlice = createSlice({
  name: 'jform',
  initialState: {
    items: [] as Item[],
    formTypes : [] as FormType[],
    currentFormType : '',
    edForm : false,
    jform : {} as JForm,
    progressBar : 0,
    params: {}
  },
  reducers: {
    getDocumentsList: (state, action) => {
      state.items = action.payload.items;
    },
    getForms: (state, action) => {
      state.formTypes = action.payload.formTypes;
    },
    setEdForm: (state, action) => {
      state.edForm = action.payload ;
    },
    setJForm: (state, action) => {
      state.jform = action.payload ;
    },
    setCurrentFormType: (state, action) => {
      state.currentFormType = action.payload ;
    },
    setCurrentFormN: (state, action) => {
      let name = action.payload;
      let ft : FormType;
      for (ft of state.formTypes){
        if (ft.name==name) {
          state.currentFormType = ft.id ;
          return
        }
      }
    },
    progressBarUp: (state, action) => {
      state.progressBar += 1 ;
    },
    progressBarDown: (state, action) => {
      state.progressBar -= 1 ;
    },
    progressBarReset: (state, action) => {
      state.progressBar = 0 ;
    },
  },
  // reduktor z funkcji zbudowanej na zewnątrz (thunk)
  extraReducers: builder => {
    builder.addCase(fetchList.fulfilled, (state, action) => {
      state.items = action.payload as Item[];
    })
    builder.addCase(fetchFormtypes.fulfilled, (state, action) => {
      state.formTypes = action.payload as FormType[];
    })

  }
})


export default JFormSlice.reducer
export const { setEdForm, setJForm, progressBarUp, progressBarDown, progressBarReset,
  setCurrentFormType, setCurrentFormN } = JFormSlice.actions
