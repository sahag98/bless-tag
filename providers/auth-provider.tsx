import { Session, User } from '@supabase/supabase-js';
import { canGoBack } from 'expo-router/build/global-state/routing';

import { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Database, Tables } from '~/database.types';
import { useUserStore } from '~/store/store';
import { BlessedMember, Blessings, Consquences, ExtendedSquad, Members } from '~/types/types';

import { supabase } from '~/utils/supabase';

const AuthContext = createContext<{
  session: Session | null;
  currentUser: Tables<'profiles'> | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<Tables<'profiles'> | null>>;
  userSquads: Members[] | null;
  squad: ExtendedSquad | null;
  setSquad: React.Dispatch<React.SetStateAction<ExtendedSquad | null>>;
  blessings: Blessings[] | null;
  setBlessings: React.Dispatch<React.SetStateAction<Blessings[] | null>>;
  consequences: Consquences[] | null;
  setConsequences: React.Dispatch<React.SetStateAction<Consquences[] | null>>;
  squadMembers: Members[] | null;
  setUserSquads: React.Dispatch<React.SetStateAction<Members[] | null>>;
  getGoogleOAuthUrl: () => Promise<string>;
  getUserSquads: () => void;
  getSquad: (id: number) => void;
  getSquadMembers: (id: number) => void;
  blessedMember: BlessedMember | null;
  setBlessedMember: React.Dispatch<React.SetStateAction<BlessedMember | null>>;
  getBlessedMember: (id: number) => void;
  getBlessings: (id: number) => void;
  getConsequences: (id: number) => void;
  isAuthenticated: boolean;
}>({
  session: null,
  currentUser: null,
  userSquads: null,
  squad: null,
  setSquad: () => null,
  blessings: null,
  setBlessings: () => null,
  squadMembers: null,
  consequences: null,
  setConsequences: () => null,
  setUserSquads: () => null,
  setCurrentUser: () => null,
  getUserSquads: async () => null,
  getSquad: async () => null,
  getSquadMembers: async () => null,
  blessedMember: null,
  setBlessedMember: () => null,
  getBlessedMember: async () => null,
  getBlessings: async () => null,
  getConsequences: async () => null,
  getGoogleOAuthUrl: async () => '',
  isAuthenticated: false,
});

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<Tables<'profiles'> | null>(null);
  const [userSquads, setUserSquads] = useState<Members[] | null>(null);
  const [blessings, setBlessings] = useState<Blessings[] | null>(null);
  const [consequences, setConsequences] = useState<Consquences[] | null>(null);
  const [squadMembers, setSquadMembers] = useState<Members[] | null>(null);
  const [blessedMember, setBlessedMember] = useState<BlessedMember | null>(null);
  const [squad, setSquad] = useState<ExtendedSquad | null>(null);
  const [isReady, setIsReady] = useState(false);
  const { fetchSquads } = useUserStore();
  const getGoogleOAuthUrl = async () => {
    const result = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'blessed-tag://',
        // prayseapp://google-auth
        // exp://192.168.1.110:19000
      },
    });

    return result.data.url!;
  };

  async function getUser(user: User | undefined) {
    if (user) {
      const { data: profiles } = await supabase.from('profiles').select('*').eq('id', user.id);
      if (profiles) {
        setCurrentUser(profiles[0]);
      }
    }
    setIsReady(true);
  }

  async function getBlessings(id: number) {
    let { data, error } = await supabase
      .from('blessed')
      .select(
        `
    *,
    user:profiles!blessed_user_id_fkey(*),
    receiver:profiles!blessed_pass_id_fkey(*)
  `
      )
      .eq('squad_id', id)
      .order('created_at', { ascending: false });
    //@ts-ignore
    setBlessings(data);
  }

  async function getBlessedMember(id: number) {
    let { data, error } = await supabase
      .from('blessed')
      .select(
        `
    *,
    user:profiles!blessed_user_id_fkey(*),
    receiver:profiles!blessed_pass_id_fkey(*)
  `
      )
      .eq('squad_id', id)
      .order('created_at', { ascending: false });
    //@ts-ignore
    setBlessedMember(data[0]);
  }

  async function getUserSquads() {
    if (!currentUser) return;

    let { data, error } = await supabase
      .from('members')
      .select('*, squads(*), profiles(username)')
      .eq('user_id', currentUser.id!)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user groups:', error);
      return;
    }
    //@ts-ignore
    setUserSquads(data);
  }

  async function getSquadMembers(id: number) {
    const { data, error } = await supabase
      .from('members')
      .select('*, profiles(*)')
      .eq('squad_id', id);

    //@ts-ignore
    setSquadMembers(data);
  }

  async function getConsequences(id: number) {
    const { data, error } = await supabase
      .from('consequences')
      .select('*, profiles(*)')
      .eq('squad_id', id)
      .order('created_at', { ascending: false });

    //@ts-ignore
    setConsequences(data);
  }

  async function getSquad(id: number) {
    if (!currentUser) return;

    let { data, error } = await supabase
      .from('squads')
      .select(
        `
    *,
    blessed:profiles!squads_blessed_id_fkey(*),
    loser:profiles!squads_loser_id_fkey(*)
  `
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching user groups:', error);
      return;
    }
    setSquad(data);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user;
      if (user) {
        console.log('user: ', user);
        getUser(user);
      } else {
        console.log('no user');

        setIsReady(true);
      }

      // setIsReady(true);
      // console.log('get session: ', user);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      if (user) {
        getUser(user);
      } else {
        setIsReady(true);
      }
    });
  }, []);

  if (!isReady) {
    return;
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        getGoogleOAuthUrl,
        currentUser,
        squad,
        setSquad,
        blessings,
        setBlessings,
        consequences,
        setConsequences,
        squadMembers,
        userSquads,
        setUserSquads,
        setCurrentUser,
        getUserSquads,
        getSquad,
        getBlessings,
        getSquadMembers,
        getBlessedMember,
        getConsequences,
        blessedMember,
        setBlessedMember,
        isAuthenticated: !!session?.user,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
