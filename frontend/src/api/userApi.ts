import { apiFetch } from './apiFetch';

export const findPatient  = (code: string)                => apiFetch(`/users/find-patient/${code}`);
export const linkPatient  = (patientId: string)           => apiFetch('/users/profile', { method: 'PUT', body: JSON.stringify({ patientId }) });
export const getUserById  = (id: string)                  => apiFetch(`/users/${id}`);
