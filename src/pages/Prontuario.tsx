import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Plus, Clock, Calendar, Tag, Edit2, Trash2, User, AlertCircle } from 'lucide-react'
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
import { listarPacientes } from '@/services/pacientes'
import {
  listarAnotacoesPaciente,
  criarAnotacao,
  atualizarAnotacao,
  excluirAnotacao,
} from '@/services/prontuario'
import {
  formatarDataExtensa,
  formatarDataAbreviada,
  calcularIdade,
  formatarTelefone,
} from '@/lib/formatters'
import { useRealtime } from '@/hooks/use-realtime'
import type { Paciente, AnotacaoProntuario, TagProntuario } from '@/types'

const TAGS_DISPONIVEIS: TagProntuario[] = ['Avaliação inicial', 'Revisão', 'Alta', 'Crise', 'Outro']

export default function ProntuarioPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const pacienteParamId = searchParams.get('paciente')

  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [pacienteSelecionadoId, setPacienteSelecionadoId] = useState<string>(pacienteParamId || '')
  const [anotacoes, setAnotacoes] = useState<AnotacaoProntuario[]>([])
  const [carregandoPacientes, setCarregandoPacientes] = useState(true)
  const [carregandoAnotacoes, setCarregandoAnotacoes] = useState(false)
  const [buscaPaciente, setBuscaPaciente] = useState('')

  // Modal formulário anotação
  const [modalAberto, setModalAberto] = useState(false)
  const [anotacaoEditando, setAnotacaoEditando] = useState<AnotacaoProntuario | null>(null)
  const [dataAnotacao, setDataAnotacao] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [tagsSelecionadas, setTagsSelecionadas] = useState<TagProntuario[]>([])
  const [salvando, setSalvando] = useState(false)
  const [erroConteudo, setErroConteudo] = useState('')

  // Exclusão anotação
  const [anotacaoExcluir, setAnotacaoExcluir] = useState<AnotacaoProntuario | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  // Carregar lista de pacientes
  useEffect(() => {
    async function carregarListaPacientes() {
      try {
        setCarregandoPacientes(true)
        const lista = await listarPacientes()
        setPacientes(lista)
        if (lista.length > 0 && !pacienteSelecionadoId) {
          setPacienteSelecionadoId(lista[0].id)
        }
      } catch {
        toast.error('Erro ao listar pacientes')
      } finally {
        setCarregandoPacientes(false)
      }
    }
    carregarListaPacientes()
  }, [])

  // Atualizar quando param muda
  useEffect(() => {
    if (pacienteParamId && pacienteParamId !== pacienteSelecionadoId) {
      setPacienteSelecionadoId(pacienteParamId)
    }
  }, [pacienteParamId])

  // Carregar anotações do paciente selecionado
  const carregarAnotacoes = useCallback(async () => {
    if (!pacienteSelecionadoId) {
      setAnotacoes([])
      return
    }
    try {
      setCarregandoAnotacoes(true)
      const lista = await listarAnotacoesPaciente(pacienteSelecionadoId)
      setAnotacoes(lista)
    } catch {
      toast.error('Erro ao carregar prontuário do paciente')
    } finally {
      setCarregandoAnotacoes(false)
    }
  }, [pacienteSelecionadoId])

  useEffect(() => {
    carregarAnotacoes()
  }, [carregarAnotacoes])

  useRealtime('anotacoes_prontuario', () => carregarAnotacoes())

  const pacienteAtual = useMemo(() => {
    return pacientes.find((p) => p.id === pacienteSelecionadoId) || null
  }, [pacientes, pacienteSelecionadoId])

  const selecionarPaciente = (id: string) => {
    setPacienteSelecionadoId(id)
    setSearchParams({ paciente: id })
  }

  const pacientesFiltrados = useMemo(() => {
    if (!buscaPaciente.trim()) return pacientes
    const termo = buscaPaciente.toLowerCase()
    return pacientes.filter((p) => p.nome.toLowerCase().includes(termo))
  }, [pacientes, buscaPaciente])

  const abrirModalCriar = () => {
    setAnotacaoEditando(null)
    setDataAnotacao(new Date().toISOString().split('T')[0])
    setConteudo('')
    setTagsSelecionadas([])
    setErroConteudo('')
    setModalAberto(true)
  }

  const abrirModalEditar = (a: AnotacaoProntuario) => {
    setAnotacaoEditando(a)
    setDataAnotacao(a.data ? a.data.split('T')[0] : new Date().toISOString().split('T')[0])
    setConteudo(a.conteudo)
    setTagsSelecionadas(a.tags || [])
    setErroConteudo('')
    setModalAberto(true)
  }

  const toggleTag = (tag: TagProntuario) => {
    setTagsSelecionadas((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  const salvarAnotacao = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!conteudo.trim()) {
      setErroConteudo('O relato da sessão é obrigatório.')
      return
    }
    if (!pacienteSelecionadoId) {
      toast.error('Selecione um paciente primeiro.')
      return
    }

    try {
      setSalvando(true)
      if (anotacaoEditando) {
        await atualizarAnotacao(anotacaoEditando.id, {
          data: `${dataAnotacao} 00:00:00.000Z`,
          conteudo: conteudo.trim(),
          tags: tagsSelecionadas,
        })
        toast.success('Anotação atualizada no prontuário!')
      } else {
        await criarAnotacao({
          paciente_id: pacienteSelecionadoId,
          data: `${dataAnotacao} 00:00:00.000Z`,
          conteudo: conteudo.trim(),
          tags: tagsSelecionadas,
        })
        toast.success('Anotação salva no prontuário!')
      }
      setModalAberto(false)
      carregarAnotacoes()
    } catch {
      toast.error('Erro ao salvar anotação.')
    } finally {
      setSalvando(false)
    }
  }

  const confirmarExclusao = async () => {
    if (!anotacaoExcluir) return
    try {
      setExcluindo(true)
      await excluirAnotacao(anotacaoExcluir.id)
      toast.success('Anotação excluída do histórico.')
      setAnotacaoExcluir(null)
      carregarAnotacoes()
    } catch {
      toast.error('Erro ao excluir anotação.')
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Barra de Seleção de Paciente */}
      <div className="bg-white rounded-2xl border border-[#B9BDB8]/30 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <Label className="text-xs font-semibold text-[#2C3A2C] block mb-1">
              Selecione o Paciente
            </Label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9A83]" />
              <select
                value={pacienteSelecionadoId}
                onChange={(e) => selecionarPaciente(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#F7F8F6] border border-[#B9BDB8]/40 rounded-xl text-sm font-medium text-[#2C3A2C] focus:outline-hidden focus:ring-2 focus:ring-[#8A9A83]"
              >
                <option value="" disabled>
                  {carregandoPacientes ? 'Carregando lista...' : 'Escolha um paciente...'}
                </option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {pacienteAtual && (
            <div className="flex items-center gap-4 text-xs text-[#4A4A48] border-t md:border-t-0 pt-3 md:pt-0 border-[#B9BDB8]/20">
              {pacienteAtual.data_nascimento && (
                <div className="flex flex-col">
                  <span className="text-[#8A9A83] font-medium">Idade</span>
                  <span className="font-semibold text-[#2C3A2C]">
                    {calcularIdade(pacienteAtual.data_nascimento)}
                  </span>
                </div>
              )}
              {pacienteAtual.telefone && (
                <div className="flex flex-col">
                  <span className="text-[#8A9A83] font-medium">Telefone</span>
                  <span className="font-semibold text-[#2C3A2C]">
                    {formatarTelefone(pacienteAtual.telefone)}
                  </span>
                </div>
              )}
              {pacienteAtual.email && (
                <div className="flex flex-col hidden sm:flex">
                  <span className="text-[#8A9A83] font-medium">E-mail</span>
                  <span className="font-semibold text-[#2C3A2C] truncate max-w-[180px]">
                    {pacienteAtual.email}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo Principal do Prontuário */}
      {!pacienteAtual ? (
        <div className="bg-white rounded-2xl border border-[#B9BDB8]/30 p-12 text-center">
          <p className="text-sm text-[#4A4A48] font-medium">Nenhum paciente selecionado.</p>
          <p className="text-xs text-[#8A9A83] mt-1">
            Selecione um paciente acima ou cadastre um novo na tela de Pacientes.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Cabeçalho do Prontuário com botão de nova anotação */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-[#B9BDB8]/30 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#E4EADF] text-[#3A4A3A] flex items-center justify-center font-bold text-lg">
                {pacienteAtual.nome.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#2C3A2C]">{pacienteAtual.nome}</h2>
                <p className="text-xs text-[#8A9A83]">
                  Histórico clínico, evoluções terapêuticas e registros de sessões
                </p>
              </div>
            </div>

            <Button
              onClick={abrirModalCriar}
              className="bg-[#8A9A83] hover:bg-[#75846F] text-white rounded-xl gap-2 shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Anotação</span>
            </Button>
          </div>

          {/* Timeline de Anotações */}
          <div className="bg-white rounded-2xl border border-[#B9BDB8]/30 shadow-xs p-6 sm:p-8">
            <h3 className="text-base font-bold text-[#2C3A2C] mb-6 flex items-center gap-2">
              <span>Linha do Tempo Terapêutica</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#E4EADF] text-[#3A4A3A] font-semibold">
                {anotacoes.length} {anotacoes.length === 1 ? 'registro' : 'registros'}
              </span>
            </h3>

            {carregandoAnotacoes ? (
              <div className="py-12 text-center text-sm text-[#8A9A83]">
                Carregando histórico do prontuário...
              </div>
            ) : anotacoes.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-xl bg-[#F7F8F6] text-[#8A9A83] flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-[#2C3A2C]">
                  Nenhuma anotação registrada ainda para este paciente.
                </p>
                <p className="text-xs text-[#8A9A83]">
                  Clique no botão acima para registrar a primeira evolução de consulta.
                </p>
              </div>
            ) : (
              <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E4EADF]">
                {anotacoes.map((item) => (
                  <div key={item.id} className="relative group">
                    {/* Marcador na linha */}
                    <div className="absolute -left-6 sm:-left-8 top-1.5 w-3 h-3 rounded-full bg-[#8A9A83] ring-4 ring-white group-hover:bg-[#C8845F] transition-colors" />

                    <div className="bg-[#F7F8F6] rounded-xl p-5 border border-[#B9BDB8]/20 hover:border-[#8A9A83]/40 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#2C3A2C]">
                          <Calendar className="w-3.5 h-3.5 text-[#8A9A83]" />
                          <span>{formatarDataAbreviada(item.data)}</span>
                          {item.created && (
                            <span className="text-[11px] font-normal text-[#8A9A83]">
                              registrado às{' '}
                              {new Date(item.created).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => abrirModalEditar(item)}
                            className="h-7 w-7 p-0 text-[#4A4A48] hover:text-[#2C3A2C] rounded-lg"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAnotacaoExcluir(item)}
                            className="h-7 w-7 p-0 text-gray-400 hover:text-[#C45545] rounded-lg"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {item.tags.map((t) => (
                            <span
                              key={t}
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                                t === 'Crise'
                                  ? 'bg-[#FBE3DE] text-[#C45545]'
                                  : t === 'Alta'
                                    ? 'bg-[#DFF0EB] text-[#2E7D6B]'
                                    : t === 'Avaliação inicial'
                                      ? 'bg-[#F6E8DF] text-[#C8845F]'
                                      : 'bg-[#E4EADF] text-[#3A4A3A]'
                              }`}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Texto da anotação */}
                      <p className="text-sm text-[#4A4A48] whitespace-pre-wrap leading-relaxed">
                        {item.conteudo}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Nova / Editar Anotação */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-xl bg-white rounded-2xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#2C3A2C]">
              {anotacaoEditando ? 'Editar Anotação Clínica' : 'Nova Anotação no Prontuário'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={salvarAnotacao} className="space-y-4 mt-2">
            <div>
              <Label htmlFor="data" className="text-xs font-semibold text-[#2C3A2C]">
                Data do atendimento *
              </Label>
              <Input
                id="data"
                type="date"
                value={dataAnotacao}
                onChange={(e) => setDataAnotacao(e.target.value)}
                className="mt-1 rounded-xl border-[#B9BDB8]/50"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-[#2C3A2C] block mb-1.5">
                Marcadores / Tags da sessão
              </Label>
              <div className="flex flex-wrap gap-2">
                {TAGS_DISPONIVEIS.map((t) => {
                  const sel = tagsSelecionadas.includes(t)
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                        sel
                          ? 'bg-[#8A9A83] text-white shadow-xs'
                          : 'bg-[#F7F8F6] text-[#4A4A48] border border-[#B9BDB8]/40 hover:bg-[#E4EADF]'
                      }`}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="relato" className="text-xs font-semibold text-[#2C3A2C]">
                Relato da consulta e evolução clínica *
              </Label>
              <Textarea
                id="relato"
                rows={6}
                placeholder="Descreva a queixa trazida pelo paciente, intervenções aplicadas, reações emocionais, insights, tarefas intersessão e encaminhamentos..."
                value={conteudo}
                onChange={(e) => {
                  setConteudo(e.target.value)
                  if (erroConteudo) setErroConteudo('')
                }}
                className={`mt-1 rounded-xl text-sm leading-relaxed ${
                  erroConteudo ? 'border-red-500' : 'border-[#B9BDB8]/50'
                }`}
              />
              {erroConteudo && <p className="text-xs text-red-500 mt-1">{erroConteudo}</p>}
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
                {salvando ? 'Salvando...' : 'Salvar no Prontuário'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog
        open={!!anotacaoExcluir}
        onOpenChange={(aberto) => !aberto && setAnotacaoExcluir(null)}
      >
        <AlertDialogContent className="bg-white rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-[#2C3A2C]">
              Excluir anotação do prontuário?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#4A4A48]">
              Esta anotação de {formatarDataAbreviada(anotacaoExcluir?.data)} será removida
              definitivamente do histórico clínico do paciente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              disabled={excluindo}
              className="bg-[#C45545] hover:bg-[#B04535] text-white rounded-xl"
            >
              {excluindo ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
