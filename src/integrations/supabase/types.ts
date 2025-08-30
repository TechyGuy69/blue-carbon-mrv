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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ai_predictions: {
        Row: {
          created_at: string
          id: string
          model_version: string
          prediction_data: Json
          prediction_type: string
          project_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          model_version: string
          prediction_data: Json
          prediction_type: string
          project_id: string
        }
        Update: {
          created_at?: string
          id?: string
          model_version?: string
          prediction_data?: Json
          prediction_type?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_predictions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      carbon_credits: {
        Row: {
          blockchain_transaction_hash: string | null
          created_at: string
          credit_amount: number
          current_owner_id: string
          id: string
          issue_date: string
          project_id: string
          retired_date: string | null
          retirement_reason: string | null
          serial_number: string
          status: Database["public"]["Enums"]["credit_status"]
          vintage_year: number
        }
        Insert: {
          blockchain_transaction_hash?: string | null
          created_at?: string
          credit_amount: number
          current_owner_id: string
          id?: string
          issue_date: string
          project_id: string
          retired_date?: string | null
          retirement_reason?: string | null
          serial_number: string
          status?: Database["public"]["Enums"]["credit_status"]
          vintage_year: number
        }
        Update: {
          blockchain_transaction_hash?: string | null
          created_at?: string
          credit_amount?: number
          current_owner_id?: string
          id?: string
          issue_date?: string
          project_id?: string
          retired_date?: string | null
          retirement_reason?: string | null
          serial_number?: string
          status?: Database["public"]["Enums"]["credit_status"]
          vintage_year?: number
        }
        Relationships: [
          {
            foreignKeyName: "carbon_credits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          blockchain_hash: string
          credit_id: string
          from_user_id: string | null
          id: string
          notes: string | null
          price_per_credit: number | null
          to_user_id: string | null
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          amount: number
          blockchain_hash: string
          credit_id: string
          from_user_id?: string | null
          id?: string
          notes?: string | null
          price_per_credit?: number | null
          to_user_id?: string | null
          transaction_date?: string
          transaction_type: string
        }
        Update: {
          amount?: number
          blockchain_hash?: string
          credit_id?: string
          from_user_id?: string | null
          id?: string
          notes?: string | null
          price_per_credit?: number | null
          to_user_id?: string | null
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_credit_id_fkey"
            columns: ["credit_id"]
            isOneToOne: false
            referencedRelation: "carbon_credits"
            referencedColumns: ["id"]
          },
        ]
      }
      mrv_submissions: {
        Row: {
          biomass_data: Json | null
          blockchain_hash: string | null
          carbon_measurement: number | null
          created_at: string
          data_source: string
          data_summary: Json | null
          file_path: string | null
          id: string
          notes: string | null
          project_id: string
          submission_date: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          biomass_data?: Json | null
          blockchain_hash?: string | null
          carbon_measurement?: number | null
          created_at?: string
          data_source: string
          data_summary?: Json | null
          file_path?: string | null
          id?: string
          notes?: string | null
          project_id: string
          submission_date: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          biomass_data?: Json | null
          blockchain_hash?: string | null
          carbon_measurement?: number | null
          created_at?: string
          data_source?: string
          data_summary?: Json | null
          file_path?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          submission_date?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mrv_submissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          contact_email: string | null
          created_at: string
          full_name: string
          id: string
          organization: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          full_name: string
          id?: string
          organization?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          full_name?: string
          id?: string
          organization?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          area_hectares: number
          baseline_carbon: number | null
          blockchain_hash: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          location: Json
          name: string
          owner_id: string
          project_type: string
          projected_sequestration: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          area_hectares: number
          baseline_carbon?: number | null
          blockchain_hash?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          location: Json
          name: string
          owner_id: string
          project_type: string
          projected_sequestration?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          area_hectares?: number
          baseline_carbon?: number | null
          blockchain_hash?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          location?: Json
          name?: string
          owner_id?: string
          project_type?: string
          projected_sequestration?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      credit_status: "issued" | "transferred" | "retired"
      project_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "approved"
        | "rejected"
        | "active"
        | "completed"
      user_role: "admin" | "ngo" | "community" | "public"
      verification_status: "pending" | "verified" | "rejected"
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
      credit_status: ["issued", "transferred", "retired"],
      project_status: [
        "draft",
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "active",
        "completed",
      ],
      user_role: ["admin", "ngo", "community", "public"],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
