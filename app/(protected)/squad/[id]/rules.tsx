import { StyleSheet, Text, ScrollView, View } from 'react-native';
import React from 'react';
import { Container } from '~/components/Container';
import QRCode from 'react-native-qrcode-svg';
import { useLocalSearchParams } from 'expo-router';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const SquadInvite = () => {
  const { id } = useLocalSearchParams();
  return (
    <View className="flex-1 p-2.5">
      <View className="flex-1 items-center gap-5">
        <Text className="font-fredoka-semibold text-3xl">Game Rules 🚩</Text>
        <ScrollView className="rounded-xl bg-card p-2" showsVerticalScrollIndicator={false}>
          <View className="gap-2">
            <View className="items-start gap-3 rounded-xl bg-background p-3 shadow-stone-200">
              <View className="flex-row items-center gap-3">
                <View className="size-12 items-center justify-center rounded-full bg-primary">
                  <Text className="font-fredoka-semibold text-xl">1</Text>
                </View>
                <Text className="font-fredoka-semibold text-xl">Game Start</Text>
              </View>
              <View>
                <Text className="font-nunito-semibold text-lg">
                  Once the leader starts the game, a random member will be "blessed".
                </Text>
              </View>
            </View>
            <View className="items-start gap-3 rounded-xl bg-background p-3 shadow-stone-200">
              <View className="flex-row items-center gap-3">
                <View className="size-12 items-center justify-center rounded-full bg-primary">
                  <Text className="font-fredoka-semibold text-xl">2</Text>
                </View>
                <Text className="font-fredoka-semibold text-xl">Time Limit</Text>
              </View>
              <View>
                <Text className="font-nunito-semibold text-lg">
                  This member has 12 hours to pass this blessing to another member.
                </Text>
              </View>
            </View>
            <View className="items-start gap-3 rounded-xl bg-background p-3 shadow-stone-200">
              <View className="flex-row items-center gap-3">
                <View className="size-12 items-center justify-center rounded-full bg-primary">
                  <Text className="font-fredoka-semibold text-xl">3</Text>
                </View>
                <Text className="font-fredoka-semibold text-xl">Pass It Along</Text>
              </View>

              <Text className="font-nunito-semibold text-lg">
                Pass a blessing by sending one of these:
              </Text>
              <View>
                <View className="w-full flex-row gap-3">
                  <View className="flex-1 items-center justify-center gap-1 rounded-lg bg-card p-2">
                    <MaterialCommunityIcons name="hands-pray" size={24} color="black" />
                    <Text className="font-nunito-semibold">Prayer Request</Text>
                  </View>
                  <View className="flex-1 items-center justify-center gap-1 rounded-lg bg-card p-2">
                    <FontAwesome5 name="bible" size={24} color="black" />
                    <Text className="font-nunito-semibold">Bible Verse</Text>
                  </View>
                  <View className="flex-1 items-center justify-center gap-1 rounded-lg bg-card p-2">
                    <FontAwesome name="handshake-o" size={24} color="black" />
                    <Text className="font-nunito-semibold">Encouragement</Text>
                  </View>
                </View>
              </View>
              <Text className="font-nunito-semibold text-lg">
                This will continue until someone forgets to pass the "blessing".
              </Text>
            </View>
            <View className="items-start gap-3 rounded-xl bg-background p-3 shadow-stone-200">
              <View className="flex-row items-center gap-3">
                <View className="size-12 items-center justify-center rounded-full bg-primary">
                  <Text className="font-fredoka-semibold text-xl">4</Text>
                </View>
                <Text className="font-fredoka-semibold text-xl">Consequences</Text>
              </View>

              <Text className="font-nunito-semibold text-lg">
                Whoever forgets must do ONE of these for ALL members:
              </Text>
              <View>
                <View className="w-full flex-row gap-3">
                  <View className="flex-1 items-center justify-center gap-1 rounded-lg bg-card p-2">
                    <Ionicons name="fast-food-outline" size={24} color="black" />
                    <Text className="text-center font-nunito-semibold">Buy snacks</Text>
                  </View>
                  <View className="flex-1 items-center justify-center gap-1 rounded-lg bg-card p-2">
                    <AntDesign name="gift" size={24} color="black" />
                    <Text className="text-center font-nunito-semibold">Bring a gift</Text>
                  </View>
                  <View className="flex-1 items-center justify-center gap-1 rounded-lg bg-card p-2">
                    <MaterialIcons name="favorite-border" size={24} color="black" />
                    <Text className="text-center font-nunito-semibold">Do a favor</Text>
                  </View>
                </View>
              </View>
              <Text className="text-center font-nunito-semibold text-lg">
                Or create your own consequence!
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default SquadInvite;

const styles = StyleSheet.create({});
