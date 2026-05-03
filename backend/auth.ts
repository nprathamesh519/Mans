const API_BASE_URL = '/api/auth';

export const loginUser = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }
  const data = await response.json();
  localStorage.setItem('token', data.token);
  return { user: data.user };
};

export const logoutUser = async () => {
  localStorage.removeItem('token');
};

export const registerUser = async (email: string, password: string, extraData: any = {}) => {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, ...extraData }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }
  const data = await response.json();
  localStorage.setItem('token', data.token);
  return { user: data.user };
};

export const observeAuthState = async (callback: (user: any | null) => void) => {
  const token = localStorage.getItem('token');
  if (!token) {
    callback(null);
    return;
  }

  try {
    const response = await fetch('/api/users/profile', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (response.ok) {
      const user = await response.json();
      callback(user);
    } else {
      localStorage.removeItem('token');
      callback(null);
    }
  } catch (err) {
    callback(null);
  }
};
