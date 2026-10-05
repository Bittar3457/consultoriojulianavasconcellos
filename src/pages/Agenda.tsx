import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Video,
  MapPin,
  Calendar as CalendarIcon,
  Trash2,
  Edit2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { listarPacientes } from '@/services/pacientes'
import {
  listarConsultas,
  criarConsulta,
  atualizarConsulta,
  excluirConsulta,
} from '@/services/consultas'
import { formatarDataAbreviada } from '@/lib/formatters'
import { Link } from 'react-router-dom'
import { useRealtime } from '@/hooks/use-realtime'
import { HORARIOS_PADRAO_CONSULTORIO } from '@/services/preferencias'
import type {
  Consulta,
  Paciente,
  ModalidadeConsulta,
  StatusConsulta,
  DiaSemanaChave,
  HorariosAtendimentoSemana,
} from '@/types'

const DIAS_SEMANA_MAP: { chave: DiaSemanaChave; nome: string }[] = [
  { chave: 'segunda', nome: 'Segunda' },
  { chave: 'terca', nome: 'Terça' },
  { chave: 'quarta', nome: 'Quarta' },
  { chave: 'quinta', nome: 'Quinta' },
  { chave: 'sexta', nome: 'Sexta' },
  { chave: 'sabado', nome: 'Sábado' },
  { chave: 'domingo', nome: 'Domingo' },
]

