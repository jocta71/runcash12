/**
 * Tipos mock para substituir os tipos gerados pelo Supabase
 * Esta implementação não depende da API do Supabase
 */

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
      roletas: {
        Row: {
          id: string;
          created_at: string;
          nome: string;
          provider: string;
          status: string;
          ultima_atualizacao: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          nome: string;
          provider: string;
          status?: string;
          ultima_atualizacao?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          nome?: string;
          provider?: string;
          status?: string;
          ultima_atualizacao?: string | null;
        };
      };
      roleta_numeros: {
        Row: {
          id: string;
          created_at: string;
          roleta_id: string;
          roleta_nome: string;
          numero: number;
          cor: 'vermelho' | 'preto' | 'verde';
          timestamp: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          roleta_id: string;
          roleta_nome: string;
          numero: number;
          cor: 'vermelho' | 'preto' | 'verde';
          timestamp?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          roleta_id?: string;
          roleta_nome?: string;
          numero?: number;
          cor?: 'vermelho' | 'preto' | 'verde';
          timestamp?: string;
        };
      };
      planos: {
        Row: {
          id: string;
          created_at: string;
          nome: string;
          descricao: string;
          preco: number;
          intervalo: string;
          features: string[] | null;
          stripe_price_id: string | null;
          is_custom: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          nome: string;
          descricao: string;
          preco: number;
          intervalo: string;
          features?: string[] | null;
          stripe_price_id?: string | null;
          is_custom?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          nome?: string;
          descricao?: string;
          preco?: number;
          intervalo?: string;
          features?: string[] | null;
          stripe_price_id?: string | null;
          is_custom?: boolean;
        };
      };
      perfis: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          nome: string | null;
          avatar_url: string | null;
          email: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          nome?: string | null;
          avatar_url?: string | null;
          email?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          nome?: string | null;
          avatar_url?: string | null;
          email?: string | null;
        };
      };
      assinaturas: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          plano_id: string;
          status: string;
          inicio: string;
          fim: string | null;
          metodo_pagamento: string | null;
          provedor_pagamento: string | null;
          payment_id: string | null;
          proxima_cobranca: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          plano_id: string;
          status?: string;
          inicio?: string;
          fim?: string | null;
          metodo_pagamento?: string | null;
          provedor_pagamento?: string | null;
          payment_id?: string | null;
          proxima_cobranca?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          plano_id?: string;
          status?: string;
          inicio?: string;
          fim?: string | null;
          metodo_pagamento?: string | null;
          provedor_pagamento?: string | null;
          payment_id?: string | null;
          proxima_cobranca?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
