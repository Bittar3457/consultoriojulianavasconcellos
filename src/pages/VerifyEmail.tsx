import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react'
import pb from '@/lib/pocketbase/client'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [status, setStatus] = useState<'verificando' | 'sucesso' | 'erro'>('verificando')
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    async function verificar() {
      if (!token) {
        setStatus('erro')
        setMensagem('Token de verificação ausente ou inválido.')
        return
      }

      try {
        await pb.collection('users').confirmVerification(token)
        setStatus('sucesso')
      } catch {
        setStatus('erro')
        setMensagem(
          'Não foi possível verificar a conta. O link pode ter expirado ou já ter sido utilizado.',
        )
      }
    }

    verificar()
  }, [token])

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F7F8F6] p-6">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl border border-[#B9BDB8]/30 shadow-xs space-y-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#C8845F] text-white flex items-center justify-center font-bold text-lg shadow-sm mx-auto">
          JV
        </div>

        {status === 'verificando' && (
          <div className="space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#8A9A83] mx-auto" />
            <h2 className="text-lg font-bold text-[#2C3A2C]">Confirmando e-mail...</h2>
            <p className="text-xs text-[#8A9A83]">
              Por favor aguarde enquanto validamos sua conta.
            </p>
          </div>
        )}

        {status === 'sucesso' && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#DFF0EB] text-[#2E7D6B] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-[#2C3A2C]">Conta verificada com sucesso!</h2>
            <p className="text-xs text-[#8A9A83]">
              Seu e-mail foi autenticado. Agora você pode acessar o consultório normalmente.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-[#8A9A83] hover:bg-[#75846F] text-white text-xs font-semibold shadow-xs"
            >
              <span>Acessar o Consultório</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {status === 'erro' && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#FBE3DE] text-[#C45545] mx-auto flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-[#2C3A2C]">Falha na verificação</h2>
            <p className="text-xs text-[#C45545]">{mensagem}</p>
            <Link
              to="/login"
              className="inline-block mt-2 text-xs font-semibold text-[#8A9A83] hover:underline"
            >
              Voltar para o Login
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
