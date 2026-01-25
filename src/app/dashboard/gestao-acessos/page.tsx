'use client'
import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'
import AdminGestaoAcessos from '@/components/AdminGestaoAcessos'

export default function Page() {
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
  return <AdminGestaoAcessos user={user} />
}