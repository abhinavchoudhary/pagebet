export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      challenges: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          creator_id: string;
          daily_goal: number;
          weekly_goal: number;
          penalty_amount: number;
          penalty_currency: string;
          carry_over: boolean;
          invite_token: string;
          invite_active: boolean;
          archived: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          creator_id: string;
          daily_goal?: number;
          weekly_goal?: number;
          penalty_amount?: number;
          penalty_currency?: string;
          carry_over?: boolean;
          invite_token: string;
          invite_active?: boolean;
          archived?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          creator_id?: string;
          daily_goal?: number;
          weekly_goal?: number;
          penalty_amount?: number;
          penalty_currency?: string;
          carry_over?: boolean;
          invite_token?: string;
          invite_active?: boolean;
          archived?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "challenges_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      challenge_members: {
        Row: {
          challenge_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          challenge_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          challenge_id?: string;
          user_id?: string;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "challenge_members_challenge_id_fkey";
            columns: ["challenge_id"];
            isOneToOne: false;
            referencedRelation: "challenges";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "challenge_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      books: {
        Row: {
          id: string;
          user_id: string;
          google_books_id: string;
          title: string;
          authors: string[] | null;
          cover_url: string | null;
          total_pages: number | null;
          finished: boolean;
          added_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          google_books_id: string;
          title: string;
          authors?: string[] | null;
          cover_url?: string | null;
          total_pages?: number | null;
          finished?: boolean;
          added_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          google_books_id?: string;
          title?: string;
          authors?: string[] | null;
          cover_url?: string | null;
          total_pages?: number | null;
          finished?: boolean;
          added_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "books_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      reading_sessions: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          log_mode: "cumulative" | "direct";
          page_position: number | null;
          pages_read: number;
          logged_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          book_id: string;
          log_mode: "cumulative" | "direct";
          page_position?: number | null;
          pages_read: number;
          logged_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          book_id?: string;
          log_mode?: "cumulative" | "direct";
          page_position?: number | null;
          pages_read?: number;
          logged_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reading_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reading_sessions_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          }
        ];
      };
      challenge_session_credits: {
        Row: {
          session_id: string;
          challenge_id: string;
          user_id: string;
          pages_credited: number;
          week_start: string;
        };
        Insert: {
          session_id: string;
          challenge_id: string;
          user_id: string;
          pages_credited: number;
          week_start: string;
        };
        Update: {
          session_id?: string;
          challenge_id?: string;
          user_id?: string;
          pages_credited?: number;
          week_start?: string;
        };
        Relationships: [];
      };
      feed_reactions: {
        Row: {
          session_id: string;
          user_id: string;
          emoji: string;
        };
        Insert: {
          session_id: string;
          user_id: string;
          emoji: string;
        };
        Update: {
          session_id?: string;
          user_id?: string;
          emoji?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_my_week_summary: {
        Args: { p_challenge_id: string; p_user_id: string };
        Returns: Array<{
          pages_this_week: number;
          weekly_goal: number;
          penalty_exposure: number;
          carry_over_surplus: number;
          days_remaining: number;
          week_start: string;
        }>;
      };
      get_leaderboard: {
        Args: { p_challenge_id: string };
        Returns: Array<{
          user_id: string;
          display_name: string;
          avatar_url: string | null;
          pages_this_week: number;
          weekly_goal: number;
          penalty_exposure: number;
        }>;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
