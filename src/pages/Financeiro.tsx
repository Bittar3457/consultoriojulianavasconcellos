import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  Filter,
  PieChart as PieIcon,
  BarChart3,
  Edit2,
  Plus,
  Receipt,
  FileText,
  User,
  Trash2,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  listarPagamentos,
  marcarComoPago,
  atualizarPagamento,
  criarPagamento,
} from '@/services/pagamentos'
import { listarConsultas } from '@/services/consultas'
import { listarPacientes } from '@/services/pacientes'
import pb from '@/lib/pocketbase/client'
import { formatarMoeda, formatarDataAbreviada } from '@/lib/formatters'
import { useRealtime } from '@/hooks/use-realtime'
import type {
  Pagamento,
  FormaPagamento,
  StatusPagamento,
  TipoPagamento,
  Paciente,
  Consulta,
} from '@/types'

const CORES_PIE = ['#8A9A83', '#C8845F', '#2E7D6B', '#E5A93D', '#75846F']

export default function FinanceiroPage() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [consultasDoMes, setConsultasDoMes] = useState<Consulta[]>([])
  const [carregando, setCarregando] = useState(true)

  // Filtros
  const hoje = new Date()
  const mesAtualStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
  const [mesSelecionado, setMesSelecionado] = useState(mesAtualStr)
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')

  // Modal de Novo Pagamento (Avulso / Mensalidade)
  const [modalNovoAberto, setModalNovoAberto] = useState(false)
  const [novoTipo, setNovoTipo] = useState<TipoPagamento>('Mensal')
  const [novoPacienteId, setNovoPacienteId] = useState('')
  const [novaConsultaId, setNovaConsultaId] = useState('')
  const [novoMesReferencia, setNovoMesReferencia] = useState(mesSelecionado)
  const [novoValor, setNovoValor] = useState<number>(800)
  const [novoStatus, setNovoStatus] = useState<StatusPagamento>('Pendente')
  const [novaForma, setNovaForma] = useState<FormaPagamento>('Pix')
  const [novaDescricao, setNovaDescricao] = useState('')
  const [salvandoNovo, setSalvandoNovo] = useState(false)

  // Modal de Edição de Pagamento
  const [modalEditarAberto, setModalEditarAberto] = useState(false)
  const [pagamentoEditando, setPagamentoEditando] = useState<Pagamento | null>(null)
  const [valorEditado, setValorEditado] = useState<number>(0)
  const [statusEditado, setStatusEditado] = useState<StatusPagamento>('Pendente')
  const [formaEditada, setFormaEditada] = useState<FormaPagamento>('Pix')
  const [descricaoEditada, setDescricaoEditada] = useState('')
  const [mesRefEditado, setMesRefEditado] = useState('')
  const [salvando, setSalvando] = useState(false)

  // Consultas do mês para gráfico de modalidade e total de atendimentos
  const [totalAtendimentosMes, setTotalAtendimentosMes] = useState(0)
  const [modalidadesDistrib, setModalidadesDistrib] = useState<{ name: string; value: number }[]>(
    [],
  )

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true)

      const [pacs, lista] = await Promise.all([
        listarPacientes(),
        listarPagamentos({
          mesAno: mesSelecionado,
          status: filtroStatus,
        }),
      ])
      setPacientes(pacs)
      setPagamentos(lista)

      // Buscar consultas do mês para total de atendimentos e modalidade
      const [anoStr, mStr] = mesSelecionado.split('-')
      const ano = parseInt(anoStr, 10)
      const mes = parseInt(mStr, 10)
      const primeiroDia = `${anoStr}-${mStr}-01`
      const ultimoDia = new Date(ano, mes, 0).toISOString().split('T')[0]

      const consultasMes = await listarConsultas({
        dataInicio: primeiroDia,
        dataFim: ultimoDia,
      })
      setConsultasDoMes(consultasMes)

      const realizadas = consultasMes.filter((c) => c.status === 'Realizada')
      setTotalAtendimentosMes(realizadas.length)

      let presenciais = 0
      let online = 0
      for (const c of consultasMes) {
        if (c.modalidade === 'Presencial') presenciais++
        else if (c.modalidade === 'Online') online++
        else {
          presenciais++
        }
      }

      setModalidadesDistrib([
        { name: 'Presencial', value: presenciais || 1 },
        { name: 'Online', value: online || 1 },
      ])
    } catch {
      toast.error('Erro ao carregar dados financeiros.')
    } finally {
      setCarregando(false)
    }
  }, [mesSelecionado, filtroStatus])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  useRealtime('pagamentos', () => carregarDados())
  useRealtime('consultas', () => carregarDados())

  // Ações de Pagamento
  const handleMarcarComoPago = async (p: Pagamento) => {
    try {
      await marcarComoPago(p.id)
      toast.success('Pagamento confirmado com sucesso!')
      carregarDados()
    } catch {
      toast.error('Erro ao confirmar pagamento.')
    }
  }

  const abrirModalNovo = () => {
    setNovoTipo('Mensal')
    setNovoPacienteId(pacientes.length > 0 ? pacientes[0].id : '')
    setNovaConsultaId(consultasDoMes.length > 0 ? consultasDoMes[0].id : '')
    setNovoMesReferencia(mesSelecionado)
    setNovoValor(800)
    setNovoStatus('Pendente')
    setNovaForma('Pix')
    const [ano, mes] = mesSelecionado.split('-')
    const nomeMes = new Date(Number(ano), Number(mes) - 1).toLocaleDateString('pt-BR', {
      month: 'long',
    })
    setNovaDescricao(`Mensalidade de ${nomeMes}/${ano}`)
    setModalNovoAberto(true)
  }

  const salvarNovoPagamento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (novoTipo === 'Mensal' && !novoPacienteId) {
      toast.error('Selecione um paciente para registrar o pagamento mensal.')
      return
    }
    if (novoTipo === 'Consulta' && !novaConsultaId) {
      toast.error('Selecione uma consulta vinculada.')
      return
    }

    try {
      setSalvandoNovo(true)
      const dataPagamento = novoStatus === 'Pago' ? new Date().toISOString() : undefined

      const payload: Partial<Pagamento> = {
        tipo_pagamento: novoTipo,
        valor: novoValor,
        status: novoStatus,
        forma_pagamento: novaForma,
        descricao: novaDescricao.trim(),
        data_pagamento: dataPagamento,
      }

      if (novoTipo === 'Mensal') {
        payload.paciente_id = novoPacienteId
        payload.mes_referencia = novoMesReferencia
        payload.consulta_id = undefined
      } else {
        payload.consulta_id = novaConsultaId
        // Encontrar paciente da consulta para referência
        const c = consultasDoMes.find((item) => item.id === novaConsultaId)
        if (c?.paciente_id) {
          payload.paciente_id = c.paciente_id
        }
      }

      await criarPagamento(payload)
      toast.success(
        novoTipo === 'Mensal'
          ? 'Pagamento mensal registrado com sucesso!'
          : 'Pagamento por consulta registrado com sucesso!',
      )
      setModalNovoAberto(false)
      carregarDados()
    } catch {
      toast.error('Erro ao registrar novo pagamento.')
    } finally {
      setSalvandoNovo(false)
    }
  }

  const abrirModalEditar = (p: Pagamento) => {
    setPagamentoEditando(p)
    setValorEditado(p.valor || 0)
    setStatusEditado(p.status || 'Pendente')
    setFormaEditada(p.forma_pagamento || 'Pix')
    setDescricaoEditada(p.descricao || '')
    setMesRefEditado(p.mes_referencia || mesSelecionado)
    setModalEditarAberto(true)
  }

  const salvarEdicaoPagamento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pagamentoEditando) return
    try {
      setSalvando(true)
      const payload: Partial<Pagamento> = {
        valor: valorEditado,
        status: statusEditado,
        forma_pagamento: formaEditada,
        descricao: descricaoEditada.trim(),
      }

      if (pagamentoEditando.tipo_pagamento === 'Mensal') {
        payload.mes_referencia = mesRefEditado
      }

      if (statusEditado === 'Pago') {
        payload.data_pagamento = pagamentoEditando.data_pagamento || new Date().toISOString()
      } else {
        payload.data_pagamento = undefined
      }

      await atualizarPagamento(pagamentoEditando.id, payload)
      toast.success('Pagamento atualizado com sucesso!')
      setModalEditarAberto(false)
      carregarDados()
    } catch {
      toast.error('Erro ao atualizar pagamento.')
    } finally {
      setSalvando(false)
    }
  }

  const excluirPagamento = async (id: string) => {
    if (!confirm('Deseja realmente excluir este registro de pagamento?')) return
    try {
      await pb.collection('pagamentos').delete(id)
      toast.success('Pagamento excluído com sucesso.')
      carregarDados()
    } catch {
      toast.error('Erro ao excluir pagamento.')
    }
  }

  // Filtragem de Pagamentos na tabela
  const pagamentosFiltrados = useMemo(() => {
    if (filtroTipo === 'todos') return pagamentos
    return pagamentos.filter((p) => {
      const tipo = p.tipo_pagamento || 'Consulta'
      return tipo === filtroTipo
    })
  }, [pagamentos, filtroTipo])

  // Agregações de Cards
  const {
    totalRecebido,
    totalReceber,
    faturamentoBruto,
    totalMensalidades,
    totalConsultasAvulsas,
  } = useMemo(() => {
    let recebido = 0
    let aReceber = 0
    let bruto = 0
    let mensalidades = 0
    let porConsulta = 0

    for (const p of pagamentos) {
      const v = p.valor || 0
      bruto += v
      if (p.status === 'Pago') {
        recebido += v
      } else if (p.status === 'Pendente') {
        aReceber += v
      }

      if (p.tipo_pagamento === 'Mensal') {
        mensalidades += v
      } else {
        porConsulta += v
      }
    }

    return {
      totalRecebido: recebido,
      totalReceber: aReceber,
      faturamentoBruto: bruto,
      totalMensalidades: mensalidades,
      totalConsultasAvulsas: porConsulta,
    }
  }, [pagamentos])

  // Gráfico por Dia do Mês: registra o faturamento no dia em que foi recebido/pago
  const dadosGraficoDias = useMemo(() => {
    const mapaDias: Record<number, number> = {}
    for (let d = 1; d <= 31; d++) mapaDias[d] = 0

    for (const p of pagamentos) {
      if (p.status === 'Pago') {
        const ref = p.data_pagamento || p.expand?.consulta_id?.data || p.created
        if (ref) {
          const diaNum = new Date(ref).getDate()
          mapaDias[diaNum] = (mapaDias[diaNum] || 0) + (p.valor || 0)
        }
      }
    }

    return Object.entries(mapaDias)
      .filter(([dia]) => parseInt(dia, 10) <= 31)
      .map(([dia, total]) => ({
        dia: `Dia ${dia}`,
        valor: total,
      }))
  }, [pagamentos])

  // Resumo Percentual por Forma de Pagamento
  const resumoFormas = useMemo(() => {
    const contagem: Record<string, number> = {
      Pix: 0,
      Cartão: 0,
      Dinheiro: 0,
      Transferência: 0,
      Outro: 0,
    }
    let total = 0

    for (const p of pagamentos) {
      const f = p.forma_pagamento || 'Outro'
      contagem[f] = (contagem[f] || 0) + 1
      total++
    }

    return Object.entries(contagem).map(([forma, qtd]) => ({
      forma,
      qtd,
      pct: total > 0 ? Math.round((qtd / total) * 100) : 0,
    }))
  }, [pagamentos])

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Barra de Filtro de Mês, Status e Botão Novo Pagamento */}
      <div className="bg-white rounded-2xl border border-[#B9BDB8]/30 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2C3A2C]">
              <Calendar className="w-4 h-4 text-[#8A9A83]" />
              <span>Mês:</span>
            </div>
            <Input
              type="month"
              value={mesSelecionado}
              onChange={(e) => setMesSelecionado(e.target.value)}
              className="w-38 rounded-xl border-[#B9BDB8]/50 text-xs font-semibold text-[#2C3A2C]"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2C3A2C]">
              <Filter className="w-4 h-4 text-[#8A9A83]" />
              <span>Status:</span>
            </div>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-3 py-1.5 bg-[#F7F8F6] border border-[#B9BDB8]/40 rounded-xl text-xs font-medium text-[#2C3A2C] focus:outline-hidden focus:ring-2 focus:ring-[#8A9A83]"
            >
              <option value="todos">Todos</option>
              <option value="Pago">Pago</option>
              <option value="Pendente">Pendente</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#2C3A2C]">Tipo:</span>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="px-3 py-1.5 bg-[#F7F8F6] border border-[#B9BDB8]/40 rounded-xl text-xs font-medium text-[#2C3A2C] focus:outline-hidden focus:ring-2 focus:ring-[#8A9A83]"
            >
              <option value="todos">Todos os tipos</option>
              <option value="Consulta">Por consulta</option>
              <option value="Mensal">Mensalidades</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <Button
            onClick={abrirModalNovo}
            className="bg-[#8A9A83] hover:bg-[#75846F] text-white rounded-xl gap-2 shadow-xs text-xs sm:text-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Pagamento / Mensalidade</span>
          </Button>
        </div>
      </div>

      {/* 3 Cards de Resumo Mensal */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Total Recebido (verde-esmeralda) */}
        <div className="bg-white p-6 rounded-2xl border border-[#B9BDB8]/30 shadow-xs hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#4A4A48]">Total Recebido</span>
            <div className="w-10 h-10 rounded-xl bg-[#DFF0EB] text-[#2E7D6B] flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-bold text-[#2E7D6B] block truncate">
              {formatarMoeda(totalRecebido)}
            </span>
          </div>
          <p className="text-xs text-[#8A9A83] mt-2">Pagamentos confirmados no mês</p>
        </div>

        {/* Total a Receber (âmbar) */}
        <div className="bg-white p-6 rounded-2xl border border-[#B9BDB8]/30 shadow-xs hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#4A4A48]">Total a Receber</span>
            <div className="w-10 h-10 rounded-xl bg-[#FBF0D6] text-[#E5A93D] flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-bold text-[#E5A93D] block truncate">
              {formatarMoeda(totalReceber)}
            </span>
          </div>
          <p className="text-xs text-[#8A9A83] mt-2">Valores pendentes de pagamento</p>
        </div>

        {/* Faturamento Bruto (verde-sálvia) */}
        <div className="bg-white p-6 rounded-2xl border border-[#B9BDB8]/30 shadow-xs hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#4A4A48]">Faturamento Bruto</span>
            <div className="w-10 h-10 rounded-xl bg-[#E4EADF] text-[#8A9A83] flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-bold text-[#2C3A2C] block truncate">
              {formatarMoeda(faturamentoBruto)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#8A9A83] mt-2">
            <span className="text-[#3A4A3A] font-semibold">
              Mensal: {formatarMoeda(totalMensalidades)}
            </span>
            <span>•</span>
            <span>Consultas: {formatarMoeda(totalConsultasAvulsas)}</span>
          </div>
        </div>
      </div>
      {/* Relatório Mensal com Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Barras: Faturamento por Dia */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#B9BDB8]/30 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#8A9A83]" />
              <h3 className="text-sm font-bold text-[#2C3A2C]">
                Faturamento Recebido por Dia (R$)
              </h3>
            </div>
            <span className="text-xs text-[#8A9A83]">Mês selecionado</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dadosGraficoDias}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4EADF" />
                <XAxis dataKey="dia" tick={{ fontSize: 10 }} tickLine={false} interval={4} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(val: number | undefined) => [formatarMoeda(val || 0), 'Recebido']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    borderColor: '#B9BDB8',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="valor" fill="#8A9A83" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Pizza: Presencial vs Online & Total Atendimentos */}
        <div className="bg-white rounded-2xl border border-[#B9BDB8]/30 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <PieIcon className="w-4 h-4 text-[#8A9A83]" />
              <h3 className="text-sm font-bold text-[#2C3A2C]">Distribuição por Modalidade</h3>
            </div>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={modalidadesDistrib}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {modalidadesDistrib.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CORES_PIE[index % CORES_PIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card Atendimentos Realizados */}
          <div className="mt-4 pt-4 border-t border-[#B9BDB8]/20 flex items-center justify-between">
            <div>
              <span className="text-xs text-[#8A9A83] block">Consultas Realizadas</span>
              <span className="text-2xl font-bold text-[#2C3A2C]">{totalAtendimentosMes}</span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E4EADF] text-[#3A4A3A]">
              Sessões concluídas
            </span>
          </div>
        </div>
      </div>

      {/* Resumo de Formas de Pagamento (Barras Horizontais) */}
      <div className="bg-white rounded-2xl border border-[#B9BDB8]/30 shadow-xs p-6">
        <h3 className="text-sm font-bold text-[#2C3A2C] mb-4">Resumo por Forma de Pagamento</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {resumoFormas.map((item) => (
            <div
              key={item.forma}
              className="bg-[#F7F8F6] p-3 rounded-xl border border-[#B9BDB8]/20"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-[#2C3A2C]">
                <span>{item.forma}</span>
                <span className="text-[#8A9A83]">{item.pct}%</span>
              </div>
              <div className="w-full bg-[#E4EADF]/60 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-[#8A9A83] h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.pct}%` }}
                />
              </div>
              <span className="text-[11px] text-[#8A9A83] mt-1 block">
                {item.qtd} {item.qtd === 1 ? 'pagamento' : 'pagamentos'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabela de Pagamentos */}
      <div className="bg-white rounded-2xl border border-[#B9BDB8]/30 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-[#B9BDB8]/30 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#2C3A2C]">Lista de Pagamentos do Mês</h3>
            <p className="text-xs text-[#8A9A83]">
              Controle detalhado de cada consulta avulsa e mensalidade do consultório
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#F7F8F6] border border-[#B9BDB8]/30 text-[#4A4A48]">
            {pagamentosFiltrados.length}{' '}
            {pagamentosFiltrados.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {carregando ? (
          <div className="p-12 text-center text-sm text-[#8A9A83]">Carregando pagamentos...</div>
        ) : pagamentosFiltrados.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Receipt className="w-10 h-10 text-[#8A9A83]/50 mx-auto" />
            <p className="text-sm font-semibold text-[#2C3A2C]">
              Nenhum pagamento encontrado com os filtros selecionados.
            </p>
            <p className="text-xs text-[#8A9A83] max-w-sm mx-auto">
              Você pode registrar um novo pagamento mensal ou vinculado a consulta pelo botão acima.
            </p>
            <Button
              onClick={abrirModalNovo}
              className="bg-[#8A9A83] hover:bg-[#75846F] text-white rounded-xl text-xs gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar pagamento</span>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#4A4A48]">
              <thead className="bg-[#F7F8F6] text-[#2C3A2C] text-xs font-semibold uppercase tracking-wider border-b border-[#B9BDB8]/30">
                <tr>
                  <th className="py-4 px-6">Tipo</th>
                  <th className="py-4 px-4">Paciente / Descrição</th>
                  <th className="py-4 px-4">Referência</th>
                  <th className="py-4 px-4">Valor</th>
                  <th className="py-4 px-4">Forma</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#B9BDB8]/20">
                {pagamentosFiltrados.map((p) => {
                  const consulta = p.expand?.consulta_id
                  const pacienteDireto = p.expand?.paciente_id
                  const pacienteNome =
                    pacienteDireto?.nome ||
                    consulta?.expand?.paciente_id?.nome ||
                    'Paciente não identificado'
                  const ehMensal = p.tipo_pagamento === 'Mensal'

                  return (
                    <tr key={p.id} className="hover:bg-[#F7F8F6]/60 transition-colors">
                      <td className="py-4 px-6">
                        {ehMensal ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-[#F6E8DF] text-[#C8845F] border border-[#C8845F]/30">
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Mensal</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-[#E4EADF] text-[#3A4A3A]">
                            <FileText className="w-3.5 h-3.5" />
                            <span>Consulta</span>
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-[#2C3A2C]">{pacienteNome}</div>
                        {p.descricao && (
                          <div className="text-xs text-[#8A9A83] mt-0.5 line-clamp-1">
                            {p.descricao}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 text-xs text-[#4A4A48]">
                        {ehMensal ? (
                          <span className="font-medium text-[#2C3A2C]">
                            Mês {p.mes_referencia || mesSelecionado}
                          </span>
                        ) : (
                          <span>{formatarDataAbreviada(consulta?.data || p.created)}</span>
                        )}
                      </td>

                      <td className="py-4 px-4 font-bold text-[#2C3A2C]">
                        {formatarMoeda(p.valor)}
                      </td>

                      <td className="py-4 px-4">
                        <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#F7F8F6] border border-[#B9BDB8]/40 font-medium">
                          {p.forma_pagamento}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            p.status === 'Pago'
                              ? 'bg-[#DFF0EB] text-[#2E7D6B]'
                              : p.status === 'Pendente'
                                ? 'bg-[#FBF0D6] text-[#E5A93D]'
                                : 'bg-[#FBE3DE] text-[#C45545]'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.status === 'Pendente' && (
                            <Button
                              size="sm"
                              onClick={() => handleMarcarComoPago(p)}
                              className="h-8 bg-[#2E7D6B] hover:bg-[#256859] text-white text-xs rounded-lg gap-1 px-3 shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Marcar Pago</span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => abrirModalEditar(p)}
                            className="h-8 w-8 p-0 text-[#4A4A48] hover:text-[#2C3A2C] rounded-lg"
                            title="Editar pagamento"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          {ehMensal && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => excluirPagamento(p.id)}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-[#C45545] rounded-lg"
                              title="Excluir mensalidade"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Novo Pagamento (Avulso ou Mensal) */}
      <Dialog open={modalNovoAberto} onOpenChange={setModalNovoAberto}>
        <DialogContent className="max-w-lg bg-white rounded-2xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#2C3A2C]">
              Registrar Pagamento
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={salvarNovoPagamento} className="space-y-4 mt-2">
            {/* Seletor de Tipo: Por Consulta ou Mensal */}
            <div>
              <Label className="text-xs font-semibold text-[#2C3A2C] block mb-1.5">
                Tipo de Cobrança *
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNovoTipo('Mensal')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    novoTipo === 'Mensal'
                      ? 'border-[#C8845F] bg-[#F6E8DF]/60 text-[#2C3A2C] font-bold shadow-xs'
                      : 'border-[#B9BDB8]/40 bg-white text-[#4A4A48] hover:bg-[#F7F8F6]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#C8845F]" />
                    <span className="text-sm">Pagamento Mensal</span>
                  </div>
                  {novoTipo === 'Mensal' && <span className="w-2 h-2 rounded-full bg-[#C8845F]" />}
                </button>

                <button
                  type="button"
                  onClick={() => setNovoTipo('Consulta')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    novoTipo === 'Consulta'
                      ? 'border-[#8A9A83] bg-[#E4EADF]/60 text-[#2C3A2C] font-bold shadow-xs'
                      : 'border-[#B9BDB8]/40 bg-white text-[#4A4A48] hover:bg-[#F7F8F6]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#8A9A83]" />
                    <span className="text-sm">Por Consulta</span>
                  </div>
                  {novoTipo === 'Consulta' && (
                    <span className="w-2 h-2 rounded-full bg-[#8A9A83]" />
                  )}
                </button>
              </div>
            </div>

            {/* Campos Específicos de acordo com o Tipo */}
            {novoTipo === 'Mensal' ? (
              <>
                <div>
                  <Label htmlFor="novoPaciente" className="text-xs font-semibold text-[#2C3A2C]">
                    Paciente Assinante *
                  </Label>
                  <select
                    id="novoPaciente"
                    value={novoPacienteId}
                    onChange={(e) => setNovoPacienteId(e.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-[#F7F8F6] border border-[#B9BDB8]/50 rounded-xl text-sm font-medium text-[#2C3A2C] focus:outline-hidden focus:ring-2 focus:ring-[#8A9A83]"
                    required
                  >
                    <option value="" disabled>
                      Selecione o paciente...
                    </option>
                    {pacientes.map((pac) => (
                      <option key={pac.id} value={pac.id}>
                        {pac.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="novoMesRef" className="text-xs font-semibold text-[#2C3A2C]">
                      Mês de Referência *
                    </Label>
                    <Input
                      id="novoMesRef"
                      type="month"
                      value={novoMesReferencia}
                      onChange={(e) => {
                        setNovoMesReferencia(e.target.value)
                        const [ano, mes] = e.target.value.split('-')
                        if (ano && mes) {
                          const nomeMes = new Date(Number(ano), Number(mes) - 1).toLocaleDateString(
                            'pt-BR',
                            { month: 'long' },
                          )
                          setNovaDescricao(`Mensalidade de ${nomeMes}/${ano}`)
                        }
                      }}
                      className="mt-1 rounded-xl border-[#B9BDB8]/50 text-sm font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="novoValor" className="text-xs font-semibold text-[#2C3A2C]">
                      Valor Mensal (R$) *
                    </Label>
                    <Input
                      id="novoValor"
                      type="number"
                      step="0.01"
                      value={novoValor}
                      onChange={(e) => setNovoValor(Number(e.target.value))}
                      className="mt-1 rounded-xl border-[#B9BDB8]/50 font-bold text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="novaDescricao" className="text-xs font-semibold text-[#2C3A2C]">
                    Descrição / Identificação
                  </Label>
                  <Input
                    id="novaDescricao"
                    value={novaDescricao}
                    onChange={(e) => setNovaDescricao(e.target.value)}
                    placeholder="Ex.: Mensalidade de março/2026 - Pacote 4 sessões"
                    className="mt-1 rounded-xl border-[#B9BDB8]/50 text-sm"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="novaConsulta" className="text-xs font-semibold text-[#2C3A2C]">
                    Consulta Vinculada *
                  </Label>
                  <select
                    id="novaConsulta"
                    value={novaConsultaId}
                    onChange={(e) => {
                      setNovaConsultaId(e.target.value)
                      const c = consultasDoMes.find((item) => item.id === e.target.value)
                      if (c?.valor_total) setNovoValor(c.valor_total)
                    }}
                    className="mt-1 w-full px-3 py-2 bg-[#F7F8F6] border border-[#B9BDB8]/50 rounded-xl text-sm font-medium text-[#2C3A2C] focus:outline-hidden focus:ring-2 focus:ring-[#8A9A83]"
                    required
                  >
                    <option value="" disabled>
                      Selecione a consulta...
                    </option>
                    {consultasDoMes.map((c) => {
                      const pac = c.expand?.paciente_id?.nome || 'Paciente'
                      return (
                        <option key={c.id} value={c.id}>
                          {formatarDataAbreviada(c.data)} às {c.hora_inicio} — {pac} (
                          {formatarMoeda(c.valor_total || 220)})
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div>
                  <Label htmlFor="novoValorCons" className="text-xs font-semibold text-[#2C3A2C]">
                    Valor da Consulta (R$) *
                  </Label>
                  <Input
                    id="novoValorCons"
                    type="number"
                    step="0.01"
                    value={novoValor}
                    onChange={(e) => setNovoValor(Number(e.target.value))}
                    className="mt-1 rounded-xl border-[#B9BDB8]/50 font-bold text-sm"
                    required
                  />
                </div>
              </>
            )}

            {/* Forma de Pagamento e Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <Label htmlFor="novaForma" className="text-xs font-semibold text-[#2C3A2C]">
                  Forma de Pagamento
                </Label>
                <select
                  id="novaForma"
                  value={novaForma}
                  onChange={(e) => setNovaForma(e.target.value as FormaPagamento)}
                  className="mt-1 w-full px-3 py-2 bg-white border border-[#B9BDB8]/50 rounded-xl text-sm font-medium text-[#2C3A2C]"
                >
                  <option value="Pix">Pix</option>
                  <option value="Cartão">Cartão</option>
                  <option value="Transferência">Transferência</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div>
                <Label htmlFor="novoStatus" className="text-xs font-semibold text-[#2C3A2C]">
                  Status do Pagamento
                </Label>
                <select
                  id="novoStatus"
                  value={novoStatus}
                  onChange={(e) => setNovoStatus(e.target.value as StatusPagamento)}
                  className="mt-1 w-full px-3 py-2 bg-white border border-[#B9BDB8]/50 rounded-xl text-sm font-medium text-[#2C3A2C]"
                >
                  <option value="Pendente">Pendente (A receber)</option>
                  <option value="Pago">Pago (Confirmado)</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalNovoAberto(false)}
                className="rounded-xl border-[#B9BDB8]/50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={salvandoNovo}
                className="bg-[#8A9A83] hover:bg-[#75846F] text-white rounded-xl"
              >
                {salvandoNovo ? 'Salvando...' : 'Confirmar e Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Pagamento */}
      <Dialog open={modalEditarAberto} onOpenChange={setModalEditarAberto}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#2C3A2C]">Editar Pagamento</DialogTitle>
          </DialogHeader>

          <form onSubmit={salvarEdicaoPagamento} className="space-y-4 mt-2">
            <div>
              <Label htmlFor="valor" className="text-xs font-semibold text-[#2C3A2C]">
                Valor (R$)
              </Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={valorEditado}
                onChange={(e) => setValorEditado(Number(e.target.value))}
                className="mt-1 rounded-xl border-[#B9BDB8]/50 font-bold"
                required
              />
            </div>

            {pagamentoEditando?.tipo_pagamento === 'Mensal' && (
              <div>
                <Label htmlFor="mesRefEdit" className="text-xs font-semibold text-[#2C3A2C]">
                  Mês de Referência
                </Label>
                <Input
                  id="mesRefEdit"
                  type="month"
                  value={mesRefEditado}
                  onChange={(e) => setMesRefEditado(e.target.value)}
                  className="mt-1 rounded-xl border-[#B9BDB8]/50"
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="descEdit" className="text-xs font-semibold text-[#2C3A2C]">
                Descrição / Observações
              </Label>
              <Input
                id="descEdit"
                value={descricaoEditada}
                onChange={(e) => setDescricaoEditada(e.target.value)}
                placeholder="Ex.: Mensalidade de março/2026"
                className="mt-1 rounded-xl border-[#B9BDB8]/50 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="forma" className="text-xs font-semibold text-[#2C3A2C]">
                Forma de Pagamento
              </Label>
              <select
                id="forma"
                value={formaEditada}
                onChange={(e) => setFormaEditada(e.target.value as FormaPagamento)}
                className="mt-1 w-full px-3 py-2 bg-white border border-[#B9BDB8]/50 rounded-xl text-sm font-medium text-[#2C3A2C]"
              >
                <option value="Pix">Pix</option>
                <option value="Cartão">Cartão</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Transferência">Transferência</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div>
              <Label htmlFor="status" className="text-xs font-semibold text-[#2C3A2C]">
                Status do Pagamento
              </Label>
              <select
                id="status"
                value={statusEditado}
                onChange={(e) => setStatusEditado(e.target.value as StatusPagamento)}
                className="mt-1 w-full px-3 py-2 bg-white border border-[#B9BDB8]/50 rounded-xl text-sm font-medium text-[#2C3A2C]"
              >
                <option value="Pendente">Pendente</option>
                <option value="Pago">Pago</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalEditarAberto(false)}
                className="rounded-xl border-[#B9BDB8]/50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={salvando}
                className="bg-[#8A9A83] hover:bg-[#75846F] text-white rounded-xl"
              >
                {salvando ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
