export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bets: {
        Row: {
          amount: number
          created_at: string
          id: string
          market_id: string
          odds_at_time: number
          option: string
          option_id: string | null
          potential_payout: number
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          market_id: string
          odds_at_time: number
          option: string
          option_id?: string | null
          potential_payout: number
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          market_id?: string
          odds_at_time?: number
          option?: string
          option_id?: string | null
          potential_payout?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bets_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bets_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "market_options"
            referencedColumns: ["id"]
          },
        ]
      }
      market_options: {
        Row: {
          id: string
          market_id: string
          name: string
          odds: number
          sort_order: number
        }
        Insert: {
          id?: string
          market_id: string
          name: string
          odds?: number
          sort_order?: number
        }
        Update: {
          id?: string
          market_id?: string
          name?: string
          odds?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "market_options_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      markets: {
        Row: {
          category: string
          created_at: string
          creator_id: string
          description: string | null
          embed_views: number
          end_date: string
          id: string
          market_type: string
          no_odds: number
          question: string
          resolution: string | null
          status: string
          total_traders: number
          updated_at: string
          volume: number
          yes_odds: number
        }
        Insert: {
          category?: string
          created_at?: string
          creator_id: string
          description?: string | null
          embed_views?: number
          end_date: string
          id?: string
          market_type?: string
          no_odds?: number
          question: string
          resolution?: string | null
          status?: string
          total_traders?: number
          updated_at?: string
          volume?: number
          yes_odds?: number
        }
        Update: {
          category?: string
          created_at?: string
          creator_id?: string
          description?: string | null
          embed_views?: number
          end_date?: string
          id?: string
          market_type?: string
          no_odds?: number
          question?: string
          resolution?: string | null
          status?: string
          total_traders?: number
          updated_at?: string
          volume?: number
          yes_odds?: number
        }
        Relationships: []
      }
      odds_history: {
        Row: {
          id: string
          market_id: string
          no_odds: number
          recorded_at: string
          yes_odds: number
        }
        Insert: {
          id?: string
          market_id: string
          no_odds: number
          recorded_at?: string
          yes_odds: number
        }
        Update: {
          id?: string
          market_id?: string
          no_odds?: number
          recorded_at?: string
          yes_odds?: number
        }
        Relationships: [
          {
            foreignKeyName: "odds_history_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          balance: number
          bio: string | null
          created_at: string
          created_markets: number
          display_name: string | null
          id: string
          total_bets: number
          total_winnings: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          balance?: number
          bio?: string | null
          created_at?: string
          created_markets?: number
          display_name?: string | null
          id?: string
          total_bets?: number
          total_winnings?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          balance?: number
          bio?: string | null
          created_at?: string
          created_markets?: number
          display_name?: string | null
          id?: string
          total_bets?: number
          total_winnings?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          created_at: string
          id: string
          market_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          market_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          market_id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_resolve_expired_markets: { Args: never; Returns: number }
      place_bet: {
        Args: {
          p_amount: number
          p_market_id: string
          p_option: string
          p_user_id: string
        }
        Returns: Json
      }
      resolve_market: {
        Args: { p_market_id: string; p_outcome: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
