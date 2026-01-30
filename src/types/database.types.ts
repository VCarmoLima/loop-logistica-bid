export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      admins: {
        Row: {
          id: string
          nome: string
          usuario: string
          email: string | null
          senha: string // No futuro, hashes não devem trafegar pro front, mas para compatibilidade atual mantemos.
          role: 'standard' | 'master' | string
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          usuario: string
          email?: string | null
          senha: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          usuario?: string
          email?: string | null
          senha?: string
          role?: string
          created_at?: string
        }
      }
      transportadoras: {
        Row: {
          id: string
          nome: string
          usuario: string
          email: string | null
          senha: string
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          usuario: string
          email?: string | null
          senha: string
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          usuario?: string
          email?: string | null
          senha?: string
          created_at?: string
        }
      }
      bids: {
        Row: {
          id: string
          codigo_unico: string | null
          titulo: string
          placa: string | null
          categoria_veiculo: string | null
          quantidade_veiculos: number
          tipo_transporte: string | null
          possui_chave: boolean
          funciona: boolean
          imagem_url: string | null
          origem: string | null
          endereco_retirada: string | null
          destino: string | null
          endereco_entrega: string | null
          status: 'ABERTO' | 'EM_ANALISE' | 'AGUARDANDO_APROVACAO' | 'FINALIZADO' | string
          prazo_limite: string | null
          data_entrega_limite: string | null
          lance_vencedor_id: string | null
          log_criacao: string | null
          log_encerramento: string | null
          log_selecao: string | null
          log_aprovacao: string | null
          created_at: string
        }
        Insert: {
          id?: string
          codigo_unico?: string | null
          titulo: string
          placa?: string | null
          categoria_veiculo?: string | null
          quantidade_veiculos?: number
          tipo_transporte?: string | null
          possui_chave?: boolean
          funciona?: boolean
          imagem_url?: string | null
          origem?: string | null
          endereco_retirada?: string | null
          destino?: string | null
          endereco_entrega?: string | null
          status?: string
          prazo_limite?: string | null
          data_entrega_limite?: string | null
          lance_vencedor_id?: string | null
          log_criacao?: string | null
          log_encerramento?: string | null
          log_selecao?: string | null
          log_aprovacao?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          codigo_unico?: string | null
          titulo?: string
          placa?: string | null
          categoria_veiculo?: string | null
          quantidade_veiculos?: number
          tipo_transporte?: string | null
          possui_chave?: boolean
          funciona?: boolean
          imagem_url?: string | null
          origem?: string | null
          endereco_retirada?: string | null
          destino?: string | null
          endereco_entrega?: string | null
          status?: string
          prazo_limite?: string | null
          data_entrega_limite?: string | null
          lance_vencedor_id?: string | null
          log_criacao?: string | null
          log_encerramento?: string | null
          log_selecao?: string | null
          log_aprovacao?: string | null
          created_at?: string
        }
      }
      lances: {
        Row: {
          id: string
          bid_id: string
          transportadora_nome: string
          valor: number
          prazo_dias: number
          notificado: boolean
          created_at: string
        }
        Insert: {
          id?: string
          bid_id: string
          transportadora_nome: string
          valor: number
          prazo_dias: number
          notificado?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          bid_id?: string
          transportadora_nome?: string
          valor?: number
          prazo_dias?: number
          notificado?: boolean
          created_at?: string
        }
      }
    }
  }
}