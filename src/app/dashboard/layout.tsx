'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { Montserrat } from 'next/font/google'
import {
  LayoutDashboard, FileSearch, Users, LogOut, PlusCircle,
  Truck, ShieldCheck, History, UserCircle, Pin, PinOff, Menu, X
} from 'lucide-react'

const logoFont = Montserrat({
  subsets: ['latin'],
  weight: ['600', '800'],
  display: 'swap',
})

const getMenuTextClass = (isOpen: boolean) => {
  return `transition-all ease-in-out whitespace-nowrap overflow-hidden
    ${isOpen
      ? 'opacity-100 max-w-[200px] translate-x-0 ml-3 duration-500'
      : 'opacity-0 max-w-0 -translate-x-5 ml-0 duration-300'
    }`
}

const getHeaderOpenClass = (isOpen: boolean) => {
  return `absolute inset-0 flex flex-col items-center justify-center transition-all ease-out whitespace-nowrap
    ${isOpen
      ? 'opacity-100 scale-100 duration-500 delay-200'
      : 'opacity-0 scale-90 duration-200 pointer-events-none'
    }`
}

const getHeaderIconClass = (isOpen: boolean) => {
  return `absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all ease-out
    ${!isOpen
      ? 'opacity-100 scale-100 duration-500 delay-300'
      : 'opacity-0 scale-50 duration-100 pointer-events-none'
    }`
}

const getUserOpenClass = (isOpen: boolean) => {
  return `flex flex-col items-center transition-all ease-in-out absolute w-full
    ${isOpen
      ? 'opacity-100 scale-100 duration-500 delay-200'
      : 'opacity-0 scale-90 duration-200 pointer-events-none'} 
  `
}

const getUserClosedClass = (isOpen: boolean) => {
  return `transition-all ease-in-out absolute
    ${!isOpen
      ? 'opacity-100 scale-100 duration-500 delay-300'
      : 'opacity-0 scale-50 duration-100 pointer-events-none'} 
  `
}

const SectionTitle = ({ label, isOpen, delayMs = 0, isFirst = false }: { label: string, isOpen: boolean, delayMs?: number, isFirst?: boolean }) => (
  <div
    className={`px-3 overflow-hidden transition-all duration-500 ease-in-out
      ${isOpen
        ? `max-h-10 opacity-100 ${isFirst ? 'mt-2' : 'mt-6'} mb-2`
        : 'max-h-0 opacity-0 mt-0 mb-0 duration-300'} 
    `}
    style={{ transitionDelay: isOpen ? `${delayMs}ms` : '0ms' }}
  >
    <div className="flex items-center justify-center">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap border-b border-gray-100 pb-1 w-full text-center">
        {label}
      </p>
    </div>
  </div>
)

const NavLink = ({ href, icon: Icon, label, isOpen, isActive, isSpecial = false, delayMs = 0, onClick }: any) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group flex items-center py-2.5 rounded-lg text-sm font-medium transition-all duration-300
        ${isOpen ? 'px-3' : 'pl-[26px] pr-0'} 
        ${isSpecial
          ? (isActive ? 'bg-red-900 text-white shadow-md' : 'text-red-900 bg-red-50 hover:bg-red-100')
          : (isActive ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900')
        }
      `}
      title={!isOpen ? label : ''}
    >
      <Icon size={18} className={`flex-shrink-0 transition-all duration-500 ${!isOpen ? 'scale-110' : ''}`} />

      <span
        className={getMenuTextClass(isOpen)}
        style={{ transitionDelay: isOpen ? `${delayMs}ms` : '0ms' }}
      >
        {label}
      </span>
    </Link>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  const [isPinned, setIsPinned] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const [logoError, setLogoError] = useState(false)
  const [iconError, setIconError] = useState(false)

  const isDesktopOpen = isPinned || isHovered
  const isOpen = isMobileOpen || isDesktopOpen

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

  const sidebarClass = `fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200 flex flex-col shadow-2xl md:shadow-sm
    transition-all duration-300 ease-in-out
    w-64 transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
    md:transform-none md:translate-x-0
    ${isDesktopOpen ? 'md:w-64' : 'md:w-20'}
  `

  let delayCounter = 100
  const step = 25
  const getDelay = () => {
    const current = delayCounter
    delayCounter += step
    return current
  }

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">

      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-20 flex items-center justify-between px-4 shadow-sm">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <Menu size={24} />
        </button>

        <div className="flex items-center gap-2">
          <div className={`flex items-baseline justify-center leading-none ${logoFont.className}`}>
            <span className="text-xl font-extrabold text-gray-800 tracking-tight">BID</span>
            <span className="text-xl font-semibold text-red-600 ml-1">Logístico</span>
          </div>
        </div>

        <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center text-red-700 font-bold text-xs border border-red-100">
          {user.nome.charAt(0).toUpperCase()}
        </div>
      </div>
      <aside
        className={sidebarClass}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >

        <div className="h-24 w-full relative border-b border-gray-100 bg-white z-20 overflow-hidden select-none flex-shrink-0">

          <div className="md:hidden absolute right-2 top-2 z-50">
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-1.5 text-gray-400 hover:text-red-600 rounded"
            >
              <X size={20} />
            </button>
          </div>

          <div className={getHeaderOpenClass(isOpen)}>
            {!logoError ? (
              <>
                <img
                  src="/images/logo.webp"
                  alt="Logo"
                  className="h-8 w-auto object-contain mb-1"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    setLogoError(true);
                  }}
                />
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                  Sistema de BIDs
                </span>
              </>
            ) : (
              <div className="text-center">
                <div className={`flex items-baseline justify-center leading-none ${logoFont.className}`}>
                  <span className="text-2xl font-extrabold text-gray-800 tracking-tight">BID</span>
                  <span className="text-2xl font-semibold text-red-600 ml-1">Logístico</span>
                </div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] block mt-1">
                  Sistema de BIDs
                </span>
              </div>
            )}
          </div>

          <div className={`${getHeaderIconClass(isOpen)} md:flex hidden`}>
            {!iconError ? (
              <img
                src="/images/icon.png"
                alt="Icon"
                className="h-8 w-8 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  setIconError(true);
                }}
              />
            ) : (
              <Truck className="text-red-600" size={24} />
            )}
          </div>

          <div className={`hidden md:block absolute right-2 top-2 transition-all duration-300 ${isOpen ? 'opacity-100 delay-200' : 'opacity-0 pointer-events-none'}`}>
            <button
              onClick={() => setIsPinned(!isPinned)}
              className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title={isPinned ? "Desafixar" : "Fixar"}
            >
              {isPinned ? <Pin size={12} className="fill-current" /> : <PinOff size={12} />}
            </button>
          </div>
        </div>

        <div className="h-20 border-b border-gray-50 transition-all duration-500 flex flex-col items-center justify-center relative overflow-hidden flex-shrink-0">
          <div className={getUserOpenClass(isOpen)}>
            <div className="text-center w-full px-2">
              <p className="text-sm font-bold text-gray-900 truncate" title={user.nome}>{user.nome}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-0.5 flex items-center justify-center gap-1">
                {isAdmin ? (isMaster ? 'Master Admin' : 'Analista') : 'Transportadora'}
                {isMaster
                }
              </p>
            </div>
          </div>

          <div className={`${getUserClosedClass(isOpen)} md:block hidden`}>
            <div className="w-9 h-9 bg-red-50 rounded-full flex items-center justify-center text-red-700 font-bold text-sm border border-red-100 shadow-sm select-none">
              {user.nome.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-100 select-none">
          <SectionTitle label="Operacional" isOpen={isOpen} delayMs={getDelay()} isFirst={true} />

          <NavLink
            href="/dashboard"
            icon={isAdmin ? LayoutDashboard : Truck}
            label={isAdmin ? 'Painel Geral' : 'Mural de Oportunidades'}
            isOpen={isOpen}
            isActive={pathname === '/dashboard'}
            delayMs={getDelay()}
            onClick={() => setIsMobileOpen(false)}
          />

          {isAdmin && (
            <>
              <NavLink href="/dashboard/novo-bid" icon={PlusCircle} label="Novo BID" isOpen={isOpen} isActive={pathname === '/dashboard/novo-bid'} delayMs={getDelay()} onClick={() => setIsMobileOpen(false)} />
              <NavLink href="/dashboard/em-analise" icon={FileSearch} label="Em Análise" isOpen={isOpen} isActive={pathname === '/dashboard/em-analise'} delayMs={getDelay()} onClick={() => setIsMobileOpen(false)} />

              {isMaster && (
                <>
                  <SectionTitle label="Área Master" isOpen={isOpen} delayMs={getDelay()} />
                  <NavLink
                    href="/dashboard/aprovacao"
                    icon={ShieldCheck}
                    label="Aprovação"
                    isOpen={isOpen}
                    isActive={pathname === '/dashboard/aprovacao'}
                    isSpecial={true}
                    delayMs={getDelay()}
                    onClick={() => setIsMobileOpen(false)}
                  />
                </>
              )}

              <SectionTitle label="Gestão" isOpen={isOpen} delayMs={getDelay()} />
              <NavLink href="/dashboard/historico" icon={History} label="Histórico" isOpen={isOpen} isActive={pathname === '/dashboard/historico'} delayMs={getDelay()} onClick={() => setIsMobileOpen(false)} />
              <NavLink href="/dashboard/gestao-acessos" icon={Users} label="Acessos" isOpen={isOpen} isActive={pathname === '/dashboard/gestao-acessos'} delayMs={getDelay()} onClick={() => setIsMobileOpen(false)} />
            </>
          )}

          {!isAdmin && (
            <>
              <SectionTitle label="Minhas Cargas" isOpen={isOpen} delayMs={getDelay()} />
              <NavLink href="/dashboard/historico" icon={History} label="Resultados" isOpen={isOpen} isActive={pathname === '/dashboard/historico'} delayMs={getDelay()} onClick={() => setIsMobileOpen(false)} />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100 bg-gray-50/30 select-none flex-shrink-0">
          <NavLink
            href="/dashboard/minha-conta"
            icon={UserCircle}
            label="Minha Conta"
            isOpen={isOpen}
            isActive={pathname === '/dashboard/minha-conta'}
            delayMs={delayCounter + step}
            onClick={() => setIsMobileOpen(false)}
          />

          <button
            onClick={handleLogout}
            className={`group flex items-center py-2 w-full rounded-lg text-sm font-medium transition-all duration-300 text-gray-500 hover:text-red-600 hover:bg-white hover:shadow-sm mt-1 
                ${isOpen ? 'px-3' : 'pl-[26px] pr-0'}`
            }
            title={!isOpen ? "Sair" : ""}
          >
            <LogOut size={18} className="flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
            <span
              className={getMenuTextClass(isOpen)}
              style={{ transitionDelay: isOpen ? `${delayCounter + (step * 2)}ms` : '0ms' }}
            >
              Sair do Sistema
            </span>
          </button>
        </div>
      </aside>

      <main
        className={`flex-1 transition-all duration-700 cubic-bezier(0.25, 0.8, 0.25, 1)
            pt-20 p-4 md:p-8 md:pt-8 
            ${isDesktopOpen ? 'md:ml-64' : 'md:ml-20'} 
            ml-0
        `}
      >
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}