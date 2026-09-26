import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatarDataExtensa(data: Date = new Date()): string {
  const str = format(data, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function formatarDataAbreviada(dataStr?: string | Date): string {
  if (!dataStr) return '-'
  const d = typeof dataStr === 'string' ? new Date(dataStr) : dataStr
  if (isNaN(d.getTime())) return '-'
  return format(d, 'dd/MM/yyyy', { locale: ptBR })
}

export function formatarDataHora(dataStr?: string | Date): string {
  if (!dataStr) return '-'
  const d = typeof dataStr === 'string' ? new Date(dataStr) : dataStr
  if (isNaN(d.getTime())) return '-'
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function formatarMoeda(valor?: number): string {
  if (typeof valor !== 'number' || isNaN(valor)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor)
}

export function formatarTelefone(telefone?: string): string {
  if (!telefone) return '-'
  const limpo = telefone.replace(/\D/g, '')
  if (limpo.length === 11) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`
  }
  if (limpo.length === 10) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 6)}-${limpo.slice(6)}`
  }
  return telefone
}

export function calcularIdade(dataNascStr?: string): string {
  if (!dataNascStr) return ''
  const nasc = new Date(dataNascStr)
  if (isNaN(nasc.getTime())) return ''
  const hoje = new Date()
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
    idade--
  }
  if (idade <= 0) return 'Menos de 1 ano'
  return `${idade} anos`
}

export function obterSaudacao(): string {
  const hora = new Date().getHours()
  if (hora >= 5 && hora < 12) return 'Bom dia'
  if (hora >= 12 && hora < 18) return 'Boa tarde'
  return 'Boa noite'
}
