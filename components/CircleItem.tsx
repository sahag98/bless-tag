import { Pressable, StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Members } from '~/types/types';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '~/utils/supabase';
import { Tables } from '~/database.types';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useAuth } from '~/providers/auth-provider';

const blurhash =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

const CircleItem = ({ item }: { item: Members }) => {
  const { getSquadMembers, squadMembers } = useAuth();
  const [members, setMembers] = useState([]);
  useEffect(() => {
    async function getMembers() {
      const { data, error } = await supabase
        .from('members')
        .select('*, profiles(*)')
        .eq('squad_id', item.squad_id);

      setMembers(data);
    }
    getMembers();
    // getSquadMembers(item.squad_id);
  }, [item.id]);

  return (
    <Pressable
      onPress={() => {
        router.push(`/squad/${item.squad_id}`);
      }}>
      <LinearGradient
        style={{
          width: '100%',
          padding: 20,
          justifyContent: 'space-between',
          aspectRatio: 16 / 10,
          borderRadius: 20,
        }}
        colors={['#292929', '#929292']}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}>
        <View className="flex-row items-center gap-0.5">
          {members?.slice(0, 4).map((member, index) => (
            <React.Fragment key={member.user_id}>
              {member.profiles.avatar_url ? (
                <Image
                  key={member.user_id}
                  style={{
                    marginLeft: index > 0 ? -10 : 0,
                    width: 45,
                    height: 45,
                    borderRadius: 100,
                  }}
                  placeholder={{ blurhash }}
                  contentFit="cover"
                  transition={1000}
                  source={{ uri: member.profiles.avatar_url }}
                  className="size-12 rounded-full"
                />
              ) : (
                <View
                  style={{
                    position: 'relative',
                    marginLeft: index > 0 ? -10 : 0,
                  }}
                  className="size-12 items-center justify-center rounded-full border border-gray-400 bg-card sm:size-11">
                  <Text className="font-nunito-semibold text-xl uppercase sm:text-base">
                    {member.profiles?.username?.charAt(0)}
                    {member.profiles?.username?.charAt(1)}
                  </Text>
                </View>
              )}
            </React.Fragment>
          ))}
          {members?.length! > 4 && (
            <Text className="ml-1 font-nunito-semibold text-xs sm:text-base">and more</Text>
          )}
        </View>

        <Text className="font-fredoka-semibold text-4xl text-white">{item.squads?.name}</Text>
        {item.squads?.description ? (
          <Text className="font-nunito-medium text-xl text-white">{item.squads?.description}</Text>
        ) : (
          <Text className="font-nunito-medium text-xl text-white">
            No description? That's okay... 🙁
          </Text>
        )}
      </LinearGradient>
    </Pressable>
  );
};

export default CircleItem;

const styles = StyleSheet.create({});
