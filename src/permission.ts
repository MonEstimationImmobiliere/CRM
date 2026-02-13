import { router } from './router';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { appTitle } from './appConfig';
import apiService from './api/apiRequests';
import { userStore } from './stores/user';
import { ElMessage } from 'element-plus';

NProgress.configure({ showSpinner: false });

const whitelist: string[] = ['/login', '/404'];
let scrollTimeout: NodeJS.Timeout | null = null;
let contentWindowDom: HTMLElement | null = null;

router.beforeEach(async (to, from, next) => {
  NProgress.start();

  // Définir le titre de la page
  document.title = `${to.meta.title}-${appTitle}`;

  const token = apiService.getToken();
  const user = userStore();

  // Pages accessibles sans authentification
  if (whitelist.includes(to.path)) {
    // Si l'utilisateur est déjà connecté et va sur /login → rediriger vers /
    if (to.path === '/login' && (token || user.token)) {
      next('/');
    } else {
      next();
    }
    return;
  }

  // Pages protégées — vérification du token
  if (!token) {
    next('/login');
  } else if (!user.token) {
    // Token dans le cookie mais pas encore en mémoire → récupérer les infos user
    try {
      await user.getUserInfo(token);
      next();
    } catch (_) {
      ElMessage.error('Token expiré, veuillez vous reconnecter.');
      apiService.removeToken();
      next('/login');
    }
  } else {
    next();
  }
});

router.afterEach((to, from) => {
  NProgress.done();
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
  if (from.path === '/') return;
  scrollTimeout = setTimeout(() => {
    if (contentWindowDom) {
      contentWindowDom.scrollTo({ top: 0, left: 0 });
      return;
    }
    contentWindowDom = document.querySelector('#content-window');
    if (contentWindowDom) {
      contentWindowDom.scrollTo({ top: 0, left: 0 });
    }
  }, 350);
});
