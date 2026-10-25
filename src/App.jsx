import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'
import { quandoCurto, primeiraLetra, normalizar } from './util'
import { Logo, Mais, SetaDireita, Alerta } from './icones'
import Crianca from './Crianca'

export default function App({ sessao }) {
  const [criancas, setCriancas] = useState([])
  const [ultimas, setUltimas] = useState({})
  const [arquivadas, setArquivadas] = useState([])
  const [busca, setBusca] = useState('')
  const [aberta, setAberta] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [adicionando, setAdicionando] = useState(false)
  const [nomeNovo, setNomeNovo] = useState('')
  const [verArquivadas, setVerArquivadas] = useState(false)

  const carregar = useCallback(async () => {
    setErro('')
    const { data, error } = await supabase
      .from('criancas').select('*')
      .eq('professor_id', sessao.user.id)
      .order('nome')

    if (error) {
      setErro('Não foi possível carregar a lista. Verifique a internet.')
      setCarregando(false)
      return
    }

    const todas = data || []
    const ativas = todas.filter(c => !c.arquivada)
    setCriancas(ativas)
    setArquivadas(todas.filter(c => c.arquivada))

    if (ativas.length) {
      const { data: anots } = await supabase
        .from('anotacoes').select('crianca_id, criado_em')
        .in('crianca_id', ativas.map(c => c.id))
        .order('criado_em', { ascending: false })

      const mapa = {}
      for (const a of anots || []) {
        if (!mapa[a.crianca_id]) mapa[a.crianca_id] = a.criado_em
      }
      setUltimas(mapa)
    } else {
      setUltimas({})
    }
    setCarregando(false)
  }, [sessao.user.id])

  useEffect(() => { carregar() }, [carregar])

  async function adicionar() {
    const nome = nomeNovo.trim()
    if (!nome) return
    const { error } = await supabase.from('criancas')
      .insert({ professor_id: sessao.user.id, nome })
    if (error) { setErro('Não foi possível adicionar. Tente de novo.'); return }
    setNomeNovo('')
    setAdicionando(false)
    await carregar()
  }

  async function devolverParaLista(c) {
    await supabase.from('criancas').update({ arquivada: false }).eq('id', c.id)
    await carregar()
  }

  if (aberta) {
    return (
      <>
        <Topo />
        <Crianca
          crianca={aberta}
          aoVoltar={() => setAberta(null)}
          aoMudarCrianca={carregar}
        />
      </>
    )
  }

  const visiveis = criancas.filter(c =>
    !busca.trim() || normalizar(c.nome).includes(normalizar(busca))
  )

  // Avisa se o nome digitado já existe — na lista ou entre as que saíram dela
  const repetida = nomeNovo.trim().length >= 3
    ? [...criancas, ...arquivadas].find(
        c => normalizar(c.nome) === normalizar(nomeNovo)
      )
    : null

  return (
    <>
      <Topo />
      <div className="pagina">
        <h1 className="titulo">Minhas crianças</h1>
        <p className="contexto">
          Toque em um nome para escrever ou ver as anotações.
        </p>

        {erro && <div className="aviso" role="alert"><Alerta /><span>{erro}</span></div>}

        {carregando && <div className="carregando">Carregando…</div>}

        {!carregando && criancas.length > 3 && (
          <input className="busca" type="text" placeholder="Procurar pelo nome"
                 value={busca} onChange={e => setBusca(e.target.value)} />
        )}

        {!carregando && criancas.length === 0 && (
          <div className="vazio">
            <Logo tamanho={40} opacidade={0.35} />
            <h2>Nenhuma criança ainda</h2>
            <p>Adicione a primeira criança para começar a escrever.</p>
          </div>
        )}

        {!carregando && visiveis.length > 0 && (
          <div className="criancas">
            {visiveis.map(c => (
              <button className="crianca" key={c.id} onClick={() => setAberta(c)}>
                <span className="inicial" aria-hidden="true">{primeiraLetra(c.nome)}</span>
                <span style={{ minWidth: 0 }}>
                  <span className="nome">{c.nome}</span>
                  <span className="ultima">
                    {ultimas[c.id]
                      ? `última anotação ${quandoCurto(ultimas[c.id])}`
                      : 'sem anotações'}
                  </span>
                </span>
                <span className="seta" aria-hidden="true"><SetaDireita /></span>
              </button>
            ))}
          </div>
        )}

        {!carregando && visiveis.length === 0 && criancas.length > 0 && (
          <div className="sem-anotacao" style={{ marginBottom: 18 }}>
            Nenhuma criança com esse nome.
          </div>
        )}

        {!carregando && (adicionando ? (
          <div className="painel">
            <div className="campo">
              <label htmlFor="nome-novo">Nome da criança</label>
              <input type="text" id="nome-novo" value={nomeNovo} autoFocus
                     placeholder="Ex.: Helena Martins"
                     onChange={e => setNomeNovo(e.target.value)}
                     onKeyDown={e => { if (e.key === 'Enter') adicionar() }} />

              {repetida && (
                <div className="ja-existe">
                  {repetida.arquivada
                    ? `${repetida.nome} está fora da lista. Em vez de criar outra, ` +
                      `use o botão "Voltar à lista" lá embaixo para trazer de volta ` +
                      `com as anotações dela.`
                    : `${repetida.nome} já está na sua lista.`}
                </div>
              )}
            </div>
            <div className="acoes">
              <button className="botao cheio" onClick={adicionar} disabled={!nomeNovo.trim()}>
                Adicionar
              </button>
              <button className="botao contorno"
                      onClick={() => { setAdicionando(false); setNomeNovo('') }}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button className="nova-crianca" onClick={() => setAdicionando(true)}>
            <Mais /> Adicionar criança
          </button>
        ))}

        {!carregando && arquivadas.length > 0 && (
          <div style={{ marginTop: 30 }}>
            <button className="botao contorno menor"
                    onClick={() => setVerArquivadas(v => !v)}>
              {verArquivadas ? 'Esconder' : 'Ver'} crianças fora da lista ({arquivadas.length})
            </button>

            {verArquivadas && (
              <div className="criancas" style={{ marginTop: 14 }}>
                {arquivadas.map(c => (
                  <div className="crianca" key={c.id} style={{ cursor: 'default' }}>
                    <span className="inicial" aria-hidden="true">{primeiraLetra(c.nome)}</span>
                    <span style={{ minWidth: 0 }}>
                      <span className="nome">{c.nome}</span>
                      <span className="ultima">anotações guardadas</span>
                    </span>
                    <button className="botao contorno menor" style={{ marginLeft: 'auto' }}
                            onClick={() => devolverParaLista(c)}>
                      Voltar à lista
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

function Topo() {
  return (
    <header className="topo">
      <div className="topo-interno">
        <div className="topo-marca">
          <Logo tamanho={24} />
          <strong>Relatórios dos Alunos</strong>
        </div>
        <button className="btn-topo" onClick={() => supabase.auth.signOut()}>
          Sair
        </button>
      </div>
    </header>
  )
}
