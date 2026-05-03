import { apiFetch } from './apiFetch';

export const getFacesApi    = ()                       => apiFetch('/faces');
export const addFaceApi     = (data: any)              => apiFetch('/faces', { method: 'POST', body: JSON.stringify(data) });
export const updateFaceApi  = (id: string, data: any)  => apiFetch(`/faces/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteFaceApi  = (id: string)             => apiFetch(`/faces/${id}`, { method: 'DELETE' });
