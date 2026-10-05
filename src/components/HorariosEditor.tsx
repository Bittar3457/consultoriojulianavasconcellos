import React, { useState } from 'react'
import {
  Clock,
  Plus,
  Trash2,
  Copy,
  Check,
  Calendar,
  Sparkles,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { DiaSemanaChave, HorariosAtendimentoSemana } from '@/types'

const DIAS_CONFIG: { chave: DiaSemanaChave; rotulo: string; subtitulo: string; util: boolean }[] = [
  {
    chave: 'segunda',
    rotulo: 'Segunda-feira',
    subtitulo: 'Início da semana de atendimentos',
    util: true,
  },
  { chave: 'terca', rotulo: 'Terça-feira', subtitulo: 'Dia útil', util: true },
  { chave: 'quarta', rotulo: 'Quarta-feira', subtitulo: 'Meio da semana', util: true },
  { chave: 'quinta', rotulo: 'Quinta-feira', subtitulo: 'Dia útil', util: true },
  { chave: 'sexta', rotulo: 'Sexta-feira', subtitulo: 'Fechamento da semana regular', util: true },
  { chave: 'sabado', rotulo: 'Sábado', subtitulo: 'Atendimento especial ou plantão', util: false },
  { chave: 'domingo', rotulo: 'Domingo', subtitulo: 'Fim de semana', util: false },
]

interface HorariosEditorProps {
  horariosSemana: HorariosAtendimentoSemana
  onChange: (novos: HorariosAtendimentoSemana) => void
}

export function HorariosEditor({ horariosSemana, onChange }: HorariosEditorProps) {
  const [diaSelecionado, setDiaSelecionado] = useState<DiaSemanaChave>('segunda')
  const [novoHorarioInput, setNovoHorarioInput] = useState('08:30')

  const diaAtualConfig = horariosSemana[diaSelecionado] || { ativo: false, horarios: [] }

  const alternarDiaAtivo = (chave: DiaSemanaChave) => {
    const atual = horariosSemana[chave] || { ativo: false, horarios: [] }
    const novoStatus = !atual.ativo

    // Se estiver ativando e não tiver horários, adiciona uma grade inicial sugestiva
    const horarios =
      atual.horarios.length > 0
        ? atual.horarios
        : ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']

    const atualizado: HorariosAtendimentoSemana = {
      ...horariosSemana,
      [chave]: {
        ativo: novoStatus,
        horarios: novoStatus ? horarios : atual.horarios,
      },
    }
    onChange(atualizado)
    toast.success(
      novoStatus
        ? `${DIAS_CONFIG.find((d) => d.chave === chave)?.rotulo} ativada para atendimentos.`
        : `${DIAS_CONFIG.find((d) => d.chave === chave)?.rotulo} desativada (sem atendimento).`,
    )
  }

  const adicionarHorario = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!novoHorarioInput || !novoHorarioInput.includes(':')) {
      toast.error('Informe um horário válido no formato HH:mm.')
      return
    }

    const [h, m] = novoHorarioInput.split(':').map((v) => parseInt(v, 10))
    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
      toast.error('Horário inválido. Escolha entre 00:00 e 23:59.')
      return
    }

    const horarioFormatado = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    const horariosAtuais = diaAtualConfig.horarios || []

    if (horariosAtuais.includes(horarioFormatado)) {
      toast.error('Este horário já está configurado para este dia.')
      return
    }

    const novaLista = [...horariosAtuais, horarioFormatado].sort((a, b) => {
      const [hA, mA] = a.split(':').map(Number)
      const [hB, mB] = b.split(':').map(Number)
      return hA * 60 + mA - (hB * 60 + mB)
    })

    onChange({
      ...horariosSemana,
      [diaSelecionado]: {
        ativo: true,
        horarios: novaLista,
      },
    })
    toast.success(`Horário ${horarioFormatado} adicionado!`)
  }

  const removerHorario = (horarioParaRemover: string) => {
    const novaLista = diaAtualConfig.horarios.filter((h) => h !== horarioParaRemover)
    onChange({
      ...horariosSemana,
      [diaSelecionado]: {
        ativo: diaAtualConfig.ativo,
        horarios: novaLista,
      },
    })
    toast.success(`Horário ${horarioParaRemover} removido.`)
  }

  // Copiar horários do dia selecionado para todos os outros dias úteis
  const copiarParaDiasUteis = () => {
    const horariosOrigem = [...diaAtualConfig.horarios]
    if (horariosOrigem.length === 0) {
      toast.error('Adicione ao menos um horário antes de copiar para os dias úteis.')
      return
    }

    const atualizado: HorariosAtendimentoSemana = { ...horariosSemana }
    const diasUteis: DiaSemanaChave[] = ['segunda', 'terca', 'quarta', 'quinta', 'sexta']

    diasUteis.forEach((d) => {
      atualizado[d] = {
        ativo: true,
        horarios: [...horariosOrigem],
      }
    })

    onChange(atualizado)
    toast.success(
      `Grade do dia (${horariosOrigem.length} horários) copiada para Segunda, Terça, Quarta, Quinta e Sexta!`,
    )
  }

  // Atalho para gerar intervalos de 30 ou 60 minutos
  const gerarGradeRapida = (intervaloMinutos: 30 | 50 | 60) => {
    const novos: string[] = []
    // Das 08:00 até 19:00
    let minutosAtuais = 8 * 60 // 480 min
    const minutosFim = 19 * 60 // 1140 min

    while (minutosAtuais <= minutosFim) {
      const hh = Math.floor(minutosAtuais / 60)
      const mm = minutosAtuais % 60
      novos.push(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`)
      minutosAtuais += intervaloMinutos
    }

    onChange({
      ...horariosSemana,
      [diaSelecionado]: {
        ativo: true,
        horarios: novos,
      },
    })
    toast.success(`Grade de ${intervaloMinutos} em ${intervaloMinutos} min gerada para este dia!`)
  }

  return (
    <div className="space-y-6">
      {/* Seletor de Dias da Semana (Abas/Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {DIAS_CONFIG.map((dia) => {
          const config = horariosSemana[dia.chave] || { ativo: false, horarios: [] }
          const isSelected = diaSelecionado === dia.chave
          const qtd = config.horarios.length

          return (
            <button
              key={dia.chave}
              type="button"
              onClick={() => setDiaSelecionado(dia.chave)}
              className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between min-h-[92px] ${
                isSelected
                  ? 'border-[#8A9A83] bg-[#E4EADF]/60 shadow-xs ring-2 ring-[#8A9A83]/30'
                  : config.ativo
                    ? 'border-[#B9BDB8]/40 bg-white hover:border-[#8A9A83]/50'
                    : 'border-[#B9BDB8]/25 bg-gray-50/70 opacity-75 hover:opacity-100'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold ${
                      isSelected ? 'text-[#2C3A2C]' : 'text-[#4A4A48]'
                    }`}
                  >
                    {dia.rotulo.split('-')[0]}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      config.ativo ? 'bg-[#2E7D6B]' : 'bg-gray-300'
                    }`}
                    title={config.ativo ? 'Dia com atendimento ativo' : 'Dia fechado'}
                  />
                </div>
                <span className="text-[10px] text-[#8A9A83] block mt-0.5">
                  {dia.util ? 'Útil' : 'Fim de semana'}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px]">
                {config.ativo ? (
                  <span className="font-semibold text-[#2C3A2C] bg-white/80 px-2 py-0.5 rounded-md border border-[#B9BDB8]/30">
                    {qtd} {qtd === 1 ? 'horário' : 'horários'}
                  </span>
                ) : (
                  <span className="text-gray-400 font-medium">Fechado</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Editor Detalhado do Dia Selecionado */}
      <div className="bg-[#F7F8F6] rounded-2xl border border-[#B9BDB8]/30 p-5 sm:p-6 space-y-6">
        {/* Cabeçalho do Dia */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#B9BDB8]/20">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#8A9A83]" />
              <h3 className="text-base font-bold text-[#2C3A2C]">
                {DIAS_CONFIG.find((d) => d.chave === diaSelecionado)?.rotulo}
              </h3>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  diaAtualConfig.ativo ? 'bg-[#DFF0EB] text-[#2E7D6B]' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {diaAtualConfig.ativo ? 'Atendimento Ativo' : 'Dia Fechado'}
              </span>
            </div>
            <p className="text-xs text-[#8A9A83] mt-1">
              {DIAS_CONFIG.find((d) => d.chave === diaSelecionado)?.subtitulo}. Defina os horários
              livres para esta data na grade da Agenda.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => alternarDiaAtivo(diaSelecionado)}
              className={`rounded-xl text-xs font-semibold gap-1.5 ${
                diaAtualConfig.ativo
                  ? 'border-[#C45545]/40 text-[#C45545] hover:bg-[#FBE3DE]'
                  : 'border-[#2E7D6B]/40 text-[#2E7D6B] hover:bg-[#DFF0EB]'
              }`}
            >
              {diaAtualConfig.ativo ? 'Desativar este dia' : 'Ativar atendimento'}
            </Button>

            {diaAtualConfig.ativo && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copiarParaDiasUteis}
                title="Aplica a mesma grade de horários para Segunda, Terça, Quarta, Quinta e Sexta"
                className="rounded-xl border-[#8A9A83]/50 text-[#3A4A3A] bg-white hover:bg-[#E4EADF]/60 text-xs font-semibold gap-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-[#8A9A83]" />
                <span>Copiar p/ dias úteis</span>
              </Button>
            )}
          </div>
        </div>

        {diaAtualConfig.ativo ? (
          <>
            {/* Bloco de Adicionar Horário Fracionado */}
            <div className="bg-white rounded-xl p-4 border border-[#B9BDB8]/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#8A9A83]" />
                  <span className="text-xs font-bold text-[#2C3A2C]">
                    Adicionar Horário Livre (com minutos livres, ex.: 08:30, 09:15)
                  </span>
                </div>

                {/* Atalhos de geração rápida */}
                <div className="flex items-center gap-1.5 text-xs text-[#8A9A83]">
                  <span className="text-[11px]">Gerar grade:</span>
                  <button
                    type="button"
                    onClick={() => gerarGradeRapida(30)}
                    className="px-2 py-0.5 rounded-md bg-[#F7F8F6] hover:bg-[#E4EADF] text-[#2C3A2C] font-semibold text-[11px] border border-[#B9BDB8]/30 transition-colors"
                  >
                    De 30 em 30 min
                  </button>
                  <button
                    type="button"
                    onClick={() => gerarGradeRapida(50)}
                    className="px-2 py-0.5 rounded-md bg-[#F7F8F6] hover:bg-[#E4EADF] text-[#2C3A2C] font-semibold text-[11px] border border-[#B9BDB8]/30 transition-colors"
                  >
                    De 50 em 50 min
                  </button>
                  <button
                    type="button"
                    onClick={() => gerarGradeRapida(60)}
                    className="px-2 py-0.5 rounded-md bg-[#F7F8F6] hover:bg-[#E4EADF] text-[#2C3A2C] font-semibold text-[11px] border border-[#B9BDB8]/30 transition-colors"
                  >
                    Horas cheias (60 min)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 max-w-sm">
                <Input
                  type="time"
                  step="300"
                  value={novoHorarioInput}
                  onChange={(e) => setNovoHorarioInput(e.target.value)}
                  className="rounded-xl border-[#B9BDB8]/50 text-sm font-semibold"
                />
                <Button
                  type="button"
                  onClick={adicionarHorario}
                  className="bg-[#8A9A83] hover:bg-[#75846F] text-white rounded-xl gap-1.5 shrink-0 text-xs shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Incluir horário</span>
                </Button>
              </div>
            </div>

            {/* Grade de Horários Atuais do Dia */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#2C3A2C]">
                  Horários disponíveis neste dia ({diaAtualConfig.horarios.length}):
                </span>
                {diaAtualConfig.horarios.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange({
                        ...horariosSemana,
                        [diaSelecionado]: { ativo: true, horarios: [] },
                      })
                      toast.success('Horários removidos deste dia.')
                    }}
                    className="text-[11px] text-[#C45545] hover:underline"
                  >
                    Limpar todos os horários
                  </button>
                )}
              </div>

              {diaAtualConfig.horarios.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-dashed border-[#B9BDB8]/40 space-y-2">
                  <Clock className="w-8 h-8 text-[#8A9A83]/50 mx-auto" />
                  <p className="text-xs font-semibold text-[#2C3A2C]">
                    Nenhum horário cadastrado para este dia.
                  </p>
                  <p className="text-[11px] text-[#8A9A83]">
                    Utilize o seletor acima para adicionar horários ou clique nos botões de geração
                    rápida.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {diaAtualConfig.horarios.map((horario) => (
                    <div
                      key={horario}
                      className="bg-white rounded-xl border border-[#B9BDB8]/40 px-3 py-2 flex items-center justify-between group hover:border-[#8A9A83] hover:shadow-xs transition-all"
                    >
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#8A9A83]" />
                        <span className="text-xs font-bold text-[#2C3A2C]">{horario}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removerHorario(horario)}
                        className="text-gray-300 hover:text-[#C45545] p-1 rounded-md transition-colors"
                        title={`Remover ${horario}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-10 text-center bg-white rounded-xl border border-[#B9BDB8]/30 space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto text-xl">
              🌙
            </div>
            <h4 className="text-sm font-bold text-[#2C3A2C]">Atendimento desativado neste dia</h4>
            <p className="text-xs text-[#8A9A83] max-w-sm mx-auto">
              A psicóloga não atende consultas neste dia da semana. Na Agenda, o dia será exibido
              com o aviso de dia fechado.
            </p>
            <Button
              type="button"
              onClick={() => alternarDiaAtivo(diaSelecionado)}
              className="bg-[#8A9A83] hover:bg-[#75846F] text-white rounded-xl text-xs gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Ativar atendimentos para este dia</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
