import { isWeekday } from '../../utils/dateUtils';

export type HomeCtaType = 'record' | 'review';

export function getHomeCtaType(): HomeCtaType {
  return isWeekday() ? 'record' : 'review';
}
