import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Lendo o cookie no servidor (Server Side)
  // Nota: No Next.js 15, cookies() é assíncrono, por isso o 'await'
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('bid_session')

  if (!sessionCookie) {
    // Se não tiver cookie, chuta pro login
    redirect('/')
  }

  let user = null
  try {
    user = JSON.parse(sessionCookie.value)
  } catch (e) {
    redirect('/')
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar Fixa */}
      <Sidebar user={user} />

      {/* Área de Conteúdo (Onde as páginas vão renderizar) */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}