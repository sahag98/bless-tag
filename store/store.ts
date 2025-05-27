import { create } from 'zustand';
import AsyncStorage from 'expo-sqlite/kv-store';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '~/utils/supabase';
import { Blessings, Members } from '~/types/types';

export interface AppState {
  hasReadRules: boolean;
  setHasReadRules: (data: boolean) => void;
  history: Blessings[];
  setHistory: (data: Blessings) => void;
  selectedEmoji: string;
  setSelectedEmoji: (data: string) => void;
  squads: Members[];
  fetchSquads: (userId: string) => Promise<void>;

  deleteSquad: (userId: string, adminId: string, squadId: string) => void;
}

export const useUserStore = create(
  persist<AppState>(
    (set, get) => ({
      squads: [],
      history: [],
      setHistory: (data: Blessings) => {
        console.log('STORE DATA: ', data);
        const currentHistory = get().history;
        set({ history: [...currentHistory, data] });
      },
      hasReadRules: false,
      selectedEmoji: '',
      setHasReadRules: (data) => {
        set({ hasReadRules: data });
      },
      setSelectedEmoji: (data) => {
        set({ selectedEmoji: data });
      },
      fetchSquads: async (userId) => {
        if (userId) {
          const { data, error } = await supabase
            .from('members')
            .select('*, squads(*), profiles(username,avatar_url)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (error && !data) {
            console.error('Error fetching studies:', error);
            return;
          }
          //@ts-ignore
          set({ squads: data || [] });
        }
      },
      deleteSquad: async (userId, adminId, squadId) => {
        if (userId === adminId) {
          await supabase.from('squads').delete().eq('id', Number(squadId));
        } else {
          await supabase
            .from('members')
            .delete()
            .eq('user_id', userId)
            .eq('squad_id', Number(squadId));
        }
        set((state) => ({
          squads: state.squads.filter((squad) => squad.squad_id !== Number(squadId)),
        }));
      },
    }),
    {
      name: 'user-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => AsyncStorage), // (optional) by default, 'localStorage' is used
    }
  )
);
