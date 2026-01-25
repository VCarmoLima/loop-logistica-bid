'use client'

import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'
// Importa os dois componentes de histórico que criamos
import AdminHistorico from '@/components/AdminHistorico'
import TransporterHistorico from '@/components/TransporterHistorico'

export default function HistoricoPage() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const session = Cookies.get('bid_session')
    if (session) {
        setUser(JSON.parse(session))
    } else {
        // Se não tiver sessão, manda pro login
        router.push('/')
    }
  }, [])

  // Enquanto carrega o cookie, não mostra nada
  if (!user) return null

  // Lógica de Roteamento baseada no tipo de usuário
  if (user.type === 'admin') {
      return <AdminHistorico />
  } else {
      return <TransporterHistorico user={user} />
  }
}