'use client'

import { useEffect, useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Trophy, Calendar, MapPin, Truck, ChevronDown, ChevronUp } from 'lucide-react'
import { downloadPDF, downloadCSV } from '@/lib/audit'
import { FileText, FileSpreadsheet } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AdminHistorico() {
    const [bids, setBids] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    useEffect(() => {
        fetchHistorico()
    }, [])

    const fetchHistorico = async () => {
        try {
            const { data, error } = await supabase
                .from('bids')
                .select('*, lances!lances_bid_id_fkey(*)')
                .eq('status', 'FINALIZADO')
                .order('prazo_limite', { ascending: false })

            if (error) console.error(error)
            if (data) setBids(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const calcularResultados = (lances: any[]) => {
        if (!lances || lances.length === 0) return []
        const minPreco = Math.min(...lances.map(l => l.valor))
        const minPrazo = Math.min(...lances.map(l => l.prazo_dias))

        return lances.map(l => {
            const scorePreco = (minPreco / l.valor) * 70
            const scorePrazo = (minPrazo / l.prazo_dias) * 30
            return { ...l, score: scorePreco + scorePrazo }
        }).sort((a, b) => b.score - a.score)
    }

    if (loading) return <div className="p-8 text-center text-gray-900 font-medium">Carregando histórico...</div>

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Histórico de BIDs</h1>
                <p className="text-gray-600 text-sm">Arquivo de processos finalizados e auditados.</p>
            </div>

            {bids.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
                    <Calendar className="mx-auto text-gray-400 mb-2" size={32} />
                    <h3 className="text-lg font-medium text-gray-900">Arquivo Vazio</h3>
                    <p className="text-gray-500">Nenhum processo foi finalizado ainda.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {bids.map((bid) => {
                        const resultados = calcularResultados(bid.lances)
                        const vencedor = bid.lances.find((l: any) => l.id === bid.lance_vencedor_id)
                        const isExpanded = expandedId === bid.id

                        return (
                            <div key={bid.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden transition-all shadow-sm">
                                <div
                                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                                    onClick={() => setExpandedId(isExpanded ? null : bid.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${vencedor ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            <Trophy size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900">{bid.titulo}</h3>
                                            <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                                                <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 font-bold">{bid.codigo_unico}</span>
                                                <span>•</span>
                                                <span>{formatDate(bid.prazo_limite)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right flex items-center gap-6">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Vencedor</p>
                                            <p className="text-sm font-bold text-gray-900">{vencedor ? vencedor.transportadora_nome : 'Deserto / Cancelado'}</p>
                                        </div>
                                        {vencedor && (
                                            <div className="hidden md:block">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Valor Fechado</p>
                                                <p className="text-sm font-bold text-green-700">{formatCurrency(vencedor.valor)}</p>
                                            </div>
                                        )}
                                        {isExpanded ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="border-t border-gray-100 bg-gray-50 p-6 animate-in slide-in-from-top-2">
                                        <div className="flex gap-6 text-sm text-gray-700 mb-6 font-medium">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={16} className="text-gray-500" />
                                                {bid.origem} <span className="text-gray-400">➝</span> {bid.destino}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Truck size={16} className="text-gray-500" />
                                                {bid.categoria_veiculo} • {bid.tipo_transporte}
                                            </div>
                                        </div>

                                        <h4 className="text-xs font-bold text-gray-900 uppercase mb-3 border-b border-gray-200 pb-2">Ranking Final (Auditado)</h4>
                                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-4 py-3">Posição</th>
                                                        <th className="px-4 py-3">Transportadora</th>
                                                        <th className="px-4 py-3 text-right">Valor</th>
                                                        <th className="px-4 py-3 text-center">Prazo</th>
                                                        <th className="px-4 py-3 text-center">Score</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {resultados.map((l, idx) => (
                                                        <tr key={l.id} className={l.id === bid.lance_vencedor_id ? 'bg-green-50/50' : ''}>
                                                            <td className="px-4 py-3 text-gray-900 font-bold">#{idx + 1}</td>
                                                            <td className="px-4 py-3 font-medium text-gray-900">
                                                                {l.transportadora_nome}
                                                                {l.id === bid.lance_vencedor_id && <span className="ml-2 text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded font-bold uppercase border border-green-200">Vencedor</span>}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(l.valor)}</td>
                                                            <td className="px-4 py-3 text-center text-gray-900">{l.prazo_dias} dias</td>
                                                            <td className="px-4 py-3 text-center font-bold text-gray-900">{l.score.toFixed(1)}</td>
                                                        </tr>
                                                    ))}
                                                    {resultados.length === 0 && (
                                                        <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Nenhum lance registrado.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="mt-4 text-xs text-gray-500 text-right">
                                            Aprovado por: <span className="font-bold text-gray-700">{bid.log_aprovacao || 'Sistema'}</span>
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-3">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); downloadCSV(bid, bid.lances); }}
                                                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded text-xs font-bold text-gray-700 hover:bg-gray-50"
                                            >
                                                <FileSpreadsheet size={14} /> CSV DADOS
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); downloadPDF(bid, bid.lances, vencedor); }}
                                                className="flex items-center gap-2 px-3 py-2 bg-red-900 text-white rounded text-xs font-bold hover:bg-red-800 shadow-sm"
                                            >
                                                <FileText size={14} /> BAIXAR AUDITORIA PDF
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}