import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import pb from '@/lib/pocketbase/client'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    try {
      await pb.collection('users').requestPasswordReset(email.trim())
      setEnviado(true)
    } catch {
      setErro('Não foi possível enviar o link. Verifique se o e-mail está cadastrado.')
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
          <h2 className="text-xl font-bold text-[#2C3A2C]">Recuperar Senha</h2>
          <p className="text-xs text-[#8A9A83]">
            Informe o e-mail cadastrado para receber as instruções de recuperação.
          </p>
        </div>

        {enviado ? (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#DFF0EB] text-[#2E7D6B] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-[#2C3A2C]">
              Enviamos um link de recuperação para seu e-mail.
            </p>
            <p className="text-xs text-[#8A9A83]">
              Verifique sua caixa de entrada e a pasta de spam. O link expira em alguns minutos.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#8A9A83] hover:text-[#75846F] mt-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para o login</span>
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
              <Label htmlFor="email" className="text-xs font-semibold text-[#2C3A2C]">
                E-mail cadastrado
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
                  className="pl-10 rounded-xl border-[#B9BDB8]/50 text-sm"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={carregando}
              className="w-full bg-[#8A9A83] hover:bg-[#75846F] text-white rounded-xl py-5 font-semibold text-sm shadow-xs"
            >
              {carregando ? 'Enviando...' : 'Enviar link de recuperação'}
            </Button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-[#8A9A83] hover:text-[#75846F] font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar ao login</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
