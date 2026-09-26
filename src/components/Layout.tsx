import React, { useState } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  Users,
  ClipboardList,
  Calendar,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { formatarDataExtensa } from '@/lib/formatters'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const rotasMap: Record<string, string> = {
  '/': 'Início',
  '/pacientes': 'Pacientes',
  '/prontuario': 'Prontuário',
  '/agenda': 'Agenda',
  '/financeiro': 'Financeiro',
  '/configuracoes': 'Configurações',
}

export default function Layout() {
  const { preferencias, logout, obterAvatarUrl } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)

  const nomeProfissional = preferencias?.nome_profissional || 'Juliana T A S Vasconcellos'
  const cargoProfissional = preferencias?.cargo || 'Psicóloga'
  const monograma = preferencias?.monograma || 'JV'
  const avatarUrl = obterAvatarUrl()

  const tituloPagina = rotasMap[location.pathname] || 'Consultório'

  const itensMenu = [
    { rota: '/', rotulo: 'Início', icone: Home },
    { rota: '/pacientes', rotulo: 'Pacientes', icone: Users },
    { rota: '/prontuario', rotulo: 'Prontuário', icone: ClipboardList },
    { rota: '/agenda', rotulo: 'Agenda', icone: Calendar },
    { rota: '/financeiro', rotulo: 'Financeiro', icone: DollarSign },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const renderMonogramaOuFoto = (tamanho: 'sm' | 'md' | 'lg' = 'md') => {
    const dim =
      tamanho === 'sm'
        ? 'w-9 h-9 text-xs'
        : tamanho === 'lg'
          ? 'w-16 h-16 text-xl'
          : 'w-11 h-11 text-sm'

    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
          alt={nomeProfissional}
          className={`${dim} rounded-full object-cover border-2 border-[#8A9A83] shrink-0`}
        />
      )
    }

    return (
      <div
        className={`${dim} rounded-xl bg-[#C8845F] text-white flex items-center justify-center font-bold tracking-wider shrink-0 shadow-sm`}
      >
        {monograma}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#F7F8F6] text-[#4A4A48]">
      {/* Sidebar para desktop */}
      <aside className="hidden md:flex flex-col w-[260px] bg-white border-r border-[#B9BDB8]/40 fixed inset-y-0 left-0 z-30 select-none">
        {/* Topo com monograma e nome */}
        <div className="p-6 flex items-center gap-3 border-b border-[#B9BDB8]/30">
          <div className="w-11 h-11 rounded-xl bg-[#C8845F] text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
            {monograma}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold text-sm text-[#2C3A2C] truncate leading-tight">
              {nomeProfissional}
            </span>
            <span className="text-xs text-[#8A9A83] font-medium tracking-wide">
              {cargoProfissional}
            </span>
          </div>
        </div>

        {/* Itens de navegação */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {itensMenu.map((item) => {
            const Icone = item.icone
            const ativo = location.pathname === item.rota
            return (
              <NavLink
                key={item.rota}
                to={item.rota}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative ${
                    isActive
                      ? 'bg-[#E4EADF] text-[#3A4A3A]'
                      : 'text-[#4A4A48] hover:bg-[#F7F8F6] hover:text-[#2C3A2C]'
                  }`
                }
              >
                {ativo && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#C8845F] rounded-r-md" />
                )}
                <Icone
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    ativo ? 'text-[#8A9A83]' : 'text-[#8A9A83]/70'
                  }`}
                />
                <span className="truncate">{item.rotulo}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Rodapé com Cartão do Usuário */}
        <div className="p-3 border-t border-[#B9BDB8]/30 bg-white">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#F7F8F6] hover:bg-[#E4EADF]/50 transition-colors">
            <NavLink
              to="/configuracoes"
              className="flex items-center gap-2.5 min-w-0 flex-1 group"
              title="Ir para Configurações"
            >
              {renderMonogramaOuFoto('sm')}
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-[#2C3A2C] truncate group-hover:text-[#8A9A83]">
                  {nomeProfissional}
                </span>
                <span className="text-[11px] text-[#4A4A48]/80 truncate">{cargoProfissional}</span>
              </div>
            </NavLink>

            <div className="flex items-center gap-1 shrink-0 ml-1">
              <NavLink
                to="/configuracoes"
                title="Configurações"
                className="p-1.5 text-[#4A4A48] hover:text-[#8A9A83] hover:bg-white rounded-md transition-colors"
              >
                <Settings className="w-4 h-4" />
              </NavLink>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    title="Sair"
                    className="p-1.5 text-[#4A4A48] hover:text-[#C45545] hover:bg-white rounded-md transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-[#2C3A2C]">
                      Deseja sair da sua conta?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-[#4A4A48]">
                      Você precisará informar seu e-mail e senha para acessar o consultório
                      novamente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-lg">Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleLogout}
                      className="bg-[#C45545] hover:bg-[#B04535] text-white rounded-lg"
                    >
                      Sair da conta
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </aside>

      {/* Drawer Mobile */}
      {menuAberto && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs animate-fade-in"
            onClick={() => setMenuAberto(false)}
          />
          <div className="relative w-[280px] bg-white h-full flex flex-col z-10 shadow-2xl animate-slide-up">
            <div className="p-5 flex items-center justify-between border-b border-[#B9BDB8]/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#C8845F] text-white flex items-center justify-center font-bold text-sm">
                  {monograma}
                </div>
                <div>
                  <h3 className="font-bold text-xs text-[#2C3A2C] leading-snug truncate max-w-[150px]">
                    {nomeProfissional}
                  </h3>
                  <p className="text-[11px] text-[#8A9A83]">{cargoProfissional}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMenuAberto(false)}
                className="p-1.5 text-[#4A4A48] hover:bg-[#F7F8F6] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 px-3 space-y-1">
              {itensMenu.map((item) => {
                const Icone = item.icone
                const ativo = location.pathname === item.rota
                return (
                  <NavLink
                    key={item.rota}
                    to={item.rota}
                    onClick={() => setMenuAberto(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      ativo ? 'bg-[#E4EADF] text-[#3A4A3A]' : 'text-[#4A4A48] hover:bg-[#F7F8F6]'
                    }`}
                  >
                    <Icone
                      className={`w-5 h-5 ${ativo ? 'text-[#8A9A83]' : 'text-[#8A9A83]/70'}`}
                    />
                    <span>{item.rotulo}</span>
                  </NavLink>
                )
              })}
              <NavLink
                to="/configuracoes"
                onClick={() => setMenuAberto(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === '/configuracoes'
                    ? 'bg-[#E4EADF] text-[#3A4A3A]'
                    : 'text-[#4A4A48] hover:bg-[#F7F8F6]'
                }`}
              >
                <Settings className="w-5 h-5 text-[#8A9A83]/70" />
                <span>Configurações</span>
              </NavLink>
            </nav>

            <div className="p-4 border-t border-[#B9BDB8]/30">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium text-[#C45545] bg-[#FBE3DE] hover:bg-[#F5D5CE] rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair da conta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo Principal com Header */}
      <div className="flex-1 flex flex-col md:pl-[260px] min-w-0">
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#B9BDB8]/30 px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuAberto(true)}
              className="md:hidden p-2 text-[#4A4A48] hover:bg-[#F7F8F6] rounded-lg border border-[#B9BDB8]/50"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#2C3A2C] tracking-tight">
                {tituloPagina}
              </h1>
              <p className="text-xs sm:text-sm text-[#8A9A83] font-medium hidden sm:block">
                {formatarDataExtensa()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden lg:block">
              <p className="text-xs font-semibold text-[#2C3A2C] leading-none">
                {nomeProfissional}
              </p>
              <p className="text-[11px] text-[#8A9A83] mt-1">{cargoProfissional}</p>
            </div>
            <NavLink to="/configuracoes" className="hover:opacity-90 transition-opacity">
              {renderMonogramaOuFoto('sm')}
            </NavLink>
          </div>
        </header>

        {/* Viewport da Página */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
