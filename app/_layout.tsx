import { Slot, Stack } from 'expo-router';
import '../global.css';
import CustomThemeProvider from '~/providers/theme-provider';
import AuthProvider from '~/providers/auth-provider';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, ActivityIndicator } from 'react-native';
import { useFonts, Nunito_400Regular } from '@expo-google-fonts/nunito';
import * as Font from 'expo-font';
// import { vexo } from 'vexo-analytics';
const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

// if (!__DEV__) {
//   vexo(process.env.EXPO_PUBLIC_VEXO_API_KEY!);
// }
export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  useEffect(() => {
    async function prepare() {
      try {
        // Artificial delay for loading experience
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
        SplashScreen.hide();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator className="text-primary" size="large" />
      </View>
    );
  }
  return (
    <>
      <StatusBar style="auto" />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CustomThemeProvider>
            <GestureHandlerRootView>
              <Stack>
                <Stack.Screen name="(protected)" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
              </Stack>
            </GestureHandlerRootView>
          </CustomThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </>
  );
}
