import React, { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import pb from '@/lib/pocketbase/client'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')

    if (!token) {
      setErro('Token de redefinição não encontrado ou expirado.')
      return
    }

    if (password.length < 8) {
      setErro('A senha deve conter no mínimo 8 caracteres.')
      return
    }

    if (password !== passwordConfirm) {
      setErro('As senhas não coincidem.')
      return
    }

    try {
      setCarregando(true)
      await pb.collection('users').confirmPasswordReset(token, password, passwordConfirm)
      setSucesso(true)
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch {
      setErro('Não foi possível redefinir a senha. O link pode ter expirado.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F7F8F6] p-6">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl border border-[#B9BDB8]/30 shadow-xs space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#C8845F] text-white flex items-center justify-center font-bold text-lg shadow-sm">
            JV
          </div>
          <h2 className="text-xl font-bold text-[#2C3A2C]">Redefinir Senha</h2>
          <p className="text-xs text-[#8A9A83]">
            Crie uma nova senha de acesso segura para sua conta.
          </p>
        </div>

        {sucesso ? (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#DFF0EB] text-[#2E7D6B] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-[#2C3A2C]">Senha alterada com sucesso!</p>
            <p className="text-xs text-[#8A9A83]">
              Redirecionando você para o login em instantes...
            </p>
            <Link
              to="/login"
              className="inline-block mt-3 px-4 py-2 rounded-xl bg-[#8A9A83] text-white text-xs font-semibold"
            >
              Ir para o Login agora
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {erro && (
              <div className="p-3 rounded-xl bg-[#FBE3DE] text-xs text-[#C45545] font-medium">
                {erro}
              </div>
            )}

            <div>
              <Label htmlFor="password" className="text-xs font-semibold text-[#2C3A2C]">
                Nova senha (mínimo 8 caracteres)
              </Label>
              <div className="relative mt-1">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9A83]" />
                <Input
                  id="password"
                  type={mostrarSenha ? 'text' : 'password'}
                  required
                  placeholder="Nova senha segura"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 rounded-xl border-[#B9BDB8]/50 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#4A4A48]"
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="passwordConfirm" className="text-xs font-semibold text-[#2C3A2C]">
                Confirmar nova senha
              </Label>
              <div className="relative mt-1">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9A83]" />
                <Input
                  id="passwordConfirm"
                  type={mostrarSenha ? 'text' : 'password'}
                  required
                  placeholder="Repita a nova senha"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="pl-10 rounded-xl border-[#B9BDB8]/50 text-sm"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={carregando}
              className="w-full bg-[#8A9A83] hover:bg-[#75846F] text-white rounded-xl py-5 font-semibold text-sm shadow-xs"
            >
              {carregando ? 'Salvando...' : 'Salvar Nova Senha'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
