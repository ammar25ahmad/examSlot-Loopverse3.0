import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'https://exam-slot-loopverse3-0.vercel.app/api';
export { baseURL };

export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 20000,
});

function getCookie(name) {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1];
}

// The CSRF cookie is set on the backend domain, so it is not readable via
// document.cookie when the frontend is served from another origin. The server
// also returns the token in response bodies — cache it and fall back to the
// cookie (same-site dev) when no body token has been received yet.
let csrfToken = null;

export function resetCsrfToken() {
  csrfToken = null;
}

api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();
  if (!['get', 'head', 'options'].includes(method)) {
    const token = csrfToken || getCookie('examslot_csrf');
    if (token) config.headers['x-csrf-token'] = token;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const token = response.data?.data?.csrfToken;
    if (token) csrfToken = token;
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) csrfToken = null;
    const payload = error.response?.data;
    const normalized = new Error(payload?.error?.message || error.message || 'Request failed');
    normalized.status = error.response?.status;
    normalized.code = payload?.error?.code;
    normalized.details = payload?.error?.details;
    return Promise.reject(normalized);
  }
);

export default api;
