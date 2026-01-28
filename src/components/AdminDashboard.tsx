'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Clock, StopCircle, TrendingDown, Package, MapPin } from 'lucide-react'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

export default function AdminDashboard({ user }: { user: any }) {
    const [bids, setBids] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)

    // LÓGICA ORIGINAL RESTAURADA
    useEffect(() => {
        fetchActiveBids()
        const interval = setInterval(fetchActiveBids, 10000)
        return () => clearInterval(interval)
    }, [])

    const fetchActiveBids = async () => {
        try {
            const { data, error } = await supabase
                .from('bids')
                .select('*, lances!lances_bid_id_fkey(*)')
                .eq('status', 'ABERTO')
                .order('created_at', { ascending: false })

            if (error) console.error("Erro ao buscar BIDs:", error)
            if (data) setBids(data)
        } catch (err) {
            console.error("Erro geral:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleEncerrar = async (bidId: string) => {
        if (!confirm('Tem certeza que deseja encerrar este BID agora? Ele irá para a fase de Análise.')) return

        setProcessingId(bidId)
        try {
            const { error } = await supabase
                .from('bids')
                .update({
                    status: 'EM_ANALISE',
                    log_encerramento: `${user.nome} (Manual) em ${new Date().toLocaleString()}`,
                    prazo_limite: new Date().toISOString()
                })
                .eq('id', bidId)

            if (error) throw error

            alert('BID Encerrado com sucesso! Disponível no menu "Em Análise".')
            fetchActiveBids()
        } catch (err) {
            console.error(err)
            alert('Erro ao encerrar BID.')
        } finally {
            setProcessingId(null)
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Carregando painel de monitoramento...</div>

    return (
        <div className="pb-20 md:pb-0"> {/* Espaço extra no mobile para não colar no fundo */}
            
            <div className="mb-6 md:mb-8">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Painel de Monitoramento</h1>
                <p className="text-gray-500 text-xs md:text-sm">Acompanhamento em tempo real das cotações ativas.</p>
            </div>

            {bids.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 md:p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="text-gray-400" size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Nenhum BID Ativo</h3>
                    <p className="text-gray-500 mb-6 text-sm">Não há leilões rodando no momento.</p>
                    <a href="/dashboard/novo-bid" className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors">
                        + Criar Novo BID
                    </a>
                </div>
            ) : (
                <div className="grid gap-4 md:gap-6">
                    {bids.map((bid) => {
                        const totalLances = bid.lances?.length || 0
                        const melhorPreco = totalLances > 0 ? Math.min(...bid.lances.map((l: any) => l.valor)) : null
                        const lider = totalLances > 0 ? bid.lances.find((l: any) => l.valor === melhorPreco)?.transportadora_nome : '---'

                        return (
                            <div key={bid.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-4 md:p-6">
                                    
                                    {/* RESPONSIVIDADE: flex-col no mobile, flex-row no desktop */}
                                    <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                                        
                                        <div className="flex gap-4 w-full md:w-auto">
                                            {/* Imagem */}
                                            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                                {bid.imagem_url ? (
                                                    <img src={bid.imagem_url} alt="Veículo" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400"><Package size={24} /></div>
                                                )}
                                            </div>

                                            {/* Informações Principais */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <span className="bg-red-50 text-red-700 border border-red-100 text-[10px] md:text-xs font-bold px-2 py-0.5 rounded uppercase">
                                                        {bid.codigo_unico}
                                                    </span>
                                                    <span className="text-[10px] md:text-xs text-gray-500 flex items-center gap-1 whitespace-nowrap">
                                                        <Clock size={12} /> Encerra: {formatDate(bid.prazo_limite)}
                                                    </span>
                                                </div>
                                                
                                                <h3 className="text-base md:text-lg font-bold text-gray-900 leading-tight mb-1">{bid.titulo}</h3>
                                                <p className="text-xs md:text-sm text-gray-500 mb-2 truncate">{bid.tipo_transporte} • {bid.categoria_veiculo}</p>

                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                                                    <span className="flex items-center gap-1"><MapPin size={12} /> {bid.origem}</span>
                                                    <span className="hidden md:inline">➝</span>
                                                    <span className="flex items-center gap-1"><MapPin size={12} /> {bid.destino}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Botão de Ação: Full width no mobile */}
                                        <button
                                            onClick={() => handleEncerrar(bid.id)}
                                            disabled={processingId === bid.id}
                                            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors disabled:opacity-50 mt-2 md:mt-0"
                                        >
                                            {processingId === bid.id ? 'Encerrando...' : <><StopCircle size={16} /> ENCERRAR</>}
                                        </button>
                                    </div>

                                    {/* Grid de Métricas (Já é responsivo nativamente, só ajustei o gap) */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 bg-gray-50 p-3 md:p-4 rounded-lg border border-gray-100">
                                        <div className="flex md:block justify-between items-center">
                                            <p className="text-xs font-bold text-gray-400 uppercase mb-0 md:mb-1">Lances</p>
                                            <p className="text-sm md:text-xl font-bold text-gray-900 flex items-center gap-2">
                                                {totalLances}
                                                <span className="text-[10px] md:text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">Propostas</span>
                                            </p>
                                        </div>

                                        <div className="flex md:block justify-between items-center border-t md:border-t-0 border-gray-200 pt-2 md:pt-0">
                                            <p className="text-xs font-bold text-gray-400 uppercase mb-0 md:mb-1">Melhor Preço</p>
                                            <p className="text-sm md:text-xl font-bold text-green-600 flex items-center gap-2">
                                                {melhorPreco ? formatCurrency(melhorPreco) : 'R$ --'}
                                                <TrendingDown size={16} className={melhorPreco ? 'text-green-500' : 'hidden'} />
                                            </p>
                                        </div>

                                        <div className="flex md:block justify-between items-center border-t md:border-t-0 border-gray-200 pt-2 md:pt-0">
                                            <div className="flex-1 min-w-0 text-right md:text-left">
                                                <p className="text-xs font-bold text-gray-400 uppercase mb-0 md:mb-1">Líder Atual</p>
                                                <p className="text-sm md:text-sm font-bold text-gray-900 truncate" title={lider}>
                                                    {lider}
                                                </p>
                                                <p className="text-[10px] md:text-xs text-gray-500 hidden md:block">
                                                    {melhorPreco ? 'Liderando pelo menor preço' : 'Aguardando ofertas'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}