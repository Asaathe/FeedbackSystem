const API_BASE = import.meta.env.VITE_API_URL || '';

export const apiFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
  return fetch(fullUrl, options);
};

export const API_BASE_URL = API_BASE;

export default API_BASE;