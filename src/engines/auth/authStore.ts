import { create } from 'zustand';

export type UserRole = 'individual' | 'parent' | 'child';

interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  familyId?: string;
  onboardingComplete: boolean;
  pilotId?: string | null;
  ageBand?: string;
  // Custom Claim — Firebase Admin으로만 부여. 클라이언트 수정 불가.
  isMaster: boolean;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setRole: (role: UserRole) => void;
  completeOnboarding: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setRole: (role) =>
    set((state) => ({
      user: state.user ? { ...state.user, role } : null,
    })),
  completeOnboarding: () =>
    set((state) => ({
      user: state.user ? { ...state.user, onboardingComplete: true } : null,
    })),
}));
