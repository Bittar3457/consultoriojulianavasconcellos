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
import { listarPagamentos, marcarComoPago, atualizarPagamento } from '@/services/pagamentos'
import { listarConsultas } from '@/services/consultas'
import { formatarMoeda, formatarDataAbreviada } from '@/lib/formatters'
import { useRealtime } from '@/hooks/use-realtime'
import type { Pagamento, FormaPagamento, StatusPagamento } from '@/types'

const CORES_PIE = ['#8A9A83', '#C8845F', '#2E7D6B', '#E5A93D', '#75846F']

export default function FinanceiroPage() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [carregando, setCarregando] = useState(true)

  // Filtros
  const hoje = new Date()
  const mesAtualStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
  const [mesSelecionado, setMesSelecionado] = useState(mesAtualStr)
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')

  // Modal de Edição de Pagamento
  const [modalEditarAberto, setModalEditarAberto] = useState(false)
  const [pagamentoEditando, setPagamentoEditando] = useState<Pagamento | null>(null)
  const [valorEditado, setValorEditado] = useState<number>(0)
  const [statusEditado, setStatusEditado] = useState<StatusPagamento>('Pendente')
  const [formaEditada, setFormaEditada] = useState<FormaPagamento>('Pix')
  const [salvando, setSalvando] = useState(false)

  // Consultas do mês para gráfico de modalidade e total de atendimentos
  const [totalAtendimentosMes, setTotalAtendimentosMes] = useState(0)
  const [modalidadesDistrib, setModalidadesDistrib] = useState<{ name: string; value: number }[]>(
    [],
  )

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true)
      const lista = await listarPagamentos({
        mesAno: mesSelecionado,
        status: filtroStatus,
      })
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

      const realizadas = consultasMes.filter((c) => c.status === 'Realizada')
      setTotalAtendimentosMes(realizadas.length)

      let presenciais = 0
      let online = 0
      for (const c of consultasMes) {
        if (c.modalidade === 'Presencial') presenciais++
        else if (c.modalidade === 'Online') online++
        else {
          // Mista divide ou conta ambos
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

  const abrirModalEditar = (p: Pagamento) => {
    setPagamentoEditando(p)
    setValorEditado(p.valor || 0)
    setStatusEditado(p.status || 'Pendente')
    setFormaEditada(p.forma_pagamento || 'Pix')
    setModalEditarAberto(true)
  }

  const salvarEdicaoPagamento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pagamentoEditando) return
    try {
      setSalvando(true)
      await atualizarPagamento(pagamentoEditando.id, {
        valor: valorEditado,
        status: statusEditado,
        forma_pagamento: formaEditada,
        data_pagamento: statusEditado === 'Pago' ? new Date().toISOString() : undefined,
      })
      toast.success('Pagamento atualizado com sucesso!')
      setModalEditarAberto(false)
      carregarDados()
    } catch {
      toast.error('Erro ao atualizar pagamento.')
    } finally {
      setSalvando(false)
    }
  }

  // Agregações de Cards
  const { totalRecebido, totalReceber, faturamentoBruto } = useMemo(() => {
    let recebido = 0
    let aReceber = 0
    let bruto = 0

    for (const p of pagamentos) {
      const v = p.valor || 0
      bruto += v
      if (p.status === 'Pago') {
        recebido += v
      } else if (p.status === 'Pendente') {
        aReceber += v
      }
    }

    return {
      totalRecebido: recebido,
      totalReceber: aReceber,
      faturamentoBruto: bruto,
    }
  }, [pagamentos])

  // Gráfico por Dia do Mês
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
      {/* Barra de Filtro de Mês e Status */}
      <div className="bg-white rounded-2xl border border-[#B9BDB8]/30 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2C3A2C]">
            <Calendar className="w-4 h-4 text-[#8A9A83]" />
            <span>Mês de Referência:</span>
          </div>
          <Input
            type="month"
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
            className="w-44 rounded-xl border-[#B9BDB8]/50 text-xs font-semibold text-[#2C3A2C]"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2C3A2C]">
            <Filter className="w-4 h-4 text-[#8A9A83]" />
            <span>Status:</span>
          </div>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-3 py-1.5 bg-[#F7F8F6] border border-[#B9BDB8]/40 rounded-xl text-xs font-medium text-[#2C3A2C] focus:outline-hidden focus:ring-2 focus:ring-[#8A9A83]"
          >
            <option value="todos">Todos os status</option>
            <option value="Pago">Pago</option>
            <option value="Pendente">Pendente</option>
            <option value="Cancelado">Cancelado</option>
          </select>
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
          <p className="text-xs text-[#8A9A83] mt-2">Soma total de consultas do mês</p>
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
              Controle detalhado de cada sessão e recebimento
            </p>
          </div>
        </div>

        {carregando ? (
          <div className="p-12 text-center text-sm text-[#8A9A83]">Carregando pagamentos...</div>
        ) : pagamentos.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-sm font-semibold text-[#2C3A2C]">
              Nenhum pagamento registrado no período.
            </p>
            <p className="text-xs text-[#8A9A83]">
              Os pagamentos são criados automaticamente ao agendar consultas na Agenda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#4A4A48]">
              <thead className="bg-[#F7F8F6] text-[#2C3A2C] text-xs font-semibold uppercase tracking-wider border-b border-[#B9BDB8]/30">
                <tr>
                  <th className="py-4 px-6">Paciente</th>
                  <th className="py-4 px-4">Data Consulta</th>
                  <th className="py-4 px-4">Valor</th>
                  <th className="py-4 px-4">Forma</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#B9BDB8]/20">
                {pagamentos.map((p) => {
                  const consulta = p.expand?.consulta_id
                  const pacienteNome =
                    consulta?.expand?.paciente_id?.nome || 'Paciente não identificado'

                  return (
                    <tr key={p.id} className="hover:bg-[#F7F8F6]/60 transition-colors">
                      <td className="py-4 px-6 font-semibold text-[#2C3A2C]">{pacienteNome}</td>
                      <td className="py-4 px-4 text-xs text-[#4A4A48]">
                        {formatarDataAbreviada(consulta?.data || p.created)}
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
                        <div className="flex items-center justify-end gap-2">
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

      {/* Modal Editar Pagamento */}
      <Dialog open={modalEditarAberto} onOpenChange={setModalEditarAberto}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#2C3A2C]">Editar Pagamento</DialogTitle>
          </DialogHeader>

          <form onSubmit={salvarEdicaoPagamento} className="space-y-4 mt-2">
            <div>
              <Label htmlFor="valor" className="text-xs font-semibold text-[#2C3A2C]">
                Valor da Sessão (R$)
              </Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={valorEditado}
                onChange={(e) => setValorEditado(Number(e.target.value))}
                className="mt-1 rounded-xl border-[#B9BDB8]/50"
                required
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
