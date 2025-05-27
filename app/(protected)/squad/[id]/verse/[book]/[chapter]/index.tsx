import { ActivityIndicator, ScrollView, Pressable, Text, View, Alert, Share } from 'react-native';
import React, { useState } from 'react';
// import * as Clipboard from 'expo-clipboard';
import { Container } from '~/components/Container';
import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/providers/theme-provider';
import { router, useLocalSearchParams } from 'expo-router';
import { Bible } from '../..';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { supabase } from '~/utils/supabase';
import { useAuth } from '~/providers/auth-provider';
import axios from 'axios';

const ChapterIndex = () => {
  const {
    chapter: chapterName,
    book: bookName,
    id,
    receiverName,
    receiverId,
    blessedId,
    streak,
  }: {
    chapter: string;
    book: string;
    id: string;
    receiverName: string;
    receiverId: string;
    blessedId: string;
    streak: string;
  } = useLocalSearchParams();

  const bibleData: Bible = require('~/assets/nkjv.json');

  const { colorScheme } = useTheme();

  const {
    currentUser,
    getSquad,
    setBlessedMember,
    blessedMember,
    squadMembers,
    getSquadMembers,
    squad,
  } = useAuth();

  const chapters = bibleData.books.find((book) => book.name === bookName)?.chapters;

  if (!chapters) return <ActivityIndicator />;
  const verses = chapters[Number(chapterName) - 1].verses;
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);

  // Toggle verse selection
  const toggleVerseSelection = (verseNum: number) => {
    setSelectedVerses(
      (prevSelected) =>
        prevSelected.includes(verseNum)
          ? prevSelected.filter((num) => num !== verseNum) // Deselect if already selected
          : [...prevSelected, verseNum] // Select if not already selected
    );
  };

  const sendVerse = async () => {
    if (selectedVerses.length === 0) return;

    const selectedText = selectedVerses
      .sort((a, b) => a - b) // Sort verses in order
      .map((num) => {
        const verse = verses.find((v: any) => v.num === num);
        return verse ? `${num}. ${verse.text}` : '';
      })
      .join('\n');

    const fullText = `${bookName} ${chapterName}:\n${selectedText}`;

    try {
      const { data, error } = await supabase
        .from('blessed')
        .update({ message: fullText })
        .eq('id', Number(blessedId))
        .eq('squad_id', Number(id))
        .eq('pass_id', receiverId)
        .eq('user_id', currentUser?.id!)
        .select();

      if (blessedMember && blessedMember.receiver.noti_token && data) {
        const notiMessage = {
          to: blessedMember?.receiver.noti_token,
          sound: 'default',
          title: `${squad?.name}`,
          body: `${blessedMember?.user.username} has sent you a bible verse. See what it says!`,
          data: {
            route: `/squad/${id}/view?dataId=${data[0]?.id}`,
          },
        };
        await axios.post('https://exp.host/--/api/v2/push/send', notiMessage, {
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
          })
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

        router.replace(`/squad/${id}`);
      }
    } catch (err) {
      console.error('Unexpected error in SendPrayer:', err);
    }

    // Clear selection after copying
    setSelectedVerses([]);
  };

  return (
    <View className="flex-1 p-5">
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => {
              router.back();
            }}>
            <AntDesign name="left" size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
          </Pressable>
          <Text className="font-nunito-bold text-3xl text-foreground sm:text-4xl">
            {bookName} {chapterName}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text className="font-nunito-regular text-xl leading-8">
          {verses.map((verse: any) => (
            <Text key={verse.num} onPress={() => toggleVerseSelection(verse.num)}>
              <Text
                className={`font-nunito-regular text-xl leading-8 text-foreground ${
                  selectedVerses.includes(verse.num) ? 'text-primary underline' : ''
                }`}>
                <Text className="font-nunito-bold">{verse.num}. </Text>
                <Text>{verse.text + ' '}</Text>
              </Text>
            </Text>
          ))}
        </Text>
      </ScrollView>
      {selectedVerses.length > 0 && (
        <Animated.View
          key={'bottom'}
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          className="absolute bottom-10 flex w-full  flex-row items-center gap-3 self-center">
          <Pressable
            onPress={sendVerse}
            className="w-full items-center justify-center rounded-xl bg-primary p-3">
            <Text className="font-fredoka-semibold text-2xl text-foreground">Send</Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
};

export default ChapterIndex;
