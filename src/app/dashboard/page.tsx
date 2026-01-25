'use client'

import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import AdminDashboard from '@/components/AdminDashboard'
import BidCard from '@/components/BidCard'
import { createClient } from '@supabase/supabase-js'
import { Truck } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [bidsTransp, setBidsTransp] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const session = Cookies.get('bid_session')
    if (session) {
        const userData = JSON.parse(session)
        setUser(userData)
        if (userData.type !== 'admin') {
            fetchBidsTransporter()
        }
    }
    setLoading(false)
  }, [])

  const fetchBidsTransporter = async () => {
    const { data } = await supabase
        .from('bids')
        .select('*, lances!lances_bid_id_fkey(*)')
        .eq('status', 'ABERTO')
        .order('created_at', { ascending: false })
    
    if (data) setBidsTransp(data)
  }

  if (loading) return null // ou um spinner

  // VISÃO ADMIN
  if (user?.type === 'admin') {
      return <AdminDashboard user={user} />
  }

  // VISÃO TRANSPORTADORA
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Mural de Oportunidades</h1>
            <p className="text-gray-500 text-sm">BIDs abertos para cotação em tempo real.</p>
        </div>
        <button 
            onClick={fetchBidsTransporter} 
            className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors"
        >
            ATUALIZAR LISTA
        </button>
      </div>

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
                    onUpdate={fetchBidsTransporter} // Passa a função de refresh
                />
            ))}
        </div>
      )}
    </div>
  )
}