import pb from '@/lib/pocketbase/client'
import type { PreferenciasUsuario } from '@/types'

export async function obterPreferencias(): Promise<PreferenciasUsuario> {
  try {
    const list = await pb.collection('preferencias_usuario').getFullList<PreferenciasUsuario>({
      sort: 'created',
      requestKey: null,
    })
    if (list.length > 0) {
      return list[0]
    }
    // Se não existir, criar padrão
    return await pb.collection('preferencias_usuario').create<PreferenciasUsuario>({
      nome_profissional: 'Juliana T A S Vasconcellos',
      cargo: 'Psicóloga',
      monograma: 'JV',
      modalidade_padrao: 'Mista',
      valor_padrao_sessao: 220.0,
    })
  } catch {
    return {
      id: '',
      nome_profissional: 'Juliana T A S Vasconcellos',
      cargo: 'Psicóloga',
      monograma: 'JV',
      modalidade_padrao: 'Mista',
      valor_padrao_sessao: 220.0,
      created: '',
      updated: '',
    }
  }
}

export async function atualizarPreferencias(
  id: string,
  dados: Partial<PreferenciasUsuario>,
): Promise<PreferenciasUsuario> {
  if (!id) {
    return await pb.collection('preferencias_usuario').create<PreferenciasUsuario>(dados)
  }
  return await pb.collection('preferencias_usuario').update<PreferenciasUsuario>(id, dados)
}
