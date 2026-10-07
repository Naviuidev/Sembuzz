import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1600,
  },
  server: {
    // Proxy only API path prefixes to backend; frontend routes (dashboard, privacy, events page, etc.) stay with Vite
    proxy: {
      '/subcategory-admin/auth': { target: 'http://localhost:3000', changeOrigin: true },
      '/subcategory-admin/external-config': { target: 'http://localhost:3000', changeOrigin: true },
      '/external-admin/category-subcategory-links': { target: 'http://localhost:3000', changeOrigin: true },
      '/subcategory-admin/events': { target: 'http://localhost:3000', changeOrigin: true },
      '/subcategory-admin/blogs': { target: 'http://localhost:3000', changeOrigin: true },
      '/subcategory-admin/queries': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // Don't proxy GET for exact path so SPA route /subcategory-admin/queries loads; only proxy API subpaths (e.g. /subcategory-admin/queries/from-school-admins)
        bypass: (req) =>
          req.method === 'GET' && /^\/subcategory-admin\/queries\/?(\?|$)/.test(req.url || '') ? '/index.html' : undefined,
      },
      '/category-admin/auth': { target: 'http://localhost:3000', changeOrigin: true },
      '/category-admin/events': { target: 'http://localhost:3000', changeOrigin: true },
      '/category-admin/blogs': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        bypass: (req) =>
          req.method === 'GET' && /^\/category-admin\/blogs\/?(\?|$)/.test(req.url || '')
            ? '/index.html'
            : undefined,
      },
      '/category-admin/queries': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // Don't proxy GET for exact path so SPA route /category-admin/queries loads; only proxy API subpaths (e.g. /category-admin/queries/from-subcategory-admins)
        bypass: (req) =>
          req.method === 'GET' && /^\/category-admin\/queries\/?(\?|$)/.test(req.url || '') ? '/index.html' : undefined,
      },
      '/category-admin/subcategory-admins': { target: 'http://localhost:3000', changeOrigin: true },
      '/category-admin/banner-ads': { target: 'http://localhost:3000', changeOrigin: true },
      '/category-admin/sponsored-ads': { target: 'http://localhost:3000', changeOrigin: true },
      '/category-admin/categories': { target: 'http://localhost:3000', changeOrigin: true },
      '/school-admin/auth': { target: 'http://localhost:3000', changeOrigin: true },
      '/school-admin/queries': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // Don't proxy GET for exact path so SPA route /school-admin/queries loads; only proxy API subpaths (e.g. /school-admin/queries/from-category-admins)
        bypass: (req) =>
          req.method === 'GET' && /^\/school-admin\/queries\/?(\?|$)/.test(req.url || '') ? '/index.html' : undefined,
      },
      '/school-admin/posts': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // SPA route /school-admin/posts — only proxy API (POST/PATCH/DELETE and GET with subpaths)
        bypass: (req) =>
          req.method === 'GET' && /^\/school-admin\/posts\/?(\?|$)/.test(req.url || '') ? '/index.html' : undefined,
      },
      '/school-admin/upcoming-posts': { target: 'http://localhost:3000', changeOrigin: true },
      '/school-admin/social-accounts': { target: 'http://localhost:3000', changeOrigin: true },
      '/school-admin/pending-users': { target: 'http://localhost:3000', changeOrigin: true },
      '/school-admin/students': { target: 'http://localhost:3000', changeOrigin: true },
      '/school-admin/category-admins': { target: 'http://localhost:3000', changeOrigin: true },
      '/school-admin/subcategory-admins': { target: 'http://localhost:3000', changeOrigin: true },
      '/super-admin/auth': { target: 'http://localhost:3000', changeOrigin: true },
      '/super-admin/features': { target: 'http://localhost:3000', changeOrigin: true },
      '/super-admin/support': { target: 'http://localhost:3000', changeOrigin: true },
      '/super-admin/external': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        bypass: (req) =>
          req.method === 'GET' && /^\/super-admin\/external\/?(\?|$)/.test(req.url || '')
            ? '/index.html'
            : undefined,
      },
      // Don't proxy /super-admin/schools — API calls use full backend URL (see api.ts baseURL); proxying would send /schools/new to backend and return 401
      '/user/auth': { target: 'http://localhost:3000', changeOrigin: true },
      '/user/events': { target: 'http://localhost:3000', changeOrigin: true },
      '/user/event-comment': { target: 'http://localhost:3000', changeOrigin: true },
      '/events/categories': { target: 'http://localhost:3000', changeOrigin: true },
      '/events/external-categories': { target: 'http://localhost:3000', changeOrigin: true },
      '/external-admin/auth': { target: 'http://localhost:3000', changeOrigin: true },
      '/external-admin/pipeline': { target: 'http://localhost:3000', changeOrigin: true },
      '/external-admin': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        bypass: (req) =>
          req.method === 'GET' &&
          /^\/external-admin\/(dashboard|profile|privacy|posts|login|set-password)\/?(\?|$)/.test(req.url || '')
            ? '/index.html'
            : undefined,
      },
      '/school-admin/external-pipeline': { target: 'http://localhost:3000', changeOrigin: true },
      '/school-admin/external-post-requests': { target: 'http://localhost:3000', changeOrigin: true },
      '/external-admin/post-requests': { target: 'http://localhost:3000', changeOrigin: true },
      '/events/approved': { target: 'http://localhost:3000', changeOrigin: true },
      '/events/school-filter-settings': { target: 'http://localhost:3000', changeOrigin: true },
      '/events/blogs': { target: 'http://localhost:3000', changeOrigin: true },
      '/events/published-blogs': { target: 'http://localhost:3000', changeOrigin: true },
      '^/events/blog/': { target: 'http://localhost:3000', changeOrigin: true },
      '/public/blogs': { target: 'http://localhost:3000', changeOrigin: true },
      '^/public/blog/': { target: 'http://localhost:3000', changeOrigin: true },
      '/events/banner-ads': { target: 'http://localhost:3000', changeOrigin: true },
      '/events/sponsored-ads': { target: 'http://localhost:3000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:3000', changeOrigin: true },
      '/google': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
})
