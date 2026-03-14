import { create } from 'zustand';
import { DEFAULT_FLAGS } from './featureFlags';

interface ConfigState {
  flags: Record<string, boolean | string>;
  initialized: boolean;
  setFlag: (key: string, value: boolean | string) => void;
  setFlags: (flags: Record<string, boolean | string>) => void;
  setInitialized: (v: boolean) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  flags: { ...DEFAULT_FLAGS },
  initialized: false,
  setFlag: (key, value) =>
    set((s) => ({ flags: { ...s.flags, [key]: value } })),
  setFlags: (flags) => set({ flags }),
  setInitialized: (initialized) => set({ initialized }),
}));
