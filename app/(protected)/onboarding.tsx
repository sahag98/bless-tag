import {
  Image,
  Pressable,
  Text,
  View,
  TextInput,
  Dimensions,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '~/utils/supabase';
import { useAuth } from '~/providers/auth-provider';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import Feather from '@expo/vector-icons/Feather';
import { AntDesign, FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { registerForPushNotificationsAsync } from '~/utils/registerNotification';
import { useTheme } from '~/providers/theme-provider';

export default function OnboaardingScreen() {
  const { colorScheme } = useTheme();

  const { currentUser, setCurrentUser } = useAuth();
  const screenWidth = Dimensions.get('window').width;

  const [profileImg, setProfileImg] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [img, setImg] = useState<ImagePicker.ImagePickerAsset>();
  useEffect(() => {
    async function getNotificationToken() {
      if (!currentUser) return;
      const token = await registerForPushNotificationsAsync();

      const { error } = await supabase
        .from('profiles')
        .update({
          noti_token: token,
        })
        .eq('id', currentUser.id);

      console.log('error: ', error);
    }
    getNotificationToken();
  }, []);

  async function fetchAdjectives() {
    const response = await fetch('https://api.datamuse.com/words?rel_jjb=funny&max=50');
    const data = await response.json();
    return data.map((wordObj: any) => wordObj.word);
  }

  // Fetch random nouns
  async function fetchNouns() {
    const response = await fetch('https://api.datamuse.com/words?rel_jja=goofy&max=50');
    const data = await response.json();
    return data.map((wordObj: any) => wordObj.word);
  }

  function capitalize(word: string) {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  async function generateRandomUsername() {
    try {
      const adjectives = await fetchAdjectives();
      const nouns = await fetchNouns();

      const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
      const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
      const randomNumber = Math.floor(Math.random() * 1000); // Add a random number to make it more unique

      const username = `${capitalize(randomAdj)}${capitalize(randomNoun)}${randomNumber}`;
      return username;
    } catch (error) {
      console.error('Error generating username:', error);
      return 'GuestUser' + Math.floor(Math.random() * 10000); // fallback if fetch fails
    }
  }

  async function handleGetStarted() {
    const username = await generateRandomUsername();
    setUsername(username);
    const avatarUrl = `https://api.dicebear.com/7.x/fun-emoji/png?seed=${username}`;
    setProfileImg(avatarUrl);
    // Now you can proceed to create the user with Supabase
  }

  async function updateProfile() {
    try {
      setLoading(true);
      if (!currentUser) throw new Error('No user on the session!');

      const { error } = await supabase
        .from('profiles')
        .update({
          username: username,
          avatar_url: profileImg,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      if (error) {
        throw error;
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      getProfile();
      setLoading(false);
      //   router.push('/(tabs)/home');
    }
  }

  async function getProfile() {
    try {
      setLoading(true);
      if (!currentUser) throw new Error('No user on the session!');

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`*`)
        .eq('id', currentUser.id)
        .single();
      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setCurrentUser(data);
        router.replace('/(protected)');
        // router.push('/(app)/(tabs)');
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
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
    <>
      <SafeAreaView edges={['top']} className="flex-1 bg-background">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View className="w-full flex-1 self-center">
            {/* Progress Bar */}
            <Text className="mt-5 px-6 font-nunito-bold text-2xl text-foreground">
              Hey! Let's setup your app 👋
            </Text>
            <View className="flex-1 justify-center gap-4">
              <View>
                <View className="gap-3 px-4" style={{ width: screenWidth }}>
                  <>
                    {profileImg ? (
                      <Pressable onPress={uploadAvatar}>
                        <Image
                          source={{ uri: profileImg }}
                          accessibilityLabel="Avatar"
                          className="mb-5 size-40 self-center rounded-3xl "
                          //   style={{ width: 40, height: 40 }}
                        />
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={uploadAvatar}
                        className="mb-5 size-40 items-center justify-center gap-3 self-center rounded-3xl border border-cardborder bg-card p-2">
                        {uploading ? (
                          <ActivityIndicator />
                        ) : (
                          <>
                            <Feather
                              name="upload"
                              size={40}
                              color={colorScheme === 'dark' ? 'white' : 'black'}
                            />
                            <Text className="w-4/5 text-center font-nunito-medium text-sm leading-4 text-foreground">
                              Upload profile image
                            </Text>
                          </>
                        )}
                      </Pressable>
                    )}
                    <View className="w-full flex-row items-center gap-4">
                      <TextInput
                        value={username}
                        onChangeText={setUsername}
                        selectionColor={colorScheme === 'dark' ? 'white' : 'black'}
                        placeholder="Enter your username"
                        placeholderTextColor={colorScheme === 'dark' ? '#dcdcdc' : '#4b5563'}
                        className="flex-1 rounded-xl bg-input p-4 text-foreground"
                        //   style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
                      />
                      <Pressable onPress={handleGetStarted}>
                        <FontAwesome name="random" size={24} color="black" />
                      </Pressable>
                    </View>
                    <Pressable
                      disabled={!username || username.length <= 2}
                      className="disabled:bg-light-primary/50 items-center justify-center rounded-xl bg-primary p-4"
                      onPress={updateProfile}>
                      <Text className="font-nunito-bold text-lg">Get Started 🤝</Text>
                    </Pressable>
                  </>
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
