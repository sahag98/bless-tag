import { Image, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Container } from '~/components/Container';
import { useTheme } from '~/providers/theme-provider';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '~/utils/supabase';
import { Tables } from '~/database.types';
import { AntDesign, Feather } from '@expo/vector-icons';
import { useAuth } from '~/providers/auth-provider';
import { useUserStore } from '../../../../store/store';
import axios from 'axios';

const ViewBlessingScreen = () => {
  const { colorScheme } = useTheme();
  const { id, dataId, receiverName, receiverId, blessedId, streak } = useLocalSearchParams<{
    id: string;
    dataId: string;
    receiverName: string;
    receiverId: string;
    blessedId: string;
    streak: string;
  }>();

  const {
    currentUser,
    getSquad,
    blessedMember,
    setBlessedMember,
    squadMembers,
    getSquadMembers,
    squad,
  } = useAuth();
  const [newDescription, setNewDescription] = useState(squad?.description);
  const [prayer, setPrayer] = useState('');
  const { fetchSquads } = useUserStore();
  const [blessing, setBlessing] = useState(null);

  useEffect(() => {
    async function getBlessingMessage() {
      const { data, error } = await supabase
        .from('blessed')
        .select(
          `
    *,
    user:profiles!blessed_user_id_fkey(*),
    receiver:profiles!blessed_pass_id_fkey(*)
  `
        )
        .eq('id', Number(dataId))
        .single();

      setBlessing(data);
    }
    getBlessingMessage();
  }, [id]);

  //   useEffect(() => {
  //     getSquad(Number(id));
  //     getSquadMembers(Number(id));
  //   }, [id]);

  //   async function SendPrayer() {
  //     try {
  //       const { data, error } = await supabase
  //         .from('blessed')
  //         .update({ message: prayer })
  //         .eq('id', Number(blessedId))
  //         .eq('squad_id', Number(id))
  //         .eq('pass_id', receiverId)
  //         .eq('user_id', currentUser?.id!); // Non-null assertion is okay if you're sure it's always defined

  //       if (squadMembers) {
  //         const availableMembers = squadMembers?.filter((member) => member.user_id !== receiverId);

  //         if (availableMembers?.length === 0) {
  //           console.log('No other members available to pass to');
  //           return;
  //         }

  //         const randomPassIndex = Math.floor(Math.random() * availableMembers.length);
  //         const randomPassMember = availableMembers[randomPassIndex];

  //         const { data, error } = await supabase
  //           .from('blessed')
  //           .insert({
  //             user_id: receiverId,
  //             squad_id: Number(id),
  //             pass_id: randomPassMember.user_id,
  //           })
  //           .select(
  //             `
  //     *,
  //     user:profiles!blessed_user_id_fkey(*),
  //     receiver:profiles!blessed_pass_id_fkey(*)
  //   `
  //           )
  //           .single();

  //         setBlessedMember(data);
  //       }

  //       if (error) {
  //         console.error('Error sending prayer:', error);
  //       } else {
  //         console.log('Prayer sent successfully:', data);

  //         const { data: updateData, error: updateError } = await supabase
  //           .from('squads')
  //           .update({
  //             blessed_id: receiverId,
  //             timer_start: new Date().toISOString(),
  //             streak: Number(streak) + 1,
  //           })
  //           .eq('id', Number(id))
  //           .eq('admin_id', squad?.admin_id!)
  //           .eq('blessed_id', squad?.blessed_id!);

  //         const message = {
  //           to: blessedMember?.receiver.noti_token,
  //           sound: 'default',
  //           title: `${squad?.name}`,
  //           body: `${blessedMember.user.username} has blessed you. See what it says!`,
  //           data: {
  //             route: `/squad/${id}/view`,
  //           },
  //         };

  //         await axios.post('https://exp.host/--/api/v2/push/send', message, {
  //           headers: {
  //             Accept: 'application/json',
  //             'Accept-encoding': 'gzip, deflate',
  //             'Content-Type': 'application/json',
  //           },
  //         });

  //         router.back();
  //       }
  //     } catch (err) {
  //       console.error('Unexpected error in SendPrayer:', err);
  //     }
  //   }

  //   async function updateSquadInfo() {
  //     const { data, error } = await supabase
  //       .from('squads')
  //       .update({ name: newName, description: newDescription })
  //       .eq('id', Number(id))
  //       .eq('admin_id', currentUser?.id!);
  //     getSquad(Number(id));
  //     fetchSquads(currentUser.id);
  //     router.back();
  //   }

  //   useEffect(() => {
  //     getSquad(Number(id));
  //   }, [id]);

  if (!id || !dataId || !blessing) return;

  return (
    <View className="p-5">
      <View className="mb-8 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()}>
          <AntDesign name="close" size={30} color="grey" />
        </Pressable>
      </View>
      <View className="mb-5 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          {Platform.OS === 'android' && (
            <Pressable
              onPress={() => {
                router.back();
              }}>
              <AntDesign name="left" size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
            </Pressable>
          )}
        </View>
      </View>
      <View className="w-full gap-4">
        <View className="flex-row items-center gap-4">
          {blessing?.user.avatar_url ? (
            <Image source={{ uri: blessing?.user.avatar_url }} className="size-12 rounded-full" />
          ) : (
            <View className="size-12 items-center justify-center rounded-full bg-background">
              <Text className="font-nunito-semibold text-xl uppercase text-primary">
                {blessing?.user?.username?.charAt(0)}
                {blessing?.user?.username?.charAt(1)}
              </Text>
            </View>
          )}
          <Text className="font-fredoka-semibold text-3xl text-foreground">
            {blessing?.user.username}
          </Text>
        </View>
        <Text className="font-nunito-semibold text-lg">Sent you this:</Text>
        <View className="rounded-lg bg-card p-3">
          <Text className="text-left font-nunito-medium text-foreground">{blessing?.message}</Text>
        </View>
      </View>
    </View>
  );
};

export default ViewBlessingScreen;

const styles = StyleSheet.create({});
