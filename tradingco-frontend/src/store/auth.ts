import axios from 'axios'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TokenResponse } from '../types'

// Plain axios (no interceptors) for auth endpoints to avoid a refresh loop.
const authApi = axios.create({ baseURL: '/api/v1/auth' })

type AuthState = {
  accessToken: string | null
  refreshToken: string | null
  email: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, displayName: string, password: string) => Promise<void>
  refresh: () => Promise<string | null>
  logout: () => void
}

function store(
  set: (partial: Partial<AuthState>) => void,
  get: () => AuthState,
): AuthState {
  const applyTokens = (email: string, data: TokenResponse) =>
    set({ accessToken: data.accessToken, refreshToken: data.refreshToken, email })

  return {
    accessToken: null,
    refreshToken: null,
    email: null,

    async login(email, password) {
      const { data } = await authApi.post<TokenResponse>('/login', { email, password })
      applyTokens(email, data)
    },

    async register(email, displayName, password) {
      const { data } = await authApi.post<TokenResponse>('/register', {
        email,
        displayName,
        password,
      })
      applyTokens(email, data)
    },

    async refresh() {
      const token = get().refreshToken
      if (!token) return null
      try {
        const { data } = await authApi.post<TokenResponse>('/refresh', { refreshToken: token })
        set({ accessToken: data.accessToken, refreshToken: data.refreshToken })
        return data.accessToken
      } catch {
        set({ accessToken: null, refreshToken: null, email: null })
        return null
      }
    },

    logout() {
      const token = get().refreshToken
      if (token) authApi.post('/logout', { refreshToken: token }).catch(() => undefined)
      set({ accessToken: null, refreshToken: null, email: null })
    },
  }
}

export const useAuth = create<AuthState>()(
  persist(store, { name: 'tradingco-auth' }),
)
