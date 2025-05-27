export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      blocos: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          ordem: number
          telejornal_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          ordem: number
          telejornal_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          ordem?: number
          telejornal_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocos_telejornal_id_fkey"
            columns: ["telejornal_id"]
            isOneToOne: false
            referencedRelation: "telejornais"
            referencedColumns: ["id"]
          },
        ]
      }
      espelhos_salvos: {
        Row: {
          created_at: string
          data_referencia: string
          data_salvamento: string
          estrutura: Json
          id: string
          nome: string
          telejornal_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_referencia: string
          data_salvamento?: string
          estrutura: Json
          id?: string
          nome: string
          telejornal_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_referencia?: string
          data_salvamento?: string
          estrutura?: Json
          id?: string
          nome?: string
          telejornal_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "espelhos_salvos_telejornal_id_fkey"
            columns: ["telejornal_id"]
            isOneToOne: false
            referencedRelation: "telejornais"
            referencedColumns: ["id"]
          },
        ]
      }
      materias: {
        Row: {
          bloco_id: string | null
          cabeca: string | null
          clip: string | null
          created_at: string | null
          duracao: number | null
          equipamento: string | null
          horario_exibicao: string | null
          id: string
          local_gravacao: string | null
          ordem: number
          pagina: string | null
          reporter: string | null
          retranca: string
          status: string | null
          tags: string[] | null
          texto: string | null
          updated_at: string | null
        }
        Insert: {
          bloco_id?: string | null
          cabeca?: string | null
          clip?: string | null
          created_at?: string | null
          duracao?: number | null
          equipamento?: string | null
          horario_exibicao?: string | null
          id?: string
          local_gravacao?: string | null
          ordem: number
          pagina?: string | null
          reporter?: string | null
          retranca: string
          status?: string | null
          tags?: string[] | null
          texto?: string | null
          updated_at?: string | null
        }
        Update: {
          bloco_id?: string | null
          cabeca?: string | null
          clip?: string | null
          created_at?: string | null
          duracao?: number | null
          equipamento?: string | null
          horario_exibicao?: string | null
          id?: string
          local_gravacao?: string | null
          ordem?: number
          pagina?: string | null
          reporter?: string | null
          retranca?: string
          status?: string | null
          tags?: string[] | null
          texto?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materias_bloco_id_fkey"
            columns: ["bloco_id"]
            isOneToOne: false
            referencedRelation: "blocos"
            referencedColumns: ["id"]
          },
        ]
      }
      pautas: {
        Row: {
          created_at: string | null
          data_cobertura: string | null
          descricao: string | null
          entrevistado: string | null
          horario: string | null
          id: string
          local: string | null
          produtor: string | null
          status: string | null
          titulo: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data_cobertura?: string | null
          descricao?: string | null
          entrevistado?: string | null
          horario?: string | null
          id?: string
          local?: string | null
          produtor?: string | null
          status?: string | null
          titulo: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data_cobertura?: string | null
          descricao?: string | null
          entrevistado?: string | null
          horario?: string | null
          id?: string
          local?: string | null
          produtor?: string | null
          status?: string | null
          titulo?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      telejornais: {
        Row: {
          created_at: string | null
          espelho_aberto: boolean | null
          horario: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          espelho_aberto?: boolean | null
          horario?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          espelho_aberto?: boolean | null
          horario?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      user_role: "editor_chefe" | "editor" | "reporter" | "produtor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["editor_chefe", "editor", "reporter", "produtor"],
    },
  },
} as const
