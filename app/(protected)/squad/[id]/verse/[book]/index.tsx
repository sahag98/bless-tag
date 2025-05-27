import { Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { Container } from '~/components/Container';
import { AntDesign } from '@expo/vector-icons';
import { useTheme } from '~/providers/theme-provider';
import { router, useLocalSearchParams } from 'expo-router';
import { Bible } from '..';

const BookIndex = () => {
  const {
    book: bookName,
    id: id,
    receiverName,
    receiverId,
    blessedId,
    streak,
  } = useLocalSearchParams();
  const bibleData: Bible = require('~/assets/nkjv.json');
  const { colorScheme } = useTheme();

  const chapters = bibleData.books.find((book) => book.name === bookName)?.chapters;
  const itemWidth = Dimensions.get('screen').width / 5 - 15;

  return (
    <View className="flex-1  p-5">
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => {
              router.back();
            }}>
            <AntDesign name="left" size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
          </Pressable>
          <Text className="font-nunito-bold text-3xl text-foreground sm:text-4xl">{bookName}</Text>
        </View>
      </View>

      <FlatList
        data={chapters}
        numColumns={5}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={{ gap: 10 }}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={{ gap: 10 }}
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() =>
              router.push(
                `/squad/${id}/verse/${bookName}/${index + 1}?receiverName=${receiverName}&receiverId=${receiverId}&blessedId=${blessedId}&streak=${streak}`
              )
            }
            style={{ width: itemWidth, aspectRatio: 1 / 1 }}
            className="flex-row  items-center justify-center rounded-xl border border-cardborder bg-card">
            <Text className="font-nunito-medium text-lg text-foreground">{index + 1}</Text>
          </Pressable>
        )}
      />
    </View>
  );
};

export default BookIndex;

const styles = StyleSheet.create({});
