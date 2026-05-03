const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Users
export const getUserDoc = async (uid: string) => {
  const response = await fetch('/api/users/profile', {
    headers: getAuthHeader(),
  });
  const data = await response.json();
  return { exists: () => response.ok, data: () => data };
};

export const setUserDoc = async (uid: string, data: any) => {
  // In MERN, we usually use the profile update or registration
};

export const updateUserDoc = async (uid: string, data: any) => {
  const response = await fetch('/api/users/profile', {
    method: 'PUT',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const findPatientByCode = async (code: string) => {
  const response = await fetch(`/api/users/find-patient/${code}`, {
    headers: getAuthHeader(),
  });
  if (!response.ok) return null;
  return response.json();
};

// Faces
export const listenToFaces = (targetId: string, callback: (faces: any[]) => void) => {
  const fetchFaces = async () => {
    const response = await fetch(`/api/faces?ownerId=${targetId}`, {
      headers: getAuthHeader(),
    });
    if (response.ok) callback(await response.json());
  };
  fetchFaces();
  const interval = setInterval(fetchFaces, 10000);
  return () => clearInterval(interval);
};

export const addFaceDoc = async (data: any) => {
  const response = await fetch('/api/faces', {
    method: 'POST',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const updateFaceDoc = async (id: string, data: any) => {
  const response = await fetch(`/api/faces/${id}`, {
    method: 'PUT',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const deleteFaceDoc = async (id: string) => {
  const response = await fetch(`/api/faces/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  return response.json();
};

// Memories
export const listenToMemories = (targetId: string, callback: (memories: any[]) => void) => {
  const fetchMemories = async () => {
    const response = await fetch(`/api/memories?ownerId=${targetId}`, {
      headers: getAuthHeader(),
    });
    if (response.ok) callback(await response.json());
  };
  fetchMemories();
  const interval = setInterval(fetchMemories, 10000);
  return () => clearInterval(interval);
};

export const addMemoryDoc = async (data: any) => {
  const response = await fetch('/api/memories', {
    method: 'POST',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const updateMemoryDoc = async (id: string, data: any) => {
  const response = await fetch(`/api/memories/${id}`, {
    method: 'PUT',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const deleteMemoryDoc = async (id: string) => {
  const response = await fetch(`/api/memories/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  return response.json();
};

// Reminders
export const listenToReminders = (targetId: string, callback: (reminders: any[]) => void) => {
  const fetchReminders = async () => {
    const response = await fetch(`/api/reminders?ownerId=${targetId}`, {
      headers: getAuthHeader(),
    });
    if (response.ok) callback(await response.json());
  };
  fetchReminders();
  const interval = setInterval(fetchReminders, 10000);
  return () => clearInterval(interval);
};

export const addReminderDoc = async (data: any) => {
  const response = await fetch('/api/reminders', {
    method: 'POST',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const updateReminderDoc = async (id: string, data: any) => {
  const response = await fetch(`/api/reminders/${id}`, {
    method: 'PUT',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const deleteReminderDoc = async (id: string) => {
  const response = await fetch(`/api/reminders/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  return response.json();
};

// Alerts
export const listenToAlerts = (targetId: string, callback: (alerts: any[]) => void) => {
  const fetchAlerts = async () => {
    const response = await fetch(`/api/alerts?ownerId=${targetId}`, {
      headers: getAuthHeader(),
    });
    if (response.ok) callback(await response.json());
  };
  fetchAlerts();
  const interval = setInterval(fetchAlerts, 10000);
  return () => clearInterval(interval);
};

export const addAlertDoc = async (data: any) => {
  const response = await fetch('/api/alerts', {
    method: 'POST',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const updateAlertDoc = async (id: string, data: any) => {
  const response = await fetch(`/api/alerts/${id}`, {
    method: 'PUT',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

// GPS
export const updateLocationDoc = async (uid: string, location: any) => {
  const response = await fetch('/api/gps', {
    method: 'POST',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(location),
  });
  return response.json();
};

export const listenToLocation = (uid: string, callback: (data: any) => void) => {
  const fetchLocation = async () => {
    const response = await fetch(`/api/gps/${uid}`, {
      headers: getAuthHeader(),
    });
    if (response.ok) callback(await response.json());
  };
  fetchLocation();
  const interval = setInterval(fetchLocation, 10000);
  return () => clearInterval(interval);
};

export const listenToSafeZones = (targetId: string, callback: (zones: any[]) => void) => {
  const fetchZones = async () => {
    const response = await fetch(`/api/safe-zones?ownerId=${targetId}`, {
      headers: getAuthHeader(),
    });
    if (response.ok) callback(await response.json());
  };
  fetchZones();
  const interval = setInterval(fetchZones, 10000);
  return () => clearInterval(interval);
};

export const addSafeZoneDoc = async (data: any) => {
  const response = await fetch('/api/safe-zones', {
    method: 'POST',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const updateSafeZoneDoc = async (id: string, data: any) => {
  const response = await fetch(`/api/safe-zones/${id}`, {
    method: 'PUT',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const deleteSafeZoneDoc = async (id: string) => {
  const response = await fetch(`/api/safe-zones/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  return response.json();
};
