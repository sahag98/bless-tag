import {
  Alert,
  FlatList,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import React, { useState } from 'react';
import { Container } from '~/components/Container';
import { router } from 'expo-router';
import { AntDesign, Entypo, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '~/providers/auth-provider';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '~/utils/supabase';
import { useUserStore } from '~/store/store';
import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { useTheme } from '~/providers/theme-provider';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImageManipulator from 'expo-image-manipulator';

const blurhash = 'L1QvwR-;fQ-;~qfQfQfQfQfQfQfQ';

const EditProfile = () => {
  const { colorScheme } = useTheme();
  const [profileImg, setProfileImg] = useState('');
  const [uploading, setUploading] = useState(false);
  const { currentUser, setCurrentUser } = useAuth();
  const [newUsername, setNewUsername] = useState(currentUser?.username);
  const [img, setImg] = useState<ImagePicker.ImagePickerAsset>();

  async function updateUser() {
    if (profileImg) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ username: newUsername, avatar_url: profileImg })
        .eq('id', currentUser?.id!)
        .select()
        .single();

      setCurrentUser(data);
    } else {
      const { data, error } = await supabase
        .from('profiles')
        .update({ username: newUsername })
        .eq('id', currentUser?.id!)
        .select()
        .single();

      setCurrentUser(data);
    }

    router.back();
  }

  async function downloadImage(path: string) {
    try {
      const { data, error } = await supabase.storage.from('avatars').download(path);

      if (error) {
        throw error;
      }

      const fr = new FileReader();
      fr.readAsDataURL(data);
      fr.onload = () => {
        setProfileImg(fr.result as string);
      };
    } catch (error) {
      if (error instanceof Error) {
        console.log('Error downloading image: ', error.message);
      }
    } finally {
      setUploading(false);
    }
  }
  async function uploadAvatar() {
    try {
      setUploading(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // Restrict to only images
        allowsMultipleSelection: false, // Can only select one image
        allowsEditing: true, // Allows the user to crop / rotate their photo before uploading it
        quality: 1,
        exif: false, // We don't want nor need that data.
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('User cancelled image picker.');
        return;
      }

      const image = result.assets[0];

      // setImg(image);

      if (!image.uri) {
        throw new Error('No image uri!'); // Realistically, this should never happen, but just in case...
      }

      const compressedImage = await ImageManipulator.manipulateAsync(
        image.uri,
        [{ resize: { width: 200, height: 200 } }], // Resize to 300x300 pixels (adjust as needed)
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG } // Compress and save as JPEG
      );

      setImg(compressedImage);

      const arraybuffer = await fetch(compressedImage.uri).then((res) => res.arrayBuffer());

      const fileExt = image.uri?.split('.').pop()?.toLowerCase() ?? 'jpeg';
      const path = `${Date.now()}.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, arraybuffer, {
          contentType: image.mimeType ?? 'image/jpeg',
        });

      if (uploadError) {
        throw uploadError;
      }

      downloadImage(data.path);
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      } else {
        throw error;
      }
    }
  }

  return (
    <View className="flex-1 p-4">
      <View className="h-full w-full flex-1 gap-3">
        {Platform.OS === 'android' && (
          <Pressable
            onPress={() => {
              router.back();
            }}>
            <AntDesign name="left" size={30} color={colorScheme === 'dark' ? 'white' : 'black'} />
          </Pressable>
        )}
        {((newUsername && currentUser?.username !== newUsername) || profileImg) && (
          <Feather
            className="absolute right-3 top-3"
            onPress={updateUser}
            name="check"
            size={24}
            color={colorScheme === 'dark' ? 'white' : 'black'}
          />
        )}
        <View className="mb-2 mt-8 items-center justify-center gap-4">
          {currentUser?.avatar_url ? (
            <View className="size-28 items-center justify-center rounded-full border border-cardborder bg-card ">
              <Image
                style={{
                  width: '100%',
                  aspectRatio: 1 / 1,
                  borderWidth: 1,
                  borderColor: colorScheme === 'dark' ? '#575757' : '#d5d5d5',
                  borderRadius: 100,
                }}
                className="rounded-full"
                source={img ? img : { uri: currentUser.avatar_url }}
                placeholder={{ blurhash }}
                contentFit="cover"
                transition={1000}
              />
              <Pressable
                onPress={uploadAvatar}
                className="absolute -bottom-2 -right-2 size-10 items-center justify-center rounded-full bg-primary">
                <Entypo name="plus" size={24} color="black" />
              </Pressable>
            </View>
          ) : (
            <View className="size-28 items-center justify-center rounded-full border border-cardborder bg-card ">
              {img ? (
                <Image
                  style={{
                    width: '100%',
                    aspectRatio: 1 / 1,
                    borderWidth: 1,
                    borderColor: colorScheme === 'dark' ? '#575757' : '#d5d5d5',
                    borderRadius: 100,
                  }}
                  className="rounded-full"
                  source={img}
                  placeholder={{ blurhash }}
                  contentFit="cover"
                  transition={1000}
                />
              ) : (
                <Text className="font-nunito-semibold text-3xl uppercase text-foreground">
                  {currentUser?.username?.charAt(0)}
                  {currentUser?.username?.charAt(1)}
                </Text>
              )}
              <Pressable
                onPress={uploadAvatar}
                className="absolute -bottom-2 -right-2 size-10 items-center justify-center rounded-full bg-primary">
                <Entypo className="" name="plus" size={24} color="black" />
              </Pressable>
            </View>
          )}
        </View>
        <View className="gap-2">
          <TextInput
            className="rounded-xl bg-input p-4 font-nunito-medium text-foreground"
            defaultValue={currentUser?.username!}
            value={newUsername!}
            onChangeText={setNewUsername}
          />
        </View>
      </View>
    </View>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  badgeImage: {
    width: 80, // Use 'resizeMode' instead of 'objectFit'
    aspectRatio: 1 / 1,
  },
  badgeNotAchieved: {
    opacity: 0.3, // Dim the image to indicate it's not achieved
    // Alternatively, you can apply a tintColor to simulate grayscale
    // tintColor: 'gray',
  },
});
