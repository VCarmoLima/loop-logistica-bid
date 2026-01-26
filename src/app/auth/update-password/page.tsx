'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Montserrat } from 'next/font/google'
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import Cookies from 'js-cookie'

// Configuração da Fonte (Igual ao resto do projeto)
const logoFont = Montserrat({
    subsets: ['latin'],
    weight: ['600', '800'],
    display: 'swap',
})

// Inicializa Supabase
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

export default function UpdatePasswordPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    // O Supabase detecta automaticamente a sessão pelo hash da URL (#access_token=...)
    // Não precisamos fazer nada complexo aqui, apenas deixar o cliente carregar.

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'As senhas não coincidem.' })
            return
        }

        if (password.length < 6) {
            setMessage({ type: 'error', text: 'A senha deve ter no mínimo 6 caracteres.' })
            return
        }

        setLoading(true)
        setMessage(null)

        try {
            // Atualiza a senha do usuário logado (via link mágico)
            const { data, error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) throw error

            // Sucesso!
            setMessage({ type: 'success', text: 'Senha atualizada com sucesso!' })

            // Se quiser, pode renovar o cookie ou apenas redirecionar
            // Aguarda 1.5s para o usuário ler a mensagem e redireciona para Login ou Dashboard
            setTimeout(() => {
                router.push('/') // Manda de volta para o login para garantir
            }, 2000)

        } catch (err: any) {
            setMessage({ type: 'error', text: 'Erro ao atualizar senha. O link pode ter expirado.' })
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

                    {/* Cabeçalho */}
                    <div className="flex flex-col items-center justify-center mb-8 select-none">
                        {/* Logo Texto (Fallback para garantir visual) */}
                        <div className="text-center">
                            <div className={`flex items-baseline justify-center leading-none ${logoFont.className}`}>
                                <span className="text-3xl font-extrabold text-gray-800 tracking-tight">BID</span>
                                <span className="text-3xl font-semibold text-red-600 ml-1">Logístico</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] block mt-2">
                                Definir Nova Senha
                            </span>
                        </div>
                    </div>

                    {/* Mensagens */}
                    {message && (
                        <div className={`mb-6 p-3 rounded-md flex items-center gap-2 text-sm border animate-in fade-in slide-in-from-top-2
              ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}
            `}>
                            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleUpdatePassword} className="space-y-5">

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-gray-800"
                                    placeholder="Mínimo 6 caracteres"
                                />
                                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-gray-800"
                                    placeholder="Repita a senha"
                                />
                                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
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
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <>ATUALIZAR SENHA <ArrowRight size={18} /></>}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    )
}