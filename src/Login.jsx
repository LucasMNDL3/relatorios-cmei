import { useState } from 'react'
import { supabase } from './supabase'
import { Logo, Alerta, SetaEsquerda } from './icones'

export default function Login() {
  const [modo, setModo] = useState('entrar')   // entrar | recuperar
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [lembrar, setLembrar] = useState(true)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [ocupado, setOcupado] = useState(false)

  function emailValido(e) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.trim())
  }

  async function entrar() {
    setErro('')
    if (!email.trim()) return setErro('Digite seu e-mail para entrar.')
    if (!senha) return setErro('Digite sua senha para entrar.')

    setOcupado(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(), password: senha
    })
    setOcupado(false)
    if (error) setErro('E-mail ou senha incorretos. Confira e tente de novo.')
  }

  async function enviarLink() {
    setErro('')
    setAviso('')
    if (!email.trim()) return setErro('Digite o e-mail da sua conta.')
    if (!emailValido(email)) return setErro('Esse e-mail não parece completo. Confira se está certo.')

    setOcupado(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin
    })
    setOcupado(false)

    if (error) {
      setErro('Não foi possível enviar agora. Tente de novo em alguns minutos.')
      return
    }
    setAviso(
      'Pronto. Se existir uma conta com esse e-mail, o link para criar a nova ' +
      'senha chega em instantes. Olhe também a caixa de spam.'
    )
  }

  function voltarParaEntrar() {
    setModo('entrar')
    setErro('')
    setAviso('')
  }

  // ---------- Tela de recuperação ----------
  if (modo === 'recuperar') {
    return (
      <div className="tela-login">
        <main className="cartao">
          <button className="voltar" onClick={voltarParaEntrar}>
            <SetaEsquerda /> Voltar
          </button>

          <h1>Esqueci minha senha</h1>
          <p className="sub">
            Digite o e-mail da sua conta. Enviamos um link para você criar uma senha nova.
          </p>

          {erro && <div className="aviso" role="alert"><Alerta /><span>{erro}</span></div>}
          {aviso && <div className="aviso-bom" role="status">{aviso}</div>}

          <div className="campo">
            <label htmlFor="email-rec">E-mail</label>
            <input type="email" id="email-rec" inputMode="email" autoComplete="username"
                   placeholder="nome@exemplo.com" spellCheck="false"
                   value={email}
                   onChange={e => { setEmail(e.target.value); setErro(''); setAviso('') }}
                   onKeyDown={e => { if (e.key === 'Enter') enviarLink() }} />
          </div>

          <button className="botao cheio largura-total" onClick={enviarLink} disabled={ocupado}>
            {ocupado ? 'Enviando…' : 'Enviar link por e-mail'}
          </button>
        </main>
      </div>
    )
  }

  // ---------- Tela de entrada ----------
  return (
    <div className="tela-login">
      <main className="cartao">
        <div className="marca">
          <Logo tamanho={28} />
          <span>Educação Infantil</span>
        </div>

        <h1>Relatórios dos Alunos</h1>
        <p className="sub">Entre para ver suas crianças e escrever as anotações.</p>

        {erro && <div className="aviso" role="alert"><Alerta /><span>{erro}</span></div>}

        <div className="campo">
          <label htmlFor="email">E-mail</label>
          <input type="email" id="email" inputMode="email" autoComplete="username"
                 placeholder="nome@exemplo.com" spellCheck="false"
                 value={email}
                 onChange={e => { setEmail(e.target.value); setErro('') }} />
        </div>

        <div className="campo">
          <div className="linha-senha">
            <label htmlFor="senha">Senha</label>
            <button type="button" className="mostrar" onClick={() => setMostrar(v => !v)}>
              {mostrar ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          <input type={mostrar ? 'text' : 'password'} id="senha"
                 autoComplete="current-password" value={senha}
                 onChange={e => { setSenha(e.target.value); setErro('') }}
                 onKeyDown={e => { if (e.key === 'Enter') entrar() }} />
        </div>

        <label className="lembrar" htmlFor="lembrar">
          <input type="checkbox" id="lembrar" checked={lembrar}
                 onChange={e => setLembrar(e.target.checked)} />
          <span>Continuar conectada neste aparelho</span>
        </label>

        <button className="botao cheio largura-total" onClick={entrar} disabled={ocupado}>
          {ocupado ? 'Entrando…' : 'Entrar'}
        </button>

        <button type="button" className="esqueci" onClick={() => { setModo('recuperar'); setErro('') }}>
          Esqueci minha senha
        </button>
      </main>
    </div>
  )
}
