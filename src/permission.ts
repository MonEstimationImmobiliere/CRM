import { router } from './router';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { appTitle } from './appConfig';
import { getCookie, removeCookie } from './utils';
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

  // Le chemin est dans la liste blanche, autoriser le passage
  if (whitelist.includes(to.path)) {
    next();
  } else {
    // Check if there is a token
    const token = getCookie('token');
    const user = userStore();

    if (!token) {
      next('/login');
    } else if (!user.token) {
      try {
        await user.getUserInfo(token);
        next();
      } catch (_) {
        ElMessage.error('Token expiré, veuillez vous reconnecter.');
        removeCookie('token');
        next('/login');
      }
    } else {
      next();
    }
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
