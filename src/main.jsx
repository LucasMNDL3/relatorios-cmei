import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { supabase } from './supabase'
import App from './App'
import Login from './Login'
import NovaSenha from './NovaSenha'
import './estilos.css'

function Raiz() {
  const [sessao, setSessao] = useState(null)
  const [recuperando, setRecuperando] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session)
      setCarregando(false)
    })

    const { data: assinatura } = supabase.auth.onAuthStateChange((evento, s) => {
      // Veio do link de recuperação enviado por e-mail
      if (evento === 'PASSWORD_RECOVERY') setRecuperando(true)
      setSessao(s)
    })

    return () => assinatura.subscription.unsubscribe()
  }, [])

  if (carregando) return <div className="carregando">Carregando…</div>
  if (recuperando) return <NovaSenha aoConcluir={() => setRecuperando(false)} />
  if (!sessao) return <Login />
  return <App sessao={sessao} />
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Raiz />
  </React.StrictMode>
)
