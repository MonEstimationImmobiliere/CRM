import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiService from '@/api/apiRequests';

export type UserRole = 'agent' | 'agency_manager' | 'admin';

interface LoginResponse {
  user: {
    name: string;
    email: string;
    phone: string;
    avatar: string | null;
    status: string;
    id: number | null;
    role?: string;
  };
  token: string;
}

interface UserInfo {
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  status: 'active' | 'inactive';
  id: number | null;
  role?: string;
}

export const useUserStore = defineStore('user', () => {
  // State
  const name = ref('');
  const token = ref('');
  const id = ref<number | null>(null);
  const email = ref('');
  const phone = ref('');
  const avatar = ref<string | null>(null);
  const status = ref<'active' | 'inactive'>('active');
  const role = ref<UserRole>('agent');

  // Actions
  async function login(userEmail: string, password: string) {
    const response = await apiService.post<LoginResponse>('/login', {
      email: userEmail,
      password,
    });

    if (response?.data) {
      name.value = response.data.user.name || '';
      email.value = response.data.user.email || '';
      phone.value = response.data.user.phone || '';
      token.value = response.data.token || '';
      id.value = response.data.user.id || null;
      role.value = (response.data.user.role as UserRole) || 'agent';

      if (token.value) {
        apiService.setToken(token.value);
      }

      return {
        status: 200,
        data: response.data,
        message: 'Login successful',
      };
    }

    throw new Error('Invalid response format');
  }

  async function logout() {
    try {
      await apiService.get('/logout');
    } finally {
      resetState();
      apiService.removeToken();
    }
  }

  async function getUserInfo(userToken: string): Promise<void> {
    const response = await apiService.get<UserInfo>('/user/info', {
      params: { token: userToken },
    });

    if (response?.data) {
      const { data } = response;
      name.value = data.name;
      email.value = data.email;
      phone.value = data.phone;
      avatar.value = data.avatar;
      status.value = data.status;
      id.value = data.id;
      role.value = (data.role as UserRole) || 'agent';
      token.value = userToken;
      apiService.setToken(userToken);
    }
  }

  function resetState() {
    name.value = '';
    token.value = '';
    id.value = null;
    email.value = '';
    phone.value = '';
    avatar.value = null;
    status.value = 'active';
    role.value = 'agent';
  }

  function setUserId(newId: number | null) {
    id.value = newId;
  }

  return {
    // State
    name,
    token,
    id,
    email,
    phone,
    avatar,
    status,
    role,
    // Actions
    login,
    logout,
    getUserInfo,
    resetState,
    setUserId,
  };
});

// Alias rétro-compatible — à supprimer dans un futur sprint
export const userStore = useUserStore;
