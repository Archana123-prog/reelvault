import axios from 'axios';

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl || envUrl.trim() === '' || envUrl.trim() === '/api') {
    return '/api';
  }
  const clean = envUrl.trim().replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 60000 // 60 seconds for Render free tier cold starts
});

// Cold-start notification timer
let activeRequests = 0;
let coldStartTimer = null;

const startColdStartDetector = () => {
  activeRequests++;
  if (activeRequests === 1 && !coldStartTimer) {
    coldStartTimer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('reelvault:server-waking', { detail: true }));
    }, 2800);
  }
};

const stopColdStartDetector = () => {
  activeRequests = Math.max(0, activeRequests - 1);
  if (activeRequests === 0) {
    if (coldStartTimer) {
      clearTimeout(coldStartTimer);
      coldStartTimer = null;
    }
    window.dispatchEvent(new CustomEvent('reelvault:server-waking', { detail: false }));
  }
};

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    startColdStartDetector();
    const token = localStorage.getItem('reelvault_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    stopColdStartDetector();
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 and cold-start cleanup
api.interceptors.response.use(
  (response) => {
    stopColdStartDetector();
    return response;
  },
  (error) => {
    stopColdStartDetector();

    // Auto logout on 401 Unauthorized — but ONLY if not already on an auth page.
    // On auth pages (login/register) we let the error bubble up so the form can
    // display the real server message (e.g. "Invalid email or password") instead
    // of losing it to a redirect.
    if (error.response && error.response.status === 401) {
      const isAuthPage =
        window.location.pathname.startsWith('/login') ||
        window.location.pathname.startsWith('/register');

      if (!isAuthPage) {
        localStorage.removeItem('reelvault_token');
        localStorage.removeItem('reelvault_user');
        window.location.href = '/login?expired=1';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
