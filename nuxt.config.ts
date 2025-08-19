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
    session: {
      maxAge: 60 * 60 * 24 * 7 * 4 * 3, // 3 months
      password: '',
    },
    applicationDomain: process.env.WEDDING_APPLICATION_DOMAIN || 'http://localhost:3000',
  },
  fileStorage: {
    mount: process.env.WEDDING_STORAGE_MOUNT || '',
  },
})
