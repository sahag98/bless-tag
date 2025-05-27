import { Tables } from '~/database.types';

export interface Members {
  id: number;
  user_id: string;
  squad_id: number;
  squads: Squad[]; // Assuming this is the foreign key relationship
  profiles: Profile; // Assuming this is the foreign key relationship
}

export interface BlessedFields {
  receiver: Profile;
  user: Profile;
}

type Squad = Tables<'squads'>;

export interface ExtendedSquad extends Squad {
  loser: Profile | null;
  blessed: Profile | null;
}

export type BlessedMember = Members & BlessedFields;

export interface Consquences {
  id: number;
  title: string;
  created_at: string;
  user_id: string;
  squad_id: number;
  has_done: boolean;
  squads: Squad[]; // Assuming this is the foreign key relationship
  profiles: Profile; // Assuming this is the foreign key relationship
}

export interface Blessings {
  created_at: string;
  updated_at: string;
  id: number;
  user_id: string;
  squad_id: number;
  pass_id: string | null;
  message: string | null;
  user: {
    avatar_url: string | null;
    username: string;
  };
  receiver: {
    avatar_url: string | null;
    username: string | null;
  };
}

// export interface Squad {
//   id: number;
//   name: string;
//   description: string;
//   code: number;
//   admin_id: string;
//   timer_start_time: string | null;
// }

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  noti_token: string | null;
  // Add other profile fields as necessary
}
