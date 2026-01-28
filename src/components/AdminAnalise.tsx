'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CheckCircle, AlertCircle, Trophy, Clock, DollarSign, FileText, RefreshCcw, XOctagon } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

export default function AdminAnalise({ user }: { user: any }) {
  const [bids, setBids] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWinners, setSelectedWinners] = useState<{[key: string]: string}>({})
  const [justificativas, setJustificativas] = useState<{[key: string]: string}>({})
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Estados para Relançamento
  const [relaunchDate, setRelaunchDate] = useState('')
  const [relaunchTime, setRelaunchTime] = useState('')
  const [showRelaunch, setShowRelaunch] = useState<string | null>(null)

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

  // --- FUNÇÃO DE RANKING DINÂMICO ---
  const calcularRankings = (lances: any[], bid: any) => {
    if (!lances || lances.length === 0) return []
    
    // Pega os pesos do BID ou usa o padrão 70/30 se não tiver salvo
    const pesoPreco = bid.peso_preco || 70
    const pesoPrazo = bid.peso_prazo || 30

    const minPreco = Math.min(...lances.map(l => l.valor))
    const minPrazo = Math.min(...lances.map(l => l.prazo_dias))

    return lances.map(l => {
        const scorePreco = (minPreco / l.valor) * pesoPreco
        const scorePrazo = (minPrazo / l.prazo_dias) * pesoPrazo
        return { ...l, score: scorePreco + scorePrazo }
    }).sort((a, b) => b.score - a.score)
  }

  const handleSelecionarVencedor = async (bidId: string) => {
    const vencedorId = selectedWinners[bidId]
    const justificativaTexto = justificativas[bidId]

    if (!vencedorId) return alert('Selecione uma transportadora vencedora na lista.')
    
    if (!confirm('Confirma a seleção deste vencedor? O processo irá para APROVAÇÃO FINAL.')) return

    setProcessingId(bidId)
    try {
        const { error } = await supabase
            .from('bids')
            .update({
                status: 'AGUARDANDO_APROVACAO',
                lance_vencedor_id: vencedorId,
                log_selecao: `${user.nome} em ${new Date().toLocaleString()}`,
                justificativa_selecao: justificativaTexto || 'Sem justificativa adicional.'
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

  const handleRelancar = async (bidId: string) => {
      if (!relaunchDate || !relaunchTime) return alert('Defina a nova data e horário para o relançamento.')
      
      const novaDataIso = new Date(`${relaunchDate}T${relaunchTime}:00`).toISOString()
      
      if (!confirm(`Confirmar relançamento do BID para ${formatDate(novaDataIso)}?`)) return

      setProcessingId(bidId)
      try {
          const { error } = await supabase.from('bids').update({
              status: 'ABERTO',
              prazo_limite: novaDataIso,
          }).eq('id', bidId)

          if (error) throw error
          alert('Leilão relançado com sucesso!')
          fetchBidsAnalise()
      } catch (err) {
          alert('Erro ao relançar.')
      } finally {
          setProcessingId(null)
          setShowRelaunch(null)
      }
  }

  const handleEncerrarDeserto = async (bidId: string) => {
      if(!confirm('Deseja encerrar este BID como DESERTO (Sem Vencedor)?')) return;
      
      setProcessingId(bidId)
      try {
        await supabase.from('bids').update({
            status: 'FINALIZADO',
            lance_vencedor_id: null,
            log_selecao: `Encerrado como Deserto por ${user.nome}`,
            log_aprovacao: 'Dispensa de Aprovação (Deserto)'
        }).eq('id', bidId);
        
        alert('BID Encerrado.');
        fetchBidsAnalise();
      } catch (err) {
          alert('Erro ao encerrar.')
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
                // AGORA PASSA O OBJETO BID PARA USAR OS PESOS DINÂMICOS
                const lancesCalculados = calcularRankings(bid.lances, bid)
                const totalLances = lancesCalculados.length
                
                // Pesos para exibição
                const pPreco = bid.peso_preco || 70
                const pPrazo = bid.peso_prazo || 30

                return (
                    <div key={bid.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    {/* CORREÇÃO: Tag amarela removida. Apenas o código em cinza escuro. */}
                                    <span className="text-gray-500 font-mono text-xs font-bold tracking-wide">{bid.codigo_unico}</span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">{bid.titulo}</h3>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wide">Encerrado em</p>
                                <p className="text-sm font-medium text-gray-900">{formatDate(bid.prazo_limite)}</p>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* --- CENÁRIO: LEILÃO DESERTO --- */}
                            {totalLances === 0 ? (
                                <div className="bg-red-50 rounded-xl border border-red-100 p-6">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-3 bg-white rounded-full text-red-500 shadow-sm border border-red-100">
                                            <AlertCircle size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-red-900">Leilão Deserto (Sem Lances)</h4>
                                            <p className="text-red-700 text-sm">O prazo encerrou e nenhuma transportadora enviou proposta.</p>
                                        </div>
                                    </div>

                                    {!showRelaunch ? (
                                        <div className="flex gap-4">
                                            <button 
                                                onClick={() => setShowRelaunch(bid.id)}
                                                className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 transition-all flex justify-center items-center gap-2 shadow-sm"
                                            >
                                                <RefreshCcw size={18}/> RELANÇAR LEILÃO (Novo Prazo)
                                            </button>
                                            <button 
                                                onClick={() => handleEncerrarDeserto(bid.id)}
                                                className="flex-1 bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-all flex justify-center items-center gap-2 shadow-sm"
                                            >
                                                <XOctagon size={18}/> ENCERRAR DEFINITIVAMENTE
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="bg-white p-6 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-2 shadow-sm">
                                            <h5 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                                                <RefreshCcw size={16} className="text-red-600"/> Configurar Relançamento
                                            </h5>
                                            <div className="grid grid-cols-2 gap-6 mb-6">
                                                <div>
                                                    <label className="text-xs font-bold text-gray-700 uppercase mb-2 block">Nova Data</label>
                                                    {/* CORREÇÃO: Inputs com texto preto e borda focada vermelha */}
                                                    <input 
                                                        type="date" 
                                                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" 
                                                        value={relaunchDate} 
                                                        onChange={e => setRelaunchDate(e.target.value)} 
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-700 uppercase mb-2 block">Novo Horário</label>
                                                    <input 
                                                        type="time" 
                                                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" 
                                                        value={relaunchTime} 
                                                        onChange={e => setRelaunchTime(e.target.value)} 
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-3 pt-2">
                                                <button 
                                                    onClick={() => setShowRelaunch(null)} 
                                                    className="text-xs font-bold text-gray-600 hover:text-gray-900 px-4 py-2 transition-colors"
                                                >
                                                    CANCELAR
                                                </button>
                                                {/* CORREÇÃO: Botão Vermelho */}
                                                <button 
                                                    onClick={() => handleRelancar(bid.id)}
                                                    disabled={processingId === bid.id}
                                                    className="bg-red-600 text-white text-xs font-bold px-6 py-2.5 rounded-lg hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                                                >
                                                    {processingId === bid.id ? 'PROCESSANDO...' : 'CONFIRMAR RELANÇAMENTO'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {/* ... Rankings Normais ... */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                        {/* Preço (Verde) */}
                                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                                            <div className="bg-green-50 px-3 py-2 border-b border-green-100 flex items-center gap-2">
                                                <DollarSign size={14} className="text-green-700"/>
                                                <span className="text-xs font-bold text-green-700 uppercase">Menor Preço</span>
                                            </div>
                                            <div className="p-2 bg-white">
                                                {[...lancesCalculados].sort((a,b) => a.valor - b.valor).slice(0,3).map((l, i) => (
                                                    <div key={l.id} className="flex justify-between items-center text-sm py-1.5 border-b last:border-0 border-gray-100">
                                                        <span className="text-gray-900 truncate max-w-[100px]">{i+1}. {l.transportadora_nome}</span>
                                                        <span className="font-bold text-green-700">{formatCurrency(l.valor)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Prazo (Verde) */}
                                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                                            <div className="bg-green-50 px-3 py-2 border-b border-green-100 flex items-center gap-2">
                                                <Clock size={14} className="text-green-700"/>
                                                <span className="text-xs font-bold text-green-700 uppercase">Melhor Prazo</span>
                                            </div>
                                            <div className="p-2 bg-white">
                                                {[...lancesCalculados].sort((a,b) => a.prazo_dias - b.prazo_dias).slice(0,3).map((l, i) => (
                                                    <div key={l.id} className="flex justify-between items-center text-sm py-1.5 border-b last:border-0 border-gray-100">
                                                        <span className="text-gray-900 truncate max-w-[100px]">{i+1}. {l.transportadora_nome}</span>
                                                        <span className="font-bold text-green-700">{l.prazo_dias} dias</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Score DINÂMICO */}
                                        <div className="border border-gray-200 rounded-lg overflow-hidden ring-1 ring-gray-900/10">
                                            <div className="bg-gray-100 px-3 py-2 border-b border-gray-200 flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <Trophy size={14} className="text-gray-700"/>
                                                    <span className="text-xs font-bold text-gray-700 uppercase">Score ({pPreco}/{pPrazo})</span>
                                                </div>
                                            </div>
                                            <div className="p-2 bg-white">
                                                {lancesCalculados.slice(0,3).map((l, i) => (
                                                    <div key={l.id} className="flex justify-between items-center text-sm py-1.5 border-b last:border-0 border-gray-100">
                                                        <span className={`truncate max-w-[100px] ${i===0 ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                                                            {i+1}. {l.transportadora_nome}
                                                        </span>
                                                        <span className="font-bold text-gray-900">{l.score.toFixed(1)} pts</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Seleção */}
                                    <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                                        <div className="flex flex-col gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Vencedor Selecionado</label>
                                                <select 
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-red-500 outline-none cursor-pointer"
                                                    value={selectedWinners[bid.id] || ''}
                                                    onChange={(e) => setSelectedWinners(prev => ({...prev, [bid.id]: e.target.value}))}
                                                >
                                                    <option value="">-- Escolha a Transportadora --</option>
                                                    {lancesCalculados.map(l => (
                                                        <option key={l.id} value={l.id}>
                                                            {l.transportadora_nome} — {formatCurrency(l.valor)} — Score: {l.score.toFixed(1)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                                                    <FileText size={12}/> Justificativa da Escolha
                                                </label>
                                                <textarea 
                                                    className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-red-500 outline-none resize-none h-24"
                                                    placeholder="Descreva o motivo técnico/comercial para esta escolha. Essa informação constará na auditoria."
                                                    value={justificativas[bid.id] || ''}
                                                    onChange={(e) => setJustificativas(prev => ({...prev, [bid.id]: e.target.value}))}
                                                />
                                            </div>

                                            <div className="flex justify-end pt-2">
                                                <button 
                                                    onClick={() => handleSelecionarVencedor(bid.id)}
                                                    disabled={processingId === bid.id || !selectedWinners[bid.id]}
                                                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                                                >
                                                    {processingId === bid.id ? 'Salvando...' : <><CheckCircle size={18}/> ENVIAR PARA APROVAÇÃO</>}
                                                </button>
                                            </div>
                                        </div>
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