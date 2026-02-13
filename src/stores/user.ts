import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiService from '@/api/apiRequests';

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

interface UserInfo {
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  status: 'active' | 'inactive';
  id: number | null;
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
      await apiService.get('/user/logout');
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
