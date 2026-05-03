import { create } from 'zustand';
import { SafeZone } from '../types';
import { useAuthStore } from './authStore';
import { 
  updateLocationDoc, 
  listenToLocation, 
  listenToSafeZones, 
  addSafeZoneDoc, 
  updateSafeZoneDoc, 
  deleteSafeZoneDoc 
} from '../src/api/apiClient';

interface GpsState {
  patientLocation: {
    location: { lat: number, lng: number };
    timestamp: string;
  };
  safeZones: SafeZone[];
  updatePatientLocation: (location: { lat: number, lng: number }) => Promise<void>;
  addSafeZone: (zoneData: Omit<SafeZone, 'id'>) => Promise<void>;
  updateSafeZone: (zoneData: SafeZone) => Promise<void>;
  deleteSafeZone: (id: string) => Promise<void>;
  init: () => () => void;
}

export const useGpsStore = create<GpsState>((set, get) => ({
    patientLocation: {
        location: { lat: 34.0522, lng: -118.2437 },
        timestamp: new Date().toISOString(),
    },
    safeZones: [],
    updatePatientLocation: async (location) => {
        const user = useAuthStore.getState().user;
        if (!user || user.role !== 'patient') return;
        set({ patientLocation: { location, timestamp: new Date().toISOString() } });
        await updateLocationDoc(user.id, location);
    },
    addSafeZone: async (zoneData) => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        const targetId = user.role === 'patient' ? user.id : user.patientId!;
        await addSafeZoneDoc({ ...zoneData, ownerId: targetId });
    },
    updateSafeZone: async (zoneData) => {
        const { id, ...data } = zoneData;
        await updateSafeZoneDoc(id, data);
    },
    deleteSafeZone: async (id) => {
        await deleteSafeZoneDoc(id);
    },
    init: () => {
        const user = useAuthStore.getState().user;
        if (!user) return () => {};
        const targetId = user.role === 'patient' ? user.id : user.patientId!;

        const szUnsubscribe = listenToSafeZones(targetId, (safeZones) => set({ safeZones }));
        const locUnsubscribe = listenToLocation(targetId, (data) => {
            if (data && data.location) {
                set({ patientLocation: data });
            }
        });

        return () => {
            szUnsubscribe();
            locUnsubscribe();
        };
    }
}));

export const isOutsideZone = (location: {lat: number, lng: number}, zone: SafeZone) => {
    const toRad = (x: number) => x * Math.PI / 180;
    const R = 6371e3;
    const dLat = toRad(zone.lat - location.lat);
    const dLng = toRad(zone.lng - location.lng);
    const lat1 = toRad(location.lat);
    const lat2 = toRad(zone.lat);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
    const dist = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    return dist > zone.radius;
};