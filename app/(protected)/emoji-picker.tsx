import React from 'react';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, Text } from 'react-native';
import { emojies } from '../../constants/Emojis';
import { useUserStore } from '~/store/store';
import { useTheme } from '~/providers/theme-provider';
// import { useListCreation } from '@/context/ListCreationContext';

export default function EmojiPickerScreen() {
  const router = useRouter();
  const { selectedEmoji, setSelectedEmoji } = useUserStore();
  const { colorScheme } = useTheme();

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    router.back();
  };

  return (
    <FlatList
      data={emojies}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => {
            if (process.env.EXPO_OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            handleEmojiSelect(item);
          }}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{ fontSize: 40 }}>{item}</Text>
        </Pressable>
      )}
      numColumns={3}
      keyExtractor={(item) => item}
      automaticallyAdjustContentInsets
      contentInsetAdjustmentBehavior="automatic"
      contentInset={{ bottom: 0 }}
      scrollIndicatorInsets={{ bottom: 0 }}
      contentContainerStyle={{
        backgroundColor: colorScheme === 'dark' ? '#212121' : 'white',
        padding: 16,
        gap: 20,
        paddingBottom: 100,
      }}
    />
  );
}
