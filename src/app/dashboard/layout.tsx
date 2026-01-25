'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { LayoutDashboard, FileSearch, Users, LogOut, PlusCircle, Truck, ShieldCheck, History } from 'lucide-react'

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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col fixed h-full z-10">
        
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <span className="text-xl font-extrabold text-gray-900 tracking-tight">
            BID <span className="text-red-600">Log.</span>
          </span>
        </div>

        <div className="p-6 border-b border-gray-50">
          <div className="flex items-center justify-between">
             <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                    {isAdmin ? (isMaster ? 'Master Admin' : 'Analista') : 'Transportadora'}
                </p>
                <p className="text-sm font-bold text-gray-900 truncate">{user.nome}</p>
             </div>
             {isMaster && <ShieldCheck size={16} className="text-red-900" />}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          
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
              
              {/* ITEM MASTER CORRIGIDO - AGORA VERMELHO ESCURO (VINHO) */}
              {isMaster && (
                <div className="pt-2 mt-2">
                    <p className="px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Área Master</p>
                    <Link 
                    href="/dashboard/aprovacao"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        pathname === '/dashboard/aprovacao' 
                        ? 'bg-red-900 text-white shadow-md' // Ativo: Vinho com texto branco
                        : 'text-red-900 bg-red-50 hover:bg-red-100' // Inativo: Fundo claro, texto vinho
                    }`}
                    >
                    <ShieldCheck size={18} />
                    Aprovação
                    </Link>
                </div>
              )}
              
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

      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
            {children}
        </div>
      </main>
    </div>
  )
}