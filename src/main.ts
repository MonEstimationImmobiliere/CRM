import { createApp } from 'vue'
import App from './App.vue'
import { router }from './router'
import { createPinia } from 'pinia'
import { mock, mockEnv } from './appConfig'
import enableMock from '../mock'
import '@/styles/index.postcss' 
import './permission'
import 'element-plus/theme-chalk/el-message.css' 
import 'element-plus/theme-chalk/el-message-box.css' 
import { EnvType } from 'types/app'
import 'element-plus/theme-chalk/el-table-v2.css'

mockEnv.includes(import.meta.env.MODE as EnvType) && mock === 'on' && enableMock()

createApp(App).use(createPinia()).use(router).mount('#app')
