import { create } from 'zustand';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  patientId?: string | null;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
}

// Auto-refresh token whenever Firebase renews it
onAuthStateChanged(auth, async (firebaseUser) => {
  if (firebaseUser) {
    const token = await firebaseUser.getIdToken(false);
    localStorage.setItem('token', token);
    // Refresh every 50 minutes (token expires in 60)
    setInterval(async () => {
      const fresh = await firebaseUser.getIdToken(true);
      localStorage.setItem('token', fresh);
    }, 50 * 60 * 1000);
  }
});

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  isLoading: false,

  refreshToken: async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;
    const token = await firebaseUser.getIdToken(true);
    localStorage.setItem('token', token);
    return token;
  },

  login: async (email, password) => {
    try {
      set({ isLoading: true });
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCred.user.getIdToken();
      localStorage.setItem('token', token);

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch user profile');

      const user: User = {
        id: data.id,
        name: data.name || 'Unknown',
        email: data.email || '',
        role: data.role || '',
        patientId: data.patientId || null
      };
      set({ isAuthenticated: true, user, isLoading: false });
      return user;
    } catch (err: any) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    await signOut(auth);
    localStorage.removeItem('token');
    set({ user: null, isAuthenticated: false });
  }
}));