<script setup lang="ts">
import { reactive, ref } from 'vue';
import { appTitle } from '@/appConfig';
import { userStore } from '@/stores/user';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock, View, Hide } from '@element-plus/icons-vue';
import type { ComponentPublicInstance } from 'vue';
import type { FormInstance } from 'element-plus';
import axios from 'axios';
import API_URL from '@/utils/API_URL';

interface LoginForm {
  username: string;
  password: string;
  remember: boolean;
  showPassword: boolean;
}

const refForm = ref<ComponentPublicInstance<FormInstance> | null>(null);
const form = reactive<LoginForm>({
  username: 'bite@exemple.com',
  password: 'bite',
  showPassword: false,
  remember: true,
});
const loading = reactive({
  login: false,
});
const router = useRouter();
const user = userStore();
const loginError = ref('');

// Regex pour valider les emails
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validation de l'email
function validateEmail(email: string): boolean {
  return emailRegex.test(email);
}

// Validation du mot de passe
function validatePassword(password: string): boolean {
  return password.length >= 3;
}

function login() {
  if (!refForm.value) return;
  refForm.value.validate(async (valid, fields) => {
    if (!valid) return false;
    loading.login = true;
    loginError.value = '';

    console.log('=== LOGIN DEBUG START ===');
    console.log('1. Starting login process...');

    // Validation supplémentaire
    if (!validateEmail(form.username)) {
      ElMessage.error('Veuillez entrer un email valide.');
      loading.login = false;
      return;
    }

    if (!validatePassword(form.password)) {
      ElMessage.error('Le mot de passe doit contenir au moins 3 caractères.');
      loading.login = false;
      return;
    }

    try {
      interface LoginResponse {
        status: number;
        data: any;
      }

      console.log('2. Calling user.login...');
      const response = (await user.login(
        form.username,
        form.password
      )) as LoginResponse;
      console.log('3. Login response received:', response);

      // Check user store state after login
      console.log('4. User store state after login:', {
        token: user.token,
        name: user.name,
        email: user.email,
        id: user.id,
      });

      // Check cookie
      const tokenCookie = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='));
      console.log('5. Token cookie:', tokenCookie);

      if (response.status === 200) {
        ElMessage.success('Connexion réussie');
        loading.login = false;

        console.log('6. Login successful, preparing redirect...');
        console.log('7. Current route:', router.currentRoute.value.path);

        // Attendre un peu pour que le store soit mis à jour
        setTimeout(async () => {
          console.log('8. Starting redirect process...');
          console.log('9. User token before redirect:', user.token);

          try {
            console.log("10. Attempting router.push('/')...");
            await router.push('/');
            console.log('11. Router.push completed successfully');
            console.log('12. New route:', router.currentRoute.value.path);
          } catch (err) {
            console.warn('13. Router push failed, using window.location', err);
            window.location.href = window.location.origin + '/';
          }
        }, 200);
      }
    } catch (error) {
      console.error('LOGIN ERROR:', error);
      loginError.value = 'Email ou mot de passe incorrect.';
      ElMessage.error(loginError.value);
      loading.login = false;
    }

    console.log('=== LOGIN DEBUG END ===');
  });
}
</script>

<template>
  <main class="main">
    <section class="login-wrapper">
      <h2 class="title">Mon estimation immobilière.fr</h2>
      <h3 class="subtitle">Connexion</h3>
      <el-form
        ref="refForm"
        label-width="0"
        :model="form"
        class="login-form shadow"
        size="large"
      >
        <el-form-item
          prop="username"
          :rules="[{ required: true, message: 'username!' }]"
        >
          <el-input v-model="form.username">
            <template #prefix>
              <el-icon size="1.1rem">
                <User />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item
          prop="password"
          :rules="[{ required: true, message: 'password!' }]"
        >
          <el-input
            v-model="form.password"
            :type="form.showPassword ? 'text' : 'password'"
          >
            <template #prefix>
              <el-icon size="1.1rem">
                <Lock />
              </el-icon>
            </template>
            <template #suffix>
              <el-icon
                size="1.1rem"
                @click="form.showPassword = !form.showPassword"
              >
                <component :is="form.showPassword ? View : Hide" />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="remember" style="margin-bottom: 0.5rem">
          <el-checkbox v-model="form.remember" label="se souvenir" />
        </el-form-item>
        <ElButton
          type="primary"
          style="width: 100%"
          size="large"
          :loading="loading.login"
          @click="login"
          >ok
        </ElButton>
        <div v-if="loginError" class="error-message">{{ loginError }}</div>
      </el-form>
    </section>
  </main>
</template>
<style scoped lang="postcss">
.main {
  background-image: linear-gradient(-170deg, #44cee9, #2b74c1);
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;

  & .login-wrapper {
    margin-top: -10rem;

    & .title {
      color: var(--white);
      text-align: center;
      margin-bottom: 1rem;
    }

    & .login-form {
      background-color: var(--white);
      padding: 2rem 1.5rem;
      width: 25rem;
      border-radius: 0.5rem;

      & .wrapper-remember {
        margin-bottom: 1rem;
      }
    }
  }
}

.error-message {
  color: var(--el-color-danger);
  margin-top: 0.5rem;
  font-size: 0.875rem;
  text-align: center;
}

.subtitle {
  color: var(--white);
  text-align: center;
  margin-bottom: 1rem;
  font-size: 1.6rem;
}
</style>
