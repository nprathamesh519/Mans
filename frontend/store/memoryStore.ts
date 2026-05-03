import { create } from 'zustand';
import { Memory } from '../types';
import { addMemoryApi, getMemoriesApi, deleteMemoryApi, updateMemoryApi } from '../src/api/memoryApi';

interface MemoryState {
  memories: Memory[];
  fetchMemories: () => Promise<void>;
  addMemory: (data: any) => Promise<void>;
  updateMemory: (id: string, data: any) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
}

export const useMemoryStore = create<MemoryState>((set) => ({
  memories: [],

  fetchMemories: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const data = await getMemoriesApi();
      if (Array.isArray(data)) set({ memories: data });
      else set({ memories: [] });
    } catch (err) {
      console.error('fetchMemories error:', err);
      set({ memories: [] });
    }
  },

  addMemory: async (data: any) => {
    try {
      const newMemory = await addMemoryApi(data);
      set((state) => ({ memories: [newMemory, ...state.memories] }));
    } catch (err) {
      console.error('Add memory error:', err);
    }
  },

  deleteMemory: async (id) => {
    try {
      await deleteMemoryApi(id);
      set((state) => ({ memories: state.memories.filter(m => m.id !== id) }));
    } catch (err) {
      console.error('Delete memory error:', err);
    }
  },

  updateMemory: async (id, data) => {
    try {
      const updated = await updateMemoryApi(id, data);
      set((state) => ({
        memories: state.memories.map(m => m.id === id ? { ...m, ...updated } : m)
      }));
    } catch (err: any) {
      console.error('Update memory error:', err.message);
      throw err; // re-throw so the page can show the error
    }
  }
}));