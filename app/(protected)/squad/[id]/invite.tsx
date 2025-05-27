import { Share, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { Container } from '~/components/Container';
import QRCode from 'react-native-qrcode-svg';
import { useLocalSearchParams } from 'expo-router';

const SquadInvite = () => {
  const { id, code } = useLocalSearchParams();

  async function shareSquad() {
    await Share.share({
      title: `Hey! Join my squad 🙌`,
      message: `Use this code to join my squad: ${code}`,
    });
    // Linking.openURL(`market://details?id=${config.androidPackageName}`);

    // Linking.openURL(`itms-apps://itunes.apple.com/app/id${config.iosItemId}`);
  }
  return (
    <Container>
      <View className="flex-1 items-center justify-between gap-12 pt-10">
        <Text className="font-fredoka-semibold text-3xl">Invite your homies</Text>
        <View className="items-center gap-5">
          <Text className="font-nunito-bold text-2xl">Scan QR Code</Text>
          <View className="rounded-2xl bg-primary p-3">
            <QRCode
              backgroundColor="#ffac27"
              color="black"
              size={220}
              value={`my-expo-app://squad/${id}/join`}
            />
          </View>
        </View>
        <View className="h-0.5 w-full items-center justify-center bg-card">
          <View className="absolute z-10 self-center bg-background px-5">
            <Text className=" font-nunito-medium text-xl text-stone-400">or</Text>
          </View>
        </View>

        <Text onPress={shareSquad} className="font-nunito-bold text-2xl text-primary">
          Share Squad Code
        </Text>
        <Text className="font-nunito-medium text-lg text-foreground">
          ⚠️ Only share this with people you trust. Anyone with the code can join your squad.
        </Text>
      </View>
    </Container>
  );
};

export default SquadInvite;

const styles = StyleSheet.create({});
