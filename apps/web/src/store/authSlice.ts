import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UserDto } from "../lib/types-auth";

export type AuthStatus = "idle" | "loading" | "authenticated" | "guest";

interface AuthState {
  user: UserDto | null;
  accessToken: string | null;
  status: AuthStatus;
}

const initialState: AuthState = { user: null, accessToken: null, status: "idle" };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: UserDto; accessToken: string }>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.status = "authenticated";
    },
    clearCredentials(state) {
      state.user = null;
      state.accessToken = null;
      state.status = "guest";
    },
    setBootstrapping(state) {
      state.status = "loading";
    },
  },
});

export const { setCredentials, clearCredentials, setBootstrapping } = authSlice.actions;
export default authSlice.reducer;
