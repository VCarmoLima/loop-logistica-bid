'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
    Package, Clock, CheckCircle, AlertCircle, XCircle,
    MapPin, User, DollarSign, Filter, RefreshCw
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
            .select('*, lances(count)')
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
        const channel = supabase.channel('admin-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bids' }, fetchBids)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'lances' }, fetchBids)
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [filter])

    // Helpers de Estilo (Visual Original Restaurado)
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'ABERTO': return 'bg-green-50 text-green-700 border-green-100 ring-green-600/20'
            case 'ENCERRADO': return 'bg-gray-50 text-gray-600 border-gray-100 ring-gray-500/20'
            case 'ANALISE': return 'bg-yellow-50 text-yellow-700 border-yellow-100 ring-yellow-600/20'
            case 'HOMOLOGADO': return 'bg-blue-50 text-blue-700 border-blue-100 ring-blue-600/20'
            default: return 'bg-gray-50 text-gray-600'
        }
    }

    return (
        <div className="w-full">

            {/* 1. HEADER (Original) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Painel de Monitoramento</h1>
                    <p className="text-gray-500">Acompanhamento em tempo real das cotações ativas.</p>
                </div>

                {/* Filtros Simples (Botões) */}
                <div className="flex flex-wrap gap-2">
                    {['TODOS', 'ABERTO', 'ENCERRADO'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`
                        px-4 py-2 rounded-lg text-xs font-bold transition-all border
                        ${filter === status
                                    ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}
                    `}
                        >
                            {status === 'TODOS' ? 'Todos' : status}
                        </button>
                    ))}
                    <button onClick={fetchBids} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-100 transition-colors" title="Atualizar">
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* 2. GRID DE CARDS (O Ajuste Mobile está AQUI) */}
            {/* Mobile: grid-cols-1 (Um por linha) | Desktop: grid-cols-3 (Três por linha) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {loading && <div className="col-span-full text-center py-10 text-gray-400">Carregando painel...</div>}

                {!loading && bids.length === 0 && (
                    <div className="col-span-full text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-500">Nenhum BID encontrado.</p>
                    </div>
                )}

                {bids.map((bid) => (
                    <div
                        key={bid.id}
                        className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                    >
                        {/* Barra lateral de status colorida */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${bid.status === 'ABERTO' ? 'bg-green-500' : 'bg-gray-300'}`}></div>

                        {/* Cabeçalho do Card */}
                        <div className="flex justify-between items-start mb-4 pl-2">
                            <div className="flex gap-3 items-start">
                                {/* Ícone de Caixa (Estilo do Print) */}
                                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 border border-gray-100">
                                    <Package size={24} strokeWidth={1.5} />
                                </div>
                                <div>
                                    {/* ID e Data */}
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-100 uppercase tracking-wide">
                                            {bid.id ? `BID-${bid.id.substring(0, 6)}` : 'BID-#####'}
                                        </span>
                                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                            <Clock size={10} />
                                            {format(new Date(bid.data_fim), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                        </span>
                                    </div>
                                    {/* Título e Modelo */}
                                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{bid.titulo}</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">{bid.modelo_veiculo} • {bid.tipo_carroceria}</p>
                                </div>
                            </div>

                            {/* Badge de Status (Canto Superior Direito) */}
                            <div className={`text-[10px] font-bold px-2 py-1 rounded-full border ring-1 ring-inset ${getStatusStyle(bid.status)}`}>
                                {bid.status}
                            </div>
                        </div>

                        {/* Rota */}
                        <div className="flex items-center gap-3 mb-5 pl-2">
                            <div className="flex-1">
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Origem</p>
                                <p className="text-sm font-semibold text-gray-700 leading-tight">
                                    {bid.cidade_origem} <span className="text-gray-400 font-normal">- {bid.uf_origem}</span>
                                </p>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-gray-300 text-xs">➝</span>
                            </div>
                            <div className="flex-1 text-right">
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Destino</p>
                                <p className="text-sm font-semibold text-gray-700 leading-tight">
                                    {bid.cidade_destino} <span className="text-gray-400 font-normal">- {bid.uf_destino}</span>
                                </p>
                            </div>
                        </div>

                        {/* Painel de Métricas (Fundo Cinza Claro - Estilo do Print) */}
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 ml-2">

                            {/* Linha 1: Lances */}
                            <div className="flex justify-between items-center mb-2 border-b border-gray-200 pb-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Total de Lances</span>
                                <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded border border-gray-200">
                                    <span className="text-xs font-bold text-gray-900">{bid.lances?.[0]?.count || 0}</span>
                                    <span className="text-[10px] text-gray-500">Propostas</span>
                                </div>
                            </div>

                            {/* Linha 2: Melhor Preço */}
                            <div className="mb-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Melhor Preço (Atual)</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-lg font-bold text-green-600 tracking-tight">
                                        {bid.menor_valor
                                            ? `R$ ${bid.menor_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                            : 'R$ --'}
                                    </span>
                                </div>
                            </div>

                            {/* Linha 3: Líder */}
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Líder Atual</span>
                                <div className="flex items-center gap-1.5">
                                    <User size={12} className="text-gray-400" />
                                    <span className="text-xs font-medium text-gray-700 truncate w-full">
                                        {bid.vencedor_nome || 'Aguardando ofertas...'}
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>
                ))}
            </div>
        </div>
    )
}