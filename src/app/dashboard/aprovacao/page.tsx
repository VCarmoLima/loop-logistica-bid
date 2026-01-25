'use client'

import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'
import AdminAprovacao from '@/components/AdminAprovacao'

export default function AprovacaoPage() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const session = Cookies.get('bid_session')
    if (session) {
        const userData = JSON.parse(session)
        // Segurança Extra: Só deixa renderizar se for ADMIN e MASTER
        if (userData.type !== 'admin' || userData.role !== 'master') {
            router.push('/dashboard') 
        } else {
            setUser(userData)
        }
    } else {
        router.push('/') 
    }
  }, [])

  if (!user) return null

  return <AdminAprovacao user={user} />
}