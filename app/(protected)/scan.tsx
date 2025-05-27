import { useRef, useState } from 'react';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { supabase } from '~/utils/supabase';
import { useAuth } from '~/providers/auth-provider';

export default function ScanQRCode() {
  const [permission, requestPermission] = useCameraPermissions();
  const { currentUser } = useAuth();
  const router = useRouter();

  const [qrCodeDetected, setQrCodeDetected] = useState<string>('');
  const [joinSquadId, setJoinSquadId] = useState('');
  const [joinSquadName, setJoinSquadName] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center gap-4 p-4">
        <Image source={require('~/assets/scan.png')} style={{ width: 250, height: 250 }} />
        <Text className="w-4/5 text-center font-nunito-semibold text-lg">
          We need permission to use the camera and scan the QR Code.
        </Text>
        <Pressable
          className="w-full items-center justify-center rounded-xl bg-primary p-4"
          onPress={requestPermission}>
          <Text className="font-fredoka-semibold text-lg">Grant permission</Text>
        </Pressable>
      </View>
    );
  }

  const handleConfirmJoinList = async () => {
    const { data, error } = await supabase
      .from('members')
      .insert({
        squad_id: Number(joinSquadId),
        user_id: currentUser?.id!,
        is_admin: false,
        squad_name: joinSquadName,
      })
      .select();

    if (data && !error) {
      router.replace(`/squad/${joinSquadId}`);
    }
    // if (router.canDismiss()) {
    //   router.dismiss();
    // }
    // router.push({
    //   pathname: '/list/[listId]',
    //   params: { listId: qrCodeDetected },
    // });
  };

  const handleBarcodeScanned = async (barcodeScanningResult: BarcodeScanningResult) => {
    const qrCodeUrl = barcodeScanningResult.data;

    console.log('qr code url: ', qrCodeUrl);

    // Extract listId from QR code URL
    const listIdMatch = qrCodeUrl.match(/\/squad\/(\d+)\/join/);

    if (listIdMatch) {
      const squadId = listIdMatch[1];
      console.log(squadId);

      const { data, error } = await supabase
        .from('squads')
        .select()
        .eq('id', Number(squadId))
        .single();
      console.log('SQUAD IS AVAILABLE: ', data);

      if (data) {
        setJoinSquadId(squadId);
        setJoinSquadName(data.name);
        setQrCodeDetected(squadId);
      } else {
        return;
      }

      // setQrCodeDetected(listId);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setQrCodeDetected('');
      }, 1000);
    }
  };

  return (
    <CameraView
      style={styles.camera}
      facing="back"
      barcodeScannerSettings={{
        barcodeTypes: ['qr'],
      }}
      onBarcodeScanned={handleBarcodeScanned}>
      <View style={styles.contentContainer}>
        {qrCodeDetected ? (
          <View className="w-4/5 items-center justify-center gap-4 rounded-2xl bg-primary p-4">
            <Text className="text-center font-fredoka-medium text-2xl text-foreground">
              🥳 QR code detected!!!
            </Text>
            <Pressable
              className="w-full items-center justify-center rounded-xl bg-background p-4"
              onPress={handleConfirmJoinList}>
              <Text className="font-fredoka-semibold text-xl">Join squad</Text>
            </Pressable>
          </View>
        ) : (
          <View className="w-4/5 items-center justify-center rounded-2xl bg-primary px-4 py-2">
            <Text className="text-center font-fredoka-medium text-xl text-foreground">
              Point the camera at a valid squad QR Code.
            </Text>
          </View>
        )}
      </View>
    </CameraView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  camera: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  detectedContainer: {
    backgroundColor: 'black',
    borderRadius: 10,
    padding: 30,
  },

  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  detectedText: {
    color: 'white',
    marginBottom: 16,
  },
  instructionText: {
    color: 'white',
  },
});
