import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Calendar,
  CalendarCheck,
  DollarSign,
  ArrowRight,
  Clock,
  MapPin,
  Video,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import {
  obterSaudacao,
  formatarDataExtensa,
  formatarDataAbreviada,
  formatarMoeda,
} from '@/lib/formatters'
import { obterProximasConsultas } from '@/services/consultas'
import { listarPacientes } from '@/services/pacientes'
import { listarPagamentos } from '@/services/pagamentos'
import { useRealtime } from '@/hooks/use-realtime'
import type { Consulta } from '@/types'

export default function Index() {
  const { preferencias, obterAvatarUrl } = useAuth()
  const [carregando, setCarregando] = useState(true)
  const [proximasConsultas, setProximasConsultas] = useState<Consulta[]>([])
  const [totalPacientes, setTotalPacientes] = useState(0)
  const [consultasHoje, setConsultasHoje] = useState(0)
  const [consultasSemana, setConsultasSemana] = useState(0)
  const [faturamentoMes, setFaturamentoMes] = useState(0)

  const nomeProfissional = preferencias?.nome_profissional || 'Juliana T A S Vasconcellos'
  const monograma = preferencias?.monograma || 'JV'
  const avatarUrl = obterAvatarUrl()

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true)

      // 1. Pacientes
      const pacs = await listarPacientes()
      setTotalPacientes(pacs.length)

      // 2. Próximas 5 consultas
      const prox = await obterProximasConsultas(5)
      setProximasConsultas(prox)

      // 3. Consultas de hoje e da semana
      const hoje = new Date()
      const hojeStr = hoje.toISOString().split('T')[0]

      // Início e fim da semana (domingo a sábado)
      const diaSemana = hoje.getDay()
      const inicioSemana = new Date(hoje)
      inicioSemana.setDate(hoje.getDate() - diaSemana)
      inicioSemana.setHours(0, 0, 0, 0)
      const fimSemana = new Date(inicioSemana)
      fimSemana.setDate(inicioSemana.getDate() + 6)
      fimSemana.setHours(23, 59, 59, 999)

      const inicioSemanaStr = inicioSemana.toISOString().split('T')[0]
      const fimSemanaStr = fimSemana.toISOString().split('T')[0]

      const consultasSemanaLista = await pbConsultasPorPeriodo(inicioSemanaStr, fimSemanaStr)
      setConsultasSemana(consultasSemanaLista.length)

      const hojeLista = consultasSemanaLista.filter((c) => c.data.startsWith(hojeStr))
      setConsultasHoje(hojeLista.length)

      // 4. Faturamento do Mês
      const mesAtualStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
      const pagamentosMes = await listarPagamentos({ mesAno: mesAtualStr, status: 'Pago' })
      const soma = pagamentosMes.reduce((acc, p) => acc + (p.valor || 0), 0)
      setFaturamentoMes(soma)
    } catch {
      // continua
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Subscrições em tempo real para sincronizar
  useRealtime('consultas', () => carregarDados())
  useRealtime('pagamentos', () => carregarDados())
  useRealtime('pacientes', () => carregarDados())

  const primeiroNome = nomeProfissional.split(' ')[0] || 'Juliana'

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cartão de Saudação */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#B9BDB8]/30 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E4EADF] text-[#3A4A3A] text-xs font-semibold">
            <span>✨</span>
            <span>Painel do Consultório</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#2C3A2C] tracking-tight">
            {obterSaudacao()}, {primeiroNome}!
          </h2>
          <p className="text-sm text-[#8A9A83] font-medium">{formatarDataExtensa()}</p>
        </div>

        <div className="flex items-center gap-4 z-10 shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={nomeProfissional}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-[#8A9A83] shadow-sm"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#C8845F] text-white flex items-center justify-center font-bold text-2xl shadow-sm">
              {monograma}
            </div>
          )}
        </div>

        {/* Fundo decorativo sutil */}
        <div className="absolute right-0 top-0 w-72 h-full bg-gradient-to-l from-[#E4EADF]/30 to-transparent pointer-events-none" />
      </div>

      {/* Grid de Estatísticas (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Pacientes Atendidos */}
        <div className="bg-white p-6 rounded-2xl border border-[#B9BDB8]/30 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#4A4A48]">Pacientes Cadastrados</span>
            <div className="w-10 h-10 rounded-xl bg-[#E4EADF] text-[#8A9A83] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-[#2C3A2C]">
              {carregando ? '...' : totalPacientes}
            </span>
          </div>
          <p className="text-xs text-[#8A9A83] mt-2">Base ativa de pacientes</p>
        </div>

        {/* Card 2: Consultas Hoje */}
        <div className="bg-white p-6 rounded-2xl border border-[#B9BDB8]/30 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#4A4A48]">Consultas Hoje</span>
            <div className="w-10 h-10 rounded-xl bg-[#F6E8DF] text-[#C8845F] flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-[#C8845F]">
              {carregando ? '...' : consultasHoje}
            </span>
          </div>
          <p className="text-xs text-[#8A9A83] mt-2">Atendimentos previstos para hoje</p>
        </div>

        {/* Card 3: Consultas da Semana */}
        <div className="bg-white p-6 rounded-2xl border border-[#B9BDB8]/30 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#4A4A48]">Consultas da Semana</span>
            <div className="w-10 h-10 rounded-xl bg-[#DFF0EB] text-[#2E7D6B] flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-[#2E7D6B]">
              {carregando ? '...' : consultasSemana}
            </span>
          </div>
          <p className="text-xs text-[#8A9A83] mt-2">Sessões nesta semana corrente</p>
        </div>

        {/* Card 4: Faturamento do Mês */}
        <div className="bg-white p-6 rounded-2xl border border-[#B9BDB8]/30 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#4A4A48]">Faturamento do Mês</span>
            <div className="w-10 h-10 rounded-xl bg-[#FBF0D6] text-[#E5A93D] flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-bold text-[#2C3A2C] truncate block">
              {carregando ? '...' : formatarMoeda(faturamentoMes)}
            </span>
          </div>
          <p className="text-xs text-[#8A9A83] mt-2">Pagamentos recebidos neste mês</p>
        </div>
      </div>

      {/* Próximas Consultas */}
      <div className="bg-white rounded-2xl border border-[#B9BDB8]/30 shadow-xs p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-[#2C3A2C]">Próximas Consultas</h3>
            <p className="text-xs text-[#8A9A83]">Seus próximos atendimentos agendados</p>
          </div>
          <Link
            to="/agenda"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8A9A83] hover:text-[#75846F] hover:underline"
          >
            <span>Ver agenda completa</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {carregando ? (
          <div className="py-8 text-center text-sm text-[#8A9A83]">Carregando consultas...</div>
        ) : proximasConsultas.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-[#4A4A48] font-medium">Nenhuma consulta futura agendada.</p>
            <p className="text-xs text-[#8A9A83] mt-1">
              Acesse a agenda para marcar novos horários com seus pacientes.
            </p>
            <Link
              to="/agenda"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8A9A83] text-white text-xs font-semibold hover:bg-[#75846F] transition-colors"
            >
              Agendar consulta
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#B9BDB8]/20">
            {proximasConsultas.map((consulta) => {
              const pacienteNome = consulta.expand?.paciente_id?.nome || 'Paciente não identificado'
              return (
                <div
                  key={consulta.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F7F8F6] px-3 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#E4EADF] text-[#3A4A3A] flex items-center justify-center font-bold text-sm shrink-0">
                      {pacienteNome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#2C3A2C]">{pacienteNome}</h4>
                      <div className="flex items-center gap-3 text-xs text-[#8A9A83] mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatarDataAbreviada(consulta.data)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {consulta.hora_inicio} ({consulta.duracao_minutos} min)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                        consulta.modalidade === 'Online'
                          ? 'bg-blue-50 text-blue-700'
                          : consulta.modalidade === 'Presencial'
                            ? 'bg-[#E4EADF] text-[#3A4A3A]'
                            : 'bg-purple-50 text-purple-700'
                      }`}
                    >
                      {consulta.modalidade === 'Online' ? (
                        <Video className="w-3 h-3" />
                      ) : (
                        <MapPin className="w-3 h-3" />
                      )}
                      {consulta.modalidade}
                    </span>

                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        consulta.status === 'Confirmada'
                          ? 'bg-[#DFF0EB] text-[#2E7D6B]'
                          : consulta.status === 'Realizada'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-[#FBF0D6] text-[#E5A93D]'
                      }`}
                    >
                      {consulta.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// Auxiliar para busca de período sem quebrar
async function pbConsultasPorPeriodo(inicio: string, fim: string): Promise<Consulta[]> {
  try {
    const pb = (await import('@/lib/pocketbase/client')).default
    return await pb.collection('consultas').getFullList<Consulta>({
      filter: `data >= '${inicio}' && data <= '${fim}' && status != 'Cancelada'`,
      requestKey: null,
    })
  } catch {
    return []
  }
}
