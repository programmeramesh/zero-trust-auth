import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  mfaEnabled: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  requiresMFA: boolean;
  tempToken: string | null;
  mfaSetup?: { secret: string; qrCode: string } | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
  requiresMFA: false,
  tempToken: null,
  mfaSetup: null as null | { secret: string; qrCode: string } ,
};

export const login = createAsyncThunk(
  'auth/login',
  async (
    credentials: {
      email: string;
      password: string;
      captchaId?: string;
      captchaInput?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await authAPI.login(credentials);
      if (response.data.requiresMFA) {
        return {
          requiresMFA: true,
          tempToken: response.data.tempToken,
          mfaEnabled: response.data.mfaEnabled,
          deviceTrusted: response.data.deviceTrusted,
        };
      }
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      return {
        requiresMFA: false,
        user: response.data.user,
        token: response.data.token,
        refreshToken: response.data.refreshToken,
      };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      const details = error.response?.data?.errors?.join(' \n ');
      return rejectWithValue(details ? `${message}: ${details}` : message);
    }
  }
);

export const verifyMFA = createAsyncThunk(
  'auth/verifyMFA',
  async (data: { tempToken: string; otp: string }, { rejectWithValue }) => {
    try {
      const response = await authAPI.verifyMFA(data);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      return {
        user: response.data.user,
        token: response.data.token,
        refreshToken: response.data.refreshToken,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'MFA verification failed');
    }
  }
);

export const refreshAccessToken = createAsyncThunk(
  'auth/refreshAccessToken',
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      const response = await authAPI.refreshToken(refreshToken);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      return {
        token: response.data.token,
        refreshToken: response.data.refreshToken,
      };
    } catch (error: any) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      return rejectWithValue(error.response?.data?.message || 'Failed to refresh token');
    }
  }
);

export const signup = createAsyncThunk(
  'auth/signup',
  async (
    credentials: {
      name: string;
      email: string;
      password: string;
      captchaId?: string;
      captchaInput?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await authAPI.signup(credentials);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Signup failed';
      const details = error.response?.data?.errors?.join(' \n ');
      return rejectWithValue(details ? `${message}: ${details}` : message);
    }
  }
);

export const enableMFA = createAsyncThunk('auth/enableMFA', async (_, { rejectWithValue }) => {
  try {
    const response = await authAPI.enableMFA();
    return response.data; // { secret, qrCode }
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to enable MFA');
  }
});

export const confirmMFAAction = createAsyncThunk('auth/confirmMFA', async (data: { otp: string }, { rejectWithValue }) => {
  try {
    const response = await authAPI.confirmMFA(data);
    return response.data; // { message }
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to confirm MFA');
  }
});

export const disableMFAAction = createAsyncThunk('auth/disableMFA', async (data: { otp: string }, { rejectWithValue }) => {
  try {
    const response = await authAPI.disableMFA(data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to disable MFA');
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  return null;
});

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.getMe();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearMFA: (state) => {
      state.requiresMFA = false;
      state.tempToken = null;
    },
    clearMFASetup: (state) => {
      state.mfaSetup = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.requiresMFA) {
          state.requiresMFA = true;
          state.tempToken = action.payload.tempToken;
        } else {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.refreshToken = action.payload.refreshToken || null;
          state.isAuthenticated = true;
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Verify MFA
      .addCase(verifyMFA.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyMFA.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken || null;
        state.isAuthenticated = true;
        state.requiresMFA = false;
        state.tempToken = null;
      })
      .addCase(verifyMFA.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Refresh token
      .addCase(refreshAccessToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
      })
      .addCase(refreshAccessToken.rejected, (state, action) => {
        state.loading = false;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      // Signup
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.requiresMFA = false;
        state.tempToken = null;
      })
      // Fetch current user
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });

    // Enable MFA
    builder
      .addCase(enableMFA.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(enableMFA.fulfilled, (state, action) => {
        state.loading = false;
        state.mfaSetup = action.payload;
      })
      .addCase(enableMFA.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Confirm MFA
      .addCase(confirmMFAAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(confirmMFAAction.fulfilled, (state) => {
        state.loading = false;
        if (state.user) state.user.mfaEnabled = true;
        state.mfaSetup = null;
      })
      .addCase(confirmMFAAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Disable MFA
      .addCase(disableMFAAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(disableMFAAction.fulfilled, (state) => {
        state.loading = false;
        if (state.user) state.user.mfaEnabled = false;
      })
      .addCase(disableMFAAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearMFA, clearMFASetup } = authSlice.actions;
export default authSlice.reducer;
