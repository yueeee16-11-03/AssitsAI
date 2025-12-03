/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import notifee, { EventType } from '@notifee/react-native';
import NotificationApi from './src/api/notificationApi';

// Background event handler - called when notification is triggered/displayed while app is killed/background
notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('NotificationService: background event', type, detail);
  
  if (type === EventType.DELIVERED) {
    // Notification was delivered/displayed - save to Firebase
    try {
      const notification = detail.notification;
      if (notification) {
        await NotificationApi.createNotification({
          id: notification.id,
          title: notification.title || '',
          message: notification.body || '',
          type: 'reminder',
          icon: 'bell-outline',
          color: '#10B981',
          actionRoute: null,
        });
        console.log('NotificationService: persisted background notification', notification.id);
      }
    } catch (err) {
      console.warn('NotificationService: failed to persist background notification', err);
    }
  }
});

AppRegistry.registerComponent(appName, () => App);
