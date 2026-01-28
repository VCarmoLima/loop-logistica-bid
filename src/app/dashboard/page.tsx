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
  
  // Estado para controlar o sinal verde
  const [isLive, setIsLive] = useState(false)

  // Função de busca (memorizada para usar no useEffect)
  const fetchBidsTransporter = useCallback(async () => {
    const { data } = await supabase
        .from('bids')
        .select('*, lances!lances_bid_id_fkey(*)')
        .eq('status', 'ABERTO')
        .order('created_at', { ascending: false })
    
    if (data) {
        setBidsTransp(data)
        setIsLive(true)
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
                    .on(
                        'postgres_changes', 
                        { event: '*', schema: 'public', table: 'bids' }, 
                        () => fetchBidsTransporter()
                    )
                    .subscribe((status) => {
                        if (status === 'SUBSCRIBED') setIsLive(true)
                    })

                // 3. Configura Polling (Backup a cada 3s)
                interval = setInterval(() => {
                    fetchBidsTransporter()
                }, 3000)
            }
        }
        setLoading(false)
    }

    init()

    return () => {
        if (channel) supabase.removeChannel(channel)
        if (interval) clearInterval(interval)
    }
  }, [fetchBidsTransporter])

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Carregando painel...</div>

  // 1. VISÃO ADMIN
  if (user?.type === 'admin') {
      return <AdminDashboard user={user} />
  }

  // 2. VISÃO TRANSPORTADORA
  return (
    <div className="pb-20 md:pb-0"> 
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">Mural de Oportunidades</h1>
            <p className="text-gray-500 text-sm flex flex-wrap items-center gap-1 mt-1">
                BIDs disponíveis em tempo real. 
                {/* Botão de Regras (AGORA CINZA) */}
                <button 
                    onClick={() => setShowRules(!showRules)} 
                    className="text-gray-600 font-bold hover:text-gray-900 hover:bg-gray-100 text-xs flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100 transition-colors"
                >
                    <Info size={12}/> Regras do Leilão
                </button>
            </p>
        </div>

        {/* INDICADOR DE TEMPO REAL */}
        <div className={`
            flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm self-start md:self-auto
            ${isLive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-100 text-gray-400'}
        `}>
            <span className="relative flex h-2.5 w-2.5">
              {isLive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isLive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            </span>
            {isLive ? 'TEMPO REAL' : 'CONECTANDO...'}
        </div>
      </div>

      {/* REGRAS (AGORA EM TONS DE CINZA) */}
      {showRules && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 md:p-6 mb-8 text-sm text-gray-700 animate-in fade-in slide-in-from-top-2 shadow-sm">
            <h3 className="font-bold mb-3 flex items-center gap-2 text-gray-900"><Info size={16}/> Regras do Leilão & Escolha</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-600 text-xs md:text-sm">
                <li><strong>Ranking Dinâmico:</strong> O sistema prioriza o <span className="font-bold text-gray-900">Menor Preço</span>. Em caso de empate, vence o <span className="font-bold text-gray-900">Menor Prazo</span>.</li>
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
            <p className="text-gray-500 text-sm mt-1">Nenhum BID disponível para cotação no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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