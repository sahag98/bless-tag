import { Redirect, Stack } from 'expo-router';
import {
  Nunito_300Light,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';

import {
  Fredoka_300Light,
  Fredoka_400Regular,
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from '@expo-google-fonts/fredoka';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import CustomThemeProvider from '~/providers/theme-provider';
import { useAuth } from '~/providers/auth-provider';
import * as Notifications from 'expo-notifications';
import { useNotificationObserver } from '~/hooks/useNotificationObserver';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function ProtectedLayout() {
  const [loaded, error] = useFonts({
    Nunito_300Light,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Fredoka_300Light,
    Fredoka_400Regular,
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
  });
  const { currentUser } = useAuth();
  const [appIsReady, setAppIsReady] = useState(false);

  useNotificationObserver();

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here

        // Artificially delay for two seconds to simulate a slow loading
        // experience. Remove this if you copy and paste the code!
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  if (!appIsReady || error) {
    return null;
  }

  if (!currentUser) {
    return <Redirect href={'/login'} />;
  }

  // if (currentUser && currentUser.username === null) {
  //   return <Redirect href={'/(protected)/onboarding'} />;
  // }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="profile"
        options={{
          presentation: 'modal',
          headerShown: false,
          sheetAllowedDetents: [0.5, 0.75, 1],
          sheetGrabberVisible: true,
        }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{
          presentation: 'modal',
          sheetAllowedDetents: [0.75, 1],
          sheetGrabberVisible: true,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          presentation: 'modal',
          sheetAllowedDetents: [0.75, 1],
          sheetGrabberVisible: true,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="scan"
        options={{
          presentation: 'modal',
          sheetAllowedDetents: [0.75, 1],
          sheetGrabberVisible: true,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="emoji-picker"
        options={{
          presentation: 'formSheet',
          headerShown: false,
          sheetAllowedDetents: [0.5, 0.75, 1],
          sheetGrabberVisible: true,
        }}
      />
      <Stack.Screen name="squad" />
    </Stack>
  );
}
