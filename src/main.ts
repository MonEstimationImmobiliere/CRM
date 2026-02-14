import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import { createPinia } from 'pinia';
import { isMockEnabled } from './appConfig';
import enableMock from '../mock';
import '@/styles/index.css';
import './permission';
import 'element-plus/theme-chalk/el-message.css';
import 'element-plus/theme-chalk/el-message-box.css';
import 'element-plus/theme-chalk/el-table-v2.css';

if (isMockEnabled) {
  enableMock();
}

createApp(App).use(createPinia()).use(router).mount('#app');
