import { auth } from '../../firebase';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Always get fresh token from Firebase directly
const getToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken(false);
    localStorage.setItem('token', token);
    return token;
  }
  return localStorage.getItem('token') || '';
};

export const apiFetch = async (path: string, options: RequestInit = {}): Promise<any> => {
  const token = await getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let message = res.statusText || `Request failed: ${res.status}`;
    try { message = JSON.parse(text).message || message; } catch {}
    throw new Error(message);
  }

  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
};
