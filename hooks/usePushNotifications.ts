import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { deleteNotificationToken, registerNotificationToken } from '@/lib/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldShowAlert: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const androidChannel: Notifications.NotificationChannelInput = {
  name: 'default',
  importance: Notifications.AndroidImportance.MAX,
  vibrationPattern: [0, 250, 250, 250],
  sound: 'default',
  lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
};

export interface PushNotificationState {
  token: string | null;
  notification: Notifications.Notification | null;
  permissionStatus: Notifications.PermissionStatus;
  isRegistering: boolean;
  error: string | null;
  isDevice: boolean;
}

const ensureAndroidChannelAsync = async () => {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync('default', androidChannel);
};

export const usePushNotifications = (userId?: string | null): PushNotificationState => {
  const [token, setToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<Notifications.PermissionStatus>(Notifications.PermissionStatus.UNDETERMINED);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registrationRef = useRef<{ userId: string | null; token: string | null }>({
    userId: null,
    token: null,
  });
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;

      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }

      const { userId: registeredUser, token: registeredToken } = registrationRef.current;
      if (registeredUser && registeredToken) {
        deleteNotificationToken(registeredUser, registeredToken).catch((cleanupError) => {
          console.warn('Failed to delete notification token on cleanup', cleanupError);
        });
      }
    };
  }, []);

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener((incoming) => {
      setNotification(incoming);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        setNotification(response.notification);
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!Device.isDevice) {
      setError('Push notifications require running on a physical device.');
      console.log('Push notifications require running on a physical device.');
      setToken(null);
      return;
    }

    let cancelled = false;

    const registerAsync = async () => {
      setIsRegistering(true);
      setError(null);

      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        setPermissionStatus(existingStatus);

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
          setPermissionStatus(status);
        }

        if (finalStatus !== 'granted') {
          throw new Error('Push notification permission not granted.');
        }

        await ensureAndroidChannelAsync();

        const deviceToken = await Notifications.getDevicePushTokenAsync();
        if (!deviceToken?.data) {
          throw new Error('Firebase push token not available. Verify native Android build.');
        }

        const nextToken = deviceToken.data;
        const previousRegistration = registrationRef.current;

        if (
          previousRegistration.userId &&
          previousRegistration.token &&
          previousRegistration.userId !== userId
        ) {
          await deleteNotificationToken(previousRegistration.userId, previousRegistration.token).catch(
            (cleanupError) => {
              console.warn('Failed to remove previous notification token', cleanupError);
            }
          );
        }

        if (userId) {
          await registerNotificationToken(userId, nextToken);
        }

        if (!cancelled && isMountedRef.current) {
          registrationRef.current = { userId: userId ?? null, token: nextToken };
          setToken(nextToken);
          setError(null);
        }
      } catch (registrationError) {
        const message =
          registrationError instanceof Error
            ? registrationError.message
            : 'Failed to register for push notifications.';

        if (!cancelled && isMountedRef.current) {
          setError(message);
          setToken(null);
        }

        console.warn('Push notification registration failed:', registrationError);
      } finally {
        if (!cancelled && isMountedRef.current) {
          setIsRegistering(false);
        }
      }
    };

    registerAsync().catch(() => {
      // Error already surfaced via state updates.
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return {
    token,
    notification,
    permissionStatus,
    isRegistering,
    error,
    isDevice: Device.isDevice,
  };
};
