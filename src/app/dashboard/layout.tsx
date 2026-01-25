'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { LayoutDashboard, FileSearch, Users, LogOut, PlusCircle, Truck, ShieldCheck, History, UserCircle } from 'lucide-react'

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

  const isAdmin = user.type === 'admin'
  const isMaster = user.role === 'master'

  // ESTILO DE TÍTULO DE SEÇÃO REFINADO
  // Mudanças: mt-6 (espaço topo), text-gray-500 (mais escuro), font-bold (menos pesado que extra), tracking-wider (espaçamento letras)
  const sectionTitleStyle = "px-3 mb-2 mt-6 text-xs font-bold text-gray-500 uppercase tracking-wider"

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col fixed h-full z-10">
        
        {/* Header Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <span className="text-xl font-extrabold text-gray-900 tracking-tight">
            BID <span className="text-red-600">Log.</span>
          </span>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-gray-50">
          <div className="flex items-center justify-between">
             <div className="overflow-hidden">
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-wide">
                    {isAdmin ? (isMaster ? 'Master Admin' : 'Analista') : 'Transportadora'}
                </p>
                <p className="text-sm font-bold text-gray-900 truncate" title={user.nome}>{user.nome}</p>
             </div>
             {isMaster && <ShieldCheck size={16} className="text-red-900 flex-shrink-0" />}
          </div>
        </div>

        {/* Menu Principal */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          
          {/* Link Principal (Sem título de seção) */}
          <Link 
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/dashboard' 
                ? 'bg-red-50 text-red-700' 
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {isAdmin ? <LayoutDashboard size={18} /> : <Truck size={18} />}
            {isAdmin ? 'Painel Geral' : 'Mural de Oportunidades'}
          </Link>

          {isAdmin && (
            <>
              <Link 
                href="/dashboard/novo-bid"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/dashboard/novo-bid' 
                    ? 'bg-red-50 text-red-700' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
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
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <FileSearch size={18} />
                Em Análise
              </Link>

              {/* Seção Master */}
              {isMaster && (
                <div>
                    <p className={sectionTitleStyle}>Área Master</p>
                    <Link 
                    href="/dashboard/aprovacao"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        pathname === '/dashboard/aprovacao' 
                        ? 'bg-red-900 text-white shadow-md' 
                        : 'text-red-900 bg-red-50 hover:bg-red-100' 
                    }`}
                    >
                    <ShieldCheck size={18} />
                    Aprovação
                    </Link>
                </div>
              )}
              
              {/* Seção Gestão */}
              <div>
                 <p className={sectionTitleStyle}>Gestão</p>
                 <Link 
                    href="/dashboard/historico"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        pathname === '/dashboard/historico' 
                        ? 'bg-red-50 text-red-700' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                 >
                    <History size={18} /> Histórico
                 </Link>
                 <Link 
                    href="/dashboard/gestao-acessos"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        pathname === '/dashboard/gestao-acessos' 
                        ? 'bg-red-50 text-red-700' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                 >
                    <Users size={18} /> Acessos
                 </Link>
              </div>
            </>
          )}
        </nav>

        {/* Footer: Minha Conta + Logout */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/30">
             <Link 
                href="/dashboard/minha-conta"
                className={`flex items-center gap-3 px-3 py-2 mb-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === '/dashboard/minha-conta' 
                    ? 'bg-white text-red-700 shadow-sm border border-gray-200' 
                    : 'text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm'
                }`}
             >
                <UserCircle size={18} /> Minha Conta
             </Link>

            <button 
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2 w-full text-left text-gray-500 hover:text-red-600 hover:bg-white hover:shadow-sm rounded-lg text-sm font-medium transition-all"
            >
                <LogOut size={18} />
                Sair do Sistema
            </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
            {children}
        </div>
      </main>
    </div>
  )
}