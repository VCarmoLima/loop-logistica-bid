'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CheckCircle, AlertCircle, Trophy, TrendingUp, Clock, DollarSign } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

export default function AdminAnalise({ user }: { user: any }) {
  const [bids, setBids] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWinners, setSelectedWinners] = useState<{[key: string]: string}>({})
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchBidsAnalise()
  }, [])

  const fetchBidsAnalise = async () => {
    try {
        const { data, error } = await supabase
            .from('bids')
            .select('*, lances!lances_bid_id_fkey(*)')
            .eq('status', 'EM_ANALISE')
            .order('prazo_limite', { ascending: false })

        if (error) console.error(error)
        if (data) setBids(data)
    } catch (err) {
        console.error(err)
    } finally {
        setLoading(false)
    }
  }

  // Função que calcula o Score (Custo-Benefício)
  const calcularRankings = (lances: any[]) => {
    if (!lances || lances.length === 0) return []

    const minPreco = Math.min(...lances.map(l => l.valor))
    const minPrazo = Math.min(...lances.map(l => l.prazo_dias))

    return lances.map(l => {
        // Fórmula: (MinPreço / Preço * 70) + (MinPrazo / Prazo * 30)
        const scorePreco = (minPreco / l.valor) * 70
        const scorePrazo = (minPrazo / l.prazo_dias) * 30
        const scoreFinal = scorePreco + scorePrazo
        return { ...l, score: scoreFinal }
    }).sort((a, b) => b.score - a.score) // Ordena do maior score para o menor
  }

  const handleSelecionarVencedor = async (bidId: string) => {
    const vencedorId = selectedWinners[bidId]
    if (!vencedorId) return alert('Selecione uma transportadora vencedora na lista.')

    if (!confirm('Confirma a seleção deste vencedor? O processo irá para APROVAÇÃO FINAL.')) return

    setProcessingId(bidId)
    try {
        const { error } = await supabase
            .from('bids')
            .update({
                status: 'AGUARDANDO_APROVACAO',
                lance_vencedor_id: vencedorId,
                log_selecao: `${user.nome} em ${new Date().toLocaleString()}`
            })
            .eq('id', bidId)

        if (error) throw error

        alert('Vencedor selecionado! Enviado para aprovação.')
        fetchBidsAnalise()
    } catch (err) {
        console.error(err)
        alert('Erro ao selecionar vencedor.')
    } finally {
        setProcessingId(null)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando análises...</div>

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Análise e Homologação</h1>
        <p className="text-gray-500 text-sm">Compare as propostas e selecione o melhor custo-benefício.</p>
      </div>

      {bids.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Tudo Limpo!</h3>
            <p className="text-gray-500">Nenhum BID pendente de análise no momento.</p>
        </div>
      ) : (
        <div className="space-y-8">
            {bids.map((bid) => {
                const lancesCalculados = calcularRankings(bid.lances)
                const totalLances = lancesCalculados.length

                return (
                    <div key={bid.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        {/* Cabeçalho do Card */}
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded uppercase border border-yellow-200">
                                        Em Análise
                                    </span>
                                    <span className="text-gray-400 text-xs font-mono">{bid.codigo_unico}</span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">{bid.titulo}</h3>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 uppercase font-bold">Encerrado em</p>
                                <p className="text-sm font-medium text-gray-900">{formatDate(bid.prazo_limite)}</p>
                            </div>
                        </div>

                        <div className="p-6">
                            {totalLances === 0 ? (
                                <div className="text-center py-8 bg-red-50 rounded-lg border border-red-100">
                                    <AlertCircle className="mx-auto text-red-400 mb-2" size={24}/>
                                    <h4 className="text-red-800 font-bold">Leilão Deserto</h4>
                                    <p className="text-red-600 text-sm mb-4">Nenhuma proposta foi recebida para este lote.</p>
                                    <button className="px-4 py-2 bg-white border border-red-200 text-red-700 text-sm font-bold rounded hover:bg-red-50">
                                        Finalizar como Deserto
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* 3 Tabelas de Ranking (Grid) */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                        {/* 1. Melhor Preço */}
                                        <div className="border border-gray-100 rounded-lg overflow-hidden">
                                            <div className="bg-green-50 px-3 py-2 border-b border-green-100 flex items-center gap-2">
                                                <DollarSign size={14} className="text-green-600"/>
                                                <span className="text-xs font-bold text-green-800 uppercase">Menor Preço</span>
                                            </div>
                                            <div className="p-2">
                                                {[...lancesCalculados].sort((a,b) => a.valor - b.valor).slice(0,3).map((l, i) => (
                                                    <div key={l.id} className="flex justify-between items-center text-sm py-1.5 border-b last:border-0 border-gray-50">
                                                        <span className="text-gray-600 truncate max-w-[100px]">{i+1}. {l.transportadora_nome}</span>
                                                        <span className="font-bold text-gray-900">{formatCurrency(l.valor)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 2. Melhor Prazo */}
                                        <div className="border border-gray-100 rounded-lg overflow-hidden">
                                            <div className="bg-blue-50 px-3 py-2 border-b border-blue-100 flex items-center gap-2">
                                                <Clock size={14} className="text-blue-600"/>
                                                <span className="text-xs font-bold text-blue-800 uppercase">Melhor Prazo</span>
                                            </div>
                                            <div className="p-2">
                                                {[...lancesCalculados].sort((a,b) => a.prazo_dias - b.prazo_dias).slice(0,3).map((l, i) => (
                                                    <div key={l.id} className="flex justify-between items-center text-sm py-1.5 border-b last:border-0 border-gray-50">
                                                        <span className="text-gray-600 truncate max-w-[100px]">{i+1}. {l.transportadora_nome}</span>
                                                        <span className="font-bold text-gray-900">{l.prazo_dias} dias</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 3. Melhor Score (Recomendado) */}
                                        <div className="border border-purple-100 rounded-lg overflow-hidden ring-1 ring-purple-100">
                                            <div className="bg-purple-50 px-3 py-2 border-b border-purple-100 flex items-center gap-2">
                                                <Trophy size={14} className="text-purple-600"/>
                                                <span className="text-xs font-bold text-purple-800 uppercase">Melhor Score (Recomendado)</span>
                                            </div>
                                            <div className="p-2 bg-purple-50/10">
                                                {lancesCalculados.slice(0,3).map((l, i) => (
                                                    <div key={l.id} className="flex justify-between items-center text-sm py-1.5 border-b last:border-0 border-purple-50">
                                                        <span className={`truncate max-w-[100px] ${i===0 ? 'font-bold text-purple-900' : 'text-gray-600'}`}>
                                                            {i+1}. {l.transportadora_nome}
                                                        </span>
                                                        <span className="font-bold text-gray-900">{l.score.toFixed(1)} pts</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Área de Ação */}
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col md:flex-row gap-4 items-end">
                                        <div className="flex-1 w-full">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Selecione o Vencedor</label>
                                            <select 
                                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-red-500 outline-none"
                                                value={selectedWinners[bid.id] || ''}
                                                onChange={(e) => setSelectedWinners(prev => ({...prev, [bid.id]: e.target.value}))}
                                            >
                                                <option value="">-- Escolha a Transportadora --</option>
                                                {lancesCalculados.map(l => (
                                                    <option key={l.id} value={l.id}>
                                                        {l.transportadora_nome} — {formatCurrency(l.valor)} ({l.prazo_dias} dias) — Score: {l.score.toFixed(1)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <button 
                                            onClick={() => handleSelecionarVencedor(bid.id)}
                                            disabled={processingId === bid.id || !selectedWinners[bid.id]}
                                            className="w-full md:w-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                                        >
                                            {processingId === bid.id ? 'Processando...' : <><CheckCircle size={18}/> CONFIRMAR VENCEDOR</>}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
      )}
    </div>
  )
}