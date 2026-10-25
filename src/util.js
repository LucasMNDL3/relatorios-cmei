/** "hoje às 14:32" / "ontem às 09:10" / "12/10/2026 às 14:32" */
export function quando(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const hoje = new Date()
  const soData = x => new Date(x.getFullYear(), x.getMonth(), x.getDate())
  const dias = Math.round((soData(hoje) - soData(d)) / 86400000)

  if (dias === 0) return `hoje às ${hora}`
  if (dias === 1) return `ontem às ${hora}`
  return `${d.toLocaleDateString('pt-BR')} às ${hora}`
}

/** Versão curta para a lista: "hoje", "ontem", "12/10" */
export function quandoCurto(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const hoje = new Date()
  const soData = x => new Date(x.getFullYear(), x.getMonth(), x.getDate())
  const dias = Math.round((soData(hoje) - soData(d)) / 86400000)

  if (dias === 0) return 'hoje'
  if (dias === 1) return 'ontem'
  if (dias < 7) return `há ${dias} dias`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function primeiraLetra(nome) {
  return (nome || '?').trim().charAt(0).toUpperCase()
}

export function normalizar(texto) {
  return (texto || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim()
}
