import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  gpsEnabled: boolean;
  setGpsEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      gpsEnabled: false,
      setGpsEnabled: (gpsEnabled) => set({ gpsEnabled }),
    }),
    {
      name: 'sales-counter-settings',
      version: 1,
    },
  ),
);
