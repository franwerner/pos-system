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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          default_employee_id: string | null
          default_payment_id: number | null
          id: number
          updated_at: string
          waste_percentage_drink: number
          waste_percentage_food: number
          waste_percentage_packaging: number
        }
        Insert: {
          default_employee_id?: string | null
          default_payment_id?: number | null
          id?: never
          updated_at?: string
          waste_percentage_drink?: number
          waste_percentage_food?: number
          waste_percentage_packaging?: number
        }
        Update: {
          default_employee_id?: string | null
          default_payment_id?: number | null
          id?: never
          updated_at?: string
          waste_percentage_drink?: number
          waste_percentage_food?: number
          waste_percentage_packaging?: number
        }
        Relationships: [
          {
            foreignKeyName: "app_config_default_employee_id_fkey"
            columns: ["default_employee_id"]
            isOneToOne: false
            referencedRelation: "employee"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_config_default_payment_id_fkey"
            columns: ["default_payment_id"]
            isOneToOne: false
            referencedRelation: "payment_method"
            referencedColumns: ["id"]
          },
        ]
      }
      app_user: {
        Row: {
          created_at: string
          id: number
          password_hash: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: never
          password_hash: string
          username: string
        }
        Update: {
          created_at?: string
          id?: never
          password_hash?: string
          username?: string
        }
        Relationships: []
      }
      cash_movement: {
        Row: {
          amount: number
          cash_session_id: number
          concept: string
          created_at: string
          id: number
          type: string
        }
        Insert: {
          amount: number
          cash_session_id: number
          concept: string
          created_at?: string
          id?: never
          type: string
        }
        Update: {
          amount?: number
          cash_session_id?: number
          concept?: string
          created_at?: string
          id?: never
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_movement_cash_session_id_fkey"
            columns: ["cash_session_id"]
            isOneToOne: false
            referencedRelation: "cash_session"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_session: {
        Row: {
          closed_at: string | null
          counted_amount: number | null
          employee_id: string
          id: number
          note: string | null
          opened_at: string
          opening_amount: number
        }
        Insert: {
          closed_at?: string | null
          counted_amount?: number | null
          employee_id: string
          id?: never
          note?: string | null
          opened_at?: string
          opening_amount?: number
        }
        Update: {
          closed_at?: string | null
          counted_amount?: number | null
          employee_id?: string
          id?: never
          note?: string | null
          opened_at?: string
          opening_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "cash_session_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee"
            referencedColumns: ["id"]
          },
        ]
      }
      category: {
        Row: {
          created_at: string
          id: number
          name: string
          parent_id: number | null
        }
        Insert: {
          created_at?: string
          id?: never
          name: string
          parent_id?: number | null
        }
        Update: {
          created_at?: string
          id?: never
          name?: string
          parent_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "category_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["id"]
          },
        ]
      }
      employee: {
        Row: {
          id: string
          is_active: boolean
          lastname: string | null
          name: string
          role: string
        }
        Insert: {
          id: string
          is_active?: boolean
          lastname?: string | null
          name: string
          role?: string
        }
        Update: {
          id?: string
          is_active?: boolean
          lastname?: string | null
          name?: string
          role?: string
        }
        Relationships: []
      }
      fixed_cost: {
        Row: {
          amount: number
          concept: string
          created_at: string
          id: number
          period: string
        }
        Insert: {
          amount: number
          concept: string
          created_at?: string
          id?: never
          period: string
        }
        Update: {
          amount?: number
          concept?: string
          created_at?: string
          id?: never
          period?: string
        }
        Relationships: []
      }
      payment_method: {
        Row: {
          id: number
          is_active: boolean
          name: string
          tax: number
        }
        Insert: {
          id?: never
          is_active?: boolean
          name: string
          tax?: number
        }
        Update: {
          id?: never
          is_active?: boolean
          name?: string
          tax?: number
        }
        Relationships: []
      }
      product: {
        Row: {
          category_id: number | null
          created_at: string
          description: string | null
          id: number
          img_url: string | null
          is_active: boolean
          name: string
          price: number
          search_name: string | null
          target_margin_percentage: number | null
          updated_at: string
        }
        Insert: {
          category_id?: number | null
          created_at?: string
          description?: string | null
          id?: never
          img_url?: string | null
          is_active?: boolean
          name: string
          price: number
          search_name?: string | null
          target_margin_percentage?: number | null
          updated_at?: string
        }
        Update: {
          category_id?: number | null
          created_at?: string
          description?: string | null
          id?: never
          img_url?: string | null
          is_active?: boolean
          name?: string
          price?: number
          search_name?: string | null
          target_margin_percentage?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["id"]
          },
        ]
      }
      product_supply: {
        Row: {
          id: number
          product_id: number
          quantity: number
          supply_id: number
        }
        Insert: {
          id?: never
          product_id: number
          quantity: number
          supply_id: number
        }
        Update: {
          id?: never
          product_id?: number
          quantity?: number
          supply_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_supply_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_supply_supply_id_fkey"
            columns: ["supply_id"]
            isOneToOne: false
            referencedRelation: "supply"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_supply_supply_id_fkey"
            columns: ["supply_id"]
            isOneToOne: false
            referencedRelation: "supply_stock"
            referencedColumns: ["supply_id"]
          },
        ]
      }
      production: {
        Row: {
          id: number
          note: string | null
          produced_at: string
          quantity: number
          supply_id: number
          unit_cost: number
        }
        Insert: {
          id?: never
          note?: string | null
          produced_at?: string
          quantity: number
          supply_id: number
          unit_cost?: number
        }
        Update: {
          id?: never
          note?: string | null
          produced_at?: string
          quantity?: number
          supply_id?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "production_supply_id_fkey"
            columns: ["supply_id"]
            isOneToOne: false
            referencedRelation: "supply"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_supply_id_fkey"
            columns: ["supply_id"]
            isOneToOne: false
            referencedRelation: "supply_stock"
            referencedColumns: ["supply_id"]
          },
        ]
      }
      purchase: {
        Row: {
          created_at: string
          id: number
          note: string | null
          purchased_at: string
          supplier_name: string | null
          total: number
        }
        Insert: {
          created_at?: string
          id?: never
          note?: string | null
          purchased_at?: string
          supplier_name?: string | null
          total?: number
        }
        Update: {
          created_at?: string
          id?: never
          note?: string | null
          purchased_at?: string
          supplier_name?: string | null
          total?: number
        }
        Relationships: []
      }
      purchase_item: {
        Row: {
          id: number
          purchase_id: number
          quantity: number
          supply_id: number
          unit_price: number
        }
        Insert: {
          id?: never
          purchase_id: number
          quantity: number
          supply_id: number
          unit_price: number
        }
        Update: {
          id?: never
          purchase_id?: number
          quantity?: number
          supply_id?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_item_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchase"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_item_supply_id_fkey"
            columns: ["supply_id"]
            isOneToOne: false
            referencedRelation: "supply"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_item_supply_id_fkey"
            columns: ["supply_id"]
            isOneToOne: false
            referencedRelation: "supply_stock"
            referencedColumns: ["supply_id"]
          },
        ]
      }
      sale: {
        Row: {
          cash_session_id: number | null
          created_at: string
          employee_id: string
          id: number
          paid_at: string | null
          payment_method_id: number | null
          status: string
          sub_total: number
          tax: number
          total: number
        }
        Insert: {
          cash_session_id?: number | null
          created_at?: string
          employee_id: string
          id?: never
          paid_at?: string | null
          payment_method_id?: number | null
          status?: string
          sub_total: number
          tax?: number
          total: number
        }
        Update: {
          cash_session_id?: number | null
          created_at?: string
          employee_id?: string
          id?: never
          paid_at?: string | null
          payment_method_id?: number | null
          status?: string
          sub_total?: number
          tax?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_cash_session_id_fkey"
            columns: ["cash_session_id"]
            isOneToOne: false
            referencedRelation: "cash_session"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_method"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_item: {
        Row: {
          id: number
          product_id: number
          quantity: number
          sale_id: number
          unit_price: number
        }
        Insert: {
          id?: never
          product_id: number
          quantity: number
          sale_id: number
          unit_price: number
        }
        Update: {
          id?: never
          product_id?: number
          quantity?: number
          sale_id?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_item_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_item_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sale"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_payment: {
        Row: {
          amount: number
          created_at: string
          id: number
          payment_method_id: number
          sale_id: number
          surcharge_amount: number
        }
        Insert: {
          amount: number
          created_at?: string
          id?: never
          payment_method_id: number
          sale_id: number
          surcharge_amount?: number
        }
        Update: {
          amount?: number
          created_at?: string
          id?: never
          payment_method_id?: number
          sale_id?: number
          surcharge_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_payment_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_method"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_payment_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sale"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movement: {
        Row: {
          created_at: string
          id: number
          note: string | null
          production_id: number | null
          purchase_id: number | null
          quantity: number
          sale_id: number | null
          supply_id: number
          type: string
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: never
          note?: string | null
          production_id?: number | null
          purchase_id?: number | null
          quantity: number
          sale_id?: number | null
          supply_id: number
          type: string
          unit_cost?: number
        }
        Update: {
          created_at?: string
          id?: never
          note?: string | null
          production_id?: number | null
          purchase_id?: number | null
          quantity?: number
          sale_id?: number | null
          supply_id?: number
          type?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_movement_production_id_fkey"
            columns: ["production_id"]
            isOneToOne: false
            referencedRelation: "production"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movement_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchase"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movement_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sale"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movement_supply_id_fkey"
            columns: ["supply_id"]
            isOneToOne: false
            referencedRelation: "supply"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movement_supply_id_fkey"
            columns: ["supply_id"]
            isOneToOne: false
            referencedRelation: "supply_stock"
            referencedColumns: ["supply_id"]
          },
        ]
      }
      supply: {
        Row: {
          created_at: string
          id: number
          is_active: boolean
          min_stock: number
          name: string
          origin: string
          price_includes_vat: boolean
          purchase_price: number
          search_name: string | null
          type: string
          unit: string
          updated_at: string
          vat_rate: number
          waste_percentage: number | null
          yield_factor: number
        }
        Insert: {
          created_at?: string
          id?: never
          is_active?: boolean
          min_stock?: number
          name: string
          origin?: string
          price_includes_vat?: boolean
          purchase_price?: number
          search_name?: string | null
          type: string
          unit: string
          updated_at?: string
          vat_rate?: number
          waste_percentage?: number | null
          yield_factor?: number
        }
        Update: {
          created_at?: string
          id?: never
          is_active?: boolean
          min_stock?: number
          name?: string
          origin?: string
          price_includes_vat?: boolean
          purchase_price?: number
          search_name?: string | null
          type?: string
          unit?: string
          updated_at?: string
          vat_rate?: number
          waste_percentage?: number | null
          yield_factor?: number
        }
        Relationships: []
      }
      supply_component: {
        Row: {
          component_supply_id: number
          id: number
          parent_supply_id: number
          quantity: number
        }
        Insert: {
          component_supply_id: number
          id?: never
          parent_supply_id: number
          quantity: number
        }
        Update: {
          component_supply_id?: number
          id?: never
          parent_supply_id?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "supply_component_component_supply_id_fkey"
            columns: ["component_supply_id"]
            isOneToOne: false
            referencedRelation: "supply"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_component_component_supply_id_fkey"
            columns: ["component_supply_id"]
            isOneToOne: false
            referencedRelation: "supply_stock"
            referencedColumns: ["supply_id"]
          },
          {
            foreignKeyName: "supply_component_parent_supply_id_fkey"
            columns: ["parent_supply_id"]
            isOneToOne: false
            referencedRelation: "supply"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_component_parent_supply_id_fkey"
            columns: ["parent_supply_id"]
            isOneToOne: false
            referencedRelation: "supply_stock"
            referencedColumns: ["supply_id"]
          },
        ]
      }
      tax: {
        Row: {
          amount: number
          created_at: string
          id: number
          is_active: boolean
          is_recoverable: boolean
          name: string
          payment_method_id: number | null
          rate: number
          type: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: never
          is_active?: boolean
          is_recoverable?: boolean
          name: string
          payment_method_id?: number | null
          rate?: number
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: never
          is_active?: boolean
          is_recoverable?: boolean
          name?: string
          payment_method_id?: number | null
          rate?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_method"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      supply_stock: {
        Row: {
          current_stock: number | null
          min_stock: number | null
          name: string | null
          search_name: string | null
          supply_id: number | null
          unit: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      immutable_unaccent: { Args: { value: string }; Returns: string }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
