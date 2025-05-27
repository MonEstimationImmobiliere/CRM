import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { getCookie, setCookie, removeCookie } from '@/utils'
import API_URL from '@/utils/API_URL'

class ApiService {
  private api: AxiosInstance
  private token: string | null = null

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      timeout: 10000,
    })

    // Initialize token from cookie
    this.token = getCookie('token') || null

    // Request interceptor to add token
    this.api.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.removeToken()
        }
        return Promise.reject(error)
      }
    )
  }

  setToken(token: string): void {
    this.token = token
    setCookie('token', token)
  }

  getToken(): string | null {
    return this.token || getCookie('token')
  }

  removeToken(): void {
    this.token = null
    removeCookie('token')
  }

  // HTTP methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.get(url, config)
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.post(url, data, config)
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.put(url, data, config)
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.delete(url, config)
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.patch(url, data, config)
  }
}

// Export singleton instance
export const apiService = new ApiService()
export default apiService
