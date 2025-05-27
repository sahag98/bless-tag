import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { formatDistance, subDays } from 'date-fns';
import { Alert, FlatList, Image, Modal, Pressable, Text, View } from 'react-native';
import { useAuth } from '~/providers/auth-provider';
import {
  AntDesign,
  Entypo,
  Feather,
  FontAwesome,
  FontAwesome5,
  Fontisto,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

import { Container } from '~/components/Container';
import { Tables } from '~/database.types';
import SquadSettingsModal from '~/modals/squad-settings';
import { supabase } from '~/utils/supabase';
import { BlessedMember, Blessings, Members } from '~/types/types';
import axios from 'axios';
import { useUserStore } from '~/store/store';
import { generateUUID } from '~/utils/generateUUID';
import * as ContextMenu from 'zeego/dropdown-menu';

export default function Squad() {
  const { id } = useLocalSearchParams();
  const {
    currentUser,
    getSquad,
    getSquadMembers,
    getBlessedMember,
    getBlessings,
    getConsequences,
    blessings,
    setBlessings,
    blessedMember,
    setBlessedMember,
    squadMembers,
    squad,
    consequences,
    setSquad,
  } = useAuth();
  const [currentSquad, setCurrentSquad] = useState<Tables<'squads'> | null>(null);
  const squadSettingsModalRef = useRef<BottomSheetModal>(null);
  const [isStarting, setIsStarting] = useState(squad?.is_starting ? squad.is_starting : false);
  const [isDeciding, setIsDeciding] = useState(false);
  const { hasReadRules, history, setHasReadRules, setHistory } = useUserStore();
  const [isEnding, setIsEnding] = useState(false);
  const [isPassing, setIsPassing] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'losers'>('users');
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const squadBlessings = blessings?.filter(
    (blessing) => blessing.user_id === currentUser?.id || blessing.pass_id === currentUser?.id
  );

  const handlePresentModalPress = useCallback(() => {
    squadSettingsModalRef.current?.present();
  }, []);

  useEffect(() => {
    getSquad(Number(id));
    getSquadMembers(Number(id));
    getBlessedMember(Number(id));
    getBlessings(Number(id));
    getConsequences(Number(id));
  }, [id]);

  // Timer effect
  useEffect(() => {
    if (!squad?.timer_start) return;

    const calculateTimeRemaining = () => {
      const startTime = new Date(squad.timer_start!).getTime();
      const now = new Date().getTime();
      const startDate = new Date(startTime);

      // Get the hour and minutes from the start time
      const startHour = startDate.getHours();
      const startMinutes = startDate.getMinutes();

      // Calculate the target end time based on the start time
      let targetEndTime = new Date(startDate);

      if (startMinutes < 30) {
        // If start time is between XX:00 and XX:30, round down to XX:00
        targetEndTime.setMinutes(0, 0, 0);
      } else {
        // If start time is between XX:30 and XX:59, round up to XX+1:00
        targetEndTime.setHours(startHour + 1, 0, 0, 0);
      }

      // Add 12 hours to the target end time
      targetEndTime.setHours(targetEndTime.getHours() + 12);

      const remaining = Math.max(0, targetEndTime.getTime() - now);
      setTimeRemaining(Math.floor(remaining / 1000)); // Convert to seconds

      if (remaining === 0 && !isEnding) {
        setIsEnding(true);
        // endGame();
      }
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [squad?.timer_start]);

  async function endGame() {
    const { sound } = await Audio.Sound.createAsync(require('~/assets/losing-horn.mp3'));
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
    });
    sound.playAsync();
  }

  async function snoozeBlessed() {
    if (blessedMember) {
      const message = {
        to: blessedMember.user.noti_token,
        sound: 'default',
        title: `${squad?.name}`,
        body: `${currentUser?.username}: Don't forget to pass the blessing buddy 👊`,
        data: {
          route: `/squad/${id}`,
        },
      };

      await axios.post('https://exp.host/--/api/v2/push/send', message, {
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
      });
    }
  }

  async function startGame() {
    setHasReadRules(true);

    const { data, error } = await supabase
      .from('squads')
      .update({
        is_starting: true,
        timer_start: new Date().toISOString(), // Set the timer start time
      })
      .eq('id', Number(id));

    if (squadMembers) {
      squadMembers.map(async (m) => {
        const message = {
          to: m.profiles.noti_token,
          sound: 'default',
          title: `${squad?.name}`,
          body: `Game is starting!!`,
          data: {
            route: `/squad/${id}`,
          },
        };

        await axios.post('https://exp.host/--/api/v2/push/send', message, {
          headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
        });
      });
    }
  }
  useEffect(() => {
    const channel = supabase
      .channel('squad')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'squads', filter: `id=eq.${id}` },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            console.log('CHECK SQUAD: ', payload.new);

            if (payload.new.streak !== squad?.streak) {
              console.log('UPDATE STREAK: ', payload.new.streak);
              setSquad((prev: any) => ({
                ...prev,
                streak: payload.new.streak,
              }));
            }

            if (payload.new.loser_id) {
              getSquad(Number(id));
              console.log('LOSER IS CHOSEN!!!');
            }

            if (payload.new.is_starting) {
              setIsStarting(payload.new.is_starting);
            } else if (payload.new.has_started === true) {
              setSquad((prev: any) => ({
                ...prev,
                has_started: true,
                timer_start: payload.new.timer_start,
                blessed_id: payload.new.blessed_id,
              }));
              getBlessedMember(payload.new.id);
            } else if (payload.new.streak !== squad?.streak) {
              console.log('should add streak: ', payload.new.streak);
              setSquad((prev: any) => ({
                ...prev,
                streak: payload.new.streak,
              }));
            } else if (!payload.new.has_started) {
              console.log('GAME OVER PAYLOAD: ', payload.new);
              setSquad((prev: any) => ({
                ...prev,
                has_started: false,
                has_ended: true,
                blessed_id: null,
                timer_start: null,
                streak: 0,
              }));
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'consequences', filter: `squad_id=eq.${id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            console.log('INSERT CONSEQUENCES!!!');
            getConsequences(Number(id));

            // console.log('UPDATE COMING INNN!!!', payload.new.streak);
            setSquad((prev: any) => ({
              ...prev,
              loser_id: null,
              has_ended: false,
            }));
          }
        }
      )
      .subscribe();

    const blessChannel = supabase
      .channel('blessed')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blessed',
          filter: `squad_id=eq.${id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            getBlessings(Number(id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(blessChannel);
    };
  }, [id, blessings?.length]);

  if (!squad || !squadMembers) return;

  return (
    <>
      <Container>
        <View className="mb-8 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => router.replace('/')}>
              <AntDesign name="caretleft" size={24} color="black" />
            </Pressable>
            <Text className="font-fredoka-semibold text-3xl">{squad?.name}</Text>
          </View>
          <Pressable
            className=" px-4 py-2"
            onPress={() => squadSettingsModalRef.current?.present()}>
            <Fontisto name="more-v-a" size={24} color="black" />
          </Pressable>
        </View>
        <View style={{ height: 400 }}>
          <LinearGradient
            style={{
              width: '100%',
              padding: 20,
              justifyContent: 'space-between',
              flex: 1,
              borderRadius: 20,
            }}
            colors={['#292929', '#929292']}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}>
            {squad.has_started ? (
              <View className="flex-1 justify-between ">
                <View className="flex-row items-center justify-between">
                  <Text className="font-nunito-medium text-2xl text-background">
                    Currently Blessed 😇
                  </Text>
                  {timeRemaining !== null && currentUser?.id === squad.blessed_id && (
                    <View className="flex-row items-center gap-2 rounded-xl bg-primary px-2 py-1">
                      <MaterialCommunityIcons name="timer-outline" size={20} color="#292929" />
                      <Text className="font-nunito-semibold text-foreground">
                        {Math.floor(timeRemaining / 3600)}:
                        {Math.floor((timeRemaining % 3600) / 60)
                          .toString()
                          .padStart(2, '0')}
                        :{(timeRemaining % 60).toString().padStart(2, '0')}
                      </Text>
                    </View>
                  )}
                </View>
                <View className="mt-4 items-center gap-3">
                  <View className="flex-row items-center gap-3">
                    {blessedMember && (
                      <>
                        {blessedMember.user.avatar_url ? (
                          <Image
                            source={{ uri: blessedMember.user.avatar_url }}
                            className="size-14 rounded-full"
                          />
                        ) : (
                          <View className="size-14 items-center justify-center rounded-full bg-background">
                            <Text className="font-nunito-semibold text-xl uppercase text-primary">
                              {blessedMember.user?.username?.charAt(0)}
                              {blessedMember.user?.username?.charAt(1)}
                            </Text>
                          </View>
                        )}
                      </>
                    )}
                    {currentUser?.username === blessedMember?.user.username ? (
                      <Text className="font-fredoka-semibold text-4xl text-background">
                        IT'S YOU!!!
                      </Text>
                    ) : (
                      <Text className="font-fredoka-semibold text-4xl text-background">
                        {blessedMember?.user.username}
                      </Text>
                    )}
                  </View>
                  <AntDesign name="caretdown" size={24} color="#ffac27" />
                  <View className="flex-row items-center gap-4">
                    <>
                      {blessedMember?.receiver.avatar_url ? (
                        <Image
                          source={{ uri: blessedMember.receiver.avatar_url }}
                          className="size-14 rounded-full"
                        />
                      ) : (
                        <View className="size-14 items-center justify-center rounded-full bg-background">
                          <Text className="font-nunito-semibold text-xl uppercase text-primary">
                            {blessedMember?.receiver?.username?.charAt(0)}
                            {blessedMember?.receiver?.username?.charAt(1)}
                          </Text>
                        </View>
                      )}
                    </>
                    <Text className="mt-2 font-fredoka-semibold text-4xl text-background">
                      {blessedMember?.receiver.username}
                    </Text>
                  </View>
                </View>
                {blessedMember?.user_id === currentUser?.id ? (
                  <Pressable
                    onPress={() => setIsPassing(true)}
                    className="w-full items-center justify-center rounded-xl bg-primary p-3">
                    <View className="flex-row items-center gap-2">
                      <Text className="font-fredoka-semibold text-2xl text-foreground">
                        Pass The Blessing
                      </Text>
                    </View>
                  </Pressable>
                ) : (
                  <View className="w-full flex-row items-center gap-5">
                    <Pressable
                      onPress={snoozeBlessed}
                      className="flex-1 flex-row items-center justify-center gap-3 rounded-2xl border border-primary p-3">
                      <MaterialCommunityIcons name="hand-wave-outline" size={24} color="#ffac27" />
                      <Text className="font-nunito-bold text-lg text-primary">Snooze</Text>
                    </Pressable>
                    <Pressable className="flex-1 flex-row items-center justify-center gap-3 rounded-2xl border border-primary bg-primary p-3">
                      <MaterialCommunityIcons name="timer-outline" size={24} color="#292929" />
                      <Text className="font-nunito-bold text-lg text-secondary">
                        {timeRemaining !== null && (
                          <Text className="font-nunito-bold text-lg text-foreground">
                            {Math.floor(timeRemaining / 3600)}:
                            {Math.floor((timeRemaining % 3600) / 60)
                              .toString()
                              .padStart(2, '0')}
                            :{(timeRemaining % 60).toString().padStart(2, '0')}
                          </Text>
                        )}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ) : (
              <View className="flex-1 items-center justify-between">
                {squad.has_ended ? (
                  <>
                    <Text className="font-fredoka-semibold text-4xl text-primary">Game Over</Text>
                    <View className="items-center gap-2">
                      {squad.loser?.avatar_url ? (
                        <Image
                          source={{ uri: squad.loser?.avatar_url }}
                          className="size-20 rounded-full"
                        />
                      ) : (
                        <View className="flex-row">
                          <Text className="font-nunito-semibold text-xl uppercase sm:text-base">
                            {squad.loser?.username?.charAt(0)}
                            {squad.loser?.username?.charAt(1)}
                          </Text>
                        </View>
                      )}
                      <Text className="mt-2 font-nunito-semibold text-2xl text-background">
                        <Text className="font-fredoka-semibold">
                          {currentUser?.username === squad.loser?.username
                            ? 'You'
                            : squad.loser?.username}
                        </Text>{' '}
                        didn't pass the blessing.
                      </Text>
                    </View>
                    <Text className="mt-2 font-nunito-semibold text-xl text-background">
                      {currentUser?.id === squad.admin_id
                        ? 'Time to decide a consequence!'
                        : 'Waiting for leader to decide a consequence.'}
                    </Text>
                    {currentUser?.id === squad.admin_id && (
                      <Pressable
                        onPress={() => setIsDeciding(true)}
                        className="w-full flex-row items-center justify-center gap-4 self-end rounded-xl bg-primary p-4">
                        <Text className="font-fredoka-semibold text-xl">Decide</Text>
                      </Pressable>
                    )}
                  </>
                ) : (
                  <>
                    <Text className="font-fredoka-semibold text-4xl text-primary">
                      Game {squad.has_ended ? 'Over' : `not Started`}
                    </Text>
                    <Text className="mt-2 font-nunito-semibold text-xl text-background">
                      {currentUser?.id === squad.admin_id
                        ? 'Ready when you are, press start to begin!'
                        : 'Hang tight! It will begin soon.'}
                    </Text>
                    {squadMembers.length === 1 && (
                      <Text className="font-nunito-medium text-lg text-background">
                        Invite users to get started!
                      </Text>
                    )}
                    <Pressable
                      onPress={() => router.push(`/squad/${id}/rules`)}
                      className="w-full flex-row items-center justify-between gap-4 self-end rounded-xl bg-background p-4">
                      <Text className="font-nunito-semibold text-xl">Rules</Text>

                      <AntDesign name="questioncircleo" size={24} color="black" />
                    </Pressable>
                  </>
                )}
              </View>
            )}
          </LinearGradient>
        </View>

        <View className="flex-1">
          {!squad.has_started ? (
            <>
              <View className="mt-4 flex-row items-center gap-4">
                {currentUser?.id === squad.admin_id && (
                  <Pressable
                    disabled={squad.has_ended || squadMembers.length <= 1}
                    onPress={() => {
                      if (hasReadRules) {
                        startGame();
                      } else {
                        Alert.alert('Start Game ⚠️', 'Have you read the rules before starting?', [
                          {
                            text: 'No',
                            onPress: () => console.log('Cancel Pressed'),
                            style: 'cancel',
                          },
                          { text: 'Yes', onPress: startGame },
                        ]);
                      }
                    }}
                    className={
                      squad.has_ended || squadMembers.length <= 1
                        ? 'flex-1 flex-row items-center justify-center gap-4 rounded-xl bg-primary p-4 opacity-30'
                        : 'flex-1 flex-row items-center justify-center gap-4 rounded-xl bg-primary p-4'
                    }>
                    <Text className="font-nunito-bold text-lg">START</Text>
                    <FontAwesome name="play" size={24} color="black" />
                  </Pressable>
                )}
                <Pressable
                  onPress={() => router.push(`/squad/${id}/invite?code=${squad.code}`)}
                  className="flex-1 flex-row items-center justify-center gap-4 rounded-xl bg-card p-4">
                  <Text className="font-nunito-bold text-lg">INVITE</Text>
                  <AntDesign name="adduser" size={24} color="black" />
                </Pressable>
              </View>
              {activeTab === 'users' ? (
                <View className="mt-4  gap-4">
                  <View className={'flex-row items-center justify-center gap-3'}>
                    <Pressable
                      onPress={() => setActiveTab('users')}
                      className={
                        activeTab === 'users'
                          ? 'flex-1 flex-row items-center justify-center gap-4 rounded-xl bg-card p-2'
                          : 'flex-1 flex-row items-center justify-center gap-4 p-2'
                      }>
                      <Text className="font-fredoka-medium text-2xl">Users</Text>
                      <Feather name="user-check" size={24} color="black" />
                    </Pressable>

                    <Pressable
                      onPress={() => setActiveTab('losers')}
                      className={
                        (activeTab as 'users' | 'losers') === 'losers'
                          ? 'flex-1 flex-row items-center justify-center gap-4 rounded-xl bg-card p-2'
                          : 'flex-1 flex-row items-center justify-center gap-4 p-2'
                      }>
                      <Text className="font-fredoka-medium text-2xl">Losers</Text>
                      {/* <Feather name="user-check" size={24} color="black" /> */}
                    </Pressable>
                  </View>
                  <View className="flex-row flex-wrap items-center gap-3">
                    {squadMembers?.map((member) => (
                      <View
                        className="size-16 items-center justify-center rounded-full bg-card"
                        key={member.id}>
                        {member.profiles.avatar_url ? (
                          <Image
                            key={member.user_id}
                            source={{ uri: member.profiles.avatar_url }}
                            className="size-16 rounded-full"
                          />
                        ) : (
                          <View className="flex-row">
                            <Text className="font-nunito-semibold text-xl uppercase sm:text-base">
                              {member.profiles?.username?.charAt(0)}
                              {member.profiles?.username?.charAt(1)}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <View className="mt-4 flex-1  gap-4">
                  <View className={'flex-row items-center justify-center gap-3'}>
                    <Pressable
                      onPress={() => setActiveTab('users')}
                      className={
                        (activeTab as 'users' | 'consequences') === 'users'
                          ? 'flex-1 flex-row items-center justify-center gap-4 rounded-xl bg-card p-2'
                          : 'flex-1 flex-row items-center justify-center gap-4 p-2'
                      }>
                      <Text className="font-fredoka-medium text-2xl">Users</Text>
                      <Feather name="user-check" size={24} color="black" />
                    </Pressable>

                    <Pressable
                      onPress={() => setActiveTab('losers')}
                      className={
                        (activeTab as 'users' | 'losers') === 'losers'
                          ? 'flex-1 flex-row items-center justify-center gap-4 rounded-xl bg-card p-2'
                          : 'flex-1 flex-row items-center justify-center gap-4 p-2'
                      }>
                      <Text className="font-fredoka-medium text-2xl">Losers</Text>
                      {/* <Feather name="user-check" size={24} color="black" /> */}
                    </Pressable>
                  </View>
                  <FlatList
                    data={consequences}
                    ListEmptyComponent={() => (
                      <View className="flex-1 items-center justify-center">
                        <Text className="font-fredoka-semibold text-xl">No losers yet...</Text>
                      </View>
                    )}
                    contentContainerStyle={{ flexGrow: 1, gap: 10 }}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                      <View className="flex-row items-start gap-4 rounded-xl border border-card bg-none p-4">
                        {item.profiles?.avatar_url ? (
                          <Image
                            source={{ uri: item.profiles?.avatar_url }}
                            className="size-12 rounded-full"
                          />
                        ) : (
                          <View className="flex-row">
                            <Text className="font-nunito-semibold text-lg uppercase sm:text-base">
                              {item.profiles?.username?.charAt(0)}
                              {item.profiles?.username?.charAt(1)}
                            </Text>
                          </View>
                        )}
                        <View className="gap-2">
                          <Text className="font-nunito-semibold text-lg">
                            {item.profiles?.username}
                          </Text>
                          <Text className="font-nunito-medium text-sm">{item?.title}</Text>
                        </View>
                        <Text className="ml-auto text-xs">
                          {new Date(item.created_at).toDateString()}
                        </Text>
                      </View>
                    )}
                  />
                </View>
              )}
            </>
          ) : (
            <View className="mt-4 flex-1 gap-4 ">
              <View className="flex-row items-center justify-between">
                <Text className="font-fredoka-medium text-2xl">Your History</Text>
                <ContextMenu.Root>
                  <ContextMenu.Trigger>
                    <Pressable className="flex-row items-center gap-1 rounded-3xl border border-primary px-2 py-1">
                      <Text className="font-fredoka-medium text-lg">{squad.streak}</Text>
                      <Text className="">🔥</Text>
                    </Pressable>
                  </ContextMenu.Trigger>
                  <ContextMenu.Content>
                    <ContextMenu.Item key="1">
                      <ContextMenu.ItemTitle className="font-nunito-semibold text-sm">
                        Your squad has kept the streak alive for this many days!
                      </ContextMenu.ItemTitle>
                    </ContextMenu.Item>
                  </ContextMenu.Content>
                </ContextMenu.Root>
              </View>
              <FlatList
                scrollEventThrottle={16}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                  <View className="flex-1 items-center justify-center">
                    <Text className="font-fredoka-semibold text-xl">Nothing yet...</Text>
                  </View>
                )}
                contentContainerStyle={{ flexGrow: 1, gap: 10 }}
                data={squadBlessings?.filter((blessing) => blessing.message !== null)}
                renderItem={({ item }) => (
                  <View className="flex-row items-center gap-4 rounded-xl border border-cardborder bg-card p-2">
                    <View className="items-center gap-2">
                      {item?.user?.avatar_url ? (
                        <Image
                          source={{ uri: item.user?.avatar_url! }}
                          className="size-12 rounded-full"
                        />
                      ) : (
                        <View className="flex-row">
                          <Text className="font-nunito-semibold text-xl uppercase sm:text-base">
                            {item.user?.username?.charAt(0)}
                            {item.user?.username?.charAt(1)}
                          </Text>
                        </View>
                      )}
                      <Text className="font-nunito-semibold text-sm">Sender</Text>
                    </View>
                    <View className="h-full flex-1 self-start rounded-2xl bg-background  p-3">
                      {item.message ? (
                        <View className="gap-4">
                          <Text className="font-nunito-medium text-sm">{item.message}</Text>
                          <Text className="mt-auto font-nunito-regular text-xs text-foreground sm:text-base">
                            {formatDistance(new Date(item.updated_at), new Date(), {
                              addSuffix: true,
                            })}
                          </Text>
                        </View>
                      ) : (
                        <Text className="font-nunito-medium text-sm">
                          Hasn't passed the blessing yet!
                        </Text>
                      )}
                    </View>
                    <View className="items-center gap-2">
                      {item?.receiver?.avatar_url ? (
                        <Image
                          source={{ uri: item.receiver?.avatar_url! }}
                          className="size-12 rounded-full"
                        />
                      ) : (
                        <View className="flex-row">
                          <Text className="font-nunito-semibold text-xl uppercase sm:text-base">
                            {item.receiver?.username?.charAt(0)}
                            {item.receiver?.username?.charAt(1)}
                          </Text>
                        </View>
                      )}
                      <Text className="font-nunito-semibold text-sm">Receiver</Text>
                    </View>
                  </View>
                )}
              />
              <View></View>
            </View>
          )}
        </View>
      </Container>
      <SquadSettingsModal
        admin={squadMembers[0]!}
        created={squad?.created_at}
        squad_id={squad.id}
        bottomSheetModalRef={squadSettingsModalRef}
      />
      <StartModal
        currentUser={currentUser}
        isStarting={isStarting}
        setIsStarting={setIsStarting}
        squadId={Number(id)}
        adminId={squad.admin_id}
        squadMembers={squadMembers}
        blessedMember={blessedMember}
        setBlessedMember={setBlessedMember}
      />
      <DecideModal
        currentUser={currentUser}
        isDeciding={isDeciding}
        setIsDeciding={setIsDeciding}
        squadId={Number(id)}
        loserId={squad.loser_id}
        adminId={squad.admin_id}
        squadMembers={squadMembers}
        blessedMember={blessedMember}
        setBlessedMember={setBlessedMember}
      />
      <EndModal
        isEnding={isEnding}
        setIsEnding={setIsEnding}
        squadId={Number(id)}
        squadMembers={squadMembers}
        blessedMember={blessedMember}
        setBlessedMember={setBlessedMember}
      />
      <PassModal
        currentUser={currentUser}
        isPassing={isPassing}
        setIsPassing={setIsPassing}
        squadId={Number(id)}
        squadStreak={squad.streak!}
        squadMembers={squadMembers}
        blessedMember={blessedMember}
        setBlessedMember={setBlessedMember}
      />
    </>
  );
}

const StartModal = ({
  currentUser,
  isStarting,
  setIsStarting,

  squadId,
  adminId,
  squadMembers,
  blessedMember,
  setBlessedMember,
}: {
  currentUser: Tables<'profiles'> | null;
  isStarting: boolean;
  setIsStarting: React.Dispatch<React.SetStateAction<boolean>>;

  squadId: number;
  adminId: string;
  squadMembers: Members[];
  blessedMember: BlessedMember | null;
  setBlessedMember: React.Dispatch<React.SetStateAction<BlessedMember | null>>;
}) => {
  const [countdown, setCountdown] = useState(3);
  const [sound, setSound] = useState<Audio.Sound>();

  useEffect(() => {
    // Load the sound
    const loadSound = async () => {
      const { sound } = await Audio.Sound.createAsync(require('~/assets/horn-sound-2.mp3'));
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
      });
      setSound(sound);
    };
    loadSound();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (isStarting) {
      if (countdown > 0) {
        const timer = setTimeout(() => {
          setCountdown(countdown - 1);
        }, 1000);
        return () => clearTimeout(timer);
      } else if (countdown === 0) {
        const timer = setTimeout(async () => {
          if (sound) {
            await sound.replayAsync();
          }
          setIsStarting(false);

          if (currentUser?.id === adminId) {
            console.log('admin starting game');
            updateGame();
          }
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [countdown, isStarting, sound]);

  async function updateGame() {
    if (!squadMembers || squadMembers.length === 0) return;

    // Get a random member from the squad
    const randomIndex = Math.floor(Math.random() * squadMembers.length);
    const randomMember = squadMembers[randomIndex];

    const availableMembers = squadMembers.filter((member) => member.user_id !== currentUser?.id);

    if (availableMembers.length === 0) {
      console.log('No other members available to pass to');
      return;
    }

    const randomPassIndex = Math.floor(Math.random() * availableMembers.length);
    const randomPassMember = availableMembers[randomPassIndex];

    const uuid = await generateUUID();
    const newBlessing = {
      id: Number(uuid),
      created_at: new Date().toISOString(),
      user_id: String(currentUser?.id),
      squad_id: squadId,
      pass_id: randomPassMember.user_id,
      message: '',
      user: {
        avatar_url: currentUser?.avatar_url ?? null,
        username: currentUser?.username ?? '',
      },
      receiver: {
        avatar_url: randomPassMember?.profiles.avatar_url,
        username: randomPassMember?.profiles.username,
      },
    };

    await supabase
      .from('squads')
      .update({
        is_starting: false,
        has_started: true,
        blessed_id: currentUser?.id,
      })
      .eq('id', squadId);

    const { data, error } = await supabase
      .from('blessed')
      .insert({
        user_id: String(currentUser?.id),
        squad_id: squadId,
        pass_id: randomPassMember.user_id,
        updated_at: new Date().toISOString(),
      })
      .select(
        `
    *,
    user:profiles!blessed_user_id_fkey(*),
    receiver:profiles!blessed_pass_id_fkey(*)
  `
      )
      .single();

    console.log('blessed error: ', error);
    //@ts-ignore
    setBlessedMember(data);
    setCountdown(3);
    // console.log('data: ', JSON.stringify(data, null, 2));
  }

  return (
    <Modal animationType="fade" visible={isStarting} transparent>
      <View className="flex-1 items-center justify-center bg-black/50">
        <LinearGradient
          style={{
            width: '85%',
            padding: 20,
            justifyContent: 'center',
            alignItems: 'center',
            aspectRatio: 1 / 1,
            borderRadius: 20,
          }}
          colors={['#292929', '#929292']}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}>
          <Text className="font-nunito-semibold text-3xl text-background">Starting in...</Text>
          <Text className="mt-4 font-fredoka-bold text-7xl text-primary">
            {countdown === 0 ? "LET'S GO!" : countdown}
          </Text>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const DecideModal = ({
  currentUser,
  isDeciding,
  setIsDeciding,
  loserId,
  squadId,
  adminId,
  squadMembers,
  blessedMember,
  setBlessedMember,
}: {
  currentUser: Tables<'profiles'> | null;
  isDeciding: boolean;
  setIsDeciding: React.Dispatch<React.SetStateAction<boolean>>;
  loserId: string | null;
  squadId: number;
  adminId: string;
  squadMembers: Members[];
  blessedMember: BlessedMember | null;
  setBlessedMember: React.Dispatch<React.SetStateAction<BlessedMember | null>>;
}) => {
  const [countdown, setCountdown] = useState(3);
  const [sound, setSound] = useState<Audio.Sound>();

  async function updateGame() {
    if (!squadMembers || squadMembers.length === 0) return;

    // Get a random member from the squad
    const randomIndex = Math.floor(Math.random() * squadMembers.length);
    const randomMember = squadMembers[randomIndex];

    const availableMembers = squadMembers.filter((member) => member.user_id !== currentUser?.id);

    if (availableMembers.length === 0) {
      console.log('No other members available to pass to');
      return;
    }

    const randomPassIndex = Math.floor(Math.random() * availableMembers.length);
    const randomPassMember = availableMembers[randomPassIndex];

    const uuid = await generateUUID();
    const newBlessing = {
      id: Number(uuid),
      created_at: new Date().toISOString(),
      user_id: String(currentUser?.id),
      squad_id: squadId,
      pass_id: randomPassMember.user_id,
      message: '',
      user: {
        avatar_url: currentUser?.avatar_url ?? null,
        username: currentUser?.username ?? '',
      },
      receiver: {
        avatar_url: randomPassMember?.profiles.avatar_url,
        username: randomPassMember?.profiles.username,
      },
    };

    await supabase
      .from('squads')
      .update({
        is_starting: false,
        has_started: true,
        blessed_id: currentUser?.id,
      })
      .eq('id', squadId);

    const { data, error } = await supabase
      .from('blessed')
      .insert({
        user_id: String(currentUser?.id),
        squad_id: squadId,
        pass_id: randomPassMember.user_id,
        updated_at: new Date().toISOString(),
      })
      .select(
        `
    *,
    user:profiles!blessed_user_id_fkey(*),
    receiver:profiles!blessed_pass_id_fkey(*)
  `
      )
      .single();

    console.log('blessed error: ', error);
    //@ts-ignore
    setBlessedMember(data);
    setCountdown(3);
    // console.log('data: ', JSON.stringify(data, null, 2));
  }

  return (
    <Modal animationType="fade" visible={isDeciding} transparent>
      <View className="flex-1 items-center justify-center bg-black/75">
        <LinearGradient
          style={{
            width: '85%',
            padding: 20,
            justifyContent: 'center',
            alignItems: 'center',
            aspectRatio: 1 / 1,
            borderRadius: 20,
          }}
          colors={['#292929', '#929292']}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}>
          <View className="gap-2">
            <Text className="font-fredoka-semibold text-2xl text-background">
              What will be the consequence?
            </Text>
            <Text className="font-nunito-medium text-lg text-background">
              Remember, this consequence needs to be done for everyone.
            </Text>
          </View>
          <View className="mt-auto w-full flex-row gap-3">
            <Pressable
              onPress={async () => {
                setIsDeciding(false);
                await supabase
                  .from('squads')
                  .update({ loser_id: null, has_ended: false })
                  .eq('id', squadId);
                const { data, error } = await supabase
                  .from('consequences')
                  .insert({ title: 'Buy snacks', user_id: loserId, squad_id: squadId });
              }}
              className="flex-1 items-center justify-center gap-1 rounded-lg bg-primary p-2">
              <Ionicons name="fast-food-outline" size={24} color="#292929" />
              <Text className="font-nunito-semibold">Buy snacks</Text>
            </Pressable>
            <Pressable
              onPress={async () => {
                setIsDeciding(false);
                await supabase
                  .from('squads')
                  .update({ loser_id: null, has_ended: false })
                  .eq('id', squadId);
                const { data, error } = await supabase
                  .from('consequences')
                  .insert({ title: 'Bring a gift', user_id: loserId, squad_id: squadId });
              }}
              className="flex-1 items-center justify-center gap-1 rounded-lg bg-primary p-2">
              <AntDesign name="gift" size={24} color="#292929" />
              <Text className="font-nunito-semibold">Bring a gift</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={async () => {
              setIsDeciding(false);
              await supabase
                .from('squads')
                .update({ loser_id: null, has_ended: false })
                .eq('id', squadId);
              const { data, error } = await supabase
                .from('consequences')
                .insert({ title: 'Do a favor', user_id: loserId, squad_id: squadId });
            }}
            className="mt-3 w-full items-center justify-center gap-1 rounded-lg bg-primary p-2">
            <MaterialIcons name="favorite-border" size={24} color="#292929" />
            <Text className="font-nunito-semibold">Do a favor</Text>
          </Pressable>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const EndModal = ({
  isEnding,
  setIsEnding,
  squadId,
  squadMembers,
  blessedMember,
  setBlessedMember,
}: {
  isEnding: boolean;
  setIsEnding: React.Dispatch<React.SetStateAction<boolean>>;
  squadId: number;
  squadMembers: any[];
  blessedMember: BlessedMember | null;
  setBlessedMember: React.Dispatch<React.SetStateAction<BlessedMember | null>>;
}) => {
  const [countdown, setCountdown] = useState(3);
  const [sound, setSound] = useState<Audio.Sound>();

  return (
    <Modal animationType="fade" visible={isEnding} transparent>
      <View className="flex-1 items-center justify-center bg-black/50">
        <LinearGradient
          style={{
            width: '85%',
            padding: 20,
            justifyContent: 'center',
            alignItems: 'center',
            aspectRatio: 1 / 1,
            borderRadius: 20,
          }}
          colors={['#292929', '#929292']}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}>
          <Pressable
            className="absolute right-4 top-4 items-center justify-center rounded-full bg-primary"
            onPress={() => setIsEnding(false)}>
            <AntDesign name="closecircle" size={40} color="black" />
          </Pressable>
          <Text className="font-fredoka-semibold text-5xl text-primary">Game Over...</Text>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const PassModal = ({
  currentUser,
  isPassing,
  setIsPassing,
  squadId,
  squadStreak,
  squadMembers,
  blessedMember,
  setBlessedMember,
}: {
  currentUser: Tables<'profiles'> | null;

  isPassing: boolean;
  setIsPassing: React.Dispatch<React.SetStateAction<boolean>>;
  squadId: number;
  squadStreak: number;
  squadMembers: Members[];
  blessedMember: BlessedMember | null;
  setBlessedMember: React.Dispatch<React.SetStateAction<BlessedMember | null>>;
}) => {
  const [countdown, setCountdown] = useState(3);
  const [sound, setSound] = useState<Audio.Sound>();
  const [passingMember, setPassingMember] = useState<Members | null>(null);
  // useEffect(() => {
  //   if (isPassing) {
  //     async function initalizePassing() {
  //       // Filter out the current user from available members
  //       const availableMembers = squadMembers.filter(
  //         (member) => member.user_id !== currentUser?.id
  //       );

  //       // If there are no other members, handle this case
  //       if (availableMembers.length === 0) {
  //         console.log('No other members available to pass to');
  //         setIsPassing(false);
  //         return;
  //       }

  //       const randomIndex = Math.floor(Math.random() * availableMembers.length);
  //       const randomMember = availableMembers[randomIndex];
  //       console.log('random me: ', randomMember);
  //       setPassingMember(randomMember);
  //       await supabase
  //         .from('squads')
  //         .update({
  //           is_starting: false,
  //           has_started: true,
  //           blessed_id: randomMember.user_id,
  //         })
  //         .eq('id', squadId);
  //     }
  //     initalizePassing();
  //   }
  // }, []);

  // useEffect(() => {
  //   // Load the sound
  //   const loadSound = async () => {
  //     const { sound } = await Audio.Sound.createAsync(require('~/assets/horn-sound-2.mp3'));
  //     await Audio.setAudioModeAsync({
  //       playsInSilentModeIOS: true,
  //     });
  //     setSound(sound);
  //   };
  //   loadSound();

  //   return () => {
  //     if (sound) {
  //       sound.unloadAsync();
  //     }
  //   };
  // }, []);

  // useEffect(() => {
  //   if (isStarting) {
  //     if (countdown > 0) {
  //       const timer = setTimeout(() => {
  //         setCountdown(countdown - 1);
  //       }, 1000);
  //       return () => clearTimeout(timer);
  //     } else if (countdown === 0) {
  //       const timer = setTimeout(async () => {
  //         if (sound) {
  //           await sound.replayAsync();
  //         }
  //         setIsStarting(false);
  //         updateGame();
  //       }, 2000);
  //       return () => clearTimeout(timer);
  //     }
  //   }
  // }, [countdown, isStarting, sound]);

  async function updateGame() {
    if (!squadMembers || squadMembers.length === 0) return;

    // Get a random member from the squad
    const randomIndex = Math.floor(Math.random() * squadMembers.length);
    const randomMember = squadMembers[randomIndex];

    // Update the squad with the random member's user_id as blessed_id
    await supabase
      .from('squads')
      .update({
        is_starting: false,
        has_started: true,
        blessed_id: randomMember.user_id,
      })
      .eq('id', squadId);

    const { data, error } = await supabase
      .from('blessed')
      .insert({ user_id: randomMember.user_id, squad_id: squadId })
      .select(
        `
    *,
    user:profiles!blessed_user_id_fkey(*),
    receiver:profiles!blessed_pass_id_fkey(*)
  `
      )
      .single();

    //@ts-ignore
    setBlessedMember(data);
    setCountdown(3);
  }

  return (
    <Modal animationType="fade" visible={isPassing} transparent>
      <View className="flex-1 items-center justify-center bg-black/50">
        {/* <LinearGradient
          style={{
            width: '85%',
            padding: 20,
            justifyContent: 'between',
            alignItems: 'center',
            aspectRatio: 1 / 1,
            borderRadius: 20,
          }}
          colors={['#292929', '#929292']}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}> */}
        <View className="w-5/6 items-center justify-between rounded-2xl bg-background p-5">
          <Pressable
            className="items-center justify-center self-end rounded-full"
            onPress={() => setIsPassing(false)}>
            <AntDesign name="close" size={30} color="black" />
          </Pressable>
          <Text className="my-4 text-left font-nunito-medium text-2xl text-foreground">
            You will have to pass it to...
          </Text>
          {blessedMember?.receiver.avatar_url ? (
            <Image
              source={{ uri: blessedMember?.receiver.avatar_url }}
              className="size-20 rounded-full"
            />
          ) : (
            <View className="flex-row">
              <Text className="font-nunito-semibold text-xl uppercase sm:text-base">
                {blessedMember?.receiver.username?.charAt(0)}
                {blessedMember?.receiver.username?.charAt(1)}
              </Text>
            </View>
          )}
          <Text className="my-4 font-fredoka-bold text-3xl text-foreground">
            {blessedMember?.receiver.username}
          </Text>
          <View className="mt-auto w-full  flex-row gap-3">
            <Pressable
              onPress={() => {
                router.push(
                  `/(protected)/squad/${squadId}/prayer?receiverName=${blessedMember?.receiver.username}&receiverId=${blessedMember?.receiver.id}&blessedId=${blessedMember?.id}&streak=${squadStreak}`
                );

                setIsPassing(false);
              }}
              className="flex-1 items-center justify-center gap-1 rounded-lg bg-primary p-2">
              <MaterialCommunityIcons name="hands-pray" size={24} color="#292929" />
              <Text className="font-nunito-semibold">Prayer Request</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                router.push(
                  `/(protected)/squad/${squadId}/verse?receiverName=${blessedMember?.receiver.username}&receiverId=${blessedMember?.receiver.id}&blessedId=${blessedMember?.id}&streak=${squadStreak}`
                );

                setIsPassing(false);
              }}
              className="flex-1 items-center justify-center gap-1 rounded-lg bg-primary p-2">
              <FontAwesome5 name="bible" size={24} color="#292929" />
              <Text className="font-nunito-semibold">Bible Verse</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => {
              router.push(
                `/(protected)/squad/${squadId}/encourage?receiverName=${blessedMember?.receiver.username}&receiverId=${blessedMember?.receiver.id}&blessedId=${blessedMember?.id}&streak=${squadStreak}`
              );

              setIsPassing(false);
            }}
            className="mt-3 w-full items-center justify-center gap-1 rounded-lg bg-primary p-2">
            <FontAwesome name="handshake-o" size={24} color="#292929" />
            <Text className="font-nunito-semibold">Encouragement</Text>
          </Pressable>
        </View>
        {/* </LinearGradient> */}
      </View>
    </Modal>
  );
};
