'use client'

import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'
import AdminAnalise from '@/components/AdminAnalise'

export default function AnalisePage() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const session = Cookies.get('bid_session')
    if (session) {
      const userData = JSON.parse(session)
      if (userData.type !== 'admin') {
        router.push('/dashboard')
      } else {
        setUser(userData)
      }
    } else {
      router.push('/')
    }
  }, [])

  if (!user) return null

  return <AdminAnalise user={user} />
}