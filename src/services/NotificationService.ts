import notifee, { AndroidImportance, TimestampTrigger, TriggerType, RepeatFrequency, AndroidStyle } from '@notifee/react-native';
import CheckInService from './CheckInService';
import NotificationApi from '../api/notificationApi';
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

const displayNotification = async (opts: { id?: string; title: string; body?: string; type?: string; icon?: string; actionRoute?: string }) => {
  try {
    await ensureChannel();
    const notification = {
      id: opts.id || String(Date.now()),
      title: opts.title,
      body: opts.body || undefined,
      android: {
        channelId: CHANNEL_ID,
        smallIcon: 'ic_launcher',
        color: '#4CAF50',
        pressAction: { id: 'default' },
      },
    } as any;

    await notifee.displayNotification(notification);
    console.log('NotificationService: displayed immediate notification', notification.id);
    // Persist notification to Firestore via API
      try {
        // Persist notification with provided id when available so it can be deduplicated
        await NotificationApi.createNotification({
          id: opts.id || undefined,
          title: opts.title,
          message: opts.body || '',
          type: opts.type || 'reminder',
          icon: opts.icon || null,
          actionRoute: opts.actionRoute || null,
        });
        console.log('NotificationService: persisted notification via NotificationApi');
      } catch (err) {
        console.warn('NotificationService: failed to persist notification', err);
      }
  } catch (err) {
    console.warn('NotificationService: displayNotification failed', err);
  }
};

/**
 * Schedule a daily reminder for a habit.
 * newHabit must contain: id (string), name (string), reminderTime ("HH:mm"), hasReminder (boolean)
 */
const scheduleHabitReminder = async (newHabit: any) => {
  try {
    if (!newHabit || !newHabit.id) return null;
    // Default habit reminder to 07:00 if reminderTime not provided
    if (!newHabit.reminderTime) newHabit.reminderTime = '07:00';
    await ensureChannel();

    const zone = newHabit.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    const notificationBase = {
      title: newHabit.name || 'Nhắc thói quen',
      body: `Đã đến lúc thực hiện: ${newHabit.name}`,
      android: {
        channelId: CHANNEL_ID,
        smallIcon: 'ic_launcher',
        color: '#4CAF50',
        pressAction: { id: 'default' },
        style: {
          type: AndroidStyle.BIGPICTURE,
          picture: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
        },
        actions: [
          {
            title: 'Đã xong',
            pressAction: { id: 'done' },
          },
          {
            title: 'Nhắc lại',
            pressAction: { id: 'snooze' },
          },
        ],
      },
    } as any;

    // If caller provided daysOfWeek as an array (0=Sunday..6=Saturday) and it's a subset,
    // schedule weekly triggers for each selected weekday. If daysOfWeek is not provided
    // or includes all 7 days, fall back to a single daily trigger.
    const daysOfWeek: number[] | undefined = Array.isArray(newHabit.daysOfWeek) ? newHabit.daysOfWeek : undefined;
    console.log('NotificationService: scheduling for habit', newHabit.id, 'with daysOfWeek:', daysOfWeek);

    // Helper to create one trigger
    const createWeeklyTrigger = async (weekday?: number) => {
      let timestamp: number;
      let notifId: string | null = null;

      if (typeof weekday === 'number') {
        timestamp = parseTimeToNextTimestampForWeekday(newHabit.reminderTime, weekday, 5, zone);
      } else {
        timestamp = parseTimeToNextTimestamp(newHabit.reminderTime, 5, zone);
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
        // Persist habit reminder schedule to Firestore
        try {
          await NotificationApi.createNotification({
            id: notification.id,
            title: notification.title,
            message: notification.body || '',
            type: 'reminder',
            icon: 'timer',
            actionRoute: 'HabitDashboard',
            read: false,
          });
          console.log('NotificationService: persisted habit reminder', notification.id);
        } catch (err) {
          console.warn('NotificationService: failed persisting habit reminder', err);
        }
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

/**
 * Schedule a daily expense logging reminder at 20:00 local time.
 * ID is `expense-log-reminder` and repeats daily.
 */
const scheduleDailyExpenseReminder = async (opts?: { hour?: number; minute?: number }) => {
  try {
    await ensureChannel();
    const hour = typeof opts?.hour === 'number' ? opts.hour : 20;
    const minute = typeof opts?.minute === 'number' ? opts.minute : 0;

    // Cancel any existing reminder IDs for this purpose to avoid duplicates
    try {
      await cancelReminder('expense-log-reminder');
    } catch (err) {
      console.warn('NotificationService: failed cancel existing expense reminder', err);
    }

    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    // If user already checked in today, schedule for next day instead of today
    const todayCheckIns = await (async () => {
      try {
        const map = await CheckInService.getTodayAllCheckIns();
        return map;
      } catch (err) {
        console.warn('NotificationService: failed to read today check-ins', err);
        return {};
      }
    })();

    let timestamp = parseTimeToNextTimestamp(timeStr, 0);
    const anyCompleted = Object.values(todayCheckIns || {}).some((v: any) => v && v.completed);
    if (anyCompleted) {
      // schedule for next day
      timestamp += 24 * 60 * 60 * 1000;
    }

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp,
      repeatFrequency: RepeatFrequency.DAILY,
    };

    const notification = {
      id: 'expense-log-reminder',
      title: 'Nhắc ghi chép chi tiêu',
      body: 'Đừng quên ghi chép chi tiêu trong ngày — ghi lại vài món vừa chi nhé!',
      android: {
        channelId: CHANNEL_ID,
        smallIcon: 'ic_launcher',
        color: '#4CAF50',
        pressAction: { id: 'default' },
      },
    } as any;

    const resultId = await notifee.createTriggerNotification(notification, trigger);
    console.log('NotificationService: scheduled daily expense reminder ->', resultId);
      // Persist the daily expense reminder
      try {
        await NotificationApi.createNotification({
          id: notification.id,
          title: notification.title,
          message: notification.body || '',
          type: 'reminder',
          icon: 'calendar-check',
          actionRoute: 'BudgetPlanner',
          read: false,
        });
        console.log('NotificationService: persisted daily expense reminder', notification.id);
      } catch (err) {
        console.warn('NotificationService: failed persisting daily expense reminder', err);
      }
    return resultId;
  } catch (e) {
    console.warn('NotificationService: scheduleDailyExpenseReminder failed', e);
    throw e;
  }
};

/**
 * Schedule weekly and monthly financial report notifications.
 * - Weekly: every Monday at 09:00 (id: 'weekly-financial-report')
 * - Monthly: every 1st day of month at 09:00 (id: 'monthly-financial-report')
 */
const scheduleWeeklyMonthlyReports = async (opts?: { hour?: number; minute?: number }) => {
  try {
    await ensureChannel();
    const hour = typeof opts?.hour === 'number' ? opts.hour : 9;
    const minute = typeof opts?.minute === 'number' ? opts.minute : 0;

    // cancel existing to avoid duplicates
    try {
      await cancelReminder(['weekly-financial-report', 'monthly-financial-report']);
    } catch (err) {
      console.warn('NotificationService: failed to cancel existing report reminders', err);
    }

    // weekly: Monday (1)
    const weeklyTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    const weeklyTimestamp = parseTimeToNextTimestampForWeekday(weeklyTime, 1, 0);
    const weeklyTrigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: weeklyTimestamp,
      repeatFrequency: RepeatFrequency.WEEKLY,
    };

    const weeklyNotif = {
      id: 'weekly-financial-report',
      title: 'Báo cáo tài chính tuần',
      body: 'Báo cáo tài chính tuần qua đã sẵn sàng. Xem ngay bạn đã tiết kiệm được bao nhiêu! 📊',
      android: { channelId: CHANNEL_ID, smallIcon: 'ic_launcher', color: '#4CAF50', pressAction: { id: 'default' } },
    } as any;

    await notifee.createTriggerNotification(weeklyNotif, weeklyTrigger);
    console.log('NotificationService: scheduled weekly financial report at', weeklyTime);
      try {
        await NotificationApi.createNotification({
          id: weeklyNotif.id,
          title: weeklyNotif.title,
          message: weeklyNotif.body || '',
          type: 'reminder',
          icon: 'chart-bar',
          actionRoute: 'BudgetPlanner',
          read: false,
        });
        console.log('NotificationService: persisted weekly financial report', weeklyNotif.id);
      } catch (err) {
        console.warn('NotificationService: failed persisting weekly financial report', err);
      }

    // monthly: 1st of month at same time
    // find next occurrence of day=1 at local timezone
    const now = new Date();
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // compute target for 1st of current month
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
    const map: Record<string, string> = {};
    for (const p of parts) if (p.type !== 'literal') map[p.type] = p.value;
    let year = Number(map.year);
    let month = Number(map.month);
    let day = 1;

    const offsetMs = getZoneOffsetMs(now, zone);
    const asUtcForTarget = Date.UTC(year, month - 1, day, hour, minute, 0);
    let targetEpoch = asUtcForTarget + offsetMs;
    if (targetEpoch <= now.getTime()) {
      // schedule next month
      month += 1;
      if (month > 12) { month = 1; year += 1; }
      const nextAsUtc = Date.UTC(year, month - 1, 1, hour, minute, 0);
      targetEpoch = nextAsUtc + offsetMs;
    }

    // Notifee doesn't provide a built-in MONTHLY repeat frequency.
    // We'll schedule a one-off trigger for the next 1st of month (apps can reschedule
    // when the notification is handled or during startup if needed).
    const monthlyTrigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: targetEpoch,
    };

    const monthlyNotif = {
      id: 'monthly-financial-report',
      title: 'Báo cáo tài chính tháng',
      body: 'Báo cáo tài chính tháng đã sẵn sàng. Xem ngay bạn đã tiết kiệm được bao nhiêu! 📊',
      android: { channelId: CHANNEL_ID, smallIcon: 'ic_launcher', color: '#4CAF50', pressAction: { id: 'default' } },
    } as any;

    await notifee.createTriggerNotification(monthlyNotif, monthlyTrigger);
    console.log('NotificationService: scheduled monthly financial report at', `${year}-${month}-01 ${weeklyTime}`);
      try {
        await NotificationApi.createNotification({
          id: monthlyNotif.id,
          title: monthlyNotif.title,
          message: monthlyNotif.body || '',
          type: 'reminder',
          icon: 'calendar-month',
          actionRoute: 'BudgetPlanner',
          read: false,
        });
        console.log('NotificationService: persisted monthly financial report', monthlyNotif.id);
      } catch (err) {
        console.warn('NotificationService: failed persisting monthly financial report', err);
      }

    return { weekly: 'weekly-financial-report', monthly: 'monthly-financial-report' };
  } catch (err) {
    console.warn('NotificationService: scheduleWeeklyMonthlyReports failed', err);
    throw err;
  }
};

/**
 * Schedule payday reminders for a specific goal. Accepts a `days` array like [5,10]
 * and a reminderTime (defaults to 09:00). Schedules the next occurrence per day
 * and returns created ids. IDs will be `goal-{goalId}-payday-{day}`.
 */
const scheduleGoalPaydayReminder = async (goal: { id: string; title?: string; monthlyContribution?: number }, opts?: { days?: number[]; hour?: number; minute?: number }) => {
  try {
    if (!goal || !goal.id) return null;
    const days = Array.isArray(opts?.days) && opts!.days!.length > 0 ? opts!.days! : [5, 10];
    const hour = typeof opts?.hour === 'number' ? opts.hour : 9;
    const minute = typeof opts?.minute === 'number' ? opts.minute : 0;

    // Cancel any existing payday reminders for this goal
    const idsToCancel = days.map(d => `goal-${goal.id}-payday-${d}`);
    try { await cancelReminder(idsToCancel); } catch (cancelErr) { console.warn('NotificationService: cancel before payday failed', cancelErr); }

    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const created: string[] = [];

    for (const day of days) {
      // compute next occurrence for this day-of-month
      const now = new Date();
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
      const map: Record<string, string> = {};
      for (const p of parts) if (p.type !== 'literal') map[p.type] = p.value;
      let year = Number(map.year);
      let month = Number(map.month);
      let targetDay = Math.max(1, Math.min(28, Number(day))); // clamp to 1..28 to avoid month length issues

      let targetEpoch = Date.UTC(year, month - 1, targetDay, hour, minute, 0) + getZoneOffsetMs(now, zone);
      if (targetEpoch <= now.getTime()) {
        // schedule next month
        month += 1;
        if (month > 12) { month = 1; year += 1; }
        targetEpoch = Date.UTC(year, month - 1, targetDay, hour, minute, 0) + getZoneOffsetMs(now, zone);
      }

      const trigger: TimestampTrigger = { type: TriggerType.TIMESTAMP, timestamp: targetEpoch };

      const notification = {
        id: `goal-${goal.id}-payday-${day}`,
        title: `Nhắc tiết kiệm: ${goal.title || 'Mục tiêu'}`,
        body: `Bạn đã nhận lương chưa? Hãy trích ${goal.monthlyContribution ? `${goal.monthlyContribution.toLocaleString('vi-VN')} VNĐ` : ''} vào quỹ ${goal.title || ''}`,
        android: { channelId: CHANNEL_ID, smallIcon: 'ic_launcher', color: '#4CAF50', pressAction: { id: 'default' } },
      } as any;

      const id = await notifee.createTriggerNotification(notification, trigger);
      // Persist scheduled goal payday reminder to Firestore so it shows up in NotificationScreen
      try {
        await NotificationApi.createNotification({
          id: notification.id,
          title: notification.title,
          message: notification.body || '',
          type: 'reminder',
          icon: 'currency-usd',
          actionRoute: 'SharedGoal',
          read: false,
        });
        console.log('NotificationService: persisted scheduled goal payday reminder', notification.id);
      } catch (err) {
        console.warn('NotificationService: failed persisting goal payday reminder', err);
      }
      created.push(id);
      console.log('NotificationService: scheduled goal payday', notification.id, '->', id);
    }

    return created;
  } catch (err) {
    console.warn('NotificationService: scheduleGoalPaydayReminder failed', err);
    throw err;
  }
};

/**
 * Schedule a reminder for a recurring transaction.
 * Algorithm: triggerDate = nextDueDate - reminderDays (at provided hour/minute).
 * If computed triggerDate is in the past, advance nextDue by frequency until triggerDate is in the future.
 * Supports: weekly, monthly, quarterly, yearly via transaction.frequency.
 */
const scheduleRecurringTransactionReminder = async (transaction: any, opts?: { hour?: number; minute?: number }) => {
  try {
    if (!transaction || !transaction.id) return null;

    // ignore if no reminder requested
    const reminderDays = Number(transaction.reminderDays || 0);
    if (!reminderDays || reminderDays <= 0) return null;

    const hour = typeof opts?.hour === 'number' ? opts.hour : 9;
    const minute = typeof opts?.minute === 'number' ? opts.minute : 0;
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // parse nextDue as date (expect ISO string)
    let nextDue = transaction.nextDue ? new Date(transaction.nextDue) : null;
    if (!nextDue || isNaN(nextDue.getTime())) {
      // no valid nextDue - compute from today using frequency/dueDate
      nextDue = new Date();
      if (transaction.frequency === 'weekly') {
        // dueDate holds day-of-week (1-7) where 1=Sunday in UI; translate to JS 0-6
        const targetDay = Math.max(0, Math.min(6, (Number(transaction.dueDate || 1) - 1)));
        const current = new Date();
        const currentDay = current.getDay();
        let add = (targetDay - currentDay + 7) % 7;
        if (add === 0) add = 7; // next week if same day
        nextDue.setDate(current.getDate() + add);
      } else {
        // monthly/quarterly/yearly: dueDate is day-of-month
        const targetDay = Math.max(1, Math.min(28, Number(transaction.dueDate || 1)));
        nextDue = new Date();
        nextDue.setDate(targetDay);
        if (nextDue <= new Date()) {
          if (transaction.frequency === 'monthly') nextDue.setMonth(nextDue.getMonth() + 1);
          else if (transaction.frequency === 'quarterly') nextDue.setMonth(nextDue.getMonth() + 3);
          else if (transaction.frequency === 'yearly') nextDue.setFullYear(nextDue.getFullYear() + 1);
        }
      }
    }

    // compute triggerDate = nextDue - reminderDays
    const computeTrigger = (d: Date) => {
      const candidate = new Date(d);
      candidate.setDate(candidate.getDate() - reminderDays);
      candidate.setHours(hour, minute, 0, 0);
      return candidate;
    };

    let triggerDate = computeTrigger(nextDue);
    const now = new Date();

    // If trigger date already passed, advance nextDue until triggerDate in future
    let safety = 0;
    while (triggerDate <= now && safety < 24) {
      // advance nextDue according to frequency
      if (transaction.frequency === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
      else if (transaction.frequency === 'monthly') nextDue.setMonth(nextDue.getMonth() + 1);
      else if (transaction.frequency === 'quarterly') nextDue.setMonth(nextDue.getMonth() + 3);
      else if (transaction.frequency === 'yearly') nextDue.setFullYear(nextDue.getFullYear() + 1);
      else nextDue.setMonth(nextDue.getMonth() + 1);

      triggerDate = computeTrigger(nextDue);
      safety += 1;
    }

    if (triggerDate <= now) {
      // nothing to schedule (safety fallback)
      return null;
    }

    // Build trigger epoch in UTC adjusted for timezone
    const timestamp = Date.UTC(triggerDate.getFullYear(), triggerDate.getMonth(), triggerDate.getDate(), triggerDate.getHours(), triggerDate.getMinutes(), 0) + getZoneOffsetMs(triggerDate, zone);

    // ensure unique id per transaction (we'll use base id)
    const notifId = `recurring-${transaction.id}`;
    // cancel existing
    try { await cancelReminder(notifId); } catch { /* non-fatal */ }

    const trigger: TimestampTrigger = { type: TriggerType.TIMESTAMP, timestamp };

    const notification = {
      id: notifId,
      title: transaction.type === 'income' ? `Nhắc thu nhập: ${transaction.name}` : `Nhắc đến hạn: ${transaction.name}`,
      body: transaction.type === 'income'
        ? `Ngày ${transaction.dueDate} sắp tới — kiểm tra thu nhập và ghi lại nếu cần.`
        : `Giao dịch định kỳ "${transaction.name}" đến hạn vào ${new Date(nextDue).toLocaleDateString('vi-VN')}.`,
      android: { channelId: CHANNEL_ID, smallIcon: 'ic_launcher', color: '#4CAF50', pressAction: { id: 'default' } },
    } as any;

    const created = await notifee.createTriggerNotification(notification, trigger);
    // Persist scheduled recurring transaction reminder to Firestore
    try {
      await NotificationApi.createNotification({
        id: notifId,
        title: notification.title,
        message: notification.body || '',
        type: 'reminder',
        icon: transaction.type === 'income' ? 'currency-usd' : 'calendar-clock',
        actionRoute: 'BudgetPlanner',
        read: false,
      });
      console.log('NotificationService: persisted scheduled recurring notification', notifId);
    } catch (err) {
      console.warn('NotificationService: failed persisting recurring reminder', err);
    }
    console.log('NotificationService: scheduled recurring reminder', notifId, '->', created, 'triggerDate:', triggerDate.toISOString());
    return created;
  } catch (err) {
    console.warn('NotificationService: scheduleRecurringTransactionReminder failed', err);
    throw err;
  }
};

/**
 * Schedule a daily reminder for AI recommendations (default 08:00 local time).
 * ID: `daily-ai-recommendation`
 */
const scheduleDailyRecommendationReminder = async (opts?: { hour?: number; minute?: number }) => {
  try {
    await ensureChannel();
    const hour = typeof opts?.hour === 'number' ? opts.hour : 7;
    const minute = typeof opts?.minute === 'number' ? opts.minute : 0;

    // avoid duplicate reminders
    try {
      await cancelReminder('daily-ai-recommendation');
    } catch (err) {
      console.warn('NotificationService: failed cancel existing ai reminder', err);
    }

    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    const timestamp = parseTimeToNextTimestamp(timeStr, 0);

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp,
      repeatFrequency: RepeatFrequency.DAILY,
    };

    const notification = {
      id: 'daily-ai-recommendation',
      title: 'Gợi ý hàng ngày',
      body: 'Gợi ý mới đã sẵn sàng — mở ứng dụng để xem gợi ý AI hôm nay!',
      android: { channelId: CHANNEL_ID, smallIcon: 'ic_launcher', color: '#4CAF50', pressAction: { id: 'default' } },
    } as any;

    const created = await notifee.createTriggerNotification(notification, trigger);
    // Persist the scheduled daily AI recommendation reminder
    try {
      await NotificationApi.createNotification({
        id: notification.id,
        title: notification.title,
        message: notification.body || '',
        type: 'ai',
        icon: 'robot',
        actionRoute: 'AIRecommendation',
        read: false,
      });
      console.log('NotificationService: persisted scheduled AI recommendation reminder', notification.id);
    } catch (err) {
      console.warn('NotificationService: failed persisting ai recommendation reminder', err);
    }
    console.log('NotificationService: scheduled daily AI recommendation reminder ->', created);
    return created;
  } catch (err) {
    console.warn('NotificationService: scheduleDailyRecommendationReminder failed', err);
    throw err;
  }
};

/**
 * Schedule a daily streak reminder at configured time (default 20:00).
 * ID: `daily-streak-reminder`
 */
const scheduleDailyStreakReminder = async (opts?: { hour?: number; minute?: number }) => {
  try {
    await ensureChannel();
    const hour = typeof opts?.hour === 'number' ? opts.hour : 20;
    const minute = typeof opts?.minute === 'number' ? opts.minute : 0;

    // avoid duplicate reminders
    try {
      await cancelReminder('daily-streak-reminder');
    } catch (err) {
      console.warn('NotificationService: failed cancel existing streak reminder', err);
    }

    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    const timestamp = parseTimeToNextTimestamp(timeStr, 0);

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp,
      repeatFrequency: RepeatFrequency.DAILY,
    };

    const notification = {
      id: 'daily-streak-reminder',
      title: 'Đừng để bị mất streak!',
      body: 'Đừng để bị mất streak nha bạn — hoàn thành check-in hôm nay để giữ chuỗi!',
      android: { channelId: CHANNEL_ID, smallIcon: 'ic_launcher', color: '#4CAF50', pressAction: { id: 'default' } },
    } as any;

    const created = await notifee.createTriggerNotification(notification, trigger);
    // Persist the scheduled streak reminder
    try {
      await NotificationApi.createNotification({
        id: notification.id,
        title: notification.title,
        message: notification.body || '',
        type: 'reminder',
        icon: 'fire',
        actionRoute: 'DailyCheckIn',
        read: false,
      });
      console.log('NotificationService: persisted daily streak reminder', notification.id);
    } catch (err) {
      console.warn('NotificationService: failed persisting daily streak reminder', err);
    }
    console.log('NotificationService: scheduled daily streak reminder ->', created);
    return created;
  } catch (err) {
    console.warn('NotificationService: scheduleDailyStreakReminder failed', err);
    throw err;
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
        console.warn('NotificationService: cancel trigger failed for id', id, err);
      }
      try {
        await notifee.cancelNotification(String(id));
      } catch (err) {
        console.warn('NotificationService: cancel notification failed for id', id, err);
      }
      // Also try base/weekday pattern if id looks like base habit id
      // e.g. attempt `${id}-0`..`${id}-6`
      for (let i = 0; i < 7; i++) {
        try {
          await notifee.cancelTriggerNotification(String(`${id}-${i}`));
          await notifee.cancelNotification(String(`${id}-${i}`));
        } catch (err) {
          console.warn('NotificationService: cancel wildcard id failed', `${id}-${i}`, err);
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
  scheduleDailyExpenseReminder,
  scheduleDailyStreakReminder,
  scheduleWeeklyMonthlyReports,
  scheduleDailyRecommendationReminder,
  scheduleGoalPaydayReminder,
  scheduleRecurringTransactionReminder,
  cancelReminder,
  displayNotification,
};
