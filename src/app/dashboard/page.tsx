'use client'

import { useEffect, useState, useCallback } from 'react'
import Cookies from 'js-cookie'
import AdminDashboard from '@/components/AdminDashboard'
import BidCard from '@/components/BidCard'
import { createClient } from '@supabase/supabase-js'
import { Truck, Info, Wifi } from 'lucide-react'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null)
    const [bidsTransp, setBidsTransp] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showRules, setShowRules] = useState(false)
    const [isLive, setIsLive] = useState(false) // Estado para indicar conexão ativa

    // Função de busca silenciosa
    const fetchBidsTransporter = useCallback(async () => {
        const { data } = await supabase
            .from('bids')
            .select('*, lances!lances_bid_id_fkey(*)')
            .eq('status', 'ABERTO')
            .order('created_at', { ascending: false })

        if (data) {
            setBidsTransp(data)
            setIsLive(true)
        }
    }, [])

    useEffect(() => {
        let channel: any = null
        let interval: any = null

        const init = async () => {
            const session = Cookies.get('bid_session')
            if (session) {
                const userData = JSON.parse(session)
                setUser(userData)

                if (userData.type !== 'admin') {
                    // 1. Busca Inicial
                    await fetchBidsTransporter()

                    // 2. Realtime (Instantâneo)
                    channel = supabase.channel('mural-realtime')
                        .on(
                            'postgres_changes',
                            { event: '*', schema: 'public', table: 'bids' }, // Escuta BIDs novos
                            (payload) => {
                                console.log('⚡ Novo BID ou alteração:', payload)
                                fetchBidsTransporter()
                            }
                        )
                        .on(
                            'postgres_changes',
                            { event: '*', schema: 'public', table: 'lances' }, // Escuta Lances (para atualizar ranking)
                            (payload) => {
                                console.log('⚡ Novo Lance:', payload)
                                fetchBidsTransporter()
                            }
                        )
                        .subscribe((status) => {
                            if (status === 'SUBSCRIBED') setIsLive(true)
                        })

                    // 3. Polling de Segurança (A cada 3s - "Heartbeat")
                    interval = setInterval(() => {
                        fetchBidsTransporter()
                    }, 3000)
                }
            }
            setLoading(false)
        }

        init()

        return () => {
            if (channel) supabase.removeChannel(channel)
            if (interval) clearInterval(interval)
        }
    }, [fetchBidsTransporter])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                <span className="text-sm font-medium">Conectando ao satélite...</span>
            </div>
        )
    }

    // 1. VISÃO ADMIN (Se você precisar alterar o Admin também, me avise para editar o componente AdminDashboard)
    if (user?.type === 'admin') {
        return <AdminDashboard user={user} />
    }

    // 2. VISÃO TRANSPORTADORA (Mural Automático)
    return (
        <div className="min-h-[80vh]">

            {/* HEADER LIMPO & AUTOMÁTICO */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-3 pb-2">
                <div className="w-full">
                    <div className="flex justify-between items-center mb-1">
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-none">
                            Mural de Oportunidades
                        </h1>

                        {/* INDICADOR DE "AO VIVO" (Substitui o botão) */}
                        <div className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm
                    ${isLive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-100 text-gray-400'}
                `}>
                            <span className="relative flex h-2.5 w-2.5">
                                {isLive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isLive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                            </span>
                            {isLive ? 'TEMPO REAL' : 'CONECTANDO...'}
                        </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-start gap-4 mt-2">
                        <p className="text-gray-500 text-xs md:text-sm">
                            As cargas aparecem automaticamente aqui.
                        </p>

                        {/* Botão de Regras */}
                        <button
                            onClick={() => setShowRules(!showRules)}
                            className={`
                        text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all
                        ${showRules
                                    ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                    `}
                        >
                            <Info size={12} strokeWidth={2.5} />
                            {showRules ? 'Regras' : 'Ver Regras'}
                        </button>
                    </div>
                </div>
            </div>

            {/* REGRAS (Colapsável) */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showRules ? 'max-h-[500px] opacity-100 mb-6' : 'max-h-0 opacity-0 mb-0'}`}>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 md:p-5 text-sm text-blue-900 shadow-sm mx-1 md:mx-0">
                    <h3 className="font-bold mb-3 flex items-center gap-2 text-blue-800"><Info size={16} /> Regras do Leilão</h3>
                    <ul className="space-y-2 text-blue-800/80 text-xs md:text-sm">
                        <li className="flex gap-2 items-start">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0"></span>
                            <span><strong>Ranking:</strong> Menor Preço vence. Empate = Menor Prazo.</span>
                        </li>
                        <li className="flex gap-2 items-start">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0"></span>
                            <span><strong>Lance Automático:</strong> O sistema atualiza a lista a cada lance novo.</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* GRID DE CARDS */}
            {bidsTransp.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-dashed border-gray-200 mx-1 md:mx-0 animate-in fade-in duration-500">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                        <Wifi size={32} className="animate-pulse" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Aguardando Cargas...</h3>
                    <p className="text-gray-500 text-sm mt-1 max-w-xs text-center">
                        Fique atento. Novas oportunidades aparecerão aqui automaticamente.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-20 md:pb-0">
                    {bidsTransp.map((bid) => (
                        <BidCard
                            key={bid.id}
                            bid={bid}
                            userId={user.id}
                            userName={user.nome}
                            onUpdate={fetchBidsTransporter}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}