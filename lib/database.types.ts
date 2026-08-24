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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      attempts: {
        Row: {
          correct: boolean | null
          created_at: string | null
          diagnostic_tags: string[] | null
          difficulty: number | null
          id: string
          player_id: string | null
          prompt_snapshot: string | null
          question_seed: number | null
          response_ms: number | null
          session_id: string | null
          skill_id: string | null
          xp_awarded: number | null
        }
        Insert: {
          correct?: boolean | null
          created_at?: string | null
          diagnostic_tags?: string[] | null
          difficulty?: number | null
          id?: string
          player_id?: string | null
          prompt_snapshot?: string | null
          question_seed?: number | null
          response_ms?: number | null
          session_id?: string | null
          skill_id?: string | null
          xp_awarded?: number | null
        }
        Update: {
          correct?: boolean | null
          created_at?: string | null
          diagnostic_tags?: string[] | null
          difficulty?: number | null
          id?: string
          player_id?: string | null
          prompt_snapshot?: string | null
          question_seed?: number | null
          response_ms?: number | null
          session_id?: string | null
          skill_id?: string | null
          xp_awarded?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attempts_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "study_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempts_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_units: {
        Row: {
          active: boolean
          id: string
          name: string
          sort_order: number
          subject_id: string
        }
        Insert: {
          active?: boolean
          id: string
          name: string
          sort_order?: number
          subject_id: string
        }
        Update: {
          active?: boolean
          id?: string
          name?: string
          sort_order?: number
          subject_id?: string
        }
        Relationships: []
      }
      player_curriculum_plans: {
        Row: {
          academic_year_start: number
          current_term: number
          focus_unit_ids: string[]
          pacing_mode: string
          player_id: string
          subject_id: string
          updated_at: string
        }
        Insert: {
          academic_year_start: number
          current_term?: number
          focus_unit_ids?: string[]
          pacing_mode?: string
          player_id: string
          subject_id: string
          updated_at?: string
        }
        Update: {
          academic_year_start?: number
          current_term?: number
          focus_unit_ids?: string[]
          pacing_mode?: string
          player_id?: string
          subject_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_curriculum_plans_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          created_at: string | null
          exam_date: string | null
          id: string
          player_id: string | null
          subject_id: string | null
          title: string | null
          topic_ids: string[] | null
        }
        Insert: {
          created_at?: string | null
          exam_date?: string | null
          id?: string
          player_id?: string | null
          subject_id?: string | null
          title?: string | null
          topic_ids?: string[] | null
        }
        Update: {
          created_at?: string | null
          exam_date?: string | null
          id?: string
          player_id?: string | null
          subject_id?: string | null
          title?: string | null
          topic_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "exams_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      parent_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          family_id: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          family_id?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          family_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_profiles_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      player_skill_state: {
        Row: {
          confidence: number | null
          difficulty: number | null
          error_tags: Json | null
          last_practiced_at: string | null
          mastery: number | null
          player_id: string
          priority: number | null
          skill_id: string
          updated_at: string | null
        }
        Insert: {
          confidence?: number | null
          difficulty?: number | null
          error_tags?: Json | null
          last_practiced_at?: string | null
          mastery?: number | null
          player_id: string
          priority?: number | null
          skill_id: string
          updated_at?: string | null
        }
        Update: {
          confidence?: number | null
          difficulty?: number | null
          error_tags?: Json | null
          last_practiced_at?: string | null
          mastery?: number | null
          player_id?: string
          priority?: number | null
          skill_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_skill_state_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_skill_state_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          alias: string
          avatar: Json | null
          coins: number | null
          daily_target_minutes: number | null
          family_id: string | null
          id: string
          level: number | null
          streak_days: number | null
          xp: number | null
        }
        Insert: {
          alias: string
          avatar?: Json | null
          coins?: number | null
          daily_target_minutes?: number | null
          family_id?: string | null
          id?: string
          level?: number | null
          streak_days?: number | null
          xp?: number | null
        }
        Update: {
          alias?: string
          avatar?: Json | null
          coins?: number | null
          daily_target_minutes?: number | null
          family_id?: string | null
          id?: string
          level?: number | null
          streak_days?: number | null
          xp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          active: boolean
          common_errors: string[]
          critical: boolean
          generator_key: string | null
          goal: string | null
          id: string
          name: string
          prerequisites: string[]
          sort_order: number
          subject_id: string
          unit_id: string | null
        }
        Insert: {
          active?: boolean
          common_errors?: string[]
          critical?: boolean
          generator_key?: string | null
          goal?: string | null
          id: string
          name: string
          prerequisites?: string[]
          sort_order?: number
          subject_id: string
          unit_id?: string | null
        }
        Update: {
          active?: boolean
          common_errors?: string[]
          critical?: boolean
          generator_key?: string | null
          goal?: string | null
          id?: string
          name?: string
          prerequisites?: string[]
          sort_order?: number
          subject_id?: string
          unit_id?: string | null
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          actual_minutes: number | null
          completed: boolean | null
          completed_at: string | null
          ended_at: string | null
          generated_plan: Json | null
          id: string
          mode: string | null
          phase: string | null
          planned_minutes: number | null
          player_id: string | null
          started_at: string | null
          xp_earned: number | null
        }
        Insert: {
          actual_minutes?: number | null
          completed?: boolean | null
          completed_at?: string | null
          ended_at?: string | null
          generated_plan?: Json | null
          id?: string
          mode?: string | null
          phase?: string | null
          planned_minutes?: number | null
          player_id?: string | null
          started_at?: string | null
          xp_earned?: number | null
        }
        Update: {
          actual_minutes?: number | null
          completed?: boolean | null
          completed_at?: string | null
          ended_at?: string | null
          generated_plan?: Json | null
          id?: string
          mode?: string | null
          phase?: string | null
          planned_minutes?: number | null
          player_id?: string | null
          started_at?: string | null
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_levelup_session: {
        Args: { p_session_id: string }
        Returns: Json
      }
      create_levelup_player: {
        Args: { p_alias: string; p_daily_target_minutes?: number }
        Returns: Json
      }
      open_levelup_session: { Args: { p_player_id: string }; Returns: Json }
      set_player_curriculum_plan: {
        Args: {
          p_academic_year_start: number
          p_current_term: number
          p_focus_unit_ids?: string[]
          p_pacing_mode: string
          p_player_id: string
          p_subject_id: string
        }
        Returns: Json
      }
      setup_parent_family: {
        Args: { family_name: string; parent_name: string }
        Returns: string
      }
      submit_levelup_attempt: {
        Args: {
          p_correct: boolean
          p_diagnostic_tags?: string[]
          p_difficulty: number
          p_player_id: string
          p_prompt: string
          p_response_ms: number
          p_seed: number
          p_session_id: string
          p_skill_id: string
        }
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
