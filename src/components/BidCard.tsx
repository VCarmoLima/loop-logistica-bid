'use client'

import { useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { createClient } from '@supabase/supabase-js' 
import { MapPin, Clock, Truck, AlertTriangle, CheckCircle, ImageOff } from 'lucide-react'
import { Database } from '@/types/database.types'

type Bid = Database['public']['Tables']['bids']['Row'] & {
  lances?: Database['public']['Tables']['lances']['Row'][]
}

interface BidCardProps {
  bid: Bid
  userId: string
  userName: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

export default function BidCard({ bid, userId, userName }: BidCardProps) {
  const [loading, setLoading] = useState(false)
  const [valor, setValor] = useState<number | ''>('')
  const [prazo, setPrazo] = useState<number | ''>('')
  const [feedback, setFeedback] = useState<{type: 'success' | 'error', msg: string} | null>(null)

  const lancesAtuais = bid.lances || []
  const melhorValor = lancesAtuais.length > 0 ? Math.min(...lancesAtuais.map(l => l.valor)) : null
  const melhorPrazo = lancesAtuais.length > 0 ? Math.min(...lancesAtuais.map(l => l.prazo_dias)) : null

  const handleEnviarLance = async () => {
    if (!valor || !prazo || valor <= 0 || prazo <= 0) {
      setFeedback({ type: 'error', msg: 'Dados inválidos.' })
      return
    }

    setLoading(true)
    setFeedback(null)

    try {
        const { error } = await supabase.from('lances').insert({
            bid_id: bid.id,
            transportadora_nome: userName,
            valor: Number(valor),
            prazo_dias: Number(prazo),
            notificado: false
        })

        if (error) throw error

        setFeedback({ type: 'success', msg: 'Lance enviado!' })
        setValor('')
        setPrazo('')
        window.location.reload() 

    } catch (err) {
        setFeedback({ type: 'error', msg: 'Erro ao enviar.' })
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      
      {/* 1. ÁREA DA IMAGEM (NOVO!) */}
      <div className="relative h-48 bg-gray-100 border-b border-gray-100">
        {bid.imagem_url ? (
          // Usamos img normal para evitar config complexa de domínio no next.config
          <img 
            src={bid.imagem_url} 
            alt={bid.titulo}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <ImageOff size={32} />
            <span className="text-xs mt-2 font-medium">Sem Foto</span>
          </div>
        )}

        {/* Badge de Categoria sobre a imagem */}
        <div className="absolute top-3 left-3">
             <span className="bg-white/90 backdrop-blur text-gray-800 px-2 py-1 rounded text-xs font-bold shadow-sm uppercase">
                {bid.categoria_veiculo}
            </span>
        </div>

        {/* Badge de Código */}
        <div className="absolute top-3 right-3">
             <span className="bg-black/70 text-white px-2 py-1 rounded text-xs font-mono font-bold shadow-sm">
                {bid.codigo_unico}
            </span>
        </div>
      </div>

      {/* 2. Cabeçalho de Info */}
      <div className="px-5 pt-4 pb-2 flex justify-between items-start">
        <div>
            <h3 className="text-lg font-bold text-gray-900 leading-tight">{bid.titulo}</h3>
            <p className="text-xs text-red-600 font-bold uppercase mt-1 tracking-wide">{bid.tipo_transporte}</p>
        </div>
      </div>

      {/* 3. Corpo do Card */}
      <div className="px-5 py-2 flex-1 space-y-4">
        
        {/* Encerramento */}
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <Clock size={14} className="text-red-500" />
            <span>Encerra em: </span>
            <span className="font-bold text-gray-800">{formatDate(bid.prazo_limite)}</span>
        </div>

        {/* Rotas */}
        <div className="space-y-3">
            <div className="flex gap-3 items-start">
                <div className="mt-0.5"><MapPin size={16} className="text-gray-400" /></div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Origem</p>
                    <p className="text-sm font-medium text-gray-900 leading-none">{bid.origem}</p>
                </div>
            </div>
            <div className="flex gap-3 items-start">
                <div className="mt-0.5"><Truck size={16} className="text-gray-400" /></div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Destino</p>
                    <p className="text-sm font-medium text-gray-900 leading-none">{bid.destino}</p>
                </div>
            </div>
        </div>

        {/* 4. Placar (Ranking) */}
        <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center border border-gray-100">
            <div>
                <p className="text-[10px] uppercase text-gray-500 font-bold">Melhor Preço</p>
                <p className="text-sm font-bold text-gray-900">
                    {melhorValor ? formatCurrency(melhorValor) : '--'}
                </p>
            </div>
            <div className="w-px h-8 bg-gray-200"></div>
            <div className="text-right">
                <p className="text-[10px] uppercase text-gray-500 font-bold">Prazo Líder</p>
                <p className="text-sm font-bold text-gray-900">
                    {melhorPrazo ? `${melhorPrazo} dias` : '--'}
                </p>
            </div>
        </div>

        {/* 5. Inputs de Lance Corrigidos */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
             <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Seu Valor</label>
                <div className="relative">
                    {/* Prefixo R$ centralizado verticalmente */}
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium pointer-events-none">
                        R$
                    </span>
                    <input 
                        type="number" 
                        value={valor}
                        onChange={(e) => setValor(Number(e.target.value))}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white font-sans focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none placeholder-gray-400 transition-colors"
                        placeholder="0,00"
                    />
                </div>
            </div>
            <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Prazo (Dias)</label>
                <input 
                    type="number"
                    value={prazo}
                    onChange={(e) => setPrazo(Number(e.target.value))} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white font-sans focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none placeholder-gray-400 transition-colors"
                    placeholder="Ex: 2"
                />
            </div>
        </div>

        {feedback && (
            <div className={`text-xs p-2 rounded flex items-center gap-1 ${
                feedback.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
                {feedback.type === 'success' ? <CheckCircle size={12}/> : <AlertTriangle size={12}/>}
                {feedback.msg}
            </div>
        )}

        <button 
            onClick={handleEnviarLance}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 text-sm"
        >
            {loading ? 'Processando...' : 'ENVIAR PROPOSTA'}
        </button>
      </div>
    </div>
  )
}