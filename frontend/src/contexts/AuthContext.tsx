import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '../services/api'

interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: 'user' | 'contributor' | 'admin'
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  isLoading: boolean
  error: string | null
}

interface RegisterData {
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await api.get('/auth/me')
          setUser(response.data.user)
        } catch (err) {
          console.error('Token validation failed:', err)
          localStorage.removeItem('token')
          setToken(null)
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [token])

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await api.post('/auth/login', { username, password })
      const { user: userData, token: newToken } = response.data
      
      setUser(userData)
      setToken(newToken)
      localStorage.setItem('token', newToken)
      
      // Set default authorization header for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await api.post('/auth/register', userData)
      const { user: newUser, token: newToken } = response.data
      
      setUser(newUser)
      setToken(newToken)
      localStorage.setItem('token', newToken)
      
      // Set default authorization header for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
  }

  // Set authorization header when token changes
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete api.defaults.headers.common['Authorization']
    }
  }, [token])

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
    error
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
