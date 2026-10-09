import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'https://exam-slot-loopverse3-0-9vautgpt3-ammar-ahmads-projects-67f802df/api';
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

api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();
  if (!['get', 'head', 'options'].includes(method)) {
    const token = getCookie('examslot_csrf');
    if (token) config.headers['x-csrf-token'] = token;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const payload = error.response?.data;
    const normalized = new Error(payload?.error?.message || error.message || 'Request failed');
    normalized.status = error.response?.status;
    normalized.code = payload?.error?.code;
    normalized.details = payload?.error?.details;
    return Promise.reject(normalized);
  }
);

export default api;
