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

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando painel de monitoramento...</div>

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Painel de Monitoramento</h1>
        <p className="text-gray-500 text-sm">Acompanhamento em tempo real das cotações ativas.</p>
      </div>

      {bids.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Nenhum BID Ativo</h3>
            <p className="text-gray-500 mb-6">Não há leilões rodando no momento. Crie um novo para começar.</p>
            <a href="/dashboard/novo-bid" className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors">
                + Criar Novo BID
            </a>
        </div>
      ) : (
        <div className="grid gap-6">
            {bids.map((bid) => {
                const totalLances = bid.lances?.length || 0
                const melhorPreco = totalLances > 0 ? Math.min(...bid.lances.map((l: any) => l.valor)) : null
                const lider = totalLances > 0 ? bid.lances.find((l: any) => l.valor === melhorPreco)?.transportadora_nome : '---'

                return (
                    <div key={bid.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex gap-4">
                                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                        {bid.imagem_url ? (
                                            <img src={bid.imagem_url} alt="Veículo" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400"><Package size={24}/></div>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            {/* ALTERADO AQUI: Vermelho Clarinho */}
                                            <span className="bg-red-50 text-red-700 border border-red-100 text-xs font-bold px-2 py-0.5 rounded uppercase">
                                                {bid.codigo_unico}
                                            </span>
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Clock size={12} /> Encerra em: {formatDate(bid.prazo_limite)}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">{bid.titulo}</h3>
                                        <p className="text-sm text-gray-500 mb-2">{bid.tipo_transporte} • {bid.categoria_veiculo}</p>
                                        
                                        <div className="flex items-center gap-4 text-xs text-gray-600">
                                            <span className="flex items-center gap-1"><MapPin size={12}/> {bid.origem}</span>
                                            <span>➝</span>
                                            <span className="flex items-center gap-1"><MapPin size={12}/> {bid.destino}</span>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => handleEncerrar(bid.id)}
                                    disabled={processingId === bid.id}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors disabled:opacity-50"
                                >
                                    {processingId === bid.id ? 'Encerrando...' : <><StopCircle size={16} /> ENCERRAR AGORA</>}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Total de Lances</p>
                                    <p className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        {totalLances}
                                        <span className="text-xs font-normal text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">Propostas</span>
                                    </p>
                                </div>
                                
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Melhor Preço (Atual)</p>
                                    <p className="text-xl font-bold text-green-600 flex items-center gap-2">
                                        {melhorPreco ? formatCurrency(melhorPreco) : 'R$ --'}
                                        <TrendingDown size={16} className={melhorPreco ? 'text-green-500' : 'hidden'} />
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Líder Atual</p>
                                    <p className="text-sm font-bold text-gray-900 truncate" title={lider}>
                                        {lider}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {melhorPreco ? 'Liderando pelo menor preço' : 'Aguardando ofertas'}
                                    </p>
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