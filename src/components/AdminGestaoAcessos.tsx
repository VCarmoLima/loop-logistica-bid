'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Users, Truck, Trash2, Key, Shield } from 'lucide-react'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

export default function AdminGestaoAcessos({ user }: { user: any }) {
    const [activeTab, setActiveTab] = useState<'admins' | 'transportadoras'>('transportadoras')
    const [usersList, setUsersList] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Form States
    const [newName, setNewName] = useState('')
    const [newEmail, setNewEmail] = useState('')
    const [newUser, setNewUser] = useState('')
    const [newPass, setNewPass] = useState('')
    const [newRole, setNewRole] = useState('standard')

    useEffect(() => {
        fetchUsers()
    }, [activeTab])

    const fetchUsers = async () => {
        setLoading(true)
        const table = activeTab === 'admins' ? 'admins' : 'transportadoras'
        const { data } = await supabase.from(table).select('*').order('nome')
        if (data) setUsersList(data)
        setLoading(false)
    }

    const gerarSenha = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$";
        let pass = "";
        for (let i = 0; i < 10; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewPass(pass)
    }

    const handleCreate = async () => {
        if (!newName || !newEmail || !newPass) return alert('Preencha nome, email e senha.')

        setLoading(true)

        try {
            // 1. Criar Usuário no Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: newEmail,
                password: newPass,
            })

            if (authError) throw authError
            if (!authData.user) throw new Error("Erro ao gerar ID de autenticação")

            // 2. Criar o Perfil no Banco
            const table = activeTab === 'admins' ? 'admins' : 'transportadoras'
            const payload: any = {
                auth_id: authData.user.id,
                nome: newName,
                email: newEmail,
                usuario: newEmail.split('@')[0],
            }
            if (activeTab === 'admins') payload.role = newRole

            const { error: dbError } = await supabase.from(table).insert(payload)

            if (dbError) throw dbError

            // 3. Enviar E-mail de Boas Vindas (CORRIGIDO COM TRATAMENTO DE ERRO)
            const emailResponse = await fetch('/api/send-welcome', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: newEmail,
                    nome: newName,
                    senhaTemporaria: newPass,
                    tipo: activeTab === 'admins' ? 'admin' : 'transportadora'
                })
            })

            const emailResult = await emailResponse.json()

            if (!emailResponse.ok) {
                // Se deu erro no envio, avisamos, mas não travamos o cadastro
                console.error("Erro API Email:", emailResult)
                alert(`Usuário criado, mas o e-mail falhou: ${emailResult.error}`)
            } else {
                alert('Usuário criado com Sucesso e E-mail enviado!')
            }

            setNewName(''); setNewEmail(''); setNewUser(''); setNewPass('')
            fetchUsers()

        } catch (err: any) {
            console.error(err)
            alert('Erro: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este usuário?')) return
        const table = activeTab === 'admins' ? 'admins' : 'transportadoras'
        await supabase.from(table).delete().eq('id', id)
        fetchUsers()
    }

    // Apenas Master pode ver Admins
    const isMaster = user.role === 'master'

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Gestão de Acessos</h1>
                <p className="text-gray-500 text-sm">Gerencie quem pode acessar o sistema.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('transportadoras')}
                    className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'transportadoras' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Truck size={18} /> Transportadoras
                </button>
                {isMaster && (
                    <button
                        onClick={() => setActiveTab('admins')}
                        className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'admins' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Shield size={18} /> Administradores
                    </button>
                )}
            </div>

            {/* Formulário de Criação */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 uppercase mb-4">Adicionar Novo {activeTab === 'admins' ? 'Admin' : 'Parceiro'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        placeholder="Nome / Razão Social *"
                        className="p-2.5 border border-gray-300 rounded text-sm text-gray-900 outline-none focus:border-red-500"
                        value={newName} onChange={e => setNewName(e.target.value)}
                    />
                    <input
                        placeholder="E-mail de Contato"
                        className="p-2.5 border border-gray-300 rounded text-sm text-gray-900 outline-none focus:border-red-500"
                        value={newEmail} onChange={e => setNewEmail(e.target.value)}
                    />
                    <input
                        placeholder="Usuário de Login *"
                        className="p-2.5 border border-gray-300 rounded text-sm text-gray-900 outline-none focus:border-red-500"
                        value={newUser} onChange={e => setNewUser(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <input
                            placeholder="Senha Provisória *"
                            className="p-2.5 border border-gray-300 rounded text-sm text-gray-900 outline-none focus:border-red-500 flex-1"
                            value={newPass} onChange={e => setNewPass(e.target.value)}
                        />
                        <button
                            onClick={gerarSenha}
                            title="Gerar Senha"
                            className="px-3 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 text-gray-600"
                        >
                            <Key size={16} />
                        </button>
                    </div>

                    {activeTab === 'admins' && (
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Nível de Permissão</label>
                            <div className="flex gap-4 mt-1">
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input type="radio" name="role" value="standard" checked={newRole === 'standard'} onChange={() => setNewRole('standard')} className="text-red-600 focus:ring-red-500" /> Standard (Criar/Analisar)
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input type="radio" name="role" value="master" checked={newRole === 'master'} onChange={() => setNewRole('master')} className="text-red-600 focus:ring-red-500" /> Master (Aprovação Final)
                                </label>
                            </div>
                        </div>
                    )}
                </div>
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={handleCreate}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded text-sm shadow-sm transition-colors"
                    >
                        CADASTRAR USUÁRIO
                    </button>
                </div>
            </div>

            {/* Lista */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3">Nome</th>
                            <th className="px-6 py-3">Login</th>
                            <th className="px-6 py-3">Email</th>
                            {activeTab === 'admins' && <th className="px-6 py-3">Permissão</th>}
                            <th className="px-6 py-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {usersList.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50">
                                <td className="px-6 py-3 font-medium text-gray-900">{u.nome}</td>
                                <td className="px-6 py-3 text-gray-600 font-mono">{u.usuario}</td>
                                <td className="px-6 py-3 text-gray-500">{u.email || '-'}</td>
                                {activeTab === 'admins' && (
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${u.role === 'master' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
                                            {u.role || 'standard'}
                                        </span>
                                    </td>
                                )}
                                <td className="px-6 py-3 text-right">
                                    <button
                                        onClick={() => handleDelete(u.id)}
                                        disabled={u.id === user.id} // Não pode se deletar
                                        className="text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {usersList.length === 0 && !loading && (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Nenhum registro encontrado.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}