export function Logo({ tamanho = 26, opacidade = 1 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 30 30" fill="none"
         aria-hidden="true" style={{ opacity: opacidade, flexShrink: 0 }}>
      <rect x="4" y="3" width="22" height="24" rx="3" fill="#3F6B54" />
      <rect x="1.5" y="6" width="4" height="18" rx="2" fill="#2F5340" />
      <path d="M10 11h11M10 15.5h11M10 20h7" stroke="#FBFCFA"
            strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function Mais() {
  return (
    <svg width="18" height="18" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M11 4v14M4 11h14" stroke="currentColor"
            strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}

export function SetaEsquerda() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M11 3.5L5.5 9l5.5 5.5" stroke="currentColor"
            strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function SetaDireita() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M7 3.5L12.5 9 7 14.5" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function TresPontos() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="3.6" r="1.6" fill="currentColor" />
      <circle cx="9" cy="9" r="1.6" fill="currentColor" />
      <circle cx="9" cy="14.4" r="1.6" fill="currentColor" />
    </svg>
  )
}

export function Copiar() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="6.2" y="6.2" width="9.3" height="9.3" rx="2"
            stroke="currentColor" strokeWidth="1.6" />
      <path d="M11.8 6.2V4.5a2 2 0 0 0-2-2H4.5a2 2 0 0 0-2 2v5.3a2 2 0 0 0 2 2h1.7"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function Grupo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="17" cy="9.5" r="2.4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 15.2c2.4.2 4.2 2 4.2 3.8" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function Alerta() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"
         style={{ flexShrink: 0, marginTop: 3 }}>
      <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="12.8" r="1.1" fill="currentColor" />
    </svg>
  )
}
