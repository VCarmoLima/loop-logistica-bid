'use client'

import { useState } from 'react'
import { User, Lock, Mail, Save } from 'lucide-react'
import Cookies from 'js-cookie'
import { supabase } from '@/lib/supabase'

export default function AdminMinhaConta({ user }: { user: any }) {
    const [email, setEmail] = useState(user.email || '')
    const [newPass, setNewPass] = useState('')
    const [confirmPass, setConfirmPass] = useState('')
    const [loading, setLoading] = useState(false)

    const handleUpdate = async () => {
        setLoading(true)
        const payload: any = { email }

        if (newPass) {
            if (newPass !== confirmPass) {
                alert('As senhas não conferem.')
                setLoading(false)
                return
            }
            if (newPass.length < 6) {
                alert('A senha deve ter pelo menos 6 caracteres.')
                setLoading(false)
                return
            }
            payload.senha = newPass
        }

        const table = user.type === 'admin' ? 'admins' : 'transportadoras'
        const { error } = await supabase.from(table).update(payload).eq('id', user.id)

        if (error) {
            alert('Erro ao atualizar: ' + error.message)
        } else {
            alert('Perfil atualizado com sucesso! Faça login novamente para ver as alterações.')
            const newUser = { ...user, email }
            Cookies.set('bid_session', JSON.stringify(newUser))
        }
        setLoading(false)
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Minha Conta</h1>
                <p className="text-gray-500 text-sm">Gerencie suas credenciais de acesso.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                        <User size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{user.nome}</h3>
                        <p className="text-sm text-gray-500">Usuário: {user.usuario}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded uppercase">
                            {user.type === 'admin' ? user.role || 'Admin' : 'Transportadora'}
                        </span>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                            <Mail size={14} /> E-mail de Notificação
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-red-500 outline-none"
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Lock size={16} /> Alterar Senha (Opcional)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="password"
                                placeholder="Nova Senha"
                                value={newPass}
                                onChange={e => setNewPass(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-red-500 outline-none placeholder-gray-400"
                            />
                            <input
                                type="password"
                                placeholder="Confirmar Nova Senha"
                                value={confirmPass}
                                onChange={e => setConfirmPass(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-red-500 outline-none placeholder-gray-400"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleUpdate}
                            disabled={loading}
                            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Salvando...' : <><Save size={18} /> SALVAR ALTERAÇÕES</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}