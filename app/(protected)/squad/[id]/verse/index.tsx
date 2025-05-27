import { FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Container } from '~/components/Container';
import { useTheme } from '~/providers/theme-provider';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '~/utils/supabase';
import { Tables } from '~/database.types';
import { AntDesign, Feather } from '@expo/vector-icons';
import { useAuth } from '~/providers/auth-provider';
import { useUserStore } from '..../../store/store';

export type Book = {
  name: string;
  chapters: any[];
};

export type Bible = {
  version: string;
  books: Book[];
};

const SendVerseScreen = () => {
  const { colorScheme } = useTheme();
  const bibleData: Bible = require('~/assets/nkjv.json');

  const { id, receiverName, receiverId, blessedId, streak } = useLocalSearchParams<{
    id: string;
    receiverName: string;
    receiverId: string;
    blessedId: string;
    streak: string;
  }>();

  const { currentUser, getSquad, setBlessedMember, squadMembers, getSquadMembers, squad } =
    useAuth();
  //   const [message, setMessage] = useState('');
  const { fetchSquads } = useUserStore();

  //   async function SendEcouragement() {
  //     try {
  //       const { data, error } = await supabase
  //         .from('blessed')
  //         .update({ message: message })
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
  //         console.log('pass insert error: ', error);
  //         console.log('pass insert data: ', data);
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
  //         console.log('update error: ', updateError);
  //         router.back();
  //       }
  //     } catch (err) {
  //       console.error('Unexpected error in SendPrayer:', err);
  //     }
  //   }

  if (!id || !receiverName || !receiverId) return;

  return (
    <View className="flex-1  p-5">
      <View className="mb-8 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()}>
          <AntDesign name="close" size={30} color="grey" />
        </Pressable>
      </View>
      <FlatList
        data={bibleData.books}
        style={{ flex: 1 }}
        className="flex-1"
        contentContainerClassName=""
        keyExtractor={(_, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 10 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push(
                `/squad/${id}/verse/${item.name}?receiverName=${receiverName}&receiverId=${receiverId}&blessedId=${blessedId}&streak=${streak}`
              )
            }
            className="flex-row items-center justify-between rounded-2xl border border-cardborder bg-card p-4">
            <Text className="font-nunito-semibold text-lg text-foreground">{item.name}</Text>

            <AntDesign
              name="right"
              size={18}
              color={colorScheme === 'dark' ? 'darkgrey' : 'darkgrey'}
            />
          </Pressable>
        )}
      />
    </View>
  );
};

export default SendVerseScreen;

const styles = StyleSheet.create({});
