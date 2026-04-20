import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authService } from '../../services/auth.service'

// Async thunk for login
export const loginUser = createAsyncThunk(
    'auth/login',
    async (credentials, { rejectWithValue }) => {
        try {
            const data = await authService.login(credentials.email, credentials.password)
            localStorage.setItem('kaizen_user', JSON.stringify(data))
            return data
        } catch (error) {
            return rejectWithValue(error.response?.data?.detail || 'Login failed')
        }
    }
)

export const logoutUser = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            await authService.logout()
            localStorage.removeItem('kaizen_user')
        } catch (error) {
            console.error(error)
        }
    }
)

const initialState = {
    user: JSON.parse(localStorage.getItem('kaizen_user')) || null,
    loading: false,
    error: null,
    isAuthenticated: !!localStorage.getItem('kaizen_user')
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null
        },
        setUser: (state, action) => {
            state.user = action.payload
            state.isAuthenticated = !!action.payload
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false
                state.user = action.payload
                state.isAuthenticated = true
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null
                state.isAuthenticated = false
            })
    }
})

export const { clearError, setUser } = authSlice.actions
export default authSlice.reducer
