import { router } from './router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { appTitle } from './appConfig'
import { getCookie, removeCookie } from './utils'
import { userStore } from './stores/user'
import { ElMessage } from 'element-plus'

NProgress.configure({ showSpinner: false })

const whitelist: string[] = ['/login', '/404']
let scrollTimeout: NodeJS.Timeout | null = null
let contentWindowDom: HTMLElement | null = null

router.beforeEach(async (to, from, next) => {
  NProgress.start()
  console.log(`=== PERMISSION CHECK ===`);
  console.log(`From: ${from.path} -> To: ${to.path}`);
  
  //Définir le titre de la page
  document.title = `${to.meta.title}-${appTitle}`
  
  // Le chemin est dans la liste blanche, autoriser le passage
  if (whitelist.includes(to.path)) {
    console.log(`Route ${to.path} is whitelisted, allowing access`);
    next()
  } else {
    // Check if there is a token
    const token = getCookie('token')
    const user = userStore()
    
    console.log(`Token from cookie: ${token ? 'EXISTS' : 'NOT FOUND'}`);
    console.log(`User store token: ${user.token ? 'EXISTS' : 'NOT FOUND'}`);

    if (!token) {
      console.log(`No token found, redirecting to login`);
      next('/login')
    } else if (!user.token) {
      console.log(`Token exists but user store not initialized, getting user info...`);
      try {
        await user.getUserInfo(token)
        console.log(`User info loaded successfully, proceeding to ${to.path}`);
        next()
      } catch (_) {
        console.log(`Failed to get user info, token probably expired`);
        ElMessage.error('Token expiré, veuillez vous reconnecter.')
        removeCookie('token') // Effacer les cookies.
        next('/login')
      }
    } else {
      console.log(`User authenticated, proceeding to ${to.path}`);
      next()
    }
  }
  console.log(`=== END PERMISSION CHECK ===`);
})

router.afterEach((to, from) => {
  NProgress.done()
  scrollTimeout && clearTimeout(scrollTimeout)
  if (from.path === '/') return
  scrollTimeout = setTimeout(() => {
    if (contentWindowDom) {
      contentWindowDom.scrollTo({ top: 0, left: 0 })
      return
    }
    contentWindowDom = document.querySelector('#content-window')
    if (contentWindowDom) {
      contentWindowDom.scrollTo({ top: 0, left: 0 })
    }
  }, 350)
})
