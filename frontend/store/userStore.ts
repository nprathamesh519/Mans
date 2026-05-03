import { create } from 'zustand';
import { User } from '../types';
import { updateUserDoc, findPatientByCode } from '../src/api/apiClient';

interface UserState {
  addUser: (uid: string, userData: Omit<User, 'id'>) => Promise<User>;
  updateUser: (updatedUser: User) => Promise<void>;
  findUserByPatientCode: (code: string) => Promise<User | null>;
}

export const useUserStore = create<UserState>(() => ({
  addUser: async (uid, userData) => {
    // In MERN, registration handles user creation
    return { id: uid, ...userData } as User;
  },
  updateUser: async (updatedUser) => {
    await updateUserDoc(updatedUser.id, updatedUser);
  },
  findUserByPatientCode: async (code: string) => {
    const user = await findPatientByCode(code.toUpperCase());
    return user as User | null;
  },
}));
