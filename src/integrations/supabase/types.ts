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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
        }
        Relationships: []
      }
      materias: {
        Row: {
          bloco_id: string | null
          cabeca: string | null
          clip: string | null
          created_at: string | null
          duracao: number | null
          editor: string | null
          equipamento: string | null
          gc: string | null
          horario_exibicao: string | null
          id: string
          is_from_snapshot: boolean | null
          local_gravacao: string | null
          ordem: number
          pagina: string | null
          reporter: string | null
          retranca: string
          status: string | null
          tags: string[] | null
          tempo_clip: string | null
          texto: string | null
          tipo_material: string | null
          updated_at: string | null
        }
        Insert: {
          bloco_id?: string | null
          cabeca?: string | null
          clip?: string | null
          created_at?: string | null
          duracao?: number | null
          editor?: string | null
          equipamento?: string | null
          gc?: string | null
          horario_exibicao?: string | null
          id?: string
          is_from_snapshot?: boolean | null
          local_gravacao?: string | null
          ordem: number
          pagina?: string | null
          reporter?: string | null
          retranca: string
          status?: string | null
          tags?: string[] | null
          tempo_clip?: string | null
          texto?: string | null
          tipo_material?: string | null
          updated_at?: string | null
        }
        Update: {
          bloco_id?: string | null
          cabeca?: string | null
          clip?: string | null
          created_at?: string | null
          duracao?: number | null
          editor?: string | null
          equipamento?: string | null
          gc?: string | null
          horario_exibicao?: string | null
          id?: string
          is_from_snapshot?: boolean | null
          local_gravacao?: string | null
          ordem?: number
          pagina?: string | null
          reporter?: string | null
          retranca?: string
          status?: string | null
          tags?: string[] | null
          tempo_clip?: string | null
          texto?: string | null
          tipo_material?: string | null
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
      materias_locks: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          locked_at: string
          materia_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          locked_at?: string
          materia_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          locked_at?: string
          materia_id?: string
          user_id?: string
        }
        Relationships: []
      }
      materias_snapshots: {
        Row: {
          bloco_nome: string | null
          bloco_ordem: number | null
          cabeca: string | null
          clip: string | null
          created_at: string | null
          created_by: string | null
          duracao: number | null
          equipamento: string | null
          gc: string | null
          horario_exibicao: string | null
          id: string
          is_snapshot: boolean | null
          local_gravacao: string | null
          materia_original_id: string | null
          ordem: number
          pagina: string | null
          reporter: string | null
          retranca: string
          snapshot_id: string | null
          status: string | null
          tags: string[] | null
          tempo_clip: string | null
          texto: string | null
          tipo_material: string | null
          updated_at: string | null
        }
        Insert: {
          bloco_nome?: string | null
          bloco_ordem?: number | null
          cabeca?: string | null
          clip?: string | null
          created_at?: string | null
          created_by?: string | null
          duracao?: number | null
          equipamento?: string | null
          gc?: string | null
          horario_exibicao?: string | null
          id?: string
          is_snapshot?: boolean | null
          local_gravacao?: string | null
          materia_original_id?: string | null
          ordem?: number
          pagina?: string | null
          reporter?: string | null
          retranca: string
          snapshot_id?: string | null
          status?: string | null
          tags?: string[] | null
          tempo_clip?: string | null
          texto?: string | null
          tipo_material?: string | null
          updated_at?: string | null
        }
        Update: {
          bloco_nome?: string | null
          bloco_ordem?: number | null
          cabeca?: string | null
          clip?: string | null
          created_at?: string | null
          created_by?: string | null
          duracao?: number | null
          equipamento?: string | null
          gc?: string | null
          horario_exibicao?: string | null
          id?: string
          is_snapshot?: boolean | null
          local_gravacao?: string | null
          materia_original_id?: string | null
          ordem?: number
          pagina?: string | null
          reporter?: string | null
          retranca?: string
          snapshot_id?: string | null
          status?: string | null
          tags?: string[] | null
          tempo_clip?: string | null
          texto?: string | null
          tipo_material?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      modelos_salvos: {
        Row: {
          created_at: string
          descricao: string | null
          estrutura: Json
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          estrutura: Json
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          estrutura?: Json
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      pautas: {
        Row: {
          created_at: string | null
          data_cobertura: string | null
          descricao: string | null
          encaminhamento: string | null
          entrevistado: string | null
          horario: string | null
          id: string
          informacoes: string | null
          local: string | null
          produtor: string | null
          programa: string | null
          proposta: string | null
          reporter: string | null
          status: string | null
          titulo: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data_cobertura?: string | null
          descricao?: string | null
          encaminhamento?: string | null
          entrevistado?: string | null
          horario?: string | null
          id?: string
          informacoes?: string | null
          local?: string | null
          produtor?: string | null
          programa?: string | null
          proposta?: string | null
          reporter?: string | null
          status?: string | null
          titulo: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data_cobertura?: string | null
          descricao?: string | null
          encaminhamento?: string | null
          entrevistado?: string | null
          horario?: string | null
          id?: string
          informacoes?: string | null
          local?: string | null
          produtor?: string | null
          programa?: string | null
          proposta?: string | null
          reporter?: string | null
          status?: string | null
          titulo?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      permission_audit_logs: {
        Row: {
          action: string
          actor_user_id: string
          created_at: string
          details: Json | null
          id: string
          new_role: Database["public"]["Enums"]["user_role"] | null
          old_role: Database["public"]["Enums"]["user_role"] | null
          permission_type: Database["public"]["Enums"]["permission_type"] | null
          target_user_id: string
          telejornal_id: string | null
          timestamp: string
        }
        Insert: {
          action: string
          actor_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          new_role?: Database["public"]["Enums"]["user_role"] | null
          old_role?: Database["public"]["Enums"]["user_role"] | null
          permission_type?:
            | Database["public"]["Enums"]["permission_type"]
            | null
          target_user_id: string
          telejornal_id?: string | null
          timestamp?: string
        }
        Update: {
          action?: string
          actor_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          new_role?: Database["public"]["Enums"]["user_role"] | null
          old_role?: Database["public"]["Enums"]["user_role"] | null
          permission_type?:
            | Database["public"]["Enums"]["permission_type"]
            | null
          target_user_id?: string
          telejornal_id?: string | null
          timestamp?: string
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
      user_permissions: {
        Row: {
          assigned_by: string | null
          created_at: string | null
          id: string
          is_granted: boolean
          permission: Database["public"]["Enums"]["permission_type"]
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          is_granted?: boolean
          permission: Database["public"]["Enums"]["permission_type"]
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          is_granted?: boolean
          permission?: Database["public"]["Enums"]["permission_type"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_telejornal_access: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          telejornal_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          telejornal_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          telejornal_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_telejornal_access_telejornal_id_fkey"
            columns: ["telejornal_id"]
            isOneToOne: false
            referencedRelation: "telejornais"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_telejornal: {
        Args: { _telejornal_id: string; _user_id: string }
        Returns: boolean
      }
      cleanup_expired_locks: { Args: never; Returns: undefined }
      enable_realtime: { Args: { table_name: string }; Returns: boolean }
      get_current_user_role: { Args: never; Returns: string }
      get_effective_telejornal_role: {
        Args: { _telejornal_id: string; _user_id: string }
        Returns: string
      }
      get_user_permissions: {
        Args: { _user_id: string }
        Returns: {
          permission: string
        }[]
      }
      has_permission: {
        Args: {
          _permission: Database["public"]["Enums"]["permission_type"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      permission_type:
        | "criar_materia"
        | "editar_materia"
        | "excluir_materia"
        | "criar_bloco"
        | "editar_bloco"
        | "excluir_bloco"
        | "criar_telejornal"
        | "editar_telejornal"
        | "excluir_telejornal"
        | "gerenciar_espelho"
        | "fechar_espelho"
        | "criar_pauta"
        | "editar_pauta"
        | "excluir_pauta"
        | "visualizar_todas_pautas"
        | "gerenciar_usuarios"
        | "gerenciar_permissoes"
        | "visualizar_snapshots"
        | "excluir_snapshots"
        | "duplicar_materia"
        | "copiar_materia"
        | "colar_materia"
        | "reordenar_materias"
        | "transferir_materias"
        | "copiar_bloco"
        | "colar_bloco"
        | "renomear_bloco"
        | "salvar_modelo"
        | "aplicar_modelo"
        | "excluir_modelo"
        | "visualizar_modelos"
        | "exportar_gc"
        | "exportar_playout"
        | "exportar_lauda"
        | "exportar_clip_retranca"
        | "exportar_rss"
        | "visualizar_teleprompter"
        | "visualizar_laudas"
        | "busca_profunda"
        | "visualizar_historico_espelhos"
        | "abrir_espelho"
        | "salvar_espelho"
        | "editar_espelho_salvo"
        | "excluir_espelho_salvo"
        | "criar_snapshot"
        | "editar_snapshot"
      user_role: "reporter" | "editor" | "editor_chefe" | "produtor"
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
      permission_type: [
        "criar_materia",
        "editar_materia",
        "excluir_materia",
        "criar_bloco",
        "editar_bloco",
        "excluir_bloco",
        "criar_telejornal",
        "editar_telejornal",
        "excluir_telejornal",
        "gerenciar_espelho",
        "fechar_espelho",
        "criar_pauta",
        "editar_pauta",
        "excluir_pauta",
        "visualizar_todas_pautas",
        "gerenciar_usuarios",
        "gerenciar_permissoes",
        "visualizar_snapshots",
        "excluir_snapshots",
        "duplicar_materia",
        "copiar_materia",
        "colar_materia",
        "reordenar_materias",
        "transferir_materias",
        "copiar_bloco",
        "colar_bloco",
        "renomear_bloco",
        "salvar_modelo",
        "aplicar_modelo",
        "excluir_modelo",
        "visualizar_modelos",
        "exportar_gc",
        "exportar_playout",
        "exportar_lauda",
        "exportar_clip_retranca",
        "exportar_rss",
        "visualizar_teleprompter",
        "visualizar_laudas",
        "busca_profunda",
        "visualizar_historico_espelhos",
        "abrir_espelho",
        "salvar_espelho",
        "editar_espelho_salvo",
        "excluir_espelho_salvo",
        "criar_snapshot",
        "editar_snapshot",
      ],
      user_role: ["reporter", "editor", "editor_chefe", "produtor"],
    },
  },
} as const
