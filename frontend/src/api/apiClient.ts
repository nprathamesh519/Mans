import { apiFetch } from './apiFetch';

// Alerts
export const listenToAlerts = (targetId: string, callback: (alerts: any[]) => void) => {
  const fetch_ = async () => {
    try { callback(await apiFetch(`/alerts?ownerId=${targetId}`)); } catch {}
  };
  fetch_();
  const id = setInterval(fetch_, 10000);
  return () => clearInterval(id);
};
export const addAlertDoc    = (data: any)              => apiFetch('/alerts', { method: 'POST', body: JSON.stringify(data) });
export const updateAlertDoc = (id: string, data: any)  => apiFetch(`/alerts/${id}`, { method: 'PUT', body: JSON.stringify(data) });

// GPS
export const updateLocationDoc  = (_uid: string, location: any) => apiFetch('/gps', { method: 'POST', body: JSON.stringify(location) });
export const listenToLocation   = (uid: string, callback: (data: any) => void) => {
  const fetch_ = async () => {
    try { callback(await apiFetch(`/gps/${uid}`)); } catch {}
  };
  fetch_();
  const id = setInterval(fetch_, 10000);
  return () => clearInterval(id);
};

// Safe Zones
export const listenToSafeZones  = (targetId: string, callback: (zones: any[]) => void) => {
  const fetch_ = async () => {
    try { callback(await apiFetch(`/safe-zones?ownerId=${targetId}`)); } catch {}
  };
  fetch_();
  const id = setInterval(fetch_, 10000);
  return () => clearInterval(id);
};
export const addSafeZoneDoc     = (data: any)              => apiFetch('/safe-zones', { method: 'POST', body: JSON.stringify(data) });
export const updateSafeZoneDoc  = (id: string, data: any)  => apiFetch(`/safe-zones/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSafeZoneDoc  = (id: string)             => apiFetch(`/safe-zones/${id}`, { method: 'DELETE' });

// User
export const updateUserDoc      = (_uid: string, data: any) => apiFetch('/users/profile', { method: 'PUT', body: JSON.stringify(data) });
export const findPatientByCode  = (code: string)            => apiFetch(`/users/find-patient/${code}`).catch(() => null);
