import axios from 'axios'

const client = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const access = localStorage.getItem('access_token')
  if (access) {
    config.headers.Authorization = `Bearer ${access}`
  }
  return config
})

client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      // Clear tokens but let React Router handle the redirect via AuthContext
      // (window.location.href forces a full page reload which breaks SPA routing)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      // Fire a custom event that AuthContext listens to
      window.dispatchEvent(new Event('auth:logout'))
    }
    return Promise.reject(error)
  }
)

export default client
