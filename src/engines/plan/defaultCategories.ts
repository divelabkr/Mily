export type SpendType = 'fixed' | 'living' | 'choice';

export const DEFAULT_CATEGORIES = [
  { id: 'food',      label: '식음료', emoji: '🍚', defaultSpendType: 'living' as SpendType },
  { id: 'transport', label: '이동',   emoji: '🚌', defaultSpendType: 'living' as SpendType },
  { id: 'hobby',     label: '취미',   emoji: '🎮', defaultSpendType: 'choice' as SpendType },
  { id: 'social',    label: '모임',   emoji: '👫', defaultSpendType: 'choice' as SpendType },
  { id: 'savings',   label: '남기기', emoji: '💰', defaultSpendType: 'fixed'  as SpendType },
  { id: 'etc',       label: '기타',   emoji: '📦', defaultSpendType: 'choice' as SpendType },
] as const;

export type CategoryId = (typeof DEFAULT_CATEGORIES)[number]['id'];
