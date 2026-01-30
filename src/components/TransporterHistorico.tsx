'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Trophy, Frown, Calendar, ArrowRight } from 'lucide-react'

export default function TransporterHistorico({ user }: { user: any }) {
  const [bids, setBids] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistorico()
  }, [])

  const fetchHistorico = async () => {
    const { data: lances } = await supabase
      .from('lances')
      .select('bid_id')
      .eq('transportadora_nome', user.nome)

    if (!lances || lances.length === 0) {
      setLoading(false)
      return
    }

    const bidIds = Array.from(new Set(lances.map(l => l.bid_id)))

    const { data: bidsData } = await supabase
      .from('bids')
      .select('*, lances!lances_bid_id_fkey(*)')
      .in('id', bidIds)
      .eq('status', 'FINALIZADO')
      .order('created_at', { ascending: false })

    if (bidsData) setBids(bidsData)
    setLoading(false)
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando histórico...</div>

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Meu Histórico</h1>
        <p className="text-gray-500 text-sm">Resultados dos processos que você participou.</p>
      </div>

      {bids.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
          <Calendar className="mx-auto text-gray-400 mb-2" size={32} />
          <h3 className="text-lg font-medium text-gray-900">Nenhum resultado ainda</h3>
          <p className="text-gray-500">Seus lances ainda estão em processos abertos ou em análise.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bids.map((bid) => {
            const vencedorLance = bid.lances.find((l: any) => l.id === bid.lance_vencedor_id)
            const euGanhei = vencedorLance?.transportadora_nome === user.nome
            const meuMelhorLance = bid.lances
              .filter((l: any) => l.transportadora_nome === user.nome)
              .sort((a: any, b: any) => a.valor - b.valor)[0]

            return (
              <div key={bid.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${euGanhei ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-400'}`}>
                    {euGanhei ? <Trophy size={24} /> : <Frown size={24} />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{bid.titulo}</h3>
                    <p className="text-xs text-gray-500 mb-1">{bid.codigo_unico} • {formatDate(bid.prazo_limite)}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${euGanhei ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {euGanhei ? 'Vitória' : 'Perdido'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8 w-full md:w-auto border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-8">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Sua Melhor Oferta</p>
                    <p className="text-sm font-bold text-gray-900">{meuMelhorLance ? formatCurrency(meuMelhorLance.valor) : '-'}</p>
                    <p className="text-xs text-gray-500">{meuMelhorLance ? meuMelhorLance.prazo_dias : '-'} dias</p>
                  </div>

                  {!euGanhei && vencedorLance && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Vencedor (Ref.)</p>
                      <p className="text-sm font-bold text-green-700">{formatCurrency(vencedorLance.valor)}</p>
                      <p className="text-xs text-gray-500">{vencedorLance.prazo_dias} dias</p>
                    </div>
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