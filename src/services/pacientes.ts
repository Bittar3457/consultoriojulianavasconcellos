import pb from '@/lib/pocketbase/client'
import type { Paciente, Consulta } from '@/types'

export async function listarPacientes(filtro?: string): Promise<Paciente[]> {
  const options: Record<string, unknown> = {
    sort: 'nome',
    requestKey: null,
  }
  if (filtro && filtro.trim().length > 0) {
    const term = filtro.trim().replace(/'/g, "\\'")
    options.filter = `nome ~ '${term}' || telefone ~ '${term}' || email ~ '${term}'`
  }

  const items = await pb.collection('pacientes').getFullList<Paciente>(options)

  // Opcional: buscar próxima consulta de cada paciente
  try {
    const hoje = new Date().toISOString().split('T')[0]
    const consultasFuturas = await pb.collection('consultas').getFullList<Consulta>({
      filter: `data >= '${hoje}' && (status = 'Agendada' || status = 'Confirmada')`,
      sort: 'data,hora_inicio',
      requestKey: null,
    })

    const proximaPorPaciente: Record<string, Consulta> = {}
    for (const c of consultasFuturas) {
      if (!proximaPorPaciente[c.paciente_id]) {
        proximaPorPaciente[c.paciente_id] = c
      }
    }

    return items.map((p) => ({
      ...p,
      proxima_consulta: proximaPorPaciente[p.id],
    }))
  } catch {
    return items
  }
}

export async function obterPaciente(id: string): Promise<Paciente> {
  return await pb.collection('pacientes').getOne<Paciente>(id, { requestKey: null })
}

export async function criarPaciente(dados: Partial<Paciente>): Promise<Paciente> {
  return await pb.collection('pacientes').create<Paciente>(dados)
}

export async function atualizarPaciente(id: string, dados: Partial<Paciente>): Promise<Paciente> {
  return await pb.collection('pacientes').update<Paciente>(id, dados)
}

export async function excluirPacienteComCascata(id: string): Promise<void> {
  // 1. Buscar todas as consultas do paciente
  const consultas = await pb.collection('consultas').getFullList<Consulta>({
    filter: `paciente_id = '${id}'`,
    requestKey: null,
  })

  // 2. Para cada consulta, excluir seus pagamentos
  for (const c of consultas) {
    try {
      const pagamentos = await pb.collection('pagamentos').getFullList({
        filter: `consulta_id = '${c.id}'`,
        requestKey: null,
      })
      for (const pag of pagamentos) {
        await pb.collection('pagamentos').delete(pag.id)
      }
    } catch {
      // continua exclusão
    }
    // Excluir consulta
    try {
      await pb.collection('consultas').delete(c.id)
    } catch {
      // continua
    }
  }

  // 3. Excluir todas as anotações do prontuário do paciente
  try {
    const anotacoes = await pb.collection('anotacoes_prontuario').getFullList({
      filter: `paciente_id = '${id}'`,
      requestKey: null,
    })
    for (const a of anotacoes) {
      await pb.collection('anotacoes_prontuario').delete(a.id)
    }
  } catch {
    // continua
  }

  // 4. Excluir o paciente
  await pb.collection('pacientes').delete(id)
}
