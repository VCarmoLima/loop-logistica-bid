'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { formatCurrency, formatDate } from '@/lib/utils'
import { MapPin, Clock, Truck, TrendingDown, AlertCircle, CheckCircle, XCircle, DollarSign } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

interface BidCardProps {
  bid: any
  userId: string
  userName: string
  onUpdate?: () => void
}

export default function BidCard({ bid, userId, userName, onUpdate }: BidCardProps) {
  const [loading, setLoading] = useState(false)
  const [valor, setValor] = useState<string>('')
  const [prazo, setPrazo] = useState<string>('')

  // 1. Análise dos Lances
  const lances = bid.lances || []
  const meusLances = lances.filter((l: any) => l.transportadora_nome === userName)
  
  // Melhor lance geral (Mercado)
  const melhorPreco = lances.length > 0 ? Math.min(...lances.map((l: any) => l.valor)) : null
  
  // Meu melhor lance
  const meuMelhorLance = meusLances.length > 0 
    ? meusLances.reduce((prev: any, curr: any) => prev.valor < curr.valor ? prev : curr) 
    : null

  // Status: Estou ganhando?
  const isLider = meuMelhorLance && melhorPreco && meuMelhorLance.valor === melhorPreco
  const isSuperado = meuMelhorLance && melhorPreco && meuMelhorLance.valor > melhorPreco

  const handleEnviarLance = async () => {
    const valorNum = parseFloat(valor.replace(/\./g, '').replace(',', '.'))
    const prazoNum = parseInt(prazo)

    if (!valorNum || !prazoNum) return alert('Preencha valor e prazo.')
    if (valorNum <= 0) return alert('Valor inválido.')

    // Validação de "Preço a Bater" (Opcional: Apenas avisa)
    if (melhorPreco && valorNum >= melhorPreco) {
        if(!confirm(`Atenção: Seu lance de ${formatCurrency(valorNum)} não supera o líder atual (${formatCurrency(melhorPreco)}). Deseja enviar mesmo assim?`)) return
    }

    setLoading(true)
    try {
        const { error } = await supabase.from('lances').insert({
            bid_id: bid.id,
            transportadora_nome: userName, // Usamos o nome para vincular (idealmente seria ID)
            valor: valorNum,
            prazo_dias: prazoNum
        })

        if (error) throw error

        alert('Lance enviado com sucesso!')
        setValor('')
        setPrazo('')
        if (onUpdate) onUpdate() // Atualiza a lista para recalcular status
    } catch (err) {
        console.error(err)
        alert('Erro ao enviar lance.')
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md ${isLider ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-200'}`}>
      
      {/* Cabeçalho Visual */}
      <div className="relative h-32 bg-gray-100">
        {bid.imagem_url ? (
            <img src={bid.imagem_url} alt="Veículo" className="w-full h-full object-cover" />
        ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Truck size={32} />
            </div>
        )}
        
        {/* Badge de Status (Gamification) */}
        <div className="absolute top-2 right-2">
            {isLider && (
                <span className="flex items-center gap-1 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                    <CheckCircle size={12}/> VOCÊ É O LÍDER
                </span>
            )}
            {isSuperado && (
                <span className="flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                    <XCircle size={12}/> OFERTA SUPERADA
                </span>
            )}
            {!meuMelhorLance && (
                <span className="bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                    SEM LANCE
                </span>
            )}
        </div>
      </div>

      <div className="p-5">
        {/* Info Principal */}
        <div className="mb-4">
            <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase bg-gray-100 px-1.5 py-0.5 rounded">{bid.codigo_unico}</span>
                <span className="text-[10px] font-bold text-red-600 flex items-center gap-1">
                    <Clock size={10} /> {formatDate(bid.prazo_limite)}
                </span>
            </div>
            <h3 className="text-base font-bold text-gray-900 leading-tight mb-1">{bid.titulo}</h3>
            <p className="text-xs text-gray-600">{bid.categoria_veiculo} • {bid.tipo_transporte}</p>
        </div>

        {/* Rota */}
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-6 bg-gray-50 p-2 rounded border border-gray-100">
            <MapPin size={14} className="text-red-500 flex-shrink-0"/>
            <span className="truncate font-medium">{bid.origem}</span>
            <span className="text-gray-400">➝</span>
            <span className="truncate font-medium">{bid.destino}</span>
        </div>

        {/* Painel de Preços */}
        <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-gray-50 p-2 rounded border border-gray-100">
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-0.5">Líder Atual</p>
                <p className="text-sm font-extrabold text-gray-900">
                    {melhorPreco ? formatCurrency(melhorPreco) : '---'}
                </p>
            </div>
            <div className={`p-2 rounded border ${isLider ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-0.5">Sua Oferta</p>
                <p className={`text-sm font-extrabold ${isLider ? 'text-green-700' : 'text-gray-900'}`}>
                    {meuMelhorLance ? formatCurrency(meuMelhorLance.valor) : '---'}
                </p>
            </div>
        </div>

        {/* Área de Lance */}
        <div className="space-y-3 pt-4 border-t border-gray-100">
            <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Seu Valor (R$)</label>
                <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-3 text-gray-400"/>
                    <input 
                        type="number" 
                        placeholder="0,00" 
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded text-sm font-bold text-gray-900 focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none"
                        value={valor}
                        onChange={e => setValor(e.target.value)}
                    />
                </div>
            </div>
            <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Prazo (Dias)</label>
                <input 
                    type="number" 
                    placeholder="Ex: 5" 
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-bold text-gray-900 focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none"
                    value={prazo}
                    onChange={e => setPrazo(e.target.value)}
                />
            </div>
            
            <button 
                onClick={handleEnviarLance}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg text-sm shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? 'Enviando...' : <><TrendingDown size={16}/> ENVIAR LANCE AGORA</>}
            </button>
        </div>

      </div>
    </div>
  )
}