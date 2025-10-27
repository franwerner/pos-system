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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      Category: {
        Row: {
          created_at: string
          id: number
          name: string
          parent_id: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          parent_id?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          parent_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "Category_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "Category"
            referencedColumns: ["id"]
          },
        ]
      }
      Config: {
        Row: {
          default_payment_id: number
          id: number
          updated_at: string
        }
        Insert: {
          default_payment_id: number
          id?: number
          updated_at: string
        }
        Update: {
          default_payment_id?: number
          id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "Config_default_payment_fkey"
            columns: ["default_payment_id"]
            isOneToOne: false
            referencedRelation: "Payment"
            referencedColumns: ["id"]
          },
        ]
      }
      Employed: {
        Row: {
          id: string
          is_active: boolean | null
          lastname: string
          name: string
          role: Database["public"]["Enums"]["RoleEnum"]
        }
        Insert: {
          id: string
          is_active?: boolean | null
          lastname: string
          name: string
          role?: Database["public"]["Enums"]["RoleEnum"]
        }
        Update: {
          id?: string
          is_active?: boolean | null
          lastname?: string
          name?: string
          role?: Database["public"]["Enums"]["RoleEnum"]
        }
        Relationships: []
      }
      Order: {
        Row: {
          created_at: string
          employed_id: string
          id: number
          payment_id: number
          price: number
          product_id: number
          quantity: number
          tax: number
        }
        Insert: {
          created_at?: string
          employed_id: string
          id?: number
          payment_id: number
          price: number
          product_id: number
          quantity: number
          tax: number
        }
        Update: {
          created_at?: string
          employed_id?: string
          id?: number
          payment_id?: number
          price?: number
          product_id?: number
          quantity?: number
          tax?: number
        }
        Relationships: [
          {
            foreignKeyName: "Order_employed_id_fkey"
            columns: ["employed_id"]
            isOneToOne: false
            referencedRelation: "Employed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Order_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "Payment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Order_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
        ]
      }
      Payment: {
        Row: {
          id: number
          is_active: boolean | null
          name: string
          tax: number
        }
        Insert: {
          id?: number
          is_active?: boolean | null
          name: string
          tax: number
        }
        Update: {
          id?: number
          is_active?: boolean | null
          name?: string
          tax?: number
        }
        Relationships: []
      }
      Product: {
        Row: {
          category_id: number
          created_at: string
          description: string | null
          id: number
          img_url: string | null
          is_active: boolean | null
          name: string
          price: number
          unit_type: Database["public"]["Enums"]["UnitEnum"]
          updated_at: string
        }
        Insert: {
          category_id: number
          created_at?: string
          description?: string | null
          id?: number
          img_url?: string | null
          is_active?: boolean | null
          name: string
          price: number
          unit_type?: Database["public"]["Enums"]["UnitEnum"]
          updated_at: string
        }
        Update: {
          category_id?: number
          created_at?: string
          description?: string | null
          id?: number
          img_url?: string | null
          is_active?: boolean | null
          name?: string
          price?: number
          unit_type?: Database["public"]["Enums"]["UnitEnum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "Product_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "Category"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      RoleEnum: "admin" | "user"
      UnitEnum: "u" | "gr" | "lt"
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
      RoleEnum: ["admin", "user"],
      UnitEnum: ["u", "gr", "lt"],
    },
  },
} as const
