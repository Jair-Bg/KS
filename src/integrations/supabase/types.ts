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
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          details: Json
          id: string
          target_market_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          details?: Json
          id?: string
          target_market_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          details?: Json
          id?: string
          target_market_id?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
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
          engine: string
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
          engine?: string
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
          engine?: string
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
      mcp_tool_logs: {
        Row: {
          arguments: Json
          client_id: string | null
          created_at: string
          duration_ms: number
          error_message: string | null
          id: string
          success: boolean
          tool_name: string
          user_id: string
        }
        Insert: {
          arguments?: Json
          client_id?: string | null
          created_at?: string
          duration_ms?: number
          error_message?: string | null
          id?: string
          success?: boolean
          tool_name: string
          user_id?: string
        }
        Update: {
          arguments?: Json
          client_id?: string | null
          created_at?: string
          duration_ms?: number
          error_message?: string | null
          id?: string
          success?: boolean
          tool_name?: string
          user_id?: string
        }
        Relationships: []
      }
      mm_inventory: {
        Row: {
          market_id: string
          no_qty: number
          target_notional: number
          updated_at: string
          yes_qty: number
        }
        Insert: {
          market_id: string
          no_qty?: number
          target_notional?: number
          updated_at?: string
          yes_qty?: number
        }
        Update: {
          market_id?: string
          no_qty?: number
          target_notional?: number
          updated_at?: string
          yes_qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "mm_inventory_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: true
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
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
      orders: {
        Row: {
          contract: string
          created_at: string
          filled: number
          id: string
          is_mm: boolean
          market_id: string
          price: number
          quantity: number
          side: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contract: string
          created_at?: string
          filled?: number
          id?: string
          is_mm?: boolean
          market_id: string
          price: number
          quantity: number
          side: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contract?: string
          created_at?: string
          filled?: number
          id?: string
          is_mm?: boolean
          market_id?: string
          price?: number
          quantity?: number
          side?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          created_at: string
          id: string
          market_id: string
          no_qty: number
          updated_at: string
          user_id: string
          yes_qty: number
        }
        Insert: {
          created_at?: string
          id?: string
          market_id: string
          no_qty?: number
          updated_at?: string
          user_id: string
          yes_qty?: number
        }
        Update: {
          created_at?: string
          id?: string
          market_id?: string
          no_qty?: number
          updated_at?: string
          user_id?: string
          yes_qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "positions_market_id_fkey"
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
      trades: {
        Row: {
          buy_order_id: string | null
          contract: string | null
          created_at: string
          id: string
          market_id: string
          mint: boolean
          no_buy_order_id: string | null
          price: number
          quantity: number
          sell_order_id: string | null
          yes_buy_order_id: string | null
        }
        Insert: {
          buy_order_id?: string | null
          contract?: string | null
          created_at?: string
          id?: string
          market_id: string
          mint?: boolean
          no_buy_order_id?: string | null
          price: number
          quantity: number
          sell_order_id?: string | null
          yes_buy_order_id?: string | null
        }
        Update: {
          buy_order_id?: string | null
          contract?: string | null
          created_at?: string
          id?: string
          market_id?: string
          mint?: boolean
          no_buy_order_id?: string | null
          price?: number
          quantity?: number
          sell_order_id?: string | null
          yes_buy_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trades_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
      order_book: {
        Row: {
          contract: string | null
          created_at: string | null
          filled: number | null
          id: string | null
          is_mm: boolean | null
          market_id: string | null
          price: number | null
          quantity: number | null
          remaining: number | null
          side: string | null
          status: string | null
        }
        Insert: {
          contract?: string | null
          created_at?: string | null
          filled?: number | null
          id?: string | null
          is_mm?: boolean | null
          market_id?: string | null
          price?: number | null
          quantity?: number | null
          remaining?: never
          side?: string | null
          status?: string | null
        }
        Update: {
          contract?: string | null
          created_at?: string | null
          filled?: number | null
          id?: string | null
          is_mm?: boolean | null
          market_id?: string | null
          price?: number | null
          quantity?: number | null
          remaining?: never
          side?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      adjust_position: {
        Args: { p_market: string; p_no: number; p_user: string; p_yes: number }
        Returns: undefined
      }
      admin_force_resolve: {
        Args: { p_market_id: string; p_outcome: string }
        Returns: Json
      }
      admin_get_stats: { Args: never; Returns: Json }
      admin_list_audit: {
        Args: { p_limit?: number }
        Returns: {
          action: string
          actor_id: string
          actor_name: string
          created_at: string
          details: Json
          id: string
          target_market_id: string
          target_market_question: string
          target_user_id: string
          target_user_name: string
        }[]
      }
      admin_list_users: {
        Args: { p_limit?: number }
        Returns: {
          balance: number
          created_at: string
          created_markets: number
          display_name: string
          roles: string[]
          total_bets: number
          total_winnings: number
          user_id: string
        }[]
      }
      admin_set_role: {
        Args: {
          p_grant: boolean
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: Json
      }
      auto_resolve_expired_markets: { Args: never; Returns: number }
      cancel_order: { Args: { p_order_id: string }; Returns: Json }
      claim_creator_role: { Args: never; Returns: Json }
      get_creator_analytics: { Args: { p_days?: number }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      match_orders: { Args: { p_market_id: string }; Returns: number }
      mm_generate_quotes: {
        Args: {
          p_confidence?: string
          p_market_id: string
          p_model: number
          p_quantity?: number
        }
        Returns: Json
      }
      place_bet: {
        Args: {
          p_amount: number
          p_market_id: string
          p_option: string
          p_user_id: string
        }
        Returns: Json
      }
      place_limit_order: {
        Args: {
          p_contract: string
          p_is_mm?: boolean
          p_market_id: string
          p_price: number
          p_quantity: number
          p_side: string
        }
        Returns: Json
      }
      resolve_market: {
        Args: { p_market_id: string; p_outcome: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "user" | "creator" | "admin"
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
    Enums: {
      app_role: ["user", "creator", "admin"],
    },
  },
} as const
