import { removeCookie, setCookie } from "@/utils"
import { defineStore } from "pinia"
import request from "@/utils/request"
import { ElMessage } from "element-plus"
import { Stores } from "types/stores"
import apiService from "@/api/apiRequests"

export const userStore = defineStore('user', {
  state: (): Stores.user => ({
    name: '',
    token: '',
    id: null,
    email: '',
    phone: '',
    avatar: null,
    status: "active",
  }),

  actions: {
    async login(email: string, password: string) {
      try {
        interface LoginResponse {
          user: {
            name: string;
            email: string;
            phone: string;
            avatar: string | null;
            status: string;
            id: number | null;
          };
          token: string;
        }

        const response = await apiService.post<LoginResponse>('/login', {
          email, password
        });

        console.log('Login response:', response);
        
        // Check if response has data property
        if (response && response.data) {
          this.name = response.data.user.name || '';
          this.email = response.data.user.email || '';
          this.phone = response.data.user.phone || '';
          // this.avatar = response.data.user.avatar || null;
          // this.status = response.data.user.status || 'active';
          this.token = response.data.token || '';
          this.id = response.data.user.id || null;
          
          if (this.token) {
            apiService.setToken(this.token);
            // IMPORTANT: Save token to cookie for persistence across pages
            setCookie('token', this.token, 7); // Token expires in 7 days
          }
          
          // Return standard object structure for consistency
          return {
            status: 200,
            data: response.data,
            message: 'Login successful'
          };
        }
        
        throw new Error('Invalid response format');
      } catch (error) {
        console.error('Login error in store:', error);
        throw error;
      }
    },
    async logout() {
      return new Promise((resolve) => {
        request.get<Stores.user>('/user/logout').then((res) => {
          // Reset user state
          this.name = '';
          this.token = '';
          this.id = null;
          this.email = '';
          this.phone = '';
          this.avatar = null;
          this.status = "active";
          
          // Remove token from API service
          apiService.removeToken();
          
          // Remove token cookie
          removeCookie('token');
          
          resolve('Logout successful');
        }).catch((error) => {
          // Even if API call fails, clear local state
          this.name = '';
          this.token = '';
          this.id = null;
          this.email = '';
          this.phone = '';
          this.avatar = null;
          this.status = "active";
          
          apiService.removeToken();
          removeCookie('token');
          
          resolve('Logout completed');
        });
      });
    },
    async getUserInfo(token: string): Promise<string> {
      return new Promise((resolve, reject) => {
        request.get<Stores.user>('/user/info', {
          params: {
            token: token
          }
        }).then(res => {
          const { data } = res
          if (data) {
            this.name = data.name
            this.email = data.email
            this.phone = data.phone
            this.avatar = data.avatar
            this.status = data.status
            this.id = data.id
            this.token = data.token
            this.token = token
            setCookie('token', this.token)
            // resolve(msg)
          } else {
            // reject(msg)
          }
        })
      })
    },
    setUserId(id: number | null) {
      this.id = id;
    }
  }
})