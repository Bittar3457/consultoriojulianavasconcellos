import pb from '@/lib/pocketbase/client'
import type { Consulta } from '@/types'

export async function listarConsultas(options?: {
  dataInicio?: string
  dataFim?: string
  pacienteId?: string
  status?: string
}): Promise<Consulta[]> {
  const filters: string[] = []

  if (options?.dataInicio && options?.dataFim) {
    filters.push(`data >= '${options.dataInicio}' && data <= '${options.dataFim}'`)
  } else if (options?.dataInicio) {
    filters.push(`data >= '${options.dataInicio}'`)
  }

  if (options?.pacienteId) {
    filters.push(`paciente_id = '${options.pacienteId}'`)
  }

  if (options?.status) {
    filters.push(`status = '${options.status}'`)
  }

  return await pb.collection('consultas').getFullList<Consulta>({
    filter: filters.length > 0 ? filters.join(' && ') : undefined,
    sort: 'data,hora_inicio',
    expand: 'paciente_id',
    requestKey: null,
  })
}

export async function obterProximasConsultas(limite: number = 5): Promise<Consulta[]> {
  const hoje = new Date().toISOString().split('T')[0]
  return await pb
    .collection('consultas')
    .getList<Consulta>(1, limite, {
      filter: `data >= '${hoje}' && status != 'Cancelada'`,
      sort: 'data,hora_inicio',
      expand: 'paciente_id',
      requestKey: null,
    })
    .then((res) => res.items)
}

export async function verificarConflitoHorario(
  data: string,
  horaInicio: string,
  consultaIdIgnorar?: string,
): Promise<boolean> {
  // Conflito no mesmo dia e mesmo horário exato de início
  let filter = `data ~ '${data.split('T')[0]}' && hora_inicio = '${horaInicio}' && status != 'Cancelada'`
  if (consultaIdIgnorar) {
    filter += ` && id != '${consultaIdIgnorar}'`
  }
  const existentes = await pb.collection('consultas').getFullList<Consulta>({
    filter,
    requestKey: null,
  })
  return existentes.length > 0
}

export async function criarConsulta(dados: {
  paciente_id: string
  data: string
  hora_inicio: string
  duracao_minutos?: number
  modalidade?: string
  status?: string
  observacoes?: string
  valor_total?: number
  criar_pagamento?: boolean
  forma_pagamento?: string
}): Promise<Consulta> {
  const conflito = await verificarConflitoHorario(dados.data, dados.hora_inicio)
  if (conflito) {
    throw new Error('Já existe uma consulta agendada nesse horário.')
  }

  const consulta = await pb.collection('consultas').create<Consulta>({
    paciente_id: dados.paciente_id,
    data: dados.data.includes('T') ? dados.data : `${dados.data} 00:00:00.000Z`,
    hora_inicio: dados.hora_inicio,
    duracao_minutos: dados.duracao_minutos || 50,
    modalidade: dados.modalidade || 'Mista',
    status: dados.status || 'Agendada',
    observacoes: dados.observacoes || '',
    valor_total: dados.valor_total || 0,
  })

  // Criar pagamento vinculado automaticamente
  if (dados.criar_pagamento !== false && dados.valor_total && dados.valor_total > 0) {
    try {
      await pb.collection('pagamentos').create({
        consulta_id: consulta.id,
        valor: dados.valor_total,
        status: dados.status === 'Realizada' ? 'Pago' : 'Pendente',
        forma_pagamento: dados.forma_pagamento || 'Pix',
        data_pagamento: dados.status === 'Realizada' ? consulta.data : null,
      })
    } catch {
      // continua
    }
  }

  return consulta
}

export async function atualizarConsulta(id: string, dados: Partial<Consulta>): Promise<Consulta> {
  if (dados.data && dados.hora_inicio) {
    const conflito = await verificarConflitoHorario(dados.data, dados.hora_inicio, id)
    if (conflito) {
      throw new Error('Já existe uma consulta agendada nesse horário.')
    }
  }

  const payload: Record<string, unknown> = { ...dados }
  if (dados.data && !dados.data.includes('T')) {
    payload.data = `${dados.data} 00:00:00.000Z`
  }

  return await pb.collection('consultas').update<Consulta>(id, payload)
}

export async function excluirConsulta(id: string): Promise<void> {
  // Excluir pagamentos vinculados primeiro
  try {
    const pags = await pb.collection('pagamentos').getFullList({
      filter: `consulta_id = '${id}'`,
      requestKey: null,
    })
    for (const p of pags) {
      await pb.collection('pagamentos').delete(p.id)
    }
  } catch {
    // continua
  }
  await pb.collection('consultas').delete(id)
}
