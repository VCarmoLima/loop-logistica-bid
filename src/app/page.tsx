'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Cookies from 'js-cookie'
import { Eye, EyeOff, Loader2, LogIn, AlertCircle } from 'lucide-react'

// Inicializando Supabase (Cliente)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Estados do Formulário
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. TENTATIVA: Verificar se é ADMIN
      const { data: adminUser } = await supabase
        .from('admins')
        .select('*')
        .eq('usuario', usuario)
        .eq('senha', senha)
        .single()

      if (adminUser) {
        // É Admin! Salvar e redirecionar
        Cookies.set('bid_session', JSON.stringify({
          id: adminUser.id,
          nome: adminUser.nome,
          role: adminUser.role || 'standard',
          type: 'admin' // Definimos o tipo aqui
        }), { expires: 1 })

        router.push('/dashboard')
        return
      }

      // 2. TENTATIVA: Se não é Admin, verificar se é TRANSPORTADORA
      const { data: providerUser } = await supabase
        .from('transportadoras')
        .select('*')
        .eq('usuario', usuario)
        .eq('senha', senha)
        .single()

      if (providerUser) {
        // É Transportadora! Salvar e redirecionar
        Cookies.set('bid_session', JSON.stringify({
          id: providerUser.id,
          nome: providerUser.nome,
          role: 'provider',
          type: 'provider' // Definimos o tipo aqui
        }), { expires: 1 })

        router.push('/dashboard')
        return
      }

      // Se chegou aqui, não achou em nenhuma das duas tabelas
      throw new Error('Usuário ou senha inválidos.')

    } catch (err: any) {
      // O Supabase retorna erro se não achar .single(), então filtramos a mensagem
      const msg = err.message === 'JSON object requested, multiple (or no) rows returned' 
        ? 'Usuário ou senha incorretos.' 
        : err.message
      setError(msg || 'Erro ao conectar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        
        {/* Barra de Topo Neutra (Vermelho da Marca) */}
        <div className="h-2 w-full bg-gradient-to-r from-red-600 to-red-800" />

        <div className="p-8">
          {/* Cabeçalho */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight uppercase">BID Logístico</h1>
            <p className="text-sm text-gray-500 mt-1">Acesso Unificado</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md flex items-center gap-2 animate-pulse">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-gray-800"
                  placeholder="Seu usuário de acesso"
                />
                <LogIn className="absolute left-3 top-3 text-gray-400" size={18} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-gray-800"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-md 
                ${loading 
                  ? 'bg-red-400 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700 hover:shadow-lg hover:-translate-y-0.5'}`}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'ACESSAR SISTEMA'}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400">
              © 2026 VCarmoLima • Release 2.0 (Next.js)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}