import { configureStore } from '@reduxjs/toolkit'
import { api } from '../services/api'
import settingsReducer from '../features/settings/settingsSlice'

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch