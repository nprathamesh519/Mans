import { create } from 'zustand';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

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

onAuthStateChanged(auth, async (firebaseUser) => {
  if (firebaseUser) {
    const token = await firebaseUser.getIdToken(false);
    localStorage.setItem('token', token);
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

  // ✅ login function is properly placed here
  login: async (email, password) => {
    try {
      set({ isLoading: true });

      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCred.user.getIdToken();
      localStorage.setItem('token', token);

      // ✅ Read from Firestore directly — no Express fetch
      const docSnap = await getDoc(doc(db, "users", userCred.user.uid));
      if (!docSnap.exists()) throw new Error("User profile not found");
      const data = docSnap.data();

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