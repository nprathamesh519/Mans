import { create } from 'zustand';
import { FaceProfile } from '../types';
import { addFaceApi, getFacesApi, updateFaceApi, deleteFaceApi } from '../src/api/facesApi';

interface FaceState {
  faces: FaceProfile[];
  fetchFaces: () => Promise<void>;
  addFace: (face: Omit<FaceProfile, 'id'>) => Promise<void>;
  updateFace: (id: string, data: Partial<FaceProfile>) => Promise<void>;
  deleteFace: (id: string) => Promise<void>;
}

export const useFaceStore = create<FaceState>((set) => ({
  faces: [],

  fetchFaces: async () => {
    try {
      const data = await getFacesApi();
      if (Array.isArray(data)) set({ faces: data });
      else set({ faces: [] });
    } catch {
      set({ faces: [] });
    }
  },

  addFace: async (faceData) => {
    const newFace = await addFaceApi(faceData);
    set((state) => ({ faces: [...state.faces, newFace] }));
  },

  updateFace: async (id, data) => {
    const updated = await updateFaceApi(id, data);
    set((state) => ({
      faces: state.faces.map(f => f.id === id ? { ...f, ...updated } : f)
    }));
  },

  deleteFace: async (id) => {
    await deleteFaceApi(id);
    set((state) => ({ faces: state.faces.filter(f => f.id !== id) }));
  }
}));
