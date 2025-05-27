import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Container } from '~/components/Container';
import { useTheme } from '~/providers/theme-provider';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '~/utils/supabase';
import { Tables } from '~/database.types';
import { AntDesign, Feather } from '@expo/vector-icons';
import { useAuth } from '~/providers/auth-provider';
import { useUserStore } from '../../../../store/store';

const SquadEditScreen = () => {
  const { colorScheme } = useTheme();
  const { id } = useLocalSearchParams();
  const { currentUser, getSquad, squad } = useAuth();
  const [newDescription, setNewDescription] = useState(squad?.description);
  const [newName, setNewName] = useState(squad?.name);
  const { fetchSquads } = useUserStore();
  async function updateSquadInfo() {
    const { data, error } = await supabase
      .from('squads')
      .update({ name: newName, description: newDescription })
      .eq('id', Number(id))
      .eq('admin_id', currentUser?.id!);
    getSquad(Number(id));
    fetchSquads(currentUser?.id!);
    router.back();
  }

  useEffect(() => {
    getSquad(Number(id));
  }, [id]);

  if (!squad) return;

  return (
    <View className="flex-1 bg-background p-4">
      <View className="mb-5 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          {Platform.OS === 'android' && (
            <Pressable
              onPress={() => {
                router.back();
              }}>
              <AntDesign name="left" size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
            </Pressable>
          )}
          <Text className="font-fredoka-semibold text-3xl text-foreground">Edit Squad Info</Text>
        </View>
        {((newName && squad.name !== newName) ||
          (newDescription && squad.description !== newDescription)) && (
          <Feather
            onPress={updateSquadInfo}
            name="check"
            size={24}
            color={colorScheme === 'dark' ? 'white' : 'black'}
          />
        )}
      </View>
      <View className="gap-2">
        <TextInput
          className="rounded-xl bg-input p-4 font-nunito-medium text-foreground"
          defaultValue={squad.name}
          value={newName}
          onChangeText={setNewName}
        />
        {squad.description ? (
          <TextInput
            className="rounded-xl bg-input p-4 font-nunito-medium text-foreground"
            defaultValue={squad.description}
            value={newDescription!}
            onChangeText={setNewDescription}
          />
        ) : (
          <TextInput
            className="rounded-xl bg-input p-4 font-nunito-medium text-foreground"
            value={newDescription!}
            selectionColor={colorScheme === 'dark' ? 'white' : 'black'}
            placeholder="Add a description for this squad..."
            placeholderTextColor={colorScheme === 'dark' ? '#dcdcdc' : '#4b5563'}
            onChangeText={setNewDescription}
          />
        )}
      </View>
    </View>
  );
};

export default SquadEditScreen;

const styles = StyleSheet.create({});
