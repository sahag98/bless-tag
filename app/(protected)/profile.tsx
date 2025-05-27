import {
  Alert,
  FlatList,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React from 'react';
import { Container } from '~/components/Container';
import { router } from 'expo-router';
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '~/providers/auth-provider';

import { supabase } from '~/utils/supabase';
import { useUserStore } from '~/store/store';
import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { useTheme } from '~/providers/theme-provider';
import { SafeAreaView } from 'react-native-safe-area-context';

const blurhash = 'L1QvwR-;fQ-;~qfQfQfQfQfQfQfQ';

const ProfilePage = () => {
  const { colorScheme } = useTheme();

  const { currentUser, setCurrentUser } = useAuth();

  async function deleteAccount() {
    await supabase.auth.signOut();
    setCurrentUser(null);
    const { data } = await supabase.functions.invoke('delete-user', {
      body: JSON.stringify({
        userId: currentUser?.id,
      }),
    });
  }

  return (
    <View className="flex-1 p-4">
      <View className="h-full w-full flex-1 gap-5">
        {Platform.OS === 'android' && (
          <Pressable
            onPress={() => {
              router.back();
            }}>
            <AntDesign name="left" size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
          </Pressable>
        )}

        <View className="mt-8 flex-row items-center gap-4">
          {currentUser?.avatar_url ? (
            <Image
              style={{ width: 80, aspectRatio: 1 / 1, borderRadius: 100 }}
              className="rounded-full"
              source={{ uri: currentUser.avatar_url }}
              placeholder={{ blurhash }}
              contentFit="cover"
              transition={1000}
            />
          ) : (
            <View className="size-28 items-center justify-center rounded-full border border-cardborder bg-card ">
              <Text className="font-nunito-semibold text-3xl uppercase text-foreground">
                {currentUser?.username?.charAt(0)}
                {currentUser?.username?.charAt(1)}
              </Text>
            </View>
          )}
          <View className="gap-1">
            <Text className="font-nunito-semibold text-2xl text-foreground">
              {currentUser?.username}
            </Text>
            <Text className="font-nunito-medium text-foreground">
              Joined: {currentUser && new Date(currentUser?.updated_at!).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push('/(protected)/edit-profile')}
          className="w-full flex-row items-center justify-between rounded-xl bg-primary p-4">
          <Text className="font-nunito-bold text-lg text-foreground">Edit Profile</Text>
          <MaterialCommunityIcons name="account-edit-outline" size={24} color="black" />
        </Pressable>

        <View className="mb-20 mt-auto gap-3">
          <Pressable
            onPress={() => {
              supabase.auth.signOut();
              setCurrentUser(null);
              // router.push('/(auth)');
            }}
            className="w-full items-center justify-center rounded-xl bg-red-100 p-4 dark:bg-red-950">
            <Text className="font-nunito-semibold text-base text-red-600 dark:text-foreground">
              Sign out
            </Text>
          </Pressable>
          <Pressable
            onPress={() =>
              Alert.alert('Delete Account', 'This action will permenantly delete your account.', [
                {
                  text: 'Cancel',
                  onPress: () => console.log('Cancel Pressed'),
                  style: 'cancel',
                },
                { text: 'Delete', style: 'destructive', onPress: deleteAccount },
              ])
            }
            className=" w-full items-center justify-center rounded-xl bg-card p-4">
            <Text className="font-nunito-semibold text-base text-foreground">Delete account</Text>
          </Pressable>
          <Text className="mt-5 text-center font-nunito-medium text-foreground">v.1.0.0</Text>
        </View>
      </View>
    </View>
  );
};

export default ProfilePage;

const styles = StyleSheet.create({
  badgeImage: {
    width: 80, // Use 'resizeMode' instead of 'objectFit'
    aspectRatio: 1 / 1,
  },
  badgeNotAchieved: {
    opacity: 0.3, // Dim the image to indicate it's not achieved
    // Alternatively, you can apply a tintColor to simulate grayscale
    // tintColor: 'gray',
  },
});
