'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
    Truck, Clock, CheckCircle, AlertCircle, XCircle,
    MoreVertical, MapPin, Package, DollarSign, Filter,
    Users
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

export default function AdminDashboard({ user }: { user: any }) {
    const [bids, setBids] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('TODOS')

    // Buscar BIDs
    const fetchBids = async () => {
        setLoading(true)
        let query = supabase
            .from('bids')
            .select('*, lances(count)') // Traz a contagem de lances
            .order('created_at', { ascending: false })

        if (filter !== 'TODOS') {
            query = query.eq('status', filter)
        }

        const { data } = await query
        if (data) setBids(data)
        setLoading(false)
    }

    useEffect(() => {
        fetchBids()

        // Realtime para Admin (Atualiza quando entra lance ou cria bid)
        const channel = supabase.channel('admin-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bids' }, fetchBids)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'lances' }, fetchBids)
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [filter])

    // --- HELPERS VISUAIS ---
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ABERTO': return 'bg-green-100 text-green-700 border-green-200'
            case 'ENCERRADO': return 'bg-red-100 text-red-700 border-red-200'
            case 'ANALISE': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
            case 'HOMOLOGADO': return 'bg-blue-100 text-blue-700 border-blue-200'
            default: return 'bg-gray-100 text-gray-600 border-gray-200'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ABERTO': return <Clock size={14} className="mr-1" />
            case 'ENCERRADO': return <XCircle size={14} className="mr-1" />
            case 'HOMOLOGADO': return <CheckCircle size={14} className="mr-1" />
            default: return <AlertCircle size={14} className="mr-1" />
        }
    }

    return (
        <div className="pb-20 md:pb-0"> {/* Padding bottom extra no mobile para não colar no menu inferior se houver */}

            {/* 1. HEADER & FILTROS (Mobile First) */}
            <div className="mb-6 space-y-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">Painel de Monitoramento</h1>
                    <p className="text-xs md:text-sm text-gray-500">Gestão em tempo real das cotações.</p>
                </div>

                {/* Barra de Filtros com Scroll Horizontal (Estilo App) */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                    {['TODOS', 'ABERTO', 'ANALISE', 'ENCERRADO', 'HOMOLOGADO'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`
                        whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border
                        ${filter === status
                                    ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}
                    `}
                        >
                            {status === 'TODOS' ? 'Todos' : status}
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. LISTA DE BIDS */}
            {loading ? (
                <div className="text-center py-10 text-gray-400 text-sm">Carregando dados...</div>
            ) : bids.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
                    <Filter className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                    <p className="text-gray-500 text-sm">Nenhum BID encontrado com este filtro.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bids.map((bid) => (
                        <div
                            key={bid.id}
                            className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative"
                        >
                            {/* Cabeçalho do Card */}
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 flex-shrink-0">
                                        <Package size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center ${getStatusColor(bid.status)}`}>
                                                {getStatusIcon(bid.status)}
                                                {bid.status}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {bid.id.slice(0, 8)}...
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-sm md:text-base leading-tight line-clamp-1" title={bid.titulo}>
                                            {bid.titulo}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                            {bid.modelo_veiculo} • {bid.tipo_carroceria}
                                        </p>
                                    </div>
                                </div>

                                {/* Menu de Ações (Opcional) */}
                                {/* <button className="text-gray-300 hover:text-gray-600"><MoreVertical size={16} /></button> */}
                            </div>

                            {/* Rota (Compacta) */}
                            <div className="flex items-center gap-2 mb-4 bg-gray-50 p-2 rounded-lg">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Origem</p>
                                    <p className="text-xs font-semibold text-gray-700 truncate" title={bid.cidade_origem}>
                                        {bid.cidade_origem} - {bid.uf_origem}
                                    </p>
                                </div>
                                <div className="text-gray-300">→</div>
                                <div className="flex-1 min-w-0 text-right">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Destino</p>
                                    <p className="text-xs font-semibold text-gray-700 truncate" title={bid.cidade_destino}>
                                        {bid.cidade_destino} - {bid.uf_destino}
                                    </p>
                                </div>
                            </div>

                            <hr className="border-gray-50 mb-3" />

                            {/* Métricas Inferiores */}
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Lances</p>
                                    <div className="flex items-center gap-1.5">
                                        <Users size={14} className="text-gray-400" />
                                        <span className="text-sm font-bold text-gray-900">
                                            {bid.lances?.[0]?.count || 0}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Encerramento</p>
                                    <p className="text-xs font-medium text-red-600">
                                        {format(new Date(bid.data_fim), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}