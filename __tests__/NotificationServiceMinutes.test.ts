// Ensure we don't import native firebase modules during tests
jest.mock('../src/services/CheckInService', () => ({
  __esModule: true,
  default: {
    toggleCheckInToday: jest.fn().mockResolvedValue({ success: true }),
  },
}));

jest.mock('../src/store/habitStore', () => ({
  __esModule: true,
  useHabitStore: {
    getState: () => ({ getHabitById: jest.fn().mockReturnValue({}) }),
  },
}));

jest.mock('@notifee/react-native', () => {
  const createTriggerNotification = jest.fn().mockResolvedValue('created-notif-id');
  const createChannel = jest.fn().mockResolvedValue('channel-id');
  const requestPermission = jest.fn().mockResolvedValue(null);
  return {
    __esModule: true,
    default: {
      createTriggerNotification,
      createChannel,
      requestPermission,
    },
    createTriggerNotification,
    createChannel,
    requestPermission,
    AndroidImportance: { HIGH: 4 },
    TriggerType: { TIMESTAMP: 'timestamp' },
    RepeatFrequency: { DAILY: 'daily', WEEKLY: 'weekly' },
  };
});

import NotificationService from '../src/services/NotificationService';

describe('Notification scheduling minutesBefore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('schedules for next day when minutesBefore makes time in past', async () => {
    // build reminder time 3 minutes in the future
    const future = new Date(Date.now() + 3 * 60 * 1000);
    const hh = String(future.getHours()).padStart(2, '0');
    const mm = String(future.getMinutes()).padStart(2, '0');
    const timeStr = `${hh}:${mm}`;

    const id = 'habit-test-1';
    // default minutesBefore is 5 -> effective scheduled time will be 2 minutes in the past -> scheduled next day
    await NotificationService.scheduleHabitReminder({ id, name: 'T', reminderTime: timeStr });

    const { createTriggerNotification } = require('@notifee/react-native');
    expect(createTriggerNotification).toHaveBeenCalled();
    const [[, triggerDefault]] = createTriggerNotification.mock.calls;
    // default should schedule for roughly >= 23h ahead (next day)
    expect(triggerDefault.timestamp).toBeGreaterThan(Date.now() + 23 * 60 * 60 * 1000);
  });

  it('schedules for the same day when minutesBefore is zero', async () => {
    const future = new Date(Date.now() + 3 * 60 * 1000);
    const hh = String(future.getHours()).padStart(2, '0');
    const mm = String(future.getMinutes()).padStart(2, '0');
    const timeStr = `${hh}:${mm}`;

    const id = 'habit-test-2';
    await NotificationService.scheduleHabitReminder({ id, name: 'T', reminderTime: timeStr }, { minutesBefore: 0 });

    const { createTriggerNotification } = require('@notifee/react-native');
    expect(createTriggerNotification).toHaveBeenCalled();
    const [[, triggerZero]] = createTriggerNotification.mock.calls;
    // scheduled time should be within 10 minutes from now
    expect(triggerZero.timestamp).toBeLessThan(Date.now() + 10 * 60 * 1000);
  });
});
