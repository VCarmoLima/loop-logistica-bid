'use client'

import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import AdminDashboard from '@/components/AdminDashboard'
import BidCard from '@/components/BidCard' // Supondo que você tenha separado
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [bidsTransp, setBidsTransp] = useState<any[]>([])

  useEffect(() => {
    const session = Cookies.get('bid_session')
    if (session) {
        const userData = JSON.parse(session)
        setUser(userData)
        if (userData.type !== 'admin') fetchBidsTransporter()
    }
  }, [])

  const fetchBidsTransporter = async () => {
    const { data } = await supabase
        .from('bids')
        .select('*, lances!lances_bid_id_fkey(*)')
        .eq('status', 'ABERTO')
        .order('created_at', { ascending: false })
    if (data) setBidsTransp(data)
  }

  if (!user) return null

  // Lógica Simples: O Layout já desenhou o menu. Aqui só entregamos o miolo.
  if (user.type === 'admin') {
      return <AdminDashboard user={user} />
  }

  return (
    <div>
        {/* Conteúdo Transportadora */}
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Mural de Oportunidades</h1>
                <p className="text-gray-500 text-sm">BIDs abertos para cotação em tempo real.</p>
            </div>
            <button onClick={fetchBidsTransporter} className="text-sm text-red-600 font-medium hover:underline">
                Atualizar Lista
            </button>
        </div>

        {bidsTransp.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500">Nenhum BID disponível.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bidsTransp.map((bid) => (
                    <BidCard key={bid.id} bid={bid} userId={user.id} userName={user.nome} />
                ))}
            </div>
        )}
    </div>
  )
}