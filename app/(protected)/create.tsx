import { useEffect, useRef, useState } from 'react';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { Link, router, useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Container } from '~/components/Container';
import { useUserStore } from '~/store/store';
import { emojies } from '~/constants/Emojis';
import { useTheme } from '~/providers/theme-provider';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '~/providers/auth-provider';
import { supabase } from '~/utils/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as StoreReview from 'expo-store-review';

export default function CreateSquad() {
  const [circleName, setCircleName] = useState('');
  const [circleDescription, setcircleDescription] = useState('');
  const {
    selectedEmoji,
    setSelectedEmoji,
    fetchSquads,
    squadsCreated,
    incrementSquadsCreated,
    reviewRequested,
    setReviewRequested,
  } = useUserStore();
  const { currentUser } = useAuth();
  const [circleCode, setCircleCode] = useState<any | null>();
  const { colorScheme } = useTheme();

  const insets = useSafeAreaInsets();
  useEffect(() => {
    setSelectedEmoji(emojies[Math.floor(Math.random() * emojies.length)]);

    return () => {
      setSelectedEmoji('');
    };
  }, []);

  async function finalizeSetup() {
    if (!circleName) {
      console.log('no name');
      return;
    }
    const randomCode = Math.floor(100000 + Math.random() * 900000);

    try {
      // Generate a random 6-digit number
      const { data, error } = await supabase
        .from('squads')
        .insert([
          {
            name: `${circleName} ${selectedEmoji}`,
            code: randomCode,
            description: circleDescription,
            admin_id: currentUser?.id!,
          },
        ])
        .select();

      if (error) console.log(error);

      if (!data) return;

      setCircleName('');
      setcircleDescription('');

      //   queryClient.invalidateQueries({
      //     queryKey: ['groups'],
      //   });

      const { data: insertMemberData, error: insertMemberError } = await supabase
        .from('members')
        .insert([
          {
            squad_id: data[0].id,
            user_id: currentUser?.id!,
            squad_name: data[0].name,
            is_admin: true,
          },
        ])
        .select();

      console.log(insertMemberError);

      //   fetchStudies(currentUser?.id!);
    } catch (error) {
      console.log(error);
    } finally {
      // Increment squads created count
      incrementSquadsCreated();

      // if (squadsCreated === 1 && !reviewRequested) {
      //   console.log('is available not working');
      // }

      // // Request review after 2nd squad creation (when squadsCreated becomes 2)
      // if (squadsCreated === 1 && !reviewRequested && (await StoreReview.isAvailableAsync())) {
      //   console.log('should show review!!!');
      //   await StoreReview.requestReview();
      //   setReviewRequested(true);
      // }

      fetchSquads(currentUser?.id!);
      router.replace('/');
    }
  }
  return (
    <View style={{ paddingTop: Platform.OS === 'android' ? insets.top : 15 }} className="p-4">
      <View className="">
        <View className="mb-8 flex-row items-center justify-between">
          <Text className=" font-fredoka-semibold text-3xl">Create Squad</Text>
          <Feather
            onPress={finalizeSetup}
            name="check"
            size={40}
            color={colorScheme === 'dark' ? '#ffac27' : '#ffac27'}
          />
        </View>
        <View className="gap-2">
          <View className="flex-row items-center justify-between gap-5">
            <TextInput
              value={circleName}
              onChangeText={setCircleName}
              selectionColor={colorScheme === 'dark' ? 'white' : 'black'}
              placeholder="Squad name here..."
              placeholderTextColor={colorScheme === 'dark' ? '#dcdcdc' : '#4b5563'}
              className="flex-1 rounded-xl bg-input p-4 font-nunito-medium text-foreground"
            />

            <Link href={{ pathname: '/emoji-picker' }}>
              <View className="size-12 items-center justify-center rounded-full bg-input">
                <Text>{selectedEmoji}</Text>
              </View>
            </Link>
          </View>
          <TextInput
            value={circleDescription}
            onChangeText={setcircleDescription}
            selectionColor={colorScheme === 'dark' ? 'white' : 'black'}
            placeholder="Squad description here..."
            placeholderTextColor={colorScheme === 'dark' ? '#dcdcdc' : '#4b5563'}
            className="rounded-xl bg-input p-4 font-nunito-medium text-foreground"
          />
        </View>
      </View>
    </View>
  );
}
