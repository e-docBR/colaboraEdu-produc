import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: number;
    username: string;
    role?: string;
    is_admin?: boolean;
    aluno_id?: number | null;
    photo_url?: string;
    must_change_password?: boolean;
    tenant_id?: number | null;
    tenant_name?: string;
  };
};

const initialState: AuthState = {
  accessToken: undefined,
  refreshToken: undefined,
  user: undefined
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ access_token: string; refresh_token: string; user: AuthState["user"] }>
    ) => {
      state.accessToken = action.payload.access_token;
      state.refreshToken = action.payload.refresh_token;
      state.user = action.payload.user;
    },
    logout: (state) => {
      state.accessToken = undefined;
      state.refreshToken = undefined;
      state.user = undefined;
    },
    updateUser: (state, action: PayloadAction<AuthState["user"] | undefined>) => {
      state.user = action.payload;
    }
  }
});

export const { setCredentials, logout, updateUser } = authSlice.actions;
export const authReducer = authSlice.reducer;
