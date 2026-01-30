'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Cookies from 'js-cookie'
import {
  LayoutDashboard,
  PlusCircle,
  Search,
  History,
  Users,
  LogOut,
  Truck,
  ShieldCheck,
  Menu
} from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Sidebar({ user }: { user: any }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const menuItems = user.type === 'admin'
    ? [
      { name: 'Painel Geral', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Novo BID', href: '/dashboard/novo-bid', icon: PlusCircle },
      { name: 'Em Análise', href: '/dashboard/analise', icon: Search },
      { name: 'Histórico', href: '/dashboard/historico', icon: History },
      { name: 'Gestão de Acessos', href: '/dashboard/usuarios', icon: Users },
    ]
    : [
      { name: 'Mural de Oportunidades', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Meus Lances', href: '/dashboard/meus-lances', icon: History },
      { name: 'Minha Conta', href: '/dashboard/perfil', icon: Users },
    ]

  const handleLogout = () => {
    Cookies.remove('bid_session')
    router.push('/')
  }

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-md shadow-md"
      >
        <Menu size={24} />
      </button>

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:static md:h-screen
      `}>

        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-2 font-bold text-xl text-gray-800">
            {user.type === 'admin'
              ? <ShieldCheck className="text-gray-900" />
              : <Truck className="text-red-600" />
            }
            <span>BID Log.</span>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            {user.type === 'admin' ? 'Administrador' : 'Transportadora'}
          </p>
          <p className="font-medium text-gray-900 truncate">{user.nome}</p>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto" style={{ height: 'calc(100vh - 180px)' }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                    ? 'bg-red-50 text-red-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <item.icon size={20} className={isActive ? 'text-red-600' : 'text-gray-400'} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 absolute bottom-0 w-full bg-white">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Sair do Sistema
          </button>
        </div>
      </aside>
    </>
  )
}