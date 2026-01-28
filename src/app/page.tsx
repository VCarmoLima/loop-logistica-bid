'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Cookies from 'js-cookie'
import { Montserrat } from 'next/font/google'
import {
  Eye, EyeOff, Loader2, User, Lock, AlertCircle, CheckCircle, Mail, ArrowLeft, Send
} from 'lucide-react'

// CONFIGURANDO A FONTE DO LOGO
const logoFont = Montserrat({
  subsets: ['latin'],
  weight: ['600', '800'],
  display: 'swap',
})

// Inicializando Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

export default function LoginPage() {
  const router = useRouter()

  // ESTADOS
  const [view, setView] = useState<'login' | 'forgot'>('login')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // FORMULÁRIO
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // ESTADO DO LOGO
  const [logoError, setLogoError] = useState(false)

  // --- LOGIN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) throw new Error('E-mail ou senha incorretos.')
      if (!authData.user) throw new Error('Erro ao recuperar dados do usuário.')

      const userId = authData.user.id

      // Verifica ADMIN
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

      // Verifica TRANSPORTADORA
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

      throw new Error('Usuário sem perfil associado.')

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message === 'Invalid login credentials' ? 'Credenciais inválidas.' : err.message })
    } finally {
      setLoading(false)
    }
  }

  // --- RECUPERAÇÃO ---
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })

      if (error) throw error

      // SUCESSO: Define a mensagem (que ativará a Tela de Sucesso no render)
      setMessage({ type: 'success', text: 'Link enviado com sucesso!' })

    } catch (err: any) {
      setMessage({ type: 'error', text: 'Erro ao enviar e-mail. Verifique o endereço.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">

        {/* Barra de Topo */}
        <div className="h-2 w-full bg-gradient-to-r from-red-600 to-red-800" />

        <div className="p-8">

          {/* CABEÇALHO / LOGO */}
          {/* Só mostramos o logo se NÃO estiver na tela de sucesso (para ficar mais limpo) ou mantemos se preferir */}
          <div className="flex flex-col items-center justify-center mb-8 select-none">
            {!logoError ? (
              <>
                <img
                  src="/images/logo.webp"
                  alt="Logo"
                  className="h-10 w-auto object-contain mb-2"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    setLogoError(true);
                  }}
                />
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em]">
                  Sistema de BIDs
                </span>
              </>
            ) : (
              <div className="text-center">
                <div className={`flex items-baseline justify-center leading-none ${logoFont.className}`}>
                  <span className="text-3xl font-extrabold text-gray-800 tracking-tight">BID</span>
                  <span className="text-3xl font-semibold text-red-600 ml-1">Logístico</span>
                </div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] block mt-2">
                  Sistema de BIDs
                </span>
              </div>
            )}
          </div>

          {/* ÁREA DE FEEDBACK (Apenas Erros) */}
          {/* Se for sucesso na recuperação, ocultamos aqui pois mostraremos a tela dedicada */}
          {message && message.type === 'error' && (
            <div className="mb-6 p-3 rounded-md flex items-center gap-2 text-sm border bg-red-50 text-red-600 border-red-100 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} />
              {message.text}
            </div>
          )}

          {/* LÓGICA DE NAVEGAÇÃO ENTRE TELAS */}

          {view === 'login' ? (
            /* --- TELA 1: LOGIN --- */
            <form onSubmit={handleLogin} className="space-y-5 animate-in fade-in slide-in-from-left-4">

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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Senha</label>
                  <button
                    type="button"
                    onClick={() => { setMessage(null); setView('forgot'); }}
                    className="text-xs text-red-600 hover:text-red-800 hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
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

          ) : (
            /* --- FLUXO DE RECUPERAÇÃO --- */

            // SE TIVER SUCESSO, MOSTRA TELA DE "EMAIL ENVIADO"
            message?.type === 'success' ? (
              <div className="text-center animate-in zoom-in-95 duration-300">
                <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 text-green-600">
                  <Send size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">E-mail Enviado!</h3>
                <p className="text-sm text-gray-500 mb-6 px-4 leading-relaxed">
                  Enviamos um link de recuperação para:<br />
                  <span className="font-semibold text-gray-800">{email}</span>
                </p>

                <button
                  onClick={() => { setMessage(null); setView('login'); setEmail(''); setPassword(''); }}
                  className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-lg transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={18} /> Voltar para o Login
                </button>
              </div>
            ) : (
              // SE NÃO TIVER SUCESSO AINDA, MOSTRA O FORMULÁRIO
              <form onSubmit={handleResetPassword} className="space-y-5 animate-in fade-in slide-in-from-right-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Recuperar Acesso</h3>
                  <p className="text-xs text-gray-500 mt-1 px-4">
                    Digite seu e-mail abaixo para receber as instruções de redefinição de senha.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail Cadastrado</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-gray-800"
                      placeholder="seu@email.com"
                    />
                    <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-md 
                        ${loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gray-800 hover:bg-gray-900 hover:shadow-lg hover:-translate-y-0.5'}`}
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'ENVIAR LINK DE RECUPERAÇÃO'}
                </button>

                <button
                  type="button"
                  onClick={() => { setMessage(null); setView('login'); }}
                  className="w-full py-2 text-gray-500 hover:text-gray-900 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <ArrowLeft size={16} /> Voltar para o Login
                </button>
              </form>
            )
          )}

          {/* RODAPÉ */}
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