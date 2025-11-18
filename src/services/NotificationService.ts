import notifee, { AndroidImportance, TimestampTrigger, TriggerType, RepeatFrequency } from '@notifee/react-native';
import { Platform } from 'react-native';

const CHANNEL_ID = 'habit-reminders';

const ensureChannel = async () => {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Habit Reminders',
      importance: AndroidImportance.HIGH,
    });
  }
};

const getZoneOffsetMs = (date: Date, timeZone: string) => {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value;
  }
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );
  return date.getTime() - asUtc;
};

/**
 * Compute next timestamp (ms) for a given HH:mm in a specific IANA timezone.
 * Defaults to device timezone when timeZone is undefined.
 */
const parseTimeToNextTimestamp = (timeStr: string, minutesBefore = 5, timeZone?: string) => {
  const [hh, mm] = (timeStr || '08:00').split(':').map(Number);
  const now = new Date();
  const zone = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Get target date components in that timezone for "today"
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = dtf.formatToParts(now);
  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value;
  }

  const year = Number(map.year);
  const month = Number(map.month);
  const day = Number(map.day);

  // Build UTC epoch for the target timezone local time by using Date.UTC and adjusting by the zone offset
  const offsetMs = getZoneOffsetMs(now, zone);
  const asUtcForTarget = Date.UTC(year, month - 1, day, hh, mm, 0);
  let targetEpoch = asUtcForTarget + offsetMs;

  // subtract minutesBefore
  targetEpoch -= minutesBefore * 60 * 1000;

  if (targetEpoch <= now.getTime()) {
    // schedule for next day (add 24h)
    targetEpoch += 24 * 60 * 60 * 1000;
  }

  return targetEpoch;
};

const requestPermission = async () => {
  try {
    await ensureChannel();
    const settings = await notifee.requestPermission();
    return settings;
  } catch (e) {
    console.warn('NotificationService: requestPermission failed', e);
    return null;
  }
};

/**
 * Schedule a daily reminder for a habit.
 * newHabit must contain: id (string), name (string), reminderTime ("HH:mm"), hasReminder (boolean)
 */
const scheduleHabitReminder = async (newHabit: any) => {
  try {
    if (!newHabit || !newHabit.id || !newHabit.reminderTime) return null;
    await ensureChannel();

    // Allow caller to specify a timezone (IANA) like 'Asia/Ho_Chi_Minh'.
    const timestamp = parseTimeToNextTimestamp(newHabit.reminderTime, 5, newHabit.timeZone);

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp,
      repeatFrequency: RepeatFrequency.DAILY,
    };

    const notification = {
      id: String(newHabit.id),
      title: newHabit.name || 'Nhắc thói quen',
      body: `Đã đến lúc thực hiện: ${newHabit.name}`,
      android: {
        channelId: CHANNEL_ID,
        smallIcon: 'ic_launcher',
        // If you want exact alarm behavior on Android, manifest permission added already
        pressAction: { id: 'default' },
      },
    } as any;

    // Create trigger notification (returns an id)
    const notifId = await notifee.createTriggerNotification(notification, trigger);
    console.log('NotificationService: scheduled', newHabit.id, '->', notifId);
    return notifId;
  } catch (e) {
    console.warn('NotificationService: schedule failed', e);
    throw e;
  }
};

const cancelReminder = async (habitId: string) => {
  try {
    if (!habitId) return;
    // Try cancel trigger notification and regular notification by id
    try {
      await notifee.cancelTriggerNotification(String(habitId));
    } catch (e) {
      console.debug('NotificationService: cancelTriggerNotification ignored error', e);
    }
    try {
      await notifee.cancelNotification(String(habitId));
    } catch (e) {
      console.debug('NotificationService: cancelNotification ignored error', e);
    }
    console.log('NotificationService: cancelled', habitId);
  } catch (e) {
    console.warn('NotificationService: cancel failed', e);
    throw e;
  }
};

export default {
  requestPermission,
  scheduleHabitReminder,
  cancelReminder,
};
