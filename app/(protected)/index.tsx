import { Stack, Link, Redirect, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { FlatList, Image, Linking, Pressable, Text, View } from 'react-native';
import { useAuth } from '~/providers/auth-provider';
import { Entypo, FontAwesome } from '@expo/vector-icons';
import { useCallback, useEffect, useRef } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import CreateCircleModal from '~/modals/create-circle';
import CircleItem from '~/components/CircleItem';
import { useUserStore } from '~/store/store';
import { supabase } from '~/utils/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { registerForPushNotificationsAsync } from '~/utils/registerNotification';
import UpdateModal from '~/modals/update-modal';
import { checkReview, CheckReview } from '~/utils/requestReview';

export default function Home() {
  const { currentUser, getUserSquads, getSquadMembers, userSquads } = useAuth();
  const { fetchSquads, squads, reviewRequested, setReviewRequested, squadsCreated } =
    useUserStore();
  console.log('squads created: ', squadsCreated);
  console.log('review requested: ', reviewRequested);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchSquads(currentUser.id);
    }
  }, [currentUser]);

  useEffect(() => {
    async function getNotificationToken() {
      if (!currentUser) return;
      const token = await registerForPushNotificationsAsync();

      if (!token) return;

      if (currentUser.noti_token !== token || currentUser.noti_token === null) {
        console.log('UPDATE TOKEN');
        const { error } = await supabase
          .from('profiles')
          .update({
            noti_token: token,
          })
          .eq('id', currentUser.id);

        console.log('error: ', error);
      }
    }
    getNotificationToken();
  }, []);

  useEffect(() => {
    const channels = supabase
      .channel('members_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'members' },
        (payload: any) => {
          console.log('NEW MEMBER payload: ', payload);

          // fetchSquads(currentUser?.id!);

          if (currentUser) {
            fetchSquads(currentUser.id);
            getSquadMembers(payload.new.squad_id);
          }
        }
      )
      // .on(
      //   'postgres_changes',
      //   { event: 'DELETE', schema: 'public', table: 'study_group' },
      //   (payload) => {
      //     // console.log('DELETING GROUP');
      //     // queryClient.invalidateQueries({ queryKey: ['groups'] });
      //     // const newMember = payload.new;
      //     // getGroupMembers(newMember.group_id);
      //     // getUserGroups();
      //   }
      // )
      .subscribe();
    return () => {
      supabase.removeChannel(channels);
    };
    // if (currentUser) {
    //   fetchSquads(currentUser?.id!);
    // }
  }, []);

  if (!currentUser?.username) {
    return <Redirect href={'/(protected)/onboarding'} />;
  }

  return (
    // <Container>
    <View className="flex-1 bg-background">
      <UpdateModal />
      <SafeAreaView
        edges={['top']}
        className="border-border justify-end gap-4 rounded-bl-3xl rounded-br-3xl border bg-card p-5 sm:p-20">
        <View className="w-full flex-row items-center justify-between">
          <View className="gap-1">
            <Text onPress={() => router.push('/test')} className="font-fredoka-semibold text-3xl">
              Hey there 👋
            </Text>
            <Text className="font-nunito-medium text-2xl">{currentUser?.username}</Text>
          </View>

          <Pressable onPress={() => router.push('/profile')}>
            {currentUser?.avatar_url ? (
              <Image
                className="rounded-2xl border"
                source={{ uri: currentUser.avatar_url! }}
                style={{ width: 60, height: 60 }}
              />
            ) : (
              <View className="h-[60px] w-[60px] items-center justify-center rounded-full border border-cardborder bg-background ">
                <Text className="font-nunito-semibold text-2xl uppercase text-foreground">
                  {currentUser?.username?.charAt(0)}
                  {currentUser?.username?.charAt(1)}
                </Text>
              </View>
            )}
            <Image />
          </Pressable>
        </View>
        <Text className="font-nunito-medium">
          As iron sharpens iron , So a man sharpens the countenance of his friend. - Proverbs 27:17
        </Text>
        <Pressable
          onPress={() => Linking.openURL('https://prayse.canny.io/blesstag-feedback/create')}
          className="w-full items-center justify-center gap-4 rounded-xl border  bg-background p-3">
          <Text className="font-fredoka-medium text-lg">Submit Feedback</Text>
        </Pressable>
      </SafeAreaView>
      <View className="mt-1 flex-1 gap-5 p-4">
        <View className="flex-row items-center justify-between">
          <Text className="font-fredoka-semibold text-3xl">Squads 🙌</Text>
          <View className="flex-row items-center gap-2">
            {/* <Pressable
              onPress={handlePresentModalPress}
              className="size-16 items-center justify-center rounded-2xl">
              <FontAwesome name="search" size={25} color="black" />
            </Pressable> */}
            <Pressable
              onPress={handlePresentModalPress}
              className=" size-16 items-center justify-center rounded-2xl border bg-primary">
              <Entypo name="plus" size={30} color="black" />
            </Pressable>
          </View>
        </View>

        <FlatList
          data={squads}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ flexGrow: 1, gap: 10, paddingBottom: 30 }}
          ListEmptyComponent={() => (
            <View className="flex-1 items-center justify-center gap-5">
              <Image
                source={require('~/assets/empty-squad-2.png')}
                style={{ width: 100, height: 100 }}
              />
              <Text className="font-nunito-semibold text-xl">No squad yet? Let's get going!</Text>
            </View>
          )}
          renderItem={({ item }) => <CircleItem item={item} />}
        />
      </View>
      <CreateCircleModal currentUser={currentUser} bottomSheetModalRef={bottomSheetModalRef} />
    </View>
    // </Container>
  );
}
