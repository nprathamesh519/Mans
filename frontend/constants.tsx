import React from 'react';
import { UserRole } from './types';
import { HomeIcon, FaceSmileIcon, PhotoIcon, BellIcon, MapPinIcon, BellAlertIcon, Cog6ToothIcon } from './components/icons/Icons';

export const PATIENT_NAV_LINKS = [
  { href: '/dashboard', label: 'Home', icon: <HomeIcon /> },
  { href: '/faces', label: 'Faces', icon: <FaceSmileIcon /> },
  { href: '/memories', label: 'Memories', icon: <PhotoIcon /> },
  { href: '/reminders', label: 'Reminders', icon: <BellIcon /> },
];

export const CARETAKER_NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: <HomeIcon /> },
  { href: '/faces', label: 'Manage Faces', icon: <FaceSmileIcon /> },
  { href: '/memories', label: 'Manage Memories', icon: <PhotoIcon /> },
  { href: '/reminders', label: 'Manage Reminders', icon: <BellIcon /> },
  { href: '/gps', label: 'GPS Tracking', icon: <MapPinIcon /> },
  { href: '/alerts', label: 'Alerts', icon: <BellAlertIcon /> },
  { href: '/settings', label: 'Settings', icon: <Cog6ToothIcon /> },
];

export const getNavLinks = (role: UserRole) => {
  return role === UserRole.PATIENT ? PATIENT_NAV_LINKS : CARETAKER_NAV_LINKS;
};