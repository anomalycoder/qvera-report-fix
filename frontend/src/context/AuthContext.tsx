import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface UserProfile {
  id: number
  email: string
  name: string
  role: string
  avatar?: string | null
}

interface AuthContextType {
  user: UserProfile | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = "acadza_auth_token"
const USER_KEY = "acadza_auth_user"

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(USER_KEY)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return null
      }
    }
    return null
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const refreshUser = async () => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    if (!storedToken) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch("/api/v1/auth/me", {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      })
      if (res.ok) {
        const userData: UserProfile = await res.json()
        setUser(userData)
        localStorage.setItem(USER_KEY, JSON.stringify(userData))
      } else {
        // Token expired or invalid
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setToken(null)
        setUser(null)
      }
    } catch {
      // Offline fallback: keep cached user if present
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const login = async (
    email: string,
    password: string,
    rememberMe: boolean = false
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember_me: rememberMe }),
      })

      const data = await res.json()

      if (!res.ok) {
        return {
          success: false,
          error: data.detail || "Authentication failed. Please check your credentials.",
        }
      }

      const receivedToken = data.token
      const receivedUser = data.user

      setToken(receivedToken)
      setUser(receivedUser)

      localStorage.setItem(TOKEN_KEY, receivedToken)
      localStorage.setItem(USER_KEY, JSON.stringify(receivedUser))

      return { success: true }
    } catch (err: any) {
      return {
        success: false,
        error: "Network error connecting to authentication server.",
      }
    }
  }

  const logout = async () => {
    const currentToken = token || localStorage.getItem(TOKEN_KEY)
    try {
      if (currentToken) {
        await fetch("/api/v1/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        })
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      setToken(null)
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
