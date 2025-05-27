import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Share, Alert } from 'react-native';
import { BottomSheetModal, BottomSheetView, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { AntDesign, Entypo, FontAwesome, FontAwesome6, Ionicons } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { supabase } from '~/utils/supabase';
import { router } from 'expo-router';

import { useAuth } from '~/providers/auth-provider';
import { useTheme } from '~/providers/theme-provider';
import { useUserStore } from '~/store/store';
import { Members } from '~/types/types';
const SquadSettingsModal = ({
  squad_id,
  created,
  admin,
  bottomSheetModalRef,
}: {
  squad_id: number | undefined;
  created: string;
  admin: Members;
  bottomSheetModalRef: React.RefObject<BottomSheetModal>;
}) => {
  const { currentUser, getUserSquads } = useAuth();
  const { colorScheme } = useTheme();

  // ref
  const snapPoints = useMemo(() => ['30%'], []);
  // callbacks

  const handleSheetChanges = useCallback((index: number) => {
    // console.log('handleSheetChanges', index);
  }, []);

  async function deleteStudy() {
    console.log('deleting');

    if (!squad_id || !currentUser) return;

    // removeStudy(currentUser?.id, admin.user_id, String(group_id));

    if (currentUser?.id === admin.user_id) {
      await supabase.from('squads').delete().eq('id', squad_id);
    } else {
      const { data, error } = await supabase
        .from('members')
        .delete()
        .eq('user_id', currentUser?.id!)
        .eq('squad_id', squad_id);
      console.log('leave error: ', error);
    }
    getUserSquads();
    bottomSheetModalRef.current?.dismiss();
    router.back();
  }

  //   async function shareGroup() {
  //     await Share.share({
  //       title: `Hey! Join my bible study group 📖`,
  //       message: `Hey! Join my bible study group 📖 \n Use this code to join: ${code} if you are approved for testing. \n If not, reach out to @sahag98 on Instagram so that he can add you to the testing!`,
  //     });
  //     // Linking.openURL(`market://details?id=${config.androidPackageName}`);

  //     // Linking.openURL(`itms-apps://itunes.apple.com/app/id${config.iosItemId}`);
  //   }

  // renders
  return (
    <BottomSheetModalProvider>
      <BottomSheetModal
        containerStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
        handleStyle={{ backgroundColor: colorScheme === 'dark' ? '#212121' : 'white' }}
        handleIndicatorStyle={{ backgroundColor: colorScheme === 'dark' ? 'white' : 'black' }}
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        index={1}
        onChange={handleSheetChanges}>
        <BottomSheetView className="bg-background" style={styles.contentContainer}>
          <View className="flex-1 gap-4 p-2">
            <View className="flex-row items-center gap-2">
              <Ionicons
                name="information-circle-outline"
                size={24}
                color={colorScheme === 'dark' ? 'white' : 'black'}
              />
              <Text className="font-fredoka-semibold text-2xl text-foreground sm:text-3xl">
                Squad Info
              </Text>
            </View>
            <View className="gap-3">
              <View className="flex-row items-center gap-3">
                <AntDesign name="calendar" size={24} color="#858484" />
                <Text className="font-nunito-medium text-lg text-foreground sm:text-xl">
                  Created:{' '}
                  <Text className="text-base text-foreground sm:text-lg">
                    {new Date(created).toDateString()}
                  </Text>
                </Text>
              </View>
              <View className="flex-row items-center gap-3">
                <FontAwesome5 name="user-circle" size={24} color="#858484" />
                <Text className="font-nunito-medium text-lg text-foreground sm:text-xl">
                  Squad Lead: <Text className="text-foreground">{admin.profiles.username}</Text>
                </Text>
              </View>
            </View>
            {currentUser?.id === admin.user_id ? (
              <>
                <Pressable
                  onPress={() => {
                    bottomSheetModalRef.current?.dismiss();
                    router.push(`/(protected)/squad/${squad_id}/edit`);
                  }}
                  className="flex-row items-center justify-between rounded-xl border border-cardborder p-4">
                  <Text className="font-nunito-semibold text-lg text-stone-500 sm:text-xl">
                    Edit
                  </Text>
                  <FontAwesome name="edit" size={24} color="#78716c" />
                </Pressable>
                <Pressable
                  onPress={() => {
                    Alert.alert(
                      'Delete Squad',
                      'This action will permenantly delete this squad for everyone.',
                      [
                        {
                          text: 'Cancel',
                          onPress: () => console.log('Cancel Pressed'),
                          style: 'cancel',
                        },
                        { text: 'Delete', style: 'destructive', onPress: deleteStudy },
                      ]
                    );
                  }}
                  className="flex-row items-center justify-between rounded-xl border border-cardborder p-4">
                  <Text className="font-nunito-semibold text-lg text-red-500 sm:text-xl">
                    Delete
                  </Text>
                  <FontAwesome6 name="trash-alt" size={25} color="#ff4d4d" />
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={() => {
                  Alert.alert(
                    'Leave Squad',
                    'This action will permenantly remove you from this squad.',
                    [
                      {
                        text: 'Cancel',
                        onPress: () => console.log('Cancel Pressed'),
                        style: 'cancel',
                      },
                      { text: 'Leave', style: 'destructive', onPress: deleteStudy },
                    ]
                  );
                }}
                className="mt-auto flex-row items-center justify-between rounded-xl bg-red-100 p-4">
                <Text className="text-lg font-semibold text-red-600 sm:text-xl">Leave</Text>
                <Entypo name="log-out" size={25} color="#ff4d4d" />
              </Pressable>
            )}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </BottomSheetModalProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  contentContainer: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 10,
    paddingBottom: 30,
  },
});

export default SquadSettingsModal;
