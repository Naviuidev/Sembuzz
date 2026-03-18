import axios from 'axios';
import { getApiBaseUrl } from './apiBase';

const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token storage keys for different admin types and public user
const TOKEN_KEYS = {
  SUPER_ADMIN: 'token', // Super Admin token
  SCHOOL_ADMIN: 'school-admin-token', // School Admin token
  CATEGORY_ADMIN: 'category-admin-token', // Category Admin token
  SUBCATEGORY_ADMIN: 'subcategory-admin-token', // Subcategory Admin token
  ADS_ADMIN: 'ads-admin-token', // Ads Admin token
  USER: 'user-token', // Public user (student/parent) token
} as const;

// Build full URL for route detection (handles relative paths with or without leading slash)
function getRequestPath(config: { url?: string; baseURL?: string }): string {
  const path = (config.url || '').trim();
  const base = (config.baseURL || '').trim().replace(/\/$/, '');
  if (path.startsWith('http')) return path;
  const joined = path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
  return joined;
}

// Get pathname from full URL (e.g. "/category-admin/subcategory-admins") so we match by path segment, not substring.
// This avoids /category-admin/subcategory-admins being mistaken for subcategory-admin because of "subcategory" in the path.
function getPathname(url: string): string {
  try {
    return new URL(url, 'http://dummy').pathname;
  } catch {
    return url.replace(/^https?:\/\/[^/]+/, '') || '/';
  }
}

// Add token to requests - use REQUEST URL only (not current page) so each admin stays logged in
// when viewing another admin's dashboard. Otherwise e.g. on /super-admin page, /school-admin/auth/me
// would get super-admin token and 401 would clear super-admin token.
api.interceptors.request.use((config) => {
  const url = getRequestPath(config);
  const pathname = getPathname(url);

  // Match by path segment so /category-admin/subcategory-admins uses category-admin token, not subcategory-admin
  const isUserRoute = pathname.startsWith('/user/');
  const isSuperAdminRoute = pathname === '/super-admin' || pathname.startsWith('/super-admin/');
  const isSchoolAdminRoute = pathname === '/school-admin' || pathname.startsWith('/school-admin/');
  const isSubCategoryAdminRoute = pathname === '/subcategory-admin' || pathname.startsWith('/subcategory-admin/');
  const isCategoryAdminRoute = pathname === '/category-admin' || pathname.startsWith('/category-admin/');
  const isAdsAdminRoute = pathname === '/ads-admin' || pathname.startsWith('/ads-admin/');

  let token: string | null = null;
  if (isUserRoute) {
    token = localStorage.getItem(TOKEN_KEYS.USER);
  } else if (isSuperAdminRoute) {
    token = localStorage.getItem(TOKEN_KEYS.SUPER_ADMIN);
  } else if (isSchoolAdminRoute) {
    token = localStorage.getItem(TOKEN_KEYS.SCHOOL_ADMIN);
  } else if (isSubCategoryAdminRoute) {
    token = localStorage.getItem(TOKEN_KEYS.SUBCATEGORY_ADMIN);
  } else if (isCategoryAdminRoute) {
    token = localStorage.getItem(TOKEN_KEYS.CATEGORY_ADMIN);
  } else if (isAdsAdminRoute) {
    token = localStorage.getItem(TOKEN_KEYS.ADS_ADMIN);
  } else {
    token = localStorage.getItem(TOKEN_KEYS.USER);
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Let the browser set Content-Type with boundary for FormData (file uploads)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

// Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
    });
    return response;
  },
  (error) => {
    const url = error.config ? getRequestPath(error.config) : '';
    const status = error.response?.status;

    if (status !== 401) {
      return Promise.reject(error);
    }

    // Skip redirect/removal for auth endpoints that handle their own errors
    const isLoginEndpoint = url.includes('/login');
    const isMeEndpoint = url.includes('/me');
    const isAuthEndpoint = url.includes('/auth/');
    const isPasswordResetEndpoint = url.includes('/forgot-password') || url.includes('/reset-password');
    if (isLoginEndpoint || isMeEndpoint || isAuthEndpoint || isPasswordResetEndpoint) {
      return Promise.reject(error);
    }

    const currentPath = window.location.pathname;
    const pathname = getPathname(url);
    // Same path-segment logic as request interceptor
    const isSuperAdminRoute = pathname === '/super-admin' || pathname.startsWith('/super-admin/');
    const isSchoolAdminRoute = pathname === '/school-admin' || pathname.startsWith('/school-admin/');
    const isSubCategoryAdminRoute = pathname === '/subcategory-admin' || pathname.startsWith('/subcategory-admin/');
    const isCategoryAdminRoute = pathname === '/category-admin' || pathname.startsWith('/category-admin/');
    const isAdsAdminRoute = pathname === '/ads-admin' || pathname.startsWith('/ads-admin/');

    // Only clear token and redirect when the user is currently on that admin's section.
    // This avoids logging out when switching dashboards (e.g. Category Admin → back to Subcategory Admin).
    const onSuperAdmin = currentPath.startsWith('/super-admin') && !currentPath.includes('/super-admin/login');
    const onSchoolAdmin = currentPath.startsWith('/school-admin') && currentPath !== '/school-admin/login';
    const onSubCategoryAdmin = currentPath.startsWith('/subcategory-admin') && currentPath !== '/subcategory-admin/login';
    const onCategoryAdmin = currentPath.startsWith('/category-admin') && currentPath !== '/category-admin/login';
    const onAdsAdmin = currentPath.startsWith('/ads-admin') && currentPath !== '/ads-admin/login';

    if (isSuperAdminRoute && onSuperAdmin) {
      localStorage.removeItem(TOKEN_KEYS.SUPER_ADMIN);
      setTimeout(() => { window.location.href = '/super-admin'; }, 100);
    } else if (isSchoolAdminRoute && onSchoolAdmin) {
      localStorage.removeItem(TOKEN_KEYS.SCHOOL_ADMIN);
      setTimeout(() => { window.location.href = '/school-admin/login'; }, 100);
    } else if (isSubCategoryAdminRoute && onSubCategoryAdmin) {
      localStorage.removeItem(TOKEN_KEYS.SUBCATEGORY_ADMIN);
      setTimeout(() => { window.location.href = '/subcategory-admin/login'; }, 100);
    } else if (isCategoryAdminRoute && onCategoryAdmin) {
      // Grace period: don't clear token within 3s of category-admin login (avoids race right after login)
      const loginAt = localStorage.getItem('category-admin-login-at');
      const withinGrace = loginAt && Date.now() - Number(loginAt) < 3000;
      if (!withinGrace) {
        localStorage.removeItem(TOKEN_KEYS.CATEGORY_ADMIN);
        localStorage.removeItem('category-admin-login-at');
        setTimeout(() => { window.location.href = '/category-admin/login'; }, 100);
      }
    } else if (isAdsAdminRoute && onAdsAdmin) {
      localStorage.removeItem(TOKEN_KEYS.ADS_ADMIN);
      setTimeout(() => { window.location.href = '/ads-admin/login'; }, 100);
    } else if (pathname.startsWith('/user/') && !currentPath.startsWith('/login') && !currentPath.startsWith('/register')) {
      // On public pages (e.g. /events), allow 401 for /user/ routes so guests can still view content; only redirect when on a user-specific page
      const onPublicEventsPage = currentPath === '/events' || currentPath.startsWith('/events?');
      if (!onPublicEventsPage) {
        localStorage.removeItem(TOKEN_KEYS.USER);
        setTimeout(() => { window.location.href = '/events?openAuth=login'; }, 100);
      }
    }

    return Promise.reject(error);
  }
);