export default function AgendaPage() {
  const { preferencias } = useAuth()
  const [visualizacao, setVisualizacao] = useState<'dia' | 'semana'>('dia')
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date())
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [carregando, setCarregando] = useState(true)

  // Modal Consulta
  const [modalAberto, setModalAberto] = useState(false)
  const [consultaEditando, setConsultaEditando] = useState<Consulta | null>(null)
  const [pacienteId, setPacienteId] = useState('')
  const [dataConsulta, setDataConsulta] = useState('')
  const [horaInicio, setHoraInicio] = useState('10:00')
  const [duracaoMinutos, setDuracaoMinutos] = useState(50)
  const [modalidade, setModalidade] = useState<ModalidadeConsulta>('Mista')
  const [status, setStatus] = useState<StatusConsulta>('Agendada')
  const [observacoes, setObservacoes] = useState('')
  const [valorTotal, setValorTotal] = useState<number>(220)
  const [salvando, setSalvando] = useState(false)

  // Exclusão
  const [consultaExcluir, setConsultaExcluir] = useState<Consulta | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  // Carregar dados
  const carregar = useCallback(async () => {
    try {
      setCarregando(true)
      const pacs = await listarPacientes()
      setPacientes(pacs)

      // Definir limites de busca dependendo da visualização
      let inicioStr: string
      let fimStr: string

      if (visualizacao === 'dia') {
        const d = new Date(dataSelecionada)
        inicioStr = d.toISOString().split('T')[0]
        fimStr = inicioStr
      } else {
        // Semana: segunda a domingo
        const d = new Date(dataSelecionada)
        const dayOfWeek = d.getDay() // 0 é domingo, 1 é segunda
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
        const monday = new Date(d)
        monday.setDate(d.getDate() + diffToMonday)
        const sunday = new Date(monday)
        sunday.setDate(monday.getDate() + 6)

        inicioStr = monday.toISOString().split('T')[0]
        fimStr = sunday.toISOString().split('T')[0]
      }

      const lista = await listarConsultas({
        dataInicio: inicioStr,
        dataFim: fimStr,
      })
      setConsultas(lista)
    } catch {
      toast.error('Erro ao carregar consultas da agenda.')
    } finally {
      setCarregando(false)
    }
  }, [visualizacao, dataSelecionada])

  useEffect(() => {
    carregar()
  }, [carregar])

  useRealtime('consultas', () => carregar())

  // Obter chave do dia da semana a partir de uma data (0 = domingo, 1 = segunda, etc.)
  const obterChaveDiaSemana = useCallback((d: Date): DiaSemanaChave => {
    const day = d.getDay() // 0 = dom, 1 = seg, 2 = ter, 3 = qua, 4 = qui, 5 = sex, 6 = sab
    switch (day) {
      case 1:
        return 'segunda'
      case 2:
        return 'terca'
      case 3:
        return 'quarta'
      case 4:
        return 'quinta'
      case 5:
        return 'sexta'
      case 6:
        return 'sabado'
      case 0:
      default:
        return 'domingo'
    }
  }, [])

  // Mapa de horários configurados no sistema ou default
  const horariosConfigurados: HorariosAtendimentoSemana = useMemo(() => {
    if (
      preferencias?.horarios_atendimento &&
      Object.keys(preferencias.horarios_atendimento).length > 0
    ) {
      return preferencias.horarios_atendimento
    }
    return HORARIOS_PADRAO_CONSULTORIO
  }, [preferencias?.horarios_atendimento])

  // Configuração para o dia atualmente selecionado na visualização 'dia'
  const chaveDiaAtual = useMemo(
    () => obterChaveDiaSemana(dataSelecionada),
    [dataSelecionada, obterChaveDiaSemana],
  )
  const configDiaAtual = useMemo(() => {
    return horariosConfigurados[chaveDiaAtual] || { ativo: false, horarios: [] }
  }, [horariosConfigurados, chaveDiaAtual])

  // Lista de horários a serem renderizados no dia selecionado.
  // Se houver consultas agendadas em horários que não constam mais na grade (ex: antigas ou extraordinárias),
  // incluí-los também para que a psicóloga não perca a visualização dessas consultas existentes!
  const horariosDoDiaVisualizacao = useMemo(() => {
    const dataAtualStr = dataSelecionada.toISOString().split('T')[0]
    const consultasNesteDia = consultas.filter((c) => c.data.startsWith(dataAtualStr))

    const setHorarios = new Set<string>(configDiaAtual.ativo ? configDiaAtual.horarios : [])
    consultasNesteDia.forEach((c) => {
      if (c.hora_inicio) setHorarios.add(c.hora_inicio)
    })

    return Array.from(setHorarios).sort((a, b) => {
      const [hA, mA] = a.split(':').map(Number)
      const [hB, mB] = b.split(':').map(Number)
      return hA * 60 + mA - (hB * 60 + mB)
    })
  }, [dataSelecionada, configDiaAtual, consultas])

  // Navegação de datas
  const irParaHoje = () => {
    setDataSelecionada(new Date())
  }

  const avancarPeriodo = () => {
    const nova = new Date(dataSelecionada)
    if (visualizacao === 'dia') {
      nova.setDate(nova.getDate() + 1)
    } else {
      nova.setDate(nova.getDate() + 7)
    }
    setDataSelecionada(nova)
  }

  const retrocederPeriodo = () => {
    const nova = new Date(dataSelecionada)
    if (visualizacao === 'dia') {
      nova.setDate(nova.getDate() - 1)
    } else {
      nova.setDate(nova.getDate() - 7)
    }
    setDataSelecionada(nova)
  }

  // Abertura de Modal
  const abrirModalNovo = (horaPrevia?: string, dataPrevia?: string) => {
    setConsultaEditando(null)
    setPacienteId(pacientes.length > 0 ? pacientes[0].id : '')
    setDataConsulta(dataPrevia || dataSelecionada.toISOString().split('T')[0])
    setHoraInicio(horaPrevia || '10:00')
    setDuracaoMinutos(50)
    setModalidade(preferencias?.modalidade_padrao || 'Mista')
    setStatus('Agendada')
    setObservacoes('')
    setValorTotal(preferencias?.valor_padrao_sessao || 220)
    setModalAberto(true)
  }

  const abrirModalEditar = (c: Consulta) => {
    setConsultaEditando(c)
    setPacienteId(c.paciente_id)
    setDataConsulta(c.data.split('T')[0])
    setHoraInicio(c.hora_inicio)
    setDuracaoMinutos(c.duracao_minutos || 50)
    setModalidade(c.modalidade || 'Mista')
    setStatus(c.status || 'Agendada')
    setObservacoes(c.observacoes || '')
    setValorTotal(c.valor_total || preferencias?.valor_padrao_sessao || 220)
    setModalAberto(true)
  }

  const salvarConsulta = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pacienteId) {
      toast.error('Selecione um paciente para a consulta.')
      return
    }

    try {
      setSalvando(true)
      if (consultaEditando) {
        await atualizarConsulta(consultaEditando.id, {
          paciente_id: pacienteId,
          data: dataConsulta,
          hora_inicio: horaInicio,
          duracao_minutos: duracaoMinutos,
          modalidade,
          status,
          observacoes,
          valor_total: valorTotal,
        })
        toast.success('Consulta atualizada com sucesso!')
      } else {
        await criarConsulta({
          paciente_id: pacienteId,
          data: dataConsulta,
          hora_inicio: horaInicio,
          duracao_minutos: duracaoMinutos,
          modalidade,
          status,
          observacoes,
          valor_total: valorTotal,
          criar_pagamento: true,
        })
        toast.success('Consulta agendada com sucesso!')
      }

      setModalAberto(false)
      carregar()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao agendar consulta.'
      toast.error(msg)
    } finally {
      setSalvando(false)
    }
  }

  const confirmarExclusao = async () => {
    if (!consultaExcluir) return
    try {
      setExcluindo(true)
      await excluirConsulta(consultaExcluir.id)
      toast.success('Consulta cancelada e excluída.')
      setConsultaExcluir(null)
      carregar()
    } catch {
      toast.error('Erro ao excluir consulta.')
    } finally {
      setExcluindo(false)
    }
  }

  // Dias da semana corrente para o grid semanal
  const diasDaSemana = useMemo(() => {
    const d = new Date(dataSelecionada)
    const dayOfWeek = d.getDay()
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(d)
    monday.setDate(d.getDate() + diffToMonday)

    const dias = []
    for (let i = 0; i < 7; i++) {
      const current = new Date(monday)
      current.setDate(monday.getDate() + i)
      const chave = DIAS_SEMANA_MAP[i].chave
      const config = horariosConfigurados[chave] || { ativo: false, horarios: [] }

      dias.push({
        data: current,
        dataStr: current.toISOString().split('T')[0],
        diaSemanaNome: DIAS_SEMANA_MAP[i].nome,
        chave,
        config,
        numeroDia: current.getDate(),
        ehHoje: current.toDateString() === new Date().toDateString(),
      })
    }
    return dias
  }, [dataSelecionada, horariosConfigurados])

  const formatarCabecalhoPeriodo = () => {
    const mesAno = dataSelecionada.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    if (visualizacao === 'dia') {
      return `${dataSelecionada.toLocaleDateString('pt-BR', { weekday: 'long' })}, ${dataSelecionada.getDate()} de ${mesAno}`
    }
    const inicio = diasDaSemana[0].numeroDia
    const fim = diasDaSemana[6].numeroDia
    return `${inicio} a ${fim} de ${mesAno}`
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Barra de Navegação e Controles */}
      <div className="bg-white rounded-2xl border border-[#B9BDB8]/30 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Controles de Período */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={retrocederPeriodo}
            className="rounded-xl border-[#B9BDB8]/40 h-9 w-9 p-0"
            title="Período anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={irParaHoje}
            className="rounded-xl border-[#B9BDB8]/40 text-xs font-semibold px-3 h-9 text-[#2C3A2C]"
          >
            Hoje
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={avancarPeriodo}
            className="rounded-xl border-[#B9BDB8]/40 h-9 w-9 p-0"
            title="Próximo período"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          <span className="ml-2 font-bold text-sm sm:text-base text-[#2C3A2C] capitalize">
            {formatarCabecalhoPeriodo()}
          </span>
        </div>

        {/* Toggle Dia/Semana e Botão Nova Consulta */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="bg-[#F7F8F6] p-1 rounded-xl border border-[#B9BDB8]/30 flex items-center">
            <button
              type="button"
              onClick={() => setVisualizacao('dia')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                visualizacao === 'dia'
                  ? 'bg-white text-[#2C3A2C] shadow-xs'
                  : 'text-[#8A9A83] hover:text-[#2C3A2C]'
              }`}
            >
              Dia
            </button>
            <button
              type="button"
              onClick={() => setVisualizacao('semana')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                visualizacao === 'semana'
                  ? 'bg-white text-[#2C3A2C] shadow-xs'
                  : 'text-[#8A9A83] hover:text-[#2C3A2C]'
              }`}
            >
              Semana
            </button>
          </div>

          <Button
            onClick={() => abrirModalNovo()}
            className="bg-[#8A9A83] hover:bg-[#75846F] text-white rounded-xl gap-2 shadow-xs shrink-0 text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Consulta</span>
          </Button>
        </div>
      </div>

      {/* Visualização de Dia */}
      {visualizacao === 'dia' && (
        <div className="bg-white rounded-2xl border border-[#B9BDB8]/30 shadow-xs p-4 sm:p-6">
          {!configDiaAtual.ativo && horariosDoDiaVisualizacao.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E4EADF] text-[#8A9A83] flex items-center justify-center mx-auto text-xl">
                ☕
              </div>
              <h3 className="text-base font-bold text-[#2C3A2C]">
                Sem atendimento configurado neste dia
              </h3>
              <p className="text-xs text-[#8A9A83] max-w-sm mx-auto">
                Este dia da semana está marcado como sem atendimento nas suas configurações de
                horários livres.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  onClick={() =>
                    abrirModalNovo('09:00', dataSelecionada.toISOString().split('T')[0])
                  }
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-[#B9BDB8]/50 text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Agendar consulta extraordinária
                </Button>
                <Link to="/configuracoes">
                  <Button
                    size="sm"
                    className="bg-[#8A9A83] hover:bg-[#75846F] text-white rounded-xl text-xs"
                  >
                    Editar horários do dia
                  </Button>
                </Link>
              </div>
            </div>
          ) : horariosDoDiaVisualizacao.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Clock className="w-10 h-10 text-[#8A9A83]/50 mx-auto" />
              <h3 className="text-base font-bold text-[#2C3A2C]">
                Nenhum horário livre cadastrado para este dia
              </h3>
              <p className="text-xs text-[#8A9A83] max-w-sm mx-auto">
                O dia está ativo, mas não possui horários cadastrados. Defina seus horários livres
                nas Configurações do sistema.
              </p>
              <Link to="/configuracoes" className="inline-block mt-2">
                <Button
                  size="sm"
                  className="bg-[#8A9A83] hover:bg-[#75846F] text-white rounded-xl text-xs"
                >
                  Configurar horários agora
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#B9BDB8]/20">
              {horariosDoDiaVisualizacao.map((hora) => {
                const dataAtualStr = dataSelecionada.toISOString().split('T')[0]
                const consultasNesteHorario = consultas.filter(
                  (c) => c.data.startsWith(dataAtualStr) && c.hora_inicio === hora,
                )

                return (
                  <div
                    key={hora}
                    className="py-3 flex flex-col sm:flex-row sm:items-center gap-3 group hover:bg-[#F7F8F6]/40 px-3 rounded-xl transition-colors"
                  >
                    {/* Rótulo de Hora */}
                    <div className="w-16 shrink-0 flex items-center gap-1.5 text-xs font-bold text-[#8A9A83]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{hora}</span>
                    </div>

                    {/* Conteúdo do Horário */}
                    <div className="flex-1">
                      {consultasNesteHorario.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => abrirModalNovo(hora, dataAtualStr)}
                          className="w-full py-2 px-3 border border-dashed border-[#B9BDB8]/40 hover:border-[#8A9A83] rounded-xl text-left text-xs text-gray-400 hover:text-[#8A9A83] flex items-center justify-between transition-colors opacity-70 hover:opacity-100"
                        >
                          <span>Horário disponível para agendamento ({hora})</span>
                          <Plus className="w-4 h-4" />
                        </button>
                      ) : (
                        <div className="space-y-2">
                          {consultasNesteHorario.map((c) => {
                            const pacienteNome =
                              c.expand?.paciente_id?.nome || 'Paciente não identificado'
                            return (
                              <div
                                key={c.id}
                                className="bg-[#E4EADF]/60 border-l-4 border-[#3A4A3A] p-3.5 rounded-r-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-xs transition-shadow cursor-pointer"
                                onClick={() => abrirModalEditar(c)}
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-[#2C3A2C]">
                                      {pacienteNome}
                                    </span>
                                    <span className="text-xs text-[#8A9A83] font-medium">
                                      ({c.duracao_minutos} min)
                                    </span>
                                  </div>
                                  {c.observacoes && (
                                    <p className="text-xs text-[#4A4A48] mt-1 line-clamp-1">
                                      {c.observacoes}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span
                                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                      c.modalidade === 'Online'
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'bg-white text-[#2C3A2C]'
                                    }`}
                                  >
                                    {c.modalidade === 'Online' ? (
                                      <Video className="w-3 h-3" />
                                    ) : (
                                      <MapPin className="w-3 h-3" />
                                    )}
                                    {c.modalidade}
                                  </span>

                                  <span
                                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                                      c.status === 'Confirmada'
                                        ? 'bg-[#DFF0EB] text-[#2E7D6B]'
                                        : c.status === 'Realizada'
                                          ? 'bg-gray-200 text-gray-700'
                                          : 'bg-[#FBF0D6] text-[#E5A93D]'
                                    }`}
                                  >
                                    {c.status}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setConsultaExcluir(c)
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-[#C45545] rounded-lg hover:bg-white transition-colors ml-1"
                                    title="Cancelar consulta"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Visualização de Semana */}
      {visualizacao === 'semana' && (
        <div className="bg-white rounded-2xl border border-[#B9BDB8]/30 shadow-xs overflow-hidden">
          {/* Cabeçalho dos 7 dias */}
          <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-[#B9BDB8]/20 bg-[#F7F8F6] border-b border-[#B9BDB8]/30 text-center text-xs font-semibold">
            {diasDaSemana.map((dia) => (
              <div
                key={dia.dataStr}
                className={`py-3 px-2 ${
                  dia.ehHoje ? 'bg-[#E4EADF]/60 text-[#3A4A3A]' : 'text-[#4A4A48]'
                }`}
              >
                <span className="block text-[11px] uppercase tracking-wider">
                  {dia.diaSemanaNome}
                </span>
                <span className="text-base font-bold text-[#2C3A2C] mt-0.5 inline-block">
                  {dia.numeroDia}
                </span>
              </div>
            ))}
          </div>

          {/* Grade de Consultas da Semana */}
          <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-[#B9BDB8]/20 min-h-[450px]">
            {diasDaSemana.map((dia) => {
              const consultasDoDia = consultas.filter((c) => c.data.startsWith(dia.dataStr))
              const estaAtivo = dia.config.ativo
              const primeiroHorario = dia.config.horarios[0] || '10:00'

              return (
                <div
                  key={dia.dataStr}
                  className={`p-2.5 flex flex-col justify-between ${
                    dia.ehHoje ? 'bg-[#E4EADF]/15' : !estaAtivo ? 'bg-gray-50/50' : ''
                  }`}
                >
                  <div className="space-y-2">
                    {!estaAtivo && consultasDoDia.length === 0 && (
                      <div className="p-3 text-center my-auto">
                        <span className="text-[11px] text-gray-400 italic block">
                          Sem atendimento
                        </span>
                      </div>
                    )}

                    {consultasDoDia.map((c) => {
                      const pacienteNome =
                        c.expand?.paciente_id?.nome || 'Paciente não identificado'
                      return (
                        <div
                          key={c.id}
                          onClick={() => abrirModalEditar(c)}
                          className="bg-[#E4EADF]/70 border-l-3 border-[#3A4A3A] p-2 rounded-r-lg hover:shadow-xs transition-shadow cursor-pointer text-left"
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold text-[#3A4A3A]">
                            <span>{c.hora_inicio}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded-sm ${
                                c.status === 'Confirmada'
                                  ? 'bg-[#DFF0EB] text-[#2E7D6B]'
                                  : 'bg-[#FBF0D6] text-[#E5A93D]'
                              }`}
                            >
                              {c.status}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-[#2C3A2C] mt-1 truncate">
                            {pacienteNome}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-[#8A9A83] mt-0.5">
                            {c.modalidade === 'Online' ? (
                              <Video className="w-2.5 h-2.5" />
                            ) : (
                              <MapPin className="w-2.5 h-2.5" />
                            )}
                            <span>{c.modalidade}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => abrirModalNovo(primeiroHorario, dia.dataStr)}
                    className="mt-3 w-full py-1.5 border border-dashed border-[#B9BDB8]/50 hover:border-[#8A9A83] rounded-lg text-[11px] text-gray-400 hover:text-[#8A9A83] flex items-center justify-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{estaAtivo ? 'Agendar' : 'Agendar extra'}</span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal Formulário Consulta */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-lg bg-white rounded-2xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#2C3A2C]">
              {consultaEditando ? 'Detalhes da Consulta' : 'Nova Consulta'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={salvarConsulta} className="space-y-4 mt-2">
            <div>
              <Label htmlFor="paciente" className="text-xs font-semibold text-[#2C3A2C]">
                Paciente *
              </Label>
              <select
                id="paciente"
                value={pacienteId}
                onChange={(e) => setPacienteId(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-[#F7F8F6] border border-[#B9BDB8]/50 rounded-xl text-sm font-medium text-[#2C3A2C] focus:outline-hidden focus:ring-2 focus:ring-[#8A9A83]"
                required
              >
                <option value="" disabled>
                  Selecione um paciente...
                </option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data" className="text-xs font-semibold text-[#2C3A2C]">
                  Data do atendimento *
                </Label>
                <Input
                  id="data"
                  type="date"
                  value={dataConsulta}
                  onChange={(e) => setDataConsulta(e.target.value)}
                  className="mt-1 rounded-xl border-[#B9BDB8]/50"
                  required
                />
              </div>

              <div>
                <Label htmlFor="hora" className="text-xs font-semibold text-[#2C3A2C]">
                  Horário de início *
                </Label>
                <Input
                  id="hora"
                  type="time"
                  step="300"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="mt-1 rounded-xl border-[#B9BDB8]/50 text-sm font-semibold"
                  required
                />
                <p className="text-[10px] text-[#8A9A83] mt-1">
                  Permite qualquer horário (ex.: 08:30, 09:15, 14:45).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="duracao" className="text-xs font-semibold text-[#2C3A2C]">
                  Duração
                </Label>
                <select
                  id="duracao"
                  value={duracaoMinutos}
                  onChange={(e) => setDuracaoMinutos(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-2 bg-white border border-[#B9BDB8]/50 rounded-xl text-sm font-medium text-[#2C3A2C]"
                >
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={50}>50 minutos (padrão)</option>
                  <option value={60}>60 minutos</option>
                </select>
              </div>

              <div>
                <Label htmlFor="modalidade" className="text-xs font-semibold text-[#2C3A2C]">
                  Modalidade
                </Label>
                <select
                  id="modalidade"
                  value={modalidade}
                  onChange={(e) => setModalidade(e.target.value as ModalidadeConsulta)}
                  className="mt-1 w-full px-3 py-2 bg-white border border-[#B9BDB8]/50 rounded-xl text-sm font-medium text-[#2C3A2C]"
                >
                  <option value="Presencial">Presencial</option>
                  <option value="Online">Online</option>
                  <option value="Mista">Mista</option>
                </select>
              </div>

              <div>
                <Label htmlFor="status" className="text-xs font-semibold text-[#2C3A2C]">
                  Status
                </Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusConsulta)}
                  className="mt-1 w-full px-3 py-2 bg-white border border-[#B9BDB8]/50 rounded-xl text-sm font-medium text-[#2C3A2C]"
                >
                  <option value="Agendada">Agendada</option>
                  <option value="Confirmada">Confirmada</option>
                  <option value="Realizada">Realizada</option>
                  <option value="Faltou">Faltou</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="valor" className="text-xs font-semibold text-[#2C3A2C]">
                Valor da sessão (R$)
              </Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={valorTotal}
                onChange={(e) => setValorTotal(Number(e.target.value))}
                className="mt-1 rounded-xl border-[#B9BDB8]/50"
              />
              <p className="text-[11px] text-[#8A9A83] mt-1">
                Gera registro de pagamento automaticamente no módulo financeiro.
              </p>
            </div>

            <div>
              <Label htmlFor="obs" className="text-xs font-semibold text-[#2C3A2C]">
                Observações
              </Label>
              <Textarea
                id="obs"
                rows={2}
                placeholder="Link da chamada de vídeo, sala do consultório, lembretes..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="mt-1 rounded-xl border-[#B9BDB8]/50 text-sm resize-none"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalAberto(false)}
                className="rounded-xl border-[#B9BDB8]/50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={salvando}
                className="bg-[#8A9A83] hover:bg-[#75846F] text-white rounded-xl"
              >
                {salvando ? 'Salvando...' : 'Salvar Consulta'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog
        open={!!consultaExcluir}
        onOpenChange={(aberto) => !aberto && setConsultaExcluir(null)}
      >
        <AlertDialogContent className="bg-white rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-[#2C3A2C]">
              Cancelar e remover consulta?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#4A4A48]">
              Esta consulta agendada para {formatarDataAbreviada(consultaExcluir?.data)} às{' '}
              {consultaExcluir?.hora_inicio} será desmarcada e removida da agenda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              disabled={excluindo}
              className="bg-[#C45545] hover:bg-[#B04535] text-white rounded-xl"
            >
              {excluindo ? 'Removendo...' : 'Sim, cancelar consulta'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
