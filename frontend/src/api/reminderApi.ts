import { apiFetch } from './apiFetch';

export const getRemindersApi   = ()                        => apiFetch('/reminders');
export const addReminderApi    = (data: any)               => apiFetch('/reminders', { method: 'POST', body: JSON.stringify(data) });
export const updateReminderApi = (id: string, data: any)   => apiFetch(`/reminders/${id}`, { method: 'PUT', body: JSON.stringify(data) });
