import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  ClipboardList,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertTriangle,
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
import {
  listarPacientes,
  criarPaciente,
  atualizarPaciente,
  excluirPacienteComCascata,
} from '@/services/pacientes'
import { formatarTelefone, formatarDataAbreviada } from '@/lib/formatters'
import { useRealtime } from '@/hooks/use-realtime'
import type { Paciente } from '@/types'

export default function PacientesPage() {
  const navigate = useNavigate()
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)

  // Modal formulário
  const [modalFormAberto, setModalFormAberto] = useState(false)
  const [pacienteEditando, setPacienteEditando] = useState<Paciente | null>(null)
  const [salvando, setSalvando] = useState(false)

  // Campos do formulário
  const [nome, setNome] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [endereco, setEndereco] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [erroNome, setErroNome] = useState('')

  // Modal exclusão em cascata
  const [pacienteExcluir, setPacienteExcluir] = useState<Paciente | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const carregar = useCallback(async () => {
    try {
      setCarregando(true)
      const lista = await listarPacientes(busca)
      setPacientes(lista)
    } catch {
      toast.error('Erro ao carregar pacientes.')
    } finally {
      setCarregando(false)
    }
  }, [busca])

  useEffect(() => {
    carregar()
  }, [carregar])

  useRealtime('pacientes', () => carregar())

  const aplicarMascaraTelefone = (valor: string) => {
    const limpo = valor.replace(/\D/g, '')
    if (limpo.length <= 2) return limpo
    if (limpo.length <= 7) return `(${limpo.slice(0, 2)}) ${limpo.slice(2)}`
    if (limpo.length <= 11) {
      return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`
    }
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7, 11)}`
  }

  const abrirModalCriar = () => {
    setPacienteEditando(null)
    setNome('')
    setDataNascimento('')
    setTelefone('')
    setEmail('')
    setEndereco('')
    setObservacoes('')
    setErroNome('')
    setModalFormAberto(true)
  }

  const abrirModalEditar = (p: Paciente) => {
    setPacienteEditando(p)
    setNome(p.nome || '')
    setDataNascimento(p.data_nascimento ? p.data_nascimento.split('T')[0] : '')
    setTelefone(p.telefone || '')
    setEmail(p.email || '')
    setEndereco(p.endereco || '')
    setObservacoes(p.observacoes || '')
    setErroNome('')
    setModalFormAberto(true)
  }

  const salvarFormulario = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) {
      setErroNome('O nome completo é obrigatório.')
      return
    }

    try {
      setSalvando(true)
      const payload: Partial<Paciente> = {
        nome: nome.trim(),
        data_nascimento: dataNascimento ? `${dataNascimento} 00:00:00.000Z` : undefined,
        telefone: telefone.trim(),
        email: email.trim(),
        endereco: endereco.trim(),
        observacoes: observacoes.trim(),
      }

      if (pacienteEditando) {
        await atualizarPaciente(pacienteEditando.id, payload)
        toast.success('Paciente atualizado com sucesso!')
      } else {
        await criarPaciente(payload)
        toast.success('Paciente cadastrado com sucesso!')
      }

      setModalFormAberto(false)
      carregar()
    } catch {
      toast.error('Erro ao salvar paciente. Verifique os campos.')
    } finally {
      setSalvando(false)
    }
  }

  const confirmarExclusao = async () => {
    if (!pacienteExcluir) return
    try {
      setExcluindo(true)
      await excluirPacienteComCascata(pacienteExcluir.id)
      toast.success('Paciente e todos os registros vinculados foram excluídos.')
      setPacienteExcluir(null)
      carregar()
    } catch {
      toast.error('Erro ao excluir paciente.')
    } finally {
      setExcluindo(false)
    }
  }

  const pacientesFiltrados = useMemo(() => {
    if (!busca.trim()) return pacientes
    const termo = busca.toLowerCase()
    return pacientes.filter(
      (p) =>
        p.nome.toLowerCase().includes(termo) ||
        (p.telefone && p.telefone.toLowerCase().includes(termo)) ||
        (p.email && p.email.toLowerCase().includes(termo)),
    )
  }, [pacientes, busca])

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Barra de Ações Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9A83]" />
          <Input
            type="text"
            placeholder="Buscar por nome, telefone ou e-mail..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10 bg-white border-[#B9BDB8]/40 focus-visible:ring-[#8A9A83] rounded-xl text-sm"
          />
        </div>

        <Button
          onClick={abrirModalCriar}
          className="bg-[#8A9A83] hover:bg-[#75846F] text-white rounded-xl gap-2 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Paciente</span>
        </Button>
      </div>

      {/* Lista / Tabela */}
      <div className="bg-white rounded-2xl border border-[#B9BDB8]/30 shadow-xs overflow-hidden">
        {carregando ? (
          <div className="p-12 text-center text-sm text-[#8A9A83]">
            Carregando cadastro de pacientes...
          </div>
        ) : pacientesFiltrados.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#E4EADF] text-[#8A9A83] flex items-center justify-center text-2xl">
              🌿
            </div>
            <h3 className="text-base font-bold text-[#2C3A2C]">
              {busca
                ? 'Nenhum paciente encontrado para esta busca.'
                : 'Nenhum paciente cadastrado ainda.'}
            </h3>
            <p className="text-xs text-[#8A9A83] max-w-sm mx-auto">
              {busca
                ? 'Tente buscar com outro termo ou limpe a busca.'
                : 'Cadastre o primeiro paciente para começar a registrar prontuários, agendar atendimentos e gerenciar pagamentos.'}
            </p>
            {!busca && (
              <Button
                onClick={abrirModalCriar}
                className="mt-2 bg-[#8A9A83] hover:bg-[#75846F] text-white rounded-xl gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar primeiro paciente</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#4A4A48]">
              <thead className="bg-[#F7F8F6] text-[#2C3A2C] text-xs font-semibold uppercase tracking-wider border-b border-[#B9BDB8]/30">
                <tr>
                  <th className="py-4 px-6">Nome do Paciente</th>
                  <th className="py-4 px-4 hidden md:table-cell">Contato</th>
                  <th className="py-4 px-4 hidden lg:table-cell">Próxima Consulta</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#B9BDB8]/20">
                {pacientesFiltrados.map((p) => {
                  const proxima = p.proxima_consulta
                  return (
                    <tr key={p.id} className="hover:bg-[#F7F8F6]/60 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#F6E8DF] text-[#C8845F] flex items-center justify-center font-bold text-sm shrink-0">
                            {p.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-[#2C3A2C] block">{p.nome}</span>
                            <span className="text-xs text-[#8A9A83] md:hidden block">
                              {formatarTelefone(p.telefone)}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 hidden md:table-cell">
                        <div className="space-y-1">
                          {p.telefone && (
                            <div className="flex items-center gap-1.5 text-xs text-[#4A4A48]">
                              <Phone className="w-3.5 h-3.5 text-[#8A9A83]" />
                              <span>{formatarTelefone(p.telefone)}</span>
                            </div>
                          )}
                          {p.email && (
                            <div className="flex items-center gap-1.5 text-xs text-[#8A9A83]">
                              <Mail className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[200px]">{p.email}</span>
                            </div>
                          )}
                          {!p.telefone && !p.email && (
                            <span className="text-xs text-gray-400">Sem contato cadastrado</span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 hidden lg:table-cell">
                        {proxima ? (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-[#2E7D6B] bg-[#DFF0EB] px-2.5 py-1 rounded-full w-fit">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {formatarDataAbreviada(proxima.data)} às {proxima.hora_inicio}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Nenhuma agendada</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/prontuario?paciente=${p.id}`)}
                            title="Ver Prontuário"
                            className="text-[#8A9A83] hover:text-[#75846F] hover:bg-[#E4EADF] h-8 w-8 p-0 rounded-lg"
                          >
                            <ClipboardList className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => abrirModalEditar(p)}
                            title="Editar Dados"
                            className="text-[#4A4A48] hover:text-[#2C3A2C] hover:bg-gray-100 h-8 w-8 p-0 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPacienteExcluir(p)}
                            title="Excluir Paciente"
                            className="text-gray-400 hover:text-[#C45545] hover:bg-[#FBE3DE] h-8 w-8 p-0 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Modal Formulário Criar/Editar */}
      <Dialog open={modalFormAberto} onOpenChange={setModalFormAberto}>
        <DialogContent className="max-w-lg bg-white rounded-2xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#2C3A2C]">
              {pacienteEditando ? 'Editar Paciente' : 'Novo Paciente'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={salvarFormulario} className="space-y-4 mt-2">
            <div>
              <Label htmlFor="nome" className="text-xs font-semibold text-[#2C3A2C]">
                Nome completo *
              </Label>
              <Input
                id="nome"
                placeholder="Ex.: Mariana Duarte Siqueira"
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value)
                  if (erroNome) setErroNome('')
                }}
                className={`mt-1 rounded-xl ${erroNome ? 'border-red-500' : 'border-[#B9BDB8]/50'}`}
              />
              {erroNome && <p className="text-xs text-red-500 mt-1">{erroNome}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dataNasc" className="text-xs font-semibold text-[#2C3A2C]">
                  Data de nascimento
                </Label>
                <Input
                  id="dataNasc"
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className="mt-1 rounded-xl border-[#B9BDB8]/50"
                />
              </div>
              <div>
                <Label htmlFor="tel" className="text-xs font-semibold text-[#2C3A2C]">
                  Telefone
                </Label>
                <Input
                  id="tel"
                  placeholder="(11) 98765-4321"
                  value={telefone}
                  onChange={(e) => setTelefone(aplicarMascaraTelefone(e.target.value))}
                  className="mt-1 rounded-xl border-[#B9BDB8]/50"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-xs font-semibold text-[#2C3A2C]">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="exemplo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 rounded-xl border-[#B9BDB8]/50"
              />
            </div>

            <div>
              <Label htmlFor="endereco" className="text-xs font-semibold text-[#2C3A2C]">
                Endereço
              </Label>
              <Input
                id="endereco"
                placeholder="Rua, número, complemento, bairro, cidade - UF"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                className="mt-1 rounded-xl border-[#B9BDB8]/50"
              />
            </div>

            <div>
              <Label htmlFor="obs" className="text-xs font-semibold text-[#2C3A2C]">
                Observações clínicas ou de contato
              </Label>
              <Textarea
                id="obs"
                rows={3}
                placeholder="Queixa principal, encaminhamento, preferências de horário..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="mt-1 rounded-xl border-[#B9BDB8]/50 text-sm resize-none"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalFormAberto(false)}
                className="rounded-xl border-[#B9BDB8]/50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={salvando}
                className="bg-[#8A9A83] hover:bg-[#75846F] text-white rounded-xl"
              >
                {salvando ? 'Salvando...' : 'Salvar Paciente'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Exclusão em Cascata */}
      <AlertDialog
        open={!!pacienteExcluir}
        onOpenChange={(aberto) => !aberto && setPacienteExcluir(null)}
      >
        <AlertDialogContent className="bg-white rounded-2xl">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-xl bg-[#FBE3DE] text-[#C45545] flex items-center justify-center mb-2">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-lg font-bold text-[#2C3A2C]">
              Excluir paciente e histórico completo?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#4A4A48] space-y-2">
              <p>
                Tem certeza que deseja excluir <strong>{pacienteExcluir?.nome}</strong>?
              </p>
              <p className="text-xs bg-[#FBE3DE]/60 p-2.5 rounded-lg text-[#C45545]">
                <strong>Atenção:</strong> Esta ação é irreversível. Todas as consultas agendadas,
                pagamentos e as anotações do prontuário vinculadas a este paciente serão excluídos
                permanentemente em cascata.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              disabled={excluindo}
              className="bg-[#C45545] hover:bg-[#B04535] text-white rounded-xl"
            >
              {excluindo ? 'Excluindo...' : 'Excluir definitivamente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
