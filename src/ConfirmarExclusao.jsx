import { useState } from 'react'
import { Alerta } from './icones'

const PALAVRA = 'EXCLUIR'

/**
 * Confirmação para ações que não têm volta.
 * Exige digitar uma palavra, então não acontece por toque acidental.
 */
export default function ConfirmarExclusao({ titulo, explicacao, aoConfirmar, aoCancelar }) {
  const [digitado, setDigitado] = useState('')
  const liberado = digitado.trim().toUpperCase() === PALAVRA

  return (
    <>
      <div className="fundo-menu" onClick={aoCancelar} />
      <div className="caixa-confirmar" role="dialog" aria-label={titulo}>
        <div className="confirmar-topo">
          <Alerta />
          <h2>{titulo}</h2>
        </div>

        <p className="confirmar-texto">{explicacao}</p>

        <div className="campo">
          <label htmlFor="palavra-confirma">
            Para confirmar, digite <b>{PALAVRA}</b> abaixo
          </label>
          <input type="text" id="palavra-confirma" value={digitado} autoFocus
                 autoComplete="off" autoCapitalize="characters" spellCheck="false"
                 placeholder={PALAVRA}
                 onChange={e => setDigitado(e.target.value)}
                 onKeyDown={e => { if (e.key === 'Enter' && liberado) aoConfirmar() }} />
        </div>

        <div className="acoes">
          <button className="botao perigo-cheio" onClick={aoConfirmar} disabled={!liberado}>
            Excluir
          </button>
          <button className="botao contorno" onClick={aoCancelar}>Cancelar</button>
        </div>
      </div>
    </>
  )
}
