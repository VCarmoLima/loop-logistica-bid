'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Cookies from 'js-cookie'
import { Eye, EyeOff, Loader2, User, Lock, AlertCircle } from 'lucide-react'

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

  // Estados do Formulário (Agora usamos Email para o Auth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. AUTENTICAÇÃO OFICIAL (Supabase Auth)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) throw new Error('E-mail ou senha incorretos.')
      if (!authData.user) throw new Error('Erro ao recuperar dados do usuário.')

      const userId = authData.user.id

      // 2. VERIFICAR PERFIL: ADMIN
      // Busca na tabela 'admins' usando o ID do Auth (auth_id)
      const { data: adminUser } = await supabase
        .from('admins')
        .select('*')
        .eq('auth_id', userId)
        .single()

      if (adminUser) {
        Cookies.set('bid_session', JSON.stringify({
          id: adminUser.id,
          nome: adminUser.nome,
          role: adminUser.role || 'standard',
          type: 'admin'
        }), { expires: 1 })

        router.push('/dashboard')
        return
      }

      // 3. VERIFICAR PERFIL: TRANSPORTADORA
      // Busca na tabela 'transportadoras' usando o ID do Auth (auth_id)
      const { data: providerUser } = await supabase
        .from('transportadoras')
        .select('*')
        .eq('auth_id', userId)
        .single()

      if (providerUser) {
        Cookies.set('bid_session', JSON.stringify({
          id: providerUser.id,
          nome: providerUser.nome,
          role: 'provider',
          type: 'provider'
        }), { expires: 1 })

        router.push('/dashboard')
        return
      }

      // Se logou no Auth mas não tem perfil nas tabelas
      throw new Error('Usuário autenticado, mas sem perfil associado no sistema.')

    } catch (err: any) {
      // Tratamento de erro amigável
      const msg = err.message === 'Invalid login credentials'
        ? 'E-mail ou senha incorretos.'
        : err.message
      setError(msg || 'Erro ao conectar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">

        {/* Barra de Topo Neutra (Vermelho da Marca) - Mantida */}
        <div className="h-2 w-full bg-gradient-to-r from-red-600 to-red-800" />

        <div className="p-8">
          {/* Cabeçalho */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight uppercase">BID Logístico</h1>
            <p className="text-sm text-gray-500 mt-1">Acesso Seguro</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md flex items-center gap-2 animate-pulse border border-red-100">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail Corporativo</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-gray-800"
                  placeholder="seu@email.com"
                />
                <User className="absolute left-3 top-3 text-gray-400" size={18} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-gray-800"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
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
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'ENTRAR NO SISTEMA'}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} VCarmoLima — Todos os direitos reservados.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Precisa de ajuda?
              <a
                href="mailto:viniciuscarmo.contato@gmail.com"
                className="text-red-600 hover:underline ml-1"
              >
                Suporte Técnico
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}