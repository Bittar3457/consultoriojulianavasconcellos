import pb from '@/lib/pocketbase/client'
import type { Pagamento, StatusPagamento } from '@/types'

export async function listarPagamentos(options?: {
  status?: string
  mesAno?: string // "YYYY-MM"
}): Promise<Pagamento[]> {
  const filters: string[] = []

  if (options?.status && options.status !== 'todos') {
    filters.push(`status = '${options.status}'`)
  }

  // Ordenar por data mais recente
  const pagamentos = await pb.collection('pagamentos').getFullList<Pagamento>({
    filter: filters.length > 0 ? filters.join(' && ') : undefined,
    sort: '-created',
    expand: 'consulta_id,consulta_id.paciente_id,paciente_id',
    requestKey: null,
  })

  if (options?.mesAno) {
    const [anoStr, mesStr] = options.mesAno.split('-')
    const ano = parseInt(anoStr, 10)
    const mes = parseInt(mesStr, 10)

    return pagamentos.filter((p) => {
      // Se for pagamento mensal e tiver mes_referencia definido, respeita diretamente
      if (p.tipo_pagamento === 'Mensal' && p.mes_referencia) {
        return p.mes_referencia === options.mesAno
      }

      // Caso contrário (consulta ou sem mes_referencia explicito):
      // Usa data de pagamento, data da consulta ou criação
      const dataRef = p.data_pagamento || p.expand?.consulta_id?.data || p.created
      if (!dataRef) return false
      const d = new Date(dataRef)
      return d.getUTCFullYear() === ano && d.getUTCMonth() + 1 === mes
    })
  }

  return pagamentos
}

export async function marcarComoPago(id: string, formaPagamento?: string): Promise<Pagamento> {
  const agora = new Date().toISOString()
  const payload: Record<string, unknown> = {
    status: 'Pago',
    data_pagamento: agora,
  }
  if (formaPagamento) {
    payload.forma_pagamento = formaPagamento
  }
  return await pb.collection('pagamentos').update<Pagamento>(id, payload)
}

export async function atualizarPagamento(
  id: string,
  dados: Partial<Pagamento>,
): Promise<Pagamento> {
  return await pb.collection('pagamentos').update<Pagamento>(id, dados)
}

export async function criarPagamento(dados: Partial<Pagamento>): Promise<Pagamento> {
  return await pb.collection('pagamentos').create<Pagamento>(dados)
}
