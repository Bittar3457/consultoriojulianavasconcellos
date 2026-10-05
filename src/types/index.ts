export type ModalidadeConsulta = 'Presencial' | 'Online' | 'Mista'
export type StatusConsulta = 'Agendada' | 'Confirmada' | 'Realizada' | 'Faltou' | 'Cancelada'
export type StatusPagamento = 'Pago' | 'Pendente' | 'Cancelado'
export type FormaPagamento = 'Pix' | 'Cartão' | 'Dinheiro' | 'Transferência' | 'Outro'
export type TipoPagamento = 'Consulta' | 'Mensal'
export type TagProntuario = 'Avaliação inicial' | 'Revisão' | 'Alta' | 'Crise' | 'Outro'

export type DiaSemanaChave =
  | 'segunda'
  | 'terca'
  | 'quarta'
  | 'quinta'
  | 'sexta'
  | 'sabado'
  | 'domingo'

export interface ConfiguracaoDiaHorario {
  ativo: boolean
  horarios: string[] // ex: ['08:00', '08:30', '09:00', ...]
}

export type HorariosAtendimentoSemana = Record<DiaSemanaChave, ConfiguracaoDiaHorario>

export interface Usuario {
  id: string
  email: string
  name: string
  avatar?: string
  created: string
  updated: string
}

export interface PreferenciasUsuario {
  id: string
  nome_profissional: string
  cargo: string
  monograma: string
  modalidade_padrao: ModalidadeConsulta
  valor_padrao_sessao: number
  horarios_atendimento?: HorariosAtendimentoSemana
  created: string
  updated: string
}

export interface Paciente {
  id: string
  nome: string
  data_nascimento?: string
  telefone?: string
  email?: string
  endereco?: string
  observacoes?: string
  created: string
  updated: string
  // Calculado/expansão opcional
  proxima_consulta?: Consulta
}

export interface Consulta {
  id: string
  paciente_id: string
  data: string // YYYY-MM-DD ou ISO
  hora_inicio: string // HH:mm
  duracao_minutos: number
  modalidade: ModalidadeConsulta
  status: StatusConsulta
  observacoes?: string
  valor_total?: number
  created: string
  updated: string
  expand?: {
    paciente_id?: Paciente
    pagamentos?: Pagamento[]
  }
}

export interface Pagamento {
  id: string
  consulta_id?: string
  paciente_id?: string
  tipo_pagamento?: TipoPagamento
  mes_referencia?: string // "YYYY-MM"
  descricao?: string
  valor: number
  status: StatusPagamento
  forma_pagamento: FormaPagamento
  data_pagamento?: string
  created: string
  updated: string
  expand?: {
    consulta_id?: Consulta
    paciente_id?: Paciente
  }
}

export interface AnotacaoProntuario {
  id: string
  paciente_id: string
  consulta_id?: string
  data: string
  conteudo: string
  tags?: TagProntuario[]
  created: string
  updated: string
}
