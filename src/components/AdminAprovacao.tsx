'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CheckCircle, XCircle, ShieldCheck, FileText, Trophy, DollarSign, Clock } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

export default function AdminAprovacao({ user }: { user: any }) {
  const [bids, setBids] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchBidsAprovacao()
  }, [])

  const fetchBidsAprovacao = async () => {
    try {
        const { data, error } = await supabase
            .from('bids')
            .select('*, lances!lances_bid_id_fkey(*)')
            .eq('status', 'AGUARDANDO_APROVACAO')
            .order('prazo_limite', { ascending: false })

        if (error) console.error(error)
        if (data) setBids(data)
    } catch (err) {
        console.error(err)
    } finally {
        setLoading(false)
    }
  }

  const calcularRankings = (lances: any[]) => {
    if (!lances || lances.length === 0) return []
    const minPreco = Math.min(...lances.map(l => l.valor))
    const minPrazo = Math.min(...lances.map(l => l.prazo_dias))

    return lances.map(l => {
        const scorePreco = (minPreco / l.valor) * 70
        const scorePrazo = (minPrazo / l.prazo_dias) * 30
        return { ...l, score: scorePreco + scorePrazo }
    }).sort((a, b) => b.score - a.score)
  }

  const handleAprovar = async (bidId: string) => {
    if (!confirm('CONFIRMAÇÃO MASTER: Deseja finalizar este processo?')) return

    setProcessingId(bidId)
    try {
        const { error } = await supabase
            .from('bids')
            .update({
                status: 'FINALIZADO',
                log_aprovacao: `${user.nome} (Master) em ${new Date().toLocaleString()}`
            })
            .eq('id', bidId)

        if (error) throw error
        alert('BID Finalizado com Sucesso!')
        fetchBidsAprovacao()
    } catch (err) {
        console.error(err)
        alert('Erro ao finalizar.')
    } finally {
        setProcessingId(null)
    }
  }

  const handleReprovar = async (bidId: string) => {
    const motivo = prompt('Motivo da Reprovação (Opcional):')
    if (motivo === null) return

    setProcessingId(bidId)
    try {
        const { error } = await supabase
            .from('bids')
            .update({
                status: 'EM_ANALISE',
                lance_vencedor_id: null,
                log_selecao: null,
            })
            .eq('id', bidId)

        if (error) throw error
        alert('BID devolvido para a etapa de Análise.')
        fetchBidsAprovacao()
    } catch (err) {
        console.error(err)
        alert('Erro ao reprovar.')
    } finally {
        setProcessingId(null)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando pendências...</div>

  if (user.role !== 'master') {
      return <div className="p-8 text-center text-red-700 font-bold">Acesso Restrito</div>
  }

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <div className="p-2 bg-red-900 text-white rounded-lg shadow-md">
            <ShieldCheck size={24} />
        </div>
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Aprovação Master</h1>
            <p className="text-gray-500 text-sm">Validação executiva e encerramento.</p>
        </div>
      </div>

      {bids.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900">Tudo em dia!</h3>
            <p className="text-gray-500">Nenhuma aprovação pendente.</p>
        </div>
      ) : (
        <div className="space-y-8">
            {bids.map((bid) => {
                const vencedor = bid.lances.find((l: any) => l.id === bid.lance_vencedor_id)
                const rankings = calcularRankings(bid.lances)

                return (
                    <div key={bid.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden border-l-4 border-l-red-900">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className="bg-red-100 text-red-900 text-xs font-bold px-2 py-0.5 rounded uppercase mb-2 inline-block border border-red-200">
                                        Aguardando Master
                                    </span>
                                    <h3 className="text-xl font-bold text-gray-900">{bid.titulo}</h3>
                                    <p className="text-sm text-gray-500">{bid.codigo_unico} • Selecionado por: <b>{bid.log_selecao}</b></p>
                                </div>
                            </div>

                            <div className="bg-green-50 border border-green-100 rounded-lg p-5 mb-6 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="text-sm font-bold text-green-800 uppercase flex items-center gap-2">
                                        <CheckCircle size={16}/> Vencedor Indicado (Standard)
                                    </h4>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-green-700 leading-none">{formatCurrency(vencedor?.valor)}</p>
                                        <p className="text-sm font-medium text-gray-600">{vencedor?.prazo_dias} dias</p>
                                    </div>
                                </div>
                                <div className="text-lg font-bold text-gray-900 mb-4">{vencedor?.transportadora_nome}</div>
                                
                                <div className="bg-white/80 p-3 rounded border border-green-100">
                                    <p className="text-xs font-bold text-green-700 uppercase mb-1 flex items-center gap-1">
                                        <FileText size={12}/> Justificativa do Analista:
                                    </p>
                                    <p className="text-sm text-gray-700 italic whitespace-pre-wrap">
                                        "{bid.justificativa_selecao || 'Nenhuma justificativa fornecida.'}"
                                    </p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h5 className="text-xs font-bold text-gray-400 uppercase mb-3">Dados de Comparação do Mercado</h5>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    
                                    {/* Melhor Preço - Verde */}
                                    <div className="bg-white p-3 rounded border border-gray-200">
                                        <div className="text-xs font-bold text-green-700 mb-1 flex items-center gap-1"><DollarSign size={12}/> Melhor Preço</div>
                                        <div className="text-sm font-bold text-gray-900">
                                            {rankings.sort((a,b) => a.valor - b.valor)[0]?.transportadora_nome}
                                        </div>
                                        <div className="text-xs text-green-700 font-bold">
                                            {formatCurrency(rankings.sort((a,b) => a.valor - b.valor)[0]?.valor)}
                                        </div>
                                    </div>

                                    {/* Melhor Prazo - Verde */}
                                    <div className="bg-white p-3 rounded border border-gray-200">
                                        <div className="text-xs font-bold text-green-700 mb-1 flex items-center gap-1"><Clock size={12}/> Melhor Prazo</div>
                                        <div className="text-sm font-bold text-gray-900">
                                            {rankings.sort((a,b) => a.prazo_dias - b.prazo_dias)[0]?.transportadora_nome}
                                        </div>
                                        <div className="text-xs text-green-700 font-bold">
                                            {rankings.sort((a,b) => a.prazo_dias - b.prazo_dias)[0]?.prazo_dias} dias
                                        </div>
                                    </div>

                                    {/* Melhor Score - Preto */}
                                    <div className="bg-white p-3 rounded border border-gray-200">
                                        <div className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Trophy size={12}/> Melhor Score</div>
                                        <div className="text-sm font-bold text-gray-900">
                                            {rankings.sort((a,b) => b.score - a.score)[0]?.transportadora_nome}
                                        </div>
                                        <div className="text-xs text-gray-900 font-bold">
                                            {rankings.sort((a,b) => b.score - a.score)[0]?.score.toFixed(1)} pts
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-gray-100">
                                <button 
                                    onClick={() => handleAprovar(bid.id)}
                                    disabled={processingId === bid.id}
                                    className="flex-1 bg-red-900 hover:bg-red-800 text-white font-bold py-3 rounded-lg shadow-sm transition-all flex justify-center items-center gap-2"
                                >
                                    {processingId === bid.id ? 'Processando...' : <><ShieldCheck size={18}/> MASTER: APROVAR E FINALIZAR</>}
                                </button>
                                
                                <button 
                                    onClick={() => handleReprovar(bid.id)}
                                    disabled={processingId === bid.id}
                                    className="px-6 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold py-3 rounded-lg transition-all flex justify-center items-center gap-2"
                                >
                                    <XCircle size={18}/> REPROVAR
                                </button>
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