import { create } from 'zustand';

export interface FamilyMember {
  uid: string;
  displayName: string;
  role: 'parent' | 'child';
}

export interface Family {
  familyId: string;
  ownerUid: string;
  memberUids: string[];
  members: FamilyMember[];
  inviteCode: string;
  inviteExpiresAt: number;
}

interface FamilyState {
  family: Family | null;
  loading: boolean;
  setFamily: (family: Family | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useFamilyStore = create<FamilyState>((set) => ({
  family: null,
  loading: false,
  setFamily: (family) => set({ family }),
  setLoading: (loading) => set({ loading }),
}));
