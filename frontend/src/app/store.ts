import { configureStore } from "@reduxjs/toolkit";

import { api } from "../lib/api";
import { authReducer } from "../features/auth/authSlice";
import { appReducer } from "../features/app/appSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    app: appReducer,
    [api.reducerPath]: api.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    }).concat(api.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
