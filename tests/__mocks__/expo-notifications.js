module.exports = {
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('id'),
  cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
  setNotificationHandler: jest.fn(),
  getDevicePushTokenAsync: jest.fn().mockResolvedValue({ type: 'fcm', data: 'mock-fcm-token-test123' }),
  SchedulableTriggerInputTypes: { WEEKLY: 'WEEKLY' },
};
