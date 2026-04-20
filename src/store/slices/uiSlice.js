import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    sidebarOpen: true,
    theme: localStorage.getItem('theme') || 'light',
    notifications: []
}

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        toggleSidebar: (state) => {
            state.sidebarOpen = !state.sidebarOpen
        },
        setSidebarOpen: (state, action) => {
            state.sidebarOpen = action.payload
        },
        toggleTheme: (state) => {
            state.theme = state.theme === 'light' ? 'dark' : 'light'
            localStorage.setItem('theme', state.theme)
            if (state.theme === 'dark') {
                document.documentElement.classList.add('dark')
            } else {
                document.documentElement.classList.remove('dark')
            }
        },
        addNotification: (state, action) => {
            state.notifications.push({
                id: Date.now(),
                ...action.payload,
                read: false
            })
        },
        markNotificationRead: (state, action) => {
            const notif = state.notifications.find(n => n.id === action.payload)
            if (notif) notif.read = true
        },
        clearNotifications: (state) => {
            state.notifications = []
        }
    }
})

export const { toggleSidebar, setSidebarOpen, toggleTheme, addNotification, markNotificationRead, clearNotifications } = uiSlice.actions
export default uiSlice.reducer
