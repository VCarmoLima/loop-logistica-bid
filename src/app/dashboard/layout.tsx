'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { LayoutDashboard, FileSearch, History, Users, LogOut, PlusCircle, Truck } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const session = Cookies.get('bid_session')
    if (session) {
      setUser(JSON.parse(session))
    } else {
      router.push('/')
    }
  }, [])

  const handleLogout = () => {
    Cookies.remove('bid_session')
    router.push('/')
  }

  if (!user) return null

  // Itens do Menu (Lógica: Se for Admin mostra tudo, se for Transp mostra limitado)
  const isAdmin = user.type === 'admin'

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* --- SIDEBAR FIXA --- */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col fixed h-full z-10">
        
        {/* Logo / Header */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <span className="text-xl font-extrabold text-gray-900 tracking-tight">
            BID <span className="text-red-600">Logístico</span>
          </span>
        </div>

        {/* Info do Usuário */}
        <div className="p-6 border-b border-gray-50">
          <p className="text-xs font-bold text-gray-400 uppercase mb-1">
            {isAdmin ? 'Administrador' : 'Transportadora'}
          </p>
          <p className="text-sm font-bold text-gray-900 truncate">{user.nome}</p>
        </div>

        {/* Links de Navegação */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          
          {/* PAINEL GERAL (Para todos) */}
          <Link 
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/dashboard' 
                ? 'bg-red-50 text-red-700' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {isAdmin ? <LayoutDashboard size={18} /> : <Truck size={18} />}
            {isAdmin ? 'Painel Geral' : 'Mural de Oportunidades'}
          </Link>

          {/* ITENS SÓ DE ADMIN */}
          {isAdmin && (
            <>
              <Link 
                href="/dashboard/novo-bid"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/dashboard/novo-bid' 
                    ? 'bg-red-50 text-red-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <PlusCircle size={18} />
                Novo BID
              </Link>

              <Link 
                href="/dashboard/em-analise"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/dashboard/em-analise' 
                    ? 'bg-red-50 text-red-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <FileSearch size={18} />
                Em Análise
              </Link>
              
              {/* Placeholder para futuras páginas */}
              <div className="pt-4 mt-4 border-t border-gray-100">
                 <p className="px-3 text-xs font-bold text-gray-400 uppercase mb-2">Gestão</p>
                 <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-400 text-sm font-medium cursor-not-allowed">
                    <History size={18} /> Histórico
                 </button>
                 <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-400 text-sm font-medium cursor-not-allowed">
                    <Users size={18} /> Acessos
                 </button>
              </div>
            </>
          )}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full text-left text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
          >
            <LogOut size={18} />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* --- CONTEÚDO PRINCIPAL (Muda conforme a página) --- */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
            {children}
        </div>
      </main>
    </div>
  )
}