import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// ** Slices
import processModels from './processModels';
import processInstances from './processInstances';
import tasks from './tasks';
import comments from './comments';
import notifications from './notifications';
import events from './events';
import calendar from './calendar';
import jform from './jform';
import dictionaryEntries from './dictionaryEntries';
import contacts from './contacts';

export const store = configureStore({
  reducer: {
    processModels,
    processInstances,
    tasks,
    comments,
    notifications,
    events,
    calendar,
    jform,
    dictionaryEntries,
    contacts
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;

// Use throughout app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
