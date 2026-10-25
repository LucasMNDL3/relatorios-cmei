import { useEffect, useState, useRef } from 'react'
import { supabase } from './supabase'
import { quando, primeiraLetra } from './util'
import { SetaEsquerda, Alerta } from './icones'

export default function Crianca({ crianca, aoVoltar, aoMudarCrianca }) {
  const [anotacoes, setAnotacoes] = useState([])
  const [texto, setTexto] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const [editandoId, setEditandoId] = useState(null)
  const [textoEdicao, setTextoEdicao] = useState('')

  const [renomeando, setRenomeando] = useState(false)
  const [nomeNovo, setNomeNovo] = useState(crianca.nome)

  const campo = useRef(null)
  const chaveRascunho = `rascunho:${crianca.id}`

  // recupera rascunho não enviado
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(chaveRascunho)
      if (guardado) setTexto(guardado)
    } catch { /* navegador sem storage, segue sem rascunho */ }
  }, [chaveRascunho])

  // guarda rascunho enquanto digita
  useEffect(() => {
    try {
      if (texto.trim()) localStorage.setItem(chaveRascunho, texto)
      else localStorage.removeItem(chaveRascunho)
    } catch { /* sem storage */ }
  }, [texto, chaveRascunho])

  async function carregar() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('anotacoes').select('*')
      .eq('crianca_id', crianca.id)
      .order('criado_em', { ascending: false })
    if (error) setErro('Não foi possível carregar as anotações.')
    setAnotacoes(data || [])
    setCarregando(false)
  }

  useEffect(() => { carregar() }, [crianca.id])

  async function salvar() {
    const conteudo = texto.trim()
    if (!conteudo) return

    setSalvando(true)
    setErro('')
    const { error } = await supabase.from('anotacoes')
      .insert({ crianca_id: crianca.id, texto: conteudo })
    setSalvando(false)

    if (error) {
      setErro('Não foi possível salvar. Verifique a internet e tente de novo.')
      return
    }
    setTexto('')
    try { localStorage.removeItem(chaveRascunho) } catch { /* sem storage */ }
    await carregar()
    aoMudarCrianca?.()
    campo.current?.focus()
  }

  async function salvarEdicao(id) {
    const conteudo = textoEdicao.trim()
    if (!conteudo) return
    await supabase.from('anotacoes').update({ texto: conteudo }).eq('id', id)
    setEditandoId(null)
    await carregar()
  }

  async function excluir(id) {
    if (!confirm('Excluir esta anotação? Não tem como desfazer.')) return
    await supabase.from('anotacoes').delete().eq('id', id)
    await carregar()
    aoMudarCrianca?.()
  }

  async function salvarNome() {
    const novo = nomeNovo.trim()
    if (!novo) return
    await supabase.from('criancas').update({ nome: novo }).eq('id', crianca.id)
    crianca.nome = novo
    setRenomeando(false)
    aoMudarCrianca?.()
  }

  async function arquivar() {
    if (!confirm(
      `Tirar ${crianca.nome} da lista? As anotações continuam guardadas, ` +
      `e você pode trazer de volta depois.`
    )) return
    await supabase.from('criancas').update({ arquivada: true }).eq('id', crianca.id)
    aoMudarCrianca?.()
    aoVoltar()
  }

  return (
    <div className="pagina">
      <button className="voltar" onClick={aoVoltar}>
        <SetaEsquerda /> Todas as crianças
      </button>

      <div className="cabecalho-crianca">
        <span className="inicial" aria-hidden="true">{primeiraLetra(crianca.nome)}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          {renomeando ? (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input type="text" value={nomeNovo} autoFocus
                     style={{ flex: 1, minWidth: 180 }}
                     onChange={e => setNomeNovo(e.target.value)}
                     onKeyDown={e => { if (e.key === 'Enter') salvarNome() }} />
              <button className="botao contorno menor" onClick={salvarNome}>Salvar</button>
              <button className="botao contorno menor"
                      onClick={() => { setRenomeando(false); setNomeNovo(crianca.nome) }}>
                Cancelar
              </button>
            </div>
          ) : (
            <>
              <h1>{crianca.nome}</h1>
              <p>
                {anotacoes.length === 0 ? 'nenhuma anotação ainda'
                  : anotacoes.length === 1 ? '1 anotação'
                  : `${anotacoes.length} anotações`}
              </p>
            </>
          )}
        </div>
        {!renomeando && (
          <button className="botao contorno menor" onClick={() => setRenomeando(true)}>
            Trocar nome
          </button>
        )}
      </div>

      {erro && <div className="aviso" role="alert"><Alerta /><span>{erro}</span></div>}

      <div className="escrever">
        <label htmlFor="nova">Nova anotação</label>
        <span className="dica">
          Escreva o que você observou agora. A data e a hora são guardadas sozinhas.
        </span>
        <textarea id="nova" ref={campo} rows="5" value={texto}
                  onChange={e => setTexto(e.target.value)}
                  placeholder={`O que ${crianca.nome.split(' ')[0]} fez hoje…`} />
        <div className="acoes">
          <button className="botao cheio" onClick={salvar}
                  disabled={!texto.trim() || salvando}>
            {salvando ? 'Salvando…' : 'Salvar anotação'}
          </button>
          {texto.trim() && !salvando && (
            <span className="rascunho-aviso">
              <span className="bolinha" aria-hidden="true"></span>
              guardado neste aparelho até você salvar
            </span>
          )}
        </div>
      </div>

      <div className="divisor">
        <h2>Anotações</h2>
        <span className="risco"></span>
        {anotacoes.length > 0 && (
          <span className="conta">da mais nova para a mais antiga</span>
        )}
      </div>

      {carregando && <div className="carregando">Carregando…</div>}

      {!carregando && anotacoes.length === 0 && (
        <div className="sem-anotacao">
          Nenhuma anotação ainda. A primeira que você escrever aparece aqui.
        </div>
      )}

      {!carregando && anotacoes.map(a => (
        <article className="anotacao" key={a.id}>
          <div className="quando">
            <span>{quando(a.criado_em)}</span>
            {a.atualizado_em && a.atualizado_em !== a.criado_em && (
              <span className="editado">· editada {quando(a.atualizado_em)}</span>
            )}
          </div>

          {editandoId === a.id ? (
            <>
              <textarea rows="5" value={textoEdicao} autoFocus
                        onChange={e => setTextoEdicao(e.target.value)} />
              <div className="acoes">
                <button className="botao contorno menor" onClick={() => salvarEdicao(a.id)}>
                  Salvar
                </button>
                <button className="botao contorno menor" onClick={() => setEditandoId(null)}>
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <>
              <p>{a.texto}</p>
              <div className="acoes">
                <button className="botao contorno menor"
                        onClick={() => { setEditandoId(a.id); setTextoEdicao(a.texto) }}>
                  Editar
                </button>
                <button className="perigo" onClick={() => excluir(a.id)}>Excluir</button>
              </div>
            </>
          )}
        </article>
      ))}

      <div className="zona-perigo">
        <h2>Tirar da lista</h2>
        <p>
          Use quando a criança sair da turma. Ela some da lista, mas as anotações
          continuam guardadas e podem ser recuperadas.
        </p>
        <button className="perigo" onClick={arquivar}>Tirar {crianca.nome} da lista</button>
      </div>
    </div>
  )
}
