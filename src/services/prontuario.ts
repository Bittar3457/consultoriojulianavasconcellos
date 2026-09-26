import pb from '@/lib/pocketbase/client'
import type { AnotacaoProntuario } from '@/types'

export async function listarAnotacoesPaciente(pacienteId: string): Promise<AnotacaoProntuario[]> {
  return await pb.collection('anotacoes_prontuario').getFullList<AnotacaoProntuario>({
    filter: `paciente_id = '${pacienteId}'`,
    sort: '-data,-created',
    requestKey: null,
  })
}

export async function criarAnotacao(dados: {
  paciente_id: string
  consulta_id?: string
  data: string
  conteudo: string
  tags?: string[]
}): Promise<AnotacaoProntuario> {
  const payload = {
    ...dados,
    data: dados.data.includes('T') ? dados.data : `${dados.data} 00:00:00.000Z`,
  }
  return await pb.collection('anotacoes_prontuario').create<AnotacaoProntuario>(payload)
}

export async function atualizarAnotacao(
  id: string,
  dados: Partial<AnotacaoProntuario>,
): Promise<AnotacaoProntuario> {
  const payload: Record<string, unknown> = { ...dados }
  if (dados.data && !dados.data.includes('T')) {
    payload.data = `${dados.data} 00:00:00.000Z`
  }
  return await pb.collection('anotacoes_prontuario').update<AnotacaoProntuario>(id, payload)
}

export async function excluirAnotacao(id: string): Promise<void> {
  await pb.collection('anotacoes_prontuario').delete(id)
}
