import pb from '@/lib/pocketbase/client'
import type { PreferenciasUsuario, HorariosAtendimentoSemana } from '@/types'

export const HORARIOS_PADRAO_CONSULTORIO: HorariosAtendimentoSemana = {
  segunda: {
    ativo: true,
    horarios: [
      '08:00',
      '09:00',
      '10:00',
      '11:00',
      '12:00',
      '13:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
      '19:00',
    ],
  },
  terca: {
    ativo: true,
    horarios: [
      '08:00',
      '09:00',
      '10:00',
      '11:00',
      '12:00',
      '13:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
      '19:00',
    ],
  },
  quarta: {
    ativo: true,
    horarios: [
      '08:00',
      '09:00',
      '10:00',
      '11:00',
      '12:00',
      '13:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
      '19:00',
    ],
  },
  quinta: {
    ativo: true,
    horarios: [
      '08:00',
      '09:00',
      '10:00',
      '11:00',
      '12:00',
      '13:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
      '19:00',
    ],
  },
  sexta: {
    ativo: true,
    horarios: [
      '08:00',
      '09:00',
      '10:00',
      '11:00',
      '12:00',
      '13:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
      '19:00',
    ],
  },
  sabado: {
    ativo: false,
    horarios: [],
  },
  domingo: {
    ativo: false,
    horarios: [],
  },
}

export async function obterPreferencias(): Promise<PreferenciasUsuario> {
  try {
    const list = await pb.collection('preferencias_usuario').getFullList<PreferenciasUsuario>({
      sort: 'created',
      requestKey: null,
    })
    if (list.length > 0) {
      const pref = list[0]
      if (!pref.horarios_atendimento || Object.keys(pref.horarios_atendimento).length === 0) {
        pref.horarios_atendimento = HORARIOS_PADRAO_CONSULTORIO
      }
      return pref
    }
    // Se não existir, criar padrão
    return await pb.collection('preferencias_usuario').create<PreferenciasUsuario>({
      nome_profissional: 'Juliana T A S Vasconcellos',
      cargo: 'Psicóloga',
      monograma: 'JV',
      modalidade_padrao: 'Mista',
      valor_padrao_sessao: 220.0,
      horarios_atendimento: HORARIOS_PADRAO_CONSULTORIO,
    })
  } catch {
    return {
      id: '',
      nome_profissional: 'Juliana T A S Vasconcellos',
      cargo: 'Psicóloga',
      monograma: 'JV',
      modalidade_padrao: 'Mista',
      valor_padrao_sessao: 220.0,
      horarios_atendimento: HORARIOS_PADRAO_CONSULTORIO,
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
