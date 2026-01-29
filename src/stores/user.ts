import { removeCookie, setCookie } from '@/utils';
import { defineStore } from 'pinia';
import { Stores } from 'types/stores';
import apiService from '@/api/apiRequests';

export const userStore = defineStore('user', {
  state: (): Stores.user => ({
    name: '',
    token: '',
    id: null,
    email: '',
    phone: '',
    avatar: null,
    status: 'active',
  }),

  actions: {
    async login(email: string, password: string) {
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
        email,
        password,
      });

      if (response?.data) {
        this.name = response.data.user.name || '';
        this.email = response.data.user.email || '';
        this.phone = response.data.user.phone || '';
        this.token = response.data.token || '';
        this.id = response.data.user.id || null;

        if (this.token) {
          apiService.setToken(this.token);
          setCookie('token', this.token, 7);
        }

        return {
          status: 200,
          data: response.data,
          message: 'Login successful',
        };
      }

      throw new Error('Invalid response format');
    },

    async logout() {
      try {
        await apiService.get('/user/logout');
      } finally {
        this.resetState();
        apiService.removeToken();
        removeCookie('token');
      }
    },

    async getUserInfo(token: string): Promise<void> {
      const response = await apiService.get<Stores.user>('/user/info', {
        params: { token },
      });

      if (response?.data) {
        const { data } = response;
        this.name = data.name;
        this.email = data.email;
        this.phone = data.phone;
        this.avatar = data.avatar;
        this.status = data.status;
        this.id = data.id;
        this.token = token;
        setCookie('token', this.token);
      }
    },

    resetState() {
      this.name = '';
      this.token = '';
      this.id = null;
      this.email = '';
      this.phone = '';
      this.avatar = null;
      this.status = 'active';
    },

    setUserId(id: number | null) {
      this.id = id;
    },
  },
});
