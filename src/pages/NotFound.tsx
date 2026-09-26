import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F8F6] p-6 text-center">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-[#B9BDB8]/30 shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#C8845F] text-white flex items-center justify-center font-bold text-lg shadow-sm mx-auto">
          JV
        </div>
        <h1 className="text-4xl font-extrabold text-[#2C3A2C]">404</h1>
        <h2 className="text-base font-bold text-[#4A4A48]">Página não encontrada</h2>
        <p className="text-xs text-[#8A9A83]">O endereço acessado não existe ou foi movido.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8A9A83] hover:bg-[#75846F] text-white text-xs font-semibold shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Início</span>
        </Link>
      </div>
    </div>
  )
}
