'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Cookies from 'js-cookie'
import BidCard from '@/components/BidCard'
import { Database } from '@/types/database.types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

type BidWithLances = Database['public']['Tables']['bids']['Row'] & {
    lances: Database['public']['Tables']['lances']['Row'][]
}

export default function DashboardPage() {
  const [bids, setBids] = useState<BidWithLances[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Ler usuário do cookie
    const session = Cookies.get('bid_session')
    if (session) {
        setUser(JSON.parse(session))
    }
    
    fetchBids()
  }, [])

  const fetchBids = async () => {
    console.log("Buscando BIDs...") // Debug 1

    const { data, error } = await supabase
        .from('bids')
        .select('*, lances!lances_bid_id_fkey(*)')
        .eq('status', 'ABERTO')
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Erro Supabase:", error) // Debug 2: Vai aparecer vermelho no F12
    } else {
        console.log("Dados recebidos:", data) // Debug 3: Vai mostrar o array (vazio ou cheio)
        setBids(data as any)
    }
    setLoading(false)
  }

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Carregando oportunidades...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Mural de Oportunidades</h1>
            <p className="text-gray-500">BIDs abertos para cotação em tempo real.</p>
        </div>
        <button 
            onClick={fetchBids}
            className="text-sm text-red-600 font-medium hover:underline cursor-pointer"
        >
            🔄 Atualizar Lista
        </button>
      </div>

      {bids.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500">Nenhum BID disponível no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bids.map((bid) => (
                <BidCard 
                    key={bid.id} 
                    bid={bid} 
                    userId={user?.id}
                    userName={user?.nome || 'Transportadora'}
                />
            ))}
        </div>
      )}
    </div>
  )
}