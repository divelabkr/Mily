import { create } from 'zustand';
import { Achievement, UserAchievement, AchievementStats } from './achievementTypes';

interface AchievementState {
  userAchievements: UserAchievement[];      // 내가 해금한 업적 목록
  statsMap: Record<string, AchievementStats>; // achievementId → 통계
  pendingUnlock: Achievement | null;        // 해금 팝업 대기 업적
  nearestCardShownWeek: string | null;      // "거의 다 왔어요" 카드 마지막 표시 주차
  loading: boolean;

  setUserAchievements: (list: UserAchievement[]) => void;
  addUnlocked: (ua: UserAchievement) => void;
  updateShared: (achievementId: string, shared: boolean) => void;
  setStats: (stats: AchievementStats[]) => void;
  setPendingUnlock: (achievement: Achievement | null) => void;
  setNearestCardShownWeek: (weekId: string) => void;
  setLoading: (v: boolean) => void;
  isUnlocked: (achievementId: string) => boolean;
}

export const useAchievementStore = create<AchievementState>((set, get) => ({
  userAchievements: [],
  statsMap: {},
  pendingUnlock: null,
  nearestCardShownWeek: null,
  loading: false,

  setUserAchievements: (list) => set({ userAchievements: list }),

  addUnlocked: (ua) =>
    set((state) => ({
      userAchievements: [...state.userAchievements, ua],
    })),

  updateShared: (achievementId, shared) =>
    set((state) => ({
      userAchievements: state.userAchievements.map((ua) =>
        ua.achievementId === achievementId ? { ...ua, shared } : ua
      ),
    })),

  setStats: (stats) => {
    const statsMap: Record<string, AchievementStats> = {};
    stats.forEach((s) => { statsMap[s.achievementId] = s; });
    set({ statsMap });
  },

  setPendingUnlock: (achievement) => set({ pendingUnlock: achievement }),

  setNearestCardShownWeek: (weekId) => set({ nearestCardShownWeek: weekId }),

  setLoading: (v) => set({ loading: v }),

  isUnlocked: (achievementId) =>
    get().userAchievements.some((ua) => ua.achievementId === achievementId),
}));
