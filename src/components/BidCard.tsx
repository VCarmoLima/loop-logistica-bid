'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { formatCurrency, formatDate } from '@/lib/utils'
import { MapPin, Clock, Truck, TrendingDown, CheckCircle, XCircle, DollarSign, Zap } from 'lucide-react'

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
  
  // Dados do Mercado (Líder)
  const melhorPreco = lances.length > 0 ? Math.min(...lances.map((l: any) => l.valor)) : null
  // Para o melhor prazo, pegamos o prazo do lance que tem o melhor preço (regra de desempate) ou o menor absoluto
  const melhorPrazo = lances.length > 0 ? Math.min(...lances.map((l: any) => l.prazo_dias)) : null
  
  // Meu melhor lance
  const meuMelhorLance = meusLances.length > 0 
    ? meusLances.reduce((prev: any, curr: any) => prev.valor < curr.valor ? prev : curr) 
    : null

  // Status
  const isLider = meuMelhorLance && melhorPreco && meuMelhorLance.valor === melhorPreco
  const isSuperado = meuMelhorLance && melhorPreco && meuMelhorLance.valor > melhorPreco

  // Gamificação: Lance Relâmpago (Bater o preço em R$ 50,00 e igualar o prazo)
  const handleLanceRelampago = () => {
      if (!melhorPreco) return;
      const novoPreco = melhorPreco - 50.0;
      const novoPrazo = melhorPrazo || 1;
      
      setValor(novoPreco.toFixed(2).replace('.', ',')); // Formato BR para o input visual
      setPrazo(String(novoPrazo));
  }

  const handleEnviarLance = async () => {
    // Normaliza input (Aceita 1.000,00 ou 1000.00)
    let valorClean = valor.replace(/\./g, '').replace(',', '.')
    const valorNum = parseFloat(valorClean)
    const prazoNum = parseInt(prazo)

    if (!valorNum || !prazoNum) return alert('Preencha valor e prazo.')
    if (valorNum <= 0) return alert('Valor inválido.')

    // 5.1 VALIDAÇÃO INTELIGENTE (Pop-up de Confirmação)
    // Regra: Se Preço for PIOR (Maior ou Igual) E Prazo for PIOR (Maior ou Igual), avisa que é um lance ruim.
    if (melhorPreco && melhorPrazo) {
        const precoRuim = valorNum >= melhorPreco
        const prazoRuim = prazoNum >= melhorPrazo

        if (precoRuim && prazoRuim) {
            const confirmacao = confirm(
                `⚠️ ALERTA DE COMPETITIVIDADE ⚠️\n\n` +
                `Seu lance (R$ ${formatCurrency(valorNum)} / ${prazoNum} dias) não supera o líder atual em nenhum critério.\n\n` +
                `Isso reduz drasticamente suas chances de vitória.\n\n` +
                `Deseja enviar mesmo assim?`
            )
            if (!confirmacao) return
        }
    }

    setLoading(true)
    try {
        const { error } = await supabase.from('lances').insert({
            bid_id: bid.id,
            transportadora_nome: userName,
            valor: valorNum,
            prazo_dias: prazoNum
        })

        if (error) throw error

        alert('Lance enviado com sucesso!')
        setValor('')
        setPrazo('')
        if (onUpdate) onUpdate()
    } catch (err) {
        console.error(err)
        alert('Erro ao enviar lance.')
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md flex flex-col h-full ${isLider ? 'border-green-500 ring-2 ring-green-500' : 'border-gray-200'}`}>
      
      {/* Cabeçalho Visual */}
      <div className="relative h-32 bg-gray-100 flex-shrink-0">
        {bid.imagem_url ? (
            <img src={bid.imagem_url} alt="Veículo" className="w-full h-full object-cover" />
        ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Truck size={32} />
            </div>
        )}
        
        {/* Badges de Status */}
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
            {isLider && (
                <span className="flex items-center gap-1 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wide">
                    <CheckCircle size={10}/> Você Lidera
                </span>
            )}
            {isSuperado && (
                <span className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wide">
                    <XCircle size={10}/> Superado
                </span>
            )}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        {/* Info Principal */}
        <div className="mb-4">
            <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase bg-gray-100 px-1.5 py-0.5 rounded">{bid.codigo_unico}</span>
                <span className="text-[10px] font-bold text-red-600 flex items-center gap-1">
                    <Clock size={10} /> {formatDate(bid.prazo_limite)}
                </span>
            </div>
            <h3 className="text-base font-bold text-gray-900 leading-tight mb-1 line-clamp-1" title={bid.titulo}>{bid.titulo}</h3>
            <p className="text-xs text-gray-600">{bid.categoria_veiculo} • {bid.tipo_transporte}</p>
        </div>

        {/* Rota */}
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-6 bg-gray-50 p-2 rounded border border-gray-100">
            <MapPin size={14} className="text-red-500 flex-shrink-0"/>
            <span className="truncate font-medium">{bid.origem}</span>
            <span className="text-gray-400">➝</span>
            <span className="truncate font-medium">{bid.destino}</span>
        </div>

        {/* 3. Painel de Mercado (Preço e Prazo do Líder) */}
        <div className="grid grid-cols-2 gap-3 mb-4 mt-auto">
            <div className="bg-gray-50 p-2 rounded border border-gray-200 text-center">
                <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Melhor Preço</p>
                <p className="text-sm font-extrabold text-gray-900">
                    {melhorPreco ? formatCurrency(melhorPreco) : '---'}
                </p>
            </div>
            <div className="bg-gray-50 p-2 rounded border border-gray-200 text-center">
                <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Melhor Prazo</p>
                <p className="text-sm font-extrabold text-gray-900">
                    {melhorPrazo ? `${melhorPrazo} dias` : '---'}
                </p>
            </div>
        </div>

        {/* Área de Lance */}
        <div className="space-y-3 pt-4 border-t border-gray-100">
            {/* Gamificação: Botão Lance Relâmpago */}
            {melhorPreco && !isLider && (
                <button 
                    onClick={handleLanceRelampago}
                    className="w-full mb-2 bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 text-xs font-bold py-1.5 rounded flex items-center justify-center gap-1 transition-colors"
                    title="Preenche automaticamente com R$ 50 a menos que o líder"
                >
                    <Zap size={12} className="fill-yellow-500 text-yellow-500" /> COBRIR AGORA (-R$50)
                </button>
            )}

            <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Valor (R$)</label>
                    <div className="relative">
                        <DollarSign size={12} className="absolute left-2 top-2.5 text-gray-400"/>
                        <input 
                            type="text" // Text para facilitar formatação visual se quiser evoluir
                            placeholder="0,00" 
                            className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded text-sm font-bold text-gray-900 focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none"
                            value={valor}
                            onChange={e => setValor(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Dias</label>
                    <input 
                        type="number" 
                        placeholder="Ex: 2" 
                        className="w-full px-2 py-2 border border-gray-300 rounded text-sm font-bold text-gray-900 focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none text-center"
                        value={prazo}
                        onChange={e => setPrazo(e.target.value)}
                    />
                </div>
            </div>
            
            <button 
                onClick={handleEnviarLance}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wide shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? 'Processando...' : <><TrendingDown size={14}/> ENVIAR OFERTA</>}
            </button>
        </div>

      </div>
    </div>
  )
}