import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { Container } from '~/components/Container';
import { PrimaryButton } from '~/components/PrimaryButton';
import { useAuth } from '~/providers/auth-provider';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '~/utils/supabase';
import { router } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';

const LoginScreen = () => {
  const { getGoogleOAuthUrl, currentUser, setCurrentUser } = useAuth();

  const onSignInWithApple = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      // signed in
      // console.log('creden')
      if (credential.identityToken) {
        const {
          error,
          data: { user },
        } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });

        console.log('apple error: ', error);

        console.log('HEREE');

        if (!error) {
          console.log('Signed in!');
          router.replace('/');
          // router.push('/(app)/(tabs)');
          //   router.push(COMMUNITY_SCREEN);
        }
      } else {
        throw new Error('No identityToken.');
      }
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        // handle that the user canceled the sign-in flow
      } else {
        // handle other errors
      }
    }
  };

  const onSignInWithGoogle = async () => {
    try {
      const url = await getGoogleOAuthUrl();
      if (!url) {
        console.log('error with url');
        return;
      }

      console.log('url: ', url);

      const result = await WebBrowser.openAuthSessionAsync(url, 'blessed-tag://', {
        showInRecents: true,
      });

      console.log(result.type);

      if (result.type === 'success') {
        const data = extractParamsFromUrl(result.url);
        console.log('in success');
        if (!data.access_token || !data.refresh_token) {
          console.log('error', 'Failed to get authentication tokens');
          return;
        }
        const { data: authData, error } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });

        if (!authData.session) return;
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.session.user.id);

        if (!profiles) return;

        setCurrentUser(profiles[0]);
        router.replace('/');
        // router.push('/(app)/(tabs)');
      } else if (result.type === 'cancel') {
        console.log('info', 'Google sign-in was cancelled');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };

  const extractParamsFromUrl = (url: string) => {
    const params = new URLSearchParams(url.split('#')[1]);
    const data = {
      access_token: params.get('access_token'),
      //@ts-nocheck
      expires_in: parseInt(params.get('expires_in') || '0', 10),
      refresh_token: params.get('refresh_token'),
      token_type: params.get('token_type'),
      provider_token: params.get('provider_token'),
    };

    return data;
  };
  return (
    <View className="flex-1 bg-background">
      {/* <View className="flex-1 bg-background" /> */}
      <View className="flex-1 items-center justify-center bg-background">
        <Image
          source={require('~/assets/onboarding.png')}
          style={{ alignSelf: 'center', width: 200, height: 200 }}
        />
      </View>
      <View className="flex-1 items-center justify-between rounded-tl-3xl rounded-tr-3xl bg-secondary px-4 py-12">
        <View className="flex-row items-center gap-4">
          <Text className="font-fredoka-semibold text-4xl text-background">Bless Tag</Text>
          <View className="rounded-full bg-[#969696] px-2 py-1">
            <Text className="font-nunito-semibold">BETA</Text>
          </View>
        </View>
        <Text className="font-nunito-medium text-xl text-background">
          You were made to be a light. In this game, every tag is a chance to lift someone up, share
          God’s love, and make a difference—one blessing at a time.
        </Text>
        <Text className="font-nunito-medium text-lg text-primary">
          Please use the feedback feature to report any bugs, errors, and suggestions you might
          have!
        </Text>
        <View className="w-full gap-4">
          <PrimaryButton onPress={onSignInWithGoogle} title="Continue with Google" />
          <PrimaryButton onPress={onSignInWithApple} title="Continue with Apple" />
        </View>
      </View>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({});
