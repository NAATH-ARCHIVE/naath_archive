import axios from 'axios'

// Create axios instance with default configuration
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('token')
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    
    // Handle 403 errors (forbidden)
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data)
    }
    
    // Handle 500 errors (server error)
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data)
    }
    
    return Promise.reject(error)
  }
)

// API endpoints
export const endpoints = {
  // Auth
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    me: '/auth/me',
    refresh: '/auth/refresh',
    changePassword: '/auth/change-password',
    createContributor: '/auth/create-contributor',
  },
  
  // Articles
  articles: {
    list: '/articles',
    detail: (slug: string) => `/articles/${slug}`,
    create: '/articles',
    update: (id: string) => `/articles/${id}`,
    delete: (id: string) => `/articles/${id}`,
    drafts: '/articles/draft/all',
  },
  
  // Comments
  comments: {
    list: (articleId: string) => `/comments?article_id=${articleId}`,
    create: '/comments',
    update: (id: string) => `/comments/${id}`,
    delete: (id: string) => `/comments/${id}`,
    approve: (id: string) => `/comments/${id}/approve`,
  },
  
  // Artifacts
  artifacts: {
    list: '/artifacts',
    detail: (id: string) => `/artifacts/${id}`,
    create: '/artifacts',
    update: (id: string) => `/artifacts/${id}`,
    delete: (id: string) => `/artifacts/${id}`,
  },
  
  // Oral Histories
  oralHistories: {
    list: '/oral-histories',
    detail: (id: string) => `/oral-histories/${id}`,
    create: '/oral-histories',
    update: (id: string) => `/oral-histories/${id}`,
    delete: (id: string) => `/oral-histories/${id}`,
  },
  
  // Research
  research: {
    list: '/research',
    detail: (id: string) => `/research/${id}`,
    create: '/research',
    update: (id: string) => `/research/${id}`,
    delete: (id: string) => `/research/${id}`,
  },
  
  // Education
  education: {
    list: '/education',
    detail: (id: string) => `/education/${id}`,
    create: '/education',
    update: (id: string) => `/education/${id}`,
    delete: (id: string) => `/education/${id}`,
  },
  
  // Events
  events: {
    list: '/events',
    detail: (id: string) => `/events/${id}`,
    create: '/events',
    update: (id: string) => `/events/${id}`,
    delete: (id: string) => `/events/${id}`,
  },
  
  // Donations
  donations: {
    list: '/donations',
    create: '/donations',
    detail: (id: string) => `/donations/${id}`,
  },
  
  // Shop
  shop: {
    products: '/shop/products',
    product: (id: string) => `/shop/products/${id}`,
    orders: '/shop/orders',
    order: (id: string) => `/shop/orders/${id}`,
  },
  
  // Media
  media: {
    upload: '/media/upload',
    list: '/media',
    delete: (id: string) => `/media/${id}`,
  },
}

export default api
