'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
    MapPin, Clock, Truck, TrendingDown, CheckCircle, XCircle, 
    DollarSign, Zap, Eye, AlertTriangle, X, Key, Power, Layers, Tag
} from 'lucide-react'

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
  
  // MODAIS
  const [showDetails, setShowDetails] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [parsedValues, setParsedValues] = useState<{valor: number, prazo: number} | null>(null)

  // 1. Lógica de Lances
  const lances = bid.lances || []
  const meusLances = lances.filter((l: any) => l.transportadora_nome === userName)
  
  const melhorPreco = lances.length > 0 ? Math.min(...lances.map((l: any) => l.valor)) : null
  const melhorPrazo = lances.length > 0 ? Math.min(...lances.map((l: any) => l.prazo_dias)) : null
  
  const meuMelhorLance = meusLances.length > 0 
    ? meusLances.reduce((prev: any, curr: any) => prev.valor < curr.valor ? prev : curr) 
    : null

  const isLider = meuMelhorLance && melhorPreco && meuMelhorLance.valor === melhorPreco
  const isSuperado = meuMelhorLance && melhorPreco && meuMelhorLance.valor > melhorPreco

  // 2. Helpers de Exibição
  
  // Função para resumir endereço no Card (Tenta pegar Cidade - UF)
  // Lógica: Se tiver vírgula, assume que o formato é "Rua, Cidade - UF" e pega a parte final.
  // Se não tiver vírgula, mostra o texto original (assumindo que já é resumido).
  const getCityFromAddress = (address: string) => {
      if (!address) return '---';
      const parts = address.split(',');
      if (parts.length > 1) {
          return parts[parts.length - 1].trim(); // Pega a última parte (ex: "Jundiaí - SP")
      }
      return address;
  }

  // Helpers de Status do Veículo (Funciona / Chave)
  const renderStatusBadge = (condition: boolean | string | null, type: 'funciona' | 'chave') => {
      // Normaliza para booleano se vier string "true"/"false" ou "sim"/"não" do banco
      const isTrue = condition === true || condition === 'true' || condition === 'Sim';
      
      if (type === 'funciona') {
          return isTrue 
            ? <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded text-xs font-bold border border-green-100"><Power size={12}/> Funciona</span>
            : <span className="flex items-center gap-1 text-red-700 bg-red-50 px-2 py-1 rounded text-xs font-bold border border-red-100"><Power size={12}/> Não Funciona</span>
      }
      if (type === 'chave') {
          return isTrue
            ? <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-1 rounded text-xs font-bold border border-blue-100"><Key size={12}/> Com Chave</span>
            : <span className="flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-1 rounded text-xs font-bold border border-gray-200"><Key size={12}/> Sem Chave</span>
      }
  }

  // ... (Lógicas de Submit mantidas iguais)
  const handleLanceRelampago = () => {
      if (!melhorPreco) return;
      const novoPreco = melhorPreco - 50.0;
      const novoPrazo = melhorPrazo || 1;
      setValor(novoPreco.toFixed(2).replace('.', ','));
      setPrazo(String(novoPrazo));
  }

  const handlePreSubmit = () => {
    let valorClean = valor.replace(/\./g, '').replace(',', '.')
    const valorNum = parseFloat(valorClean)
    const prazoNum = parseInt(prazo)

    if (!valorNum || !prazoNum) return alert('Por favor, preencha valor e prazo.')
    if (valorNum <= 0) return alert('Valor inválido.')

    setParsedValues({ valor: valorNum, prazo: prazoNum })
    setShowConfirm(true)
  }

  const handleFinalSubmit = async () => {
    if (!parsedValues) return;
    setLoading(true)
    try {
        const { error } = await supabase.from('lances').insert({
            bid_id: bid.id,
            transportadora_nome: userName,
            valor: parsedValues.valor,
            prazo_dias: parsedValues.prazo
        })
        if (error) throw error
        alert('Lance enviado com sucesso!')
        setValor('')
        setPrazo('')
        setShowConfirm(false)
        if (onUpdate) onUpdate()
    } catch (err) {
        console.error(err)
        alert('Erro ao enviar lance.')
    } finally {
        setLoading(false)
    }
  }

  return (
    <>
        {/* --- CARD PRINCIPAL (RESUMIDO) --- */}
        <div className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md flex flex-col h-full ${isLider ? 'border-green-500 ring-2 ring-green-500' : 'border-gray-200'}`}>
        
        <div className="relative h-36 bg-gray-100 flex-shrink-0 group cursor-pointer" onClick={() => setShowDetails(true)}>
            {bid.imagem_url ? (
                <img src={bid.imagem_url} alt="Veículo" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Truck size={32} />
                </div>
            )}
            
            <div className="absolute top-2 left-2 bg-black/60 hover:bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm flex items-center gap-1 transition-all">
                <Eye size={12} /> DETALHES
            </div>

            <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                {isLider && (
                    <span className="flex items-center gap-1 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wide">
                        <CheckCircle size={10}/> Líder
                    </span>
                )}
                {isSuperado && (
                    <span className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wide">
                        <XCircle size={10}/> Superado
                    </span>
                )}
            </div>
        </div>

        <div className="p-4 flex flex-col flex-1">
            <div className="mb-3">
                <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase bg-gray-100 px-1.5 py-0.5 rounded">{bid.codigo_unico}</span>
                    <span className="text-[10px] font-bold text-red-600 flex items-center gap-1">
                        <Clock size={10} /> {formatDate(bid.prazo_limite)}
                    </span>
                </div>
                {/* Título Resumido */}
                <h3 className="text-sm font-bold text-gray-900 leading-tight mb-0.5 line-clamp-1" title={bid.titulo}>{bid.titulo}</h3>
                <p className="text-xs text-gray-500 line-clamp-1">{bid.modelo || bid.categoria_veiculo} • {bid.tipo_transporte}</p>
            </div>

            {/* Rota Resumida (Só Cidades) */}
            <div 
                className="flex items-center gap-2 text-xs text-gray-600 mb-4 bg-gray-50 p-2 rounded border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors group"
                onClick={() => setShowDetails(true)}
                title="Clique para ver endereços completos"
            >
                <MapPin size={14} className="text-red-500 flex-shrink-0 group-hover:scale-110 transition-transform"/>
                <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{getCityFromAddress(bid.origem)}</div>
                    <div className="flex justify-center text-gray-300 text-[10px] leading-none my-0.5">▼</div>
                    <div className="truncate font-medium">{getCityFromAddress(bid.destino)}</div>
                </div>
            </div>

            {/* Métricas de Mercado */}
            <div className="grid grid-cols-2 gap-2 mb-4 mt-auto">
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
            <div className="space-y-3 pt-3 border-t border-gray-100">
                {melhorPreco && !isLider && (
                    <button 
                        onClick={handleLanceRelampago}
                        className="w-full mb-1 bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 text-[10px] font-bold py-1.5 rounded flex items-center justify-center gap-1 transition-colors"
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
                                type="text"
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
                            placeholder="Dia" 
                            className="w-full px-1 py-2 border border-gray-300 rounded text-sm font-bold text-gray-900 focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none text-center"
                            value={prazo}
                            onChange={e => setPrazo(e.target.value)}
                        />
                    </div>
                </div>
                
                <button 
                    onClick={handlePreSubmit}
                    disabled={loading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wide shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? '...' : <><TrendingDown size={14}/> ENVIAR OFERTA</>}
                </button>
            </div>
        </div>
        </div>

        {/* --- MODAL DETALHADO (Informações Completas) --- */}
        {showDetails && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-y-auto flex flex-col">
                    
                    {/* Header Modal */}
                    <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                           <Truck className="text-red-600" /> Detalhes do BID
                        </h2>
                        <button onClick={() => setShowDetails(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Imagem Grande */}
                        <div className="w-full bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative">
                             {bid.imagem_url ? (
                                <img src={bid.imagem_url} alt="Veículo" className="w-full h-auto max-h-[300px] object-contain mx-auto" />
                            ) : (
                                <div className="h-40 flex items-center justify-center text-gray-400">Sem imagem disponível</div>
                            )}
                             <div className="absolute top-4 right-4 flex gap-2">
                                {renderStatusBadge(bid.funciona || 'Sim', 'funciona')} 
                                {renderStatusBadge(bid.chave || 'Sim', 'chave')}
                             </div>
                        </div>

                        {/* Ficha Técnica (MELHORADA) */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <Tag size={16} className="text-red-600" /> Especificações do Veículo
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Modelo</span>
                                    <p className="text-sm font-bold text-gray-900">{bid.modelo || bid.titulo}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Versão</span>
                                    <p className="text-sm font-bold text-gray-900">{bid.versao || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Quantidade</span>
                                    <p className="text-sm font-bold text-gray-900 flex items-center gap-1">
                                        <Layers size={14} className="text-gray-400"/> {bid.quantidade || 1}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">ID</span>
                                    <p className="text-sm font-mono text-gray-600">{bid.codigo_unico}</p>
                                </div>
                            </div>
                        </div>

                        {/* Endereços COMPLETOS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                                    <MapPin size={12}/> Origem (Retirada)
                                </h3>
                                <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                    <p className="text-sm font-medium text-gray-900 leading-snug">
                                        {/* Mostra o texto COMPLETO aqui */}
                                        {bid.origem}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                                    <MapPin size={12}/> Destino (Entrega)
                                </h3>
                                <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                    <p className="text-sm font-medium text-gray-900 leading-snug">
                                        {/* Mostra o texto COMPLETO aqui */}
                                        {bid.destino}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {bid.descricao && (
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Observações / Descrição</h3>
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-200 leading-relaxed">
                                    {bid.descricao}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t bg-gray-50 sticky bottom-0">
                        <button 
                            onClick={() => setShowDetails(false)}
                            className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            FECHAR
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* --- MODAL CONFIRMAÇÃO (DOUBLE CHECK) --- */}
        {showConfirm && parsedValues && (
             <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in zoom-in-95 duration-200">
                 <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden">
                    <div className="bg-yellow-50 p-4 border-b border-yellow-100 flex items-center gap-3">
                        <div className="bg-yellow-100 p-2 rounded-full text-yellow-600">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-yellow-800">Confirme seu Lance</h3>
                            <p className="text-xs text-yellow-700">Evite erros de digitação</p>
                        </div>
                    </div>

                    <div className="p-6 text-center space-y-4">
                        <p className="text-sm text-gray-500">Você está prestes a enviar uma oferta de:</p>
                        
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400"></div>
                            <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
                                {formatCurrency(parsedValues.valor)}
                            </p>
                            <p className="text-sm font-medium text-gray-500 mt-1">
                                Prazo de entrega: <span className="text-gray-900 font-bold">{parsedValues.prazo} dias</span>
                            </p>
                        </div>

                        {/* Alerta de Competitividade */}
                        {melhorPreco && parsedValues.valor >= melhorPreco && (
                            <div className="bg-red-50 p-3 rounded-lg text-xs text-red-700 text-left border border-red-100 flex gap-2">
                                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5"/>
                                <div>
                                    <strong>Atenção:</strong> Seu preço é maior ou igual ao líder. Você só vencerá se o seu prazo for significativamente melhor.
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-0 border-t border-gray-100">
                        <button 
                            onClick={() => setShowConfirm(false)}
                            className="py-4 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            CORRIGIR
                        </button>
                        <button 
                            onClick={handleFinalSubmit}
                            className="py-4 text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                            CONFIRMAR ENVIO
                        </button>
                    </div>
                 </div>
             </div>
        )}
    </>
  )
}