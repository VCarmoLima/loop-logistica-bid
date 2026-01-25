'use client'

import { useEffect, useState, useCallback } from 'react'
import Cookies from 'js-cookie'
import AdminDashboard from '@/components/AdminDashboard'
import BidCard from '@/components/BidCard'
import { createClient } from '@supabase/supabase-js'
import { Truck, Info } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [bidsTransp, setBidsTransp] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showRules, setShowRules] = useState(false)

  // Função de busca (memorizada para usar no useEffect)
  const fetchBidsTransporter = useCallback(async () => {
    const { data } = await supabase
        .from('bids')
        .select('*, lances!lances_bid_id_fkey(*)')
        .eq('status', 'ABERTO')
        .order('created_at', { ascending: false })
    
    if (data) {
        setBidsTransp(data)
        console.log("Lista de BIDs atualizada.")
    }
  }, [])

  useEffect(() => {
    let channel: any = null
    let interval: any = null

    const init = async () => {
        const session = Cookies.get('bid_session')
        if (session) {
            const userData = JSON.parse(session)
            setUser(userData)
            
            if (userData.type !== 'admin') {
                // 1. Busca Inicial
                await fetchBidsTransporter()
                
                // 2. Configura Realtime (WebSockets)
                channel = supabase.channel('mural-realtime')
                    .on(
                        'postgres_changes', 
                        { event: '*', schema: 'public', table: 'lances' }, 
                        (payload) => {
                            console.log('⚡ Mudança em lances detectada (Realtime):', payload)
                            fetchBidsTransporter()
                        }
                    )
                    .subscribe()

                // 3. Configura Polling (Backup a cada 5s)
                // Isso garante atualização mesmo se o Realtime falhar ou houver bloqueio de RLS
                interval = setInterval(() => {
                    fetchBidsTransporter()
                }, 1500)
            }
        }
        setLoading(false)
    }

    init()

    // Limpeza ao desmontar
    return () => {
        if (channel) supabase.removeChannel(channel)
        if (interval) clearInterval(interval)
    }
  }, [fetchBidsTransporter]) // Dependência segura

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Carregando painel...</div>

  // 1. VISÃO ADMIN
  if (user?.type === 'admin') {
      return <AdminDashboard user={user} />
  }

  // 2. VISÃO TRANSPORTADORA
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Mural de Oportunidades</h1>
            <p className="text-gray-500 text-sm flex items-center gap-1">
                BIDs disponíveis em tempo real. 
                <button onClick={() => setShowRules(!showRules)} className="text-red-600 font-bold hover:underline text-xs ml-2 flex items-center gap-1">
                    <Info size={12}/> Como funciona o Leilão?
                </button>
            </p>
        </div>
        <button 
            onClick={fetchBidsTransporter} 
            className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors"
        >
            ATUALIZAR LISTA
        </button>
      </div>

      {showRules && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8 text-sm text-blue-900 animate-in fade-in slide-in-from-top-2">
            <h3 className="font-bold mb-2 flex items-center gap-2"><Info size={16}/> Regras do Leilão & Escolha</h3>
            <ul className="list-disc pl-5 space-y-1 text-blue-800/80">
                <li><strong>Ranking Dinâmico:</strong> O sistema prioriza o <span className="font-bold">Menor Preço</span>. Em caso de empate, vence o <span className="font-bold">Menor Prazo</span>.</li>
                <li><strong>Decisão Final (Score):</strong> Após o encerramento, o sistema calcula um Score (70% Preço + 30% Prazo). O administrador utiliza este Score para homologar o vencedor.</li>
                <li><strong>Lances "Ruins":</strong> Você pode ofertar um valor maior que o líder, desde que seu prazo seja agressivo. Se ambos forem piores, suas chances de vitória são mínimas.</li>
                <li><strong>Encerramento:</strong> O leilão encerra automaticamente no horário estipulado.</li>
            </ul>
        </div>
      )}

      {bidsTransp.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Truck size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Sem Oportunidades</h3>
            <p className="text-gray-500">Nenhum BID disponível para cotação no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bidsTransp.map((bid) => (
                <BidCard 
                    key={bid.id} 
                    bid={bid} 
                    userId={user.id}
                    userName={user.nome}
                    onUpdate={fetchBidsTransporter} 
                />
            ))}
        </div>
      )}
    </div>
  )
}