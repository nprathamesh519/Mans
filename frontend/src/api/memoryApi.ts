import { apiFetch } from './apiFetch';

export const getMemoriesApi    = ()                        => apiFetch('/memories');
export const addMemoryApi      = (data: any)               => apiFetch('/memories', { method: 'POST', body: JSON.stringify(data) });
export const updateMemoryApi   = (id: string, data: any)   => apiFetch(`/memories/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteMemoryApi   = (id: string)              => apiFetch(`/memories/${id}`, { method: 'DELETE' });
