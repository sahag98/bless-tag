import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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

const SendPrayerScreen = () => {
  const { colorScheme } = useTheme();
  const { id, receiverName, receiverId, blessedId, streak } = useLocalSearchParams<{
    id: string;
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

  //   useEffect(() => {
  //     getSquad(Number(id));
  //     getSquadMembers(Number(id));
  //   }, [id]);

  async function SendPrayer() {
    try {
      const { data, error } = await supabase
        .from('blessed')
        .update({ message: prayer, updated_at: new Date().toISOString() })
        .eq('id', Number(blessedId))
        .eq('squad_id', Number(id))
        .eq('pass_id', receiverId)
        .eq('user_id', currentUser?.id!)
        .select();

      if (blessedMember && blessedMember.receiver.noti_token) {
        const message = {
          to: blessedMember?.receiver.noti_token,
          sound: 'default',
          title: `${squad?.name}`,
          body: `${blessedMember.user.username} has a prayer request. See what it says!`,
          data: {
            route: `/squad/${id}/view?dataId=${data[0]?.id}`,
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

      if (squadMembers) {
        const availableMembers = squadMembers?.filter((member) => member.user_id !== receiverId);

        if (availableMembers?.length === 0) {
          console.log('No other members available to pass to');
          return;
        }

        const randomPassIndex = Math.floor(Math.random() * availableMembers.length);
        const randomPassMember = availableMembers[randomPassIndex];

        const { data, error } = await supabase
          .from('blessed')
          .insert({
            user_id: receiverId,
            squad_id: Number(id),
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

        setBlessedMember(data);
      }

      if (error) {
        console.error('Error sending prayer:', error);
      } else {
        console.log('Prayer sent successfully:', data);

        const { data: updateData, error: updateError } = await supabase
          .from('squads')
          .update({
            blessed_id: receiverId,
            timer_start: new Date().toISOString(),
            streak: Number(streak) + 1,
          })
          .eq('id', Number(id))
          .eq('admin_id', squad?.admin_id!)
          .eq('blessed_id', squad?.blessed_id!);

        router.back();
      }
    } catch (err) {
      console.error('Unexpected error in SendPrayer:', err);
    }
  }

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

  if (!id || !receiverName || !receiverId) return;

  return (
    <View className="p-5">
      <View className="mb-8 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()}>
          <AntDesign name="close" size={30} color="grey" />
        </Pressable>
        <Pressable onPress={SendPrayer}>
          <AntDesign name="check" size={30} color="#ffac27" />
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
          <Text className="font-fredoka-semibold text-3xl text-foreground">Prayer Request</Text>
        </View>
      </View>
      <View className="gap-2">
        <TextInput
          className="rounded-xl font-nunito-medium text-xl placeholder:text-stone-400"
          value={prayer}
          multiline
          selectionColor={'#ffac27'}
          autoFocus
          placeholder={`How can ${receiverName} be in prayer for you?`}
          onChangeText={setPrayer}
        />
      </View>
    </View>
  );
};

export default SendPrayerScreen;

const styles = StyleSheet.create({});
