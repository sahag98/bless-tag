import { Linking, Modal, Platform, Pressable, Text, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { supabase } from '~/utils/supabase';
import { nativeApplicationVersion } from 'expo-application';
import { useTheme } from '~/providers/theme-provider';

const UpdateModal = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const { colorScheme } = useTheme();
  async function fetchUpdate() {
    try {
      const { data: update } = await supabase.from('update').select('version_num').single();

      if (update?.version_num !== nativeApplicationVersion?.toString()) {
        setIsUpdateAvailable(true);
      } else {
        setIsUpdateAvailable(false);
      }
    } catch (error) {
      console.log('fetchUpdate', error);
    }
  }
  useEffect(() => {
    fetchUpdate();
  }, []);
  return (
    <Modal
      animationType="fade"
      transparent
      visible={isUpdateAvailable}
      onRequestClose={() => setIsUpdateAvailable(false)}
      statusBarTranslucent>
      <View
        className="flex-1 items-center justify-center"
        style={
          colorScheme === 'dark'
            ? { backgroundColor: 'rgba(0, 0, 0, 0.3)' }
            : { backgroundColor: 'rgba(0, 0, 0, 0.3)' }
        }>
        <View className="w-10/12 items-center rounded-xl bg-card p-6">
          <Text className="font-fredoka-semibold text-2xl text-foreground">
            New Update Available!
          </Text>
          <Text className="mt-1 text-center font-nunito-regular text-foreground">
            Update your app to the latest version and check out the newly added features.
          </Text>

          <View className="mt-4 w-full items-center justify-between">
            <Pressable
              onPress={() => {
                if (Platform.OS === 'android') {
                  Linking.openURL(
                    'https://play.google.com/store/apps/details?id=com.sahag98.blessedtag'
                  );
                }
                if (Platform.OS === 'ios') {
                  Linking.openURL('https://apps.apple.com/us/app/bless-tag/id6745277768');
                }
              }}
              className="w-full items-center justify-center rounded-lg bg-primary p-4">
              <Text className="font-fredoka-semibold text-lg text-foreground ">Update Now</Text>
            </Pressable>
            <Pressable className="mt-2" onPress={() => setIsUpdateAvailable(false)}>
              <Text className="p-2 font-nunito-medium text-foreground underline underline-offset-4">
                Later
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default UpdateModal;
