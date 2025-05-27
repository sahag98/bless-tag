import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Button, Pressable } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetModalProvider,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { supabase } from '~/utils/supabase';
import { Tables } from '~/database.types';
import { useAuth } from '~/providers/auth-provider';
import { AntDesign, Feather } from '@expo/vector-icons';
// import { emojies } from '~/constants/Emojis';
import { useTheme } from '~/providers/theme-provider';
import { Link, router } from 'expo-router';
import { useUserStore } from '~/store/store';
import { emojies } from '~/constants/Emojis';

const InputComponent = ({ value, setValue }: { value: string; setValue: any }) => {
  const [title, setTitle] = useState('');
  return (
    <BottomSheetTextInput
      style={{
        borderBottomWidth: 1,
      }}
      placeholder="Title"
      value={value}
      className="placeholder:text-light-foreground/60 rounded-3xl bg-gray-200 p-4"
      onChangeText={setValue}
    />
  );
};

const CreateCircleModal = ({
  bottomSheetModalRef,
  currentUser,
}: {
  bottomSheetModalRef: React.RefObject<BottomSheetModal>;
  currentUser: Tables<'profiles'> | null;
}) => {
  const { colorScheme } = useTheme();

  const [circleName, setCircleName] = useState('');
  const [circleDescription, setcircleDescription] = useState('');
  const { selectedEmoji, setSelectedEmoji, fetchSquads } = useUserStore();
  const [circleCode, setCircleCode] = useState<any | null>();
  const [activeTab, setActiveTab] = useState('create');

  const snapPoints = useMemo(() => ['50%', '75%'], []);
  // callbacks

  const handleSheetChanges = useCallback((index: number) => {
    console.log('handleSheetChanges', index);
  }, []);

  useEffect(() => {
    setSelectedEmoji(emojies[Math.floor(Math.random() * emojies.length)]);

    return () => {
      setSelectedEmoji('');
    };
  }, []);

  async function joinSquad() {
    if (!circleCode) {
      return;
    }
    let { data: squad, error } = await supabase
      .from('squads')
      .select('*')
      .eq('code', circleCode)
      .single();
    try {
      if (!squad) {
        alert("This group doesn't exist. Try again");
        return;
      }
      const { data: insertMemberData, error: insertMemberError } = await supabase
        .from('members')
        .insert([
          {
            squad_id: squad.id,
            user_id: currentUser?.id!,
            squad_name: squad.name,
            is_admin: false,
          },
        ])
        .select();
    } catch (error) {
      console.log('something went wrong: ', error);
    } finally {
      // fetchStudies(currentUser?.id!);
      // getUserGroups();
      bottomSheetModalRef.current?.dismiss();
      setCircleCode(null);
      fetchSquads(currentUser?.id!);

      router.replace(`/squad/${squad?.id}`);
    }
  }

  // renders
  return (
    <BottomSheetModalProvider>
      <BottomSheetModal
        backgroundStyle={{ backgroundColor: colorScheme === 'dark' ? '#212121' : 'white' }}
        ref={bottomSheetModalRef}
        containerStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
        handleIndicatorStyle={{ backgroundColor: colorScheme === 'dark' ? '#787878' : '#292929' }}
        handleStyle={{
          backgroundColor: colorScheme === 'dark' ? '#212121' : 'white',
        }}
        snapPoints={snapPoints}
        index={2}
        onChange={handleSheetChanges}>
        <BottomSheetView className="bg-background" style={styles.contentContainer}>
          <View className="items-center gap-4">
            <Text className="font-fredoka-semibold text-3xl">Encourage One Another</Text>
            <Text className="w-4/5 text-center font-nunito-medium">
              Create a squad and build the habit of pouring into one another in your walk with God.
            </Text>
          </View>
          <View className="gap-10">
            <Pressable
              onPress={() => router.push('/(protected)/create')}
              className=" w-full items-center justify-center rounded-xl bg-primary p-4">
              <Text className="font-nunito-bold text-xl text-foreground">Create new squad</Text>
            </Pressable>
            <View className="h-0.5 w-full items-center justify-center bg-card">
              <View className="absolute z-10 self-center bg-background px-5">
                <Text className="font-nunito-medium text-xl text-stone-400">or join existing</Text>
              </View>
            </View>
            <View className="gap-3">
              <BottomSheetTextInput
                defaultValue={circleCode}
                onChangeText={setCircleCode}
                placeholder="Enter squad code"
                keyboardType="numeric"
                placeholderTextColor={colorScheme === 'dark' ? '#dcdcdc' : '#777777'}
                className="rounded-xl bg-input px-4 py-5 text-foreground"
                //   style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
              />

              <Pressable
                disabled={!circleCode}
                onPress={joinSquad}
                className={
                  !circleCode
                    ? 'mt-1 items-center justify-center rounded-2xl bg-primary p-4 opacity-40'
                    : 'mt-1 items-center justify-center rounded-2xl bg-primary p-4'
                }>
                <Text className="font-nunito-bold text-lg sm:text-xl">Join squad</Text>
              </Pressable>
            </View>
            <Pressable
              onPress={() => {
                console.log('scanning');
                router.push('/scan');
              }}
              className="w-full items-center justify-center">
              <Text className="font-fredoka-semibold text-xl text-primary">Scan QR Code</Text>
            </Pressable>
          </View>

          {/* <View className="mb-3 flex-row gap-4 rounded-lg border border-cardborder bg-card p-2">
            <Pressable
              onPress={() => setActiveTab('create')}
              style={{
                backgroundColor:
                  activeTab === 'create'
                    ? '#292929'
                    : colorScheme === 'dark'
                      ? '#212121'
                      : '#dcdcdc',
              }}
              className="flex-1 items-center justify-center rounded-md bg-secondary  p-3">
              <Text
                style={{
                  color:
                    activeTab === 'create'
                      ? colorScheme === 'dark'
                        ? 'white'
                        : 'white'
                      : colorScheme === 'dark'
                        ? 'white'
                        : 'black',
                }}
                className="font-fredoka-semibold text-base sm:text-lg">
                CREATE
              </Text>
            </Pressable>
            <View className="h-full w-0.5 bg-input dark:bg-input" />
            <Pressable
              onPress={() => setActiveTab('join')}
              style={{
                backgroundColor:
                  activeTab === 'join' ? '#292929' : colorScheme === 'dark' ? '#212121' : '#dcdcdc',
              }}
              className="flex-1 items-center  justify-center rounded-md p-2">
              <Text
                style={{
                  color:
                    activeTab === 'join'
                      ? colorScheme === 'dark'
                        ? 'white'
                        : 'white'
                      : colorScheme === 'dark'
                        ? 'white'
                        : 'black',
                }}
                className="font-fredoka-semibold text-base sm:text-lg">
                JOIN
              </Text>
            </Pressable>
          </View>
          {activeTab === 'create' ? (
            <View>
              <View className="gap-4">
                <View className="flex-row items-center justify-between gap-5">
                  <BottomSheetTextInput
                    defaultValue={circleName}
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
                <BottomSheetTextInput
                  defaultValue={circleDescription}
                  onChangeText={setcircleDescription}
                  selectionColor={colorScheme === 'dark' ? 'white' : 'black'}
                  placeholder="Squad description here..."
                  placeholderTextColor={colorScheme === 'dark' ? '#dcdcdc' : '#4b5563'}
                  className="rounded-xl bg-input p-4 font-nunito-medium text-foreground"
                />

                <Pressable
                  disabled={!circleName}
                  onPress={finalizeSetup}
                  className={
                    !circleName
                      ? 'mt-1 items-center justify-center rounded-2xl bg-primary p-4 opacity-40'
                      : 'mt-1 items-center justify-center rounded-2xl bg-primary p-4'
                  }>
                  <Text className="font-fredoka-semibold text-lg sm:text-xl">CREATE</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View>
              <View className="gap-3">
                <BottomSheetTextInput
                  defaultValue={circleCode}
                  onChangeText={setCircleCode}
                  placeholder="What's the squad code?"
                  keyboardType="numeric"
                  placeholderTextColor={colorScheme === 'dark' ? '#dcdcdc' : '#4b5563'}
                  className="rounded-3xl bg-input p-4 text-foreground"
                  //   style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
                />

                <Pressable
                  disabled={!circleCode}
                  onPress={joinSquad}
                  className={
                    !circleCode
                      ? 'mt-1 items-center justify-center rounded-2xl bg-primary p-4 opacity-40'
                      : 'mt-1 items-center justify-center rounded-2xl bg-primary p-4'
                  }>
                  <Text className="font-nunito-bold text-lg sm:text-xl">JOIN</Text>
                </Pressable>
                <View className="mt-2 gap-2 rounded-2xl border border-cardborder p-2">
                  <AntDesign
                    name="infocirlceo"
                    size={20}
                    color={colorScheme === 'dark' ? 'white' : 'black'}
                  />
                  <Text className="font-nunito-regular text-base text-foreground sm:text-lg">
                    The study leader has to send you a code for you to join that bible study.
                  </Text>
                </View>
              </View>
            </View>
          )} */}
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
    gap: 30,
    padding: 20,
  },
});

export default CreateCircleModal;
