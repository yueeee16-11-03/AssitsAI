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

// Compute next timestamp (ms) for given HH:mm on a specific weekday (0=Sunday..6=Saturday) in a timeZone
const parseTimeToNextTimestampForWeekday = (timeStr: string, weekday: number, minutesBefore = 5, timeZone?: string) => {
  const [hh, mm] = (timeStr || '08:00').split(':').map(Number);
  const now = new Date();
  const zone = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Get current date components in that timezone
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
  const currentWeekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  // compute days to add to reach target weekday
  let delta = (weekday - currentWeekday + 7) % 7;

  // Build a base UTC epoch for the target timezone local time at the base day
  const offsetMs = getZoneOffsetMs(now, zone);
  const baseAsUtc = Date.UTC(year, month - 1, day, hh, mm, 0);
  let targetEpoch = baseAsUtc + offsetMs + delta * 24 * 60 * 60 * 1000;

  // subtract minutesBefore
  targetEpoch -= minutesBefore * 60 * 1000;

  // If the computed time is in the past (same weekday but earlier), and delta === 0, schedule next week's occurrence
  if (targetEpoch <= now.getTime()) {
    targetEpoch += 7 * 24 * 60 * 60 * 1000;
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
const scheduleHabitReminder = async (newHabit: any, opts: { minutesBefore?: number } = {}) => {
  try {
    if (!newHabit || !newHabit.id || !newHabit.reminderTime) return null;
    await ensureChannel();

    const zone = newHabit.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Build a notification base with a green accent and a friendly cat reminder emoji.
    // If callers provide newHabit.catImageUrl we attach it as a large image (Android) for a richer experience.
    const notificationBase: any = {
      title: newHabit.name || 'Nhắc thói quen',
      // add a playful smirking-cat emoji by default (cười đểu), apps can supply a custom image via `catImageUrl`
      body: `😼 Đã đến lúc thực hiện: ${newHabit.name}`,
      android: {
        channelId: CHANNEL_ID,
        smallIcon: 'ic_launcher',
        pressAction: { id: 'default' },
        // accent color shown on supported Android versions
        color: '#10B981',
        // set LED color where devices support it (some OEMs respect this)
        ledColor: '#10B981',
        // Add quick actions so users can mark as done or snooze.
        actions: [
          { title: 'Đã xong', pressAction: { id: 'done' }, // icon optional (app-res)
            // Note: some Android devices won't tint action background, but color is provided
            // for consistent theming where supported.
            showUserInterface: true
          },
          { title: 'Nhắc lại', pressAction: { id: 'snooze' }, showUserInterface: true }
        ],
      },
    };

    // If the caller provides a `catImageUrl` (remote or bundled URI), include it as a large image
    // so supported Android devices will display it in an expanded view. Animated GIFs may play
    // depending on device/OS; test on real devices.
    // if a caller passes `catAnimationUrl` prefer that (animated GIF), else fallback to catImageUrl
    const gif = newHabit.catAnimationUrl || newHabit.catImageUrl;
    if (gif) {
      notificationBase.android = notificationBase.android || {};
      notificationBase.android.largeIcon = String(gif);
      // Use BIGPICTURE style when a picture is available
      notificationBase.android.style = {
        type: 'BIGPICTURE',
        picture: String(gif),
      };
    }

    // If no image provided, optionally attach a friendly default cat GIF (small) to give animation.
    // You can remove or replace this default URL with a local asset if preferred.
    if (!newHabit.catImageUrl && !newHabit.catAnimationUrl && newHabit.useDefaultCat !== false) {
      const defaultCatGif = 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif';
      notificationBase.android = notificationBase.android || {};
      notificationBase.android.largeIcon = String(defaultCatGif);
      notificationBase.android.style = { type: 'BIGPICTURE', picture: String(defaultCatGif) };
    }

    // If caller provided daysOfWeek as an array (0=Sunday..6=Saturday) and it's a subset,
    // schedule weekly triggers for each selected weekday. If daysOfWeek is not provided
    // or includes all 7 days, fall back to a single daily trigger.
    const daysOfWeek: number[] | undefined = Array.isArray(newHabit.daysOfWeek) ? newHabit.daysOfWeek : undefined;

    const minutesBefore = typeof opts.minutesBefore === 'number' ? opts.minutesBefore : 5;

    // Helper to create one trigger
    const createWeeklyTrigger = async (weekday?: number) => {
      let timestamp: number;
      let notifId: string | null = null;

      if (typeof weekday === 'number') {
        timestamp = parseTimeToNextTimestampForWeekday(newHabit.reminderTime, weekday, minutesBefore, zone);
      } else {
        timestamp = parseTimeToNextTimestamp(newHabit.reminderTime, minutesBefore, zone);
      }

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp,
        repeatFrequency: typeof weekday === 'number' ? RepeatFrequency.WEEKLY : RepeatFrequency.DAILY,
      };

      const notification = {
        id: typeof weekday === 'number' ? String(`${newHabit.id}-${weekday}`) : String(newHabit.id),
        ...notificationBase,
      };

      notifId = await notifee.createTriggerNotification(notification, trigger);
      console.log('NotificationService: scheduled', notification.id, '->', notifId);
      return notifId;
    };

    // If daysOfWeek specified and is a proper subset, schedule per-weekday
    if (daysOfWeek && daysOfWeek.length > 0 && daysOfWeek.length < 7) {
      const results: any[] = [];
      for (const d of daysOfWeek) {
        try {
          const id = await createWeeklyTrigger(d);
          results.push(id);
        } catch (e) {
          console.warn('NotificationService: failed to schedule for weekday', d, e);
        }
      }
      return results;
    }

    // Default: schedule daily
    const dailyId = await createWeeklyTrigger();
    return dailyId;
  } catch (e) {
    console.warn('NotificationService: schedule failed', e);
    throw e;
  }
};

const cancelReminder = async (idOrIds: string | string[]) => {
  try {
    if (!idOrIds) return;

    const ids = Array.isArray(idOrIds) ? idOrIds : [String(idOrIds)];

    for (const id of ids) {
      try {
        await notifee.cancelTriggerNotification(String(id));
      } catch (err) {
        void err;
      }
      try {
        await notifee.cancelNotification(String(id));
      } catch (err) {
        void err;
      }
      // Also try base/weekday pattern if id looks like base habit id
      // e.g. attempt `${id}-0`..`${id}-6`
      for (let i = 0; i < 7; i++) {
        try {
          await notifee.cancelTriggerNotification(String(`${id}-${i}`));
          await notifee.cancelNotification(String(`${id}-${i}`));
        } catch (err) {
          void err;
        }
      }
    }

    console.log('NotificationService: cancelled', ids);
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
