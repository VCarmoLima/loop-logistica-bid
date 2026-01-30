'use client'

import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'
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
      router.push('/')
    }
  }, [])

  if (!user) return null

  if (user.type === 'admin') {
    return <AdminHistorico />
  } else {
    return <TransporterHistorico user={user} />
  }
}