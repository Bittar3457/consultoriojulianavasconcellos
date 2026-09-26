import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, estaAutenticado } = useAuth()

  const [email, setEmail] = useState('julianasmithvss@gmail.com')
  const [senha, setSenha] = useState('Acapulco1436')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  // Se já autenticado, vai para a rota original ou /
  React.useEffect(() => {
    if (estaAutenticado) {
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [estaAutenticado, navigate, location])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    try {
      await login(email.trim(), senha)
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/'
      navigate(from, { replace: true })
    } catch {
      setErro('E-mail ou senha incorretos. Por favor, verifique suas credenciais de acesso.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-[#F7F8F6]">
      {/* Coluna Esquerda: Visual Acolhedor (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#E4EADF] via-white to-[#F6E8DF] p-12 flex-col justify-between overflow-hidden border-r border-[#B9BDB8]/30">
        <div className="flex items-center gap-3 z-10">
          <div className="w-12 h-12 rounded-2xl bg-[#C8845F] text-white flex items-center justify-center font-bold text-lg shadow-sm">
            JV
          </div>
          <div>
            <h1 className="font-bold text-base text-[#2C3A2C]">Juliana T A S Vasconcellos</h1>
            <p className="text-xs text-[#8A9A83] font-medium">Psicóloga</p>
          </div>
        </div>

        <div className="max-w-md space-y-6 z-10 my-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-xs border border-[#8A9A83]/30 text-[#3A4A3A] text-xs font-semibold shadow-xs">
            <span>🌿</span>
            <span>Espaço Terapêutico e Clínico</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2C3A2C] leading-tight tracking-tight">
            Seu consultório, organizado com calma e precisão.
          </h2>
          <p className="text-sm text-[#4A4A48] leading-relaxed">
            Gestão integrada de prontuários clínicos, agenda de sessões presenciais e online, e
            controle financeiro seguro para sua prática psicológica.
          </p>
        </div>

        <div className="text-xs text-[#8A9A83] font-medium z-10">
          Sistema de Gestão Privada de Consultório © {new Date().getFullYear()}
        </div>

        {/* Efeitos de fundo decorativos suaves */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#8A9A83]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 -right-24 w-80 h-80 bg-[#C8845F]/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Coluna Direita: Formulário de Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-[#B9BDB8]/30 shadow-xs">
          {/* Topo no mobile para exibir monograma */}
          <div className="lg:hidden flex flex-col items-center text-center space-y-2 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-[#C8845F] text-white flex items-center justify-center font-bold text-xl shadow-sm">
              JV
            </div>
            <h1 className="font-bold text-lg text-[#2C3A2C]">Juliana T A S Vasconcellos</h1>
            <p className="text-xs text-[#8A9A83] font-medium">Psicóloga</p>
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-[#2C3A2C] tracking-tight">Bem-vinda de volta</h3>
            <p className="text-xs text-[#8A9A83]">
              Acesse sua conta para continuar a gestão do consultório.
            </p>
          </div>

          {erro && (
            <div className="p-3.5 rounded-xl bg-[#FBE3DE] border border-[#C45545]/20 text-xs text-[#C45545] font-medium animate-shake">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-xs font-semibold text-[#2C3A2C]">
                E-mail
              </Label>
              <div className="relative mt-1">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9A83]" />
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="exemplo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 rounded-xl border-[#B9BDB8]/50 text-sm focus-visible:ring-[#8A9A83]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="senha" className="text-xs font-semibold text-[#2C3A2C]">
                  Senha
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#8A9A83] hover:text-[#75846F] hover:underline font-medium"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative mt-1">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9A83]" />
                <Input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  required
                  placeholder="Sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="pl-10 pr-10 rounded-xl border-[#B9BDB8]/50 text-sm focus-visible:ring-[#8A9A83]"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#4A4A48]"
                  title={mostrarSenha ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={carregando}
              className="w-full mt-2 bg-[#8A9A83] hover:bg-[#75846F] text-white rounded-xl py-5 font-semibold text-sm shadow-xs flex items-center justify-center gap-2"
            >
              <span>{carregando ? 'Entrando...' : 'Entrar no Consultório'}</span>
              {!carregando && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          <div className="pt-4 border-t border-[#B9BDB8]/20 text-center">
            <p className="text-[11px] text-[#8A9A83]">
              Acesso restrito e criptografado com conformidade aos preceitos éticos e sigilo
              profissional.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
