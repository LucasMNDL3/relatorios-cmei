import { useState } from 'react'
import { supabase } from './supabase'
import { Logo, Alerta } from './icones'

export default function NovaSenha({ aoConcluir }) {
  const [senha, setSenha] = useState('')
  const [repetir, setRepetir] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    setErro('')
    if (senha.length < 6) return setErro('A senha precisa ter pelo menos 6 letras ou números.')
    if (senha !== repetir) return setErro('As duas senhas estão diferentes. Confira e digite de novo.')

    setSalvando(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setSalvando(false)

    if (error) {
      setErro('Não foi possível salvar. O link pode ter expirado — peça um novo.')
      return
    }
    aoConcluir()
  }

  return (
    <div className="tela-login">
      <main className="cartao">
        <div className="marca">
          <Logo tamanho={28} />
          <span>Educação Infantil</span>
        </div>

        <h1>Criar senha nova</h1>
        <p className="sub">Escolha uma senha que você vai lembrar. Mínimo de 6 letras ou números.</p>

        {erro && <div className="aviso" role="alert"><Alerta /><span>{erro}</span></div>}

        <div className="campo">
          <div className="linha-senha">
            <label htmlFor="nova">Senha nova</label>
            <button type="button" className="mostrar" onClick={() => setMostrar(v => !v)}>
              {mostrar ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          <input type={mostrar ? 'text' : 'password'} id="nova"
                 autoComplete="new-password" value={senha}
                 onChange={e => { setSenha(e.target.value); setErro('') }} />
        </div>

        <div className="campo">
          <label htmlFor="repetir">Digite a senha de novo</label>
          <input type={mostrar ? 'text' : 'password'} id="repetir"
                 autoComplete="new-password" value={repetir}
                 onChange={e => { setRepetir(e.target.value); setErro('') }}
                 onKeyDown={e => { if (e.key === 'Enter') salvar() }} />
        </div>

        <button className="botao cheio largura-total" onClick={salvar} disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar senha nova'}
        </button>
      </main>
    </div>
  )
}
