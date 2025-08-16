import process from 'node:process'
import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  future: {
    compatibilityVersion: 4,
  },
  modules: [
    '@nuxt/eslint',
    'nuxt-auth-utils',
    'nuxt-file-storage',
    '@vueuse/nuxt',
    '@nuxt/fonts',
  ],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  runtimeConfig: {
    databaseUrl: '',
    masterPassword: process.env.WEDDING_MASTER_PASSWORD || '',
  },
  fileStorage: {
    mount: process.env.WEDDING_STORAGE_MOUNT || '',
  },
})
