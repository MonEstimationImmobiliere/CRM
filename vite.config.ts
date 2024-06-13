import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import ElementPlus from "unplugin-element-plus/vite";
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import vueJsx from '@vitejs/plugin-vue-jsx'
import path from 'path'
import postcssNesting from 'postcss-nesting'
import autoprefixer from 'autoprefixer'
import flexbugsFixes from 'postcss-flexbugs-fixes'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'

function resolvePath(src: string) {
  return path.resolve(__dirname, src)
}

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
 
  plugins: [
    vue(),
    ElementPlus({
      useSource: true
    }),
    vueJsx(),
    createSvgIconsPlugin({
      iconDirs: [resolvePath('src/svgs')],
      symbolId: 'svg-[dir]-[name]',
    }),
    Components({
      resolvers: [
        ElementPlusResolver()
      ]
    }),
  ],
  define: {
    __VUE_I18N_FULL_INSTALL__: true,
    __VUE_I18N_LEGACY_API__: false,
    __INTLIFY_PROD_DEVTOOLS__: false
  },
  css: {
    preprocessorOptions: {
      scss: {
        // eslint-disable-next-line quotes
        additionalData: `@use "./src/style/style.scss" as *;`
        // additionalData: `@use "./src/styles/element/index.scss" as *;`,
      }
    },
    postcss: {
      plugins: [
        postcssNesting,
        autoprefixer({
          overrideBrowserslist: [
            'Android 4.1',
            'iOS 7.1',
            'Chrome > 31',
            'ff > 31',
            'ie >= 8',
            '> 1%',
          ],
          grid: true,
        }),
        flexbugsFixes
      ]
    }
  },
  resolve: {
    alias: {
      '@': '/src',
      '@reusableComponents': path.resolve(__dirname, 'src/components')
    }
  },
  server: {
    open: false,
    port: 8888
  }
})
