import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'
import { quandoCurto, primeiraLetra, normalizar } from './util'
import { Logo, Mais, SetaDireita, SetaEsquerda, TresPontos, Grupo, Alerta } from './icones'
import Crianca from './Crianca'
import GerenciarTurmas from './GerenciarTurmas'
import ConfirmarExclusao from './ConfirmarExclusao'

const SEM_TURMA = '__sem_turma__'

export default function App({ sessao }) {
  const [criancas, setCriancas] = useState([])
  const [turmas, setTurmas] = useState([])
  const [ultimas, setUltimas] = useState({})
  const [arquivadas, setArquivadas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  // navegação: null = lista de turmas; id ou SEM_TURMA = dentro da turma
  const [turmaAberta, setTurmaAberta] = useState(null)
  const [criancaAberta, setCriancaAberta] = useState(null)
  const [gerenciando, setGerenciando] = useState(false)

  const [busca, setBusca] = useState('')
  const [adicionando, setAdicionando] = useState(false)
  const [nomeNovo, setNomeNovo] = useState('')
  const [matriculaNova, setMatriculaNova] = useState('')
  const [turmaNova, setTurmaNova] = useState(SEM_TURMA)
  const [salvando, setSalvando] = useState(false)
  const [verArquivadas, setVerArquivadas] = useState(false)
  const [menuAberto, setMenuAberto] = useState(null)
  const [excluindoCrianca, setExcluindoCrianca] = useState(null)

  const carregar = useCallback(async () => {
    setErro('')

    const [resCriancas, resTurmas] = await Promise.all([
      supabase.from('criancas').select('*')
        .eq('professor_id', sessao.user.id).order('nome'),
      supabase.from('turmas').select('*')
        .eq('professor_id', sessao.user.id).order('nome')
    ])

    if (resCriancas.error) {
      setErro('Não foi possível carregar a lista. Verifique a internet.')
      setCarregando(false)
      return
    }

    const todas = resCriancas.data || []
    const ativas = todas.filter(c => !c.arquivada)
    setCriancas(ativas)
    setArquivadas(todas.filter(c => c.arquivada))
    setTurmas(resTurmas.data || [])

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
    const matricula = matriculaNova.trim()
    if (!nome) return

    setSalvando(true)
    setErro('')
    const { error } = await supabase.from('criancas').insert({
      professor_id: sessao.user.id,
      nome,
      // string vazia viraria um valor no índice único; null é ausência de verdade
      matricula: matricula || null,
      turma_id: turmaNova
    })
    setSalvando(false)

    if (error) {
      setErro(error.code === '23505'
        ? `A matrícula ${matricula} já está cadastrada para outra criança.`
        : 'Não foi possível adicionar. Tente de novo.')
      return
    }

    setNomeNovo('')
    setMatriculaNova('')
    setAdicionando(false)
    await carregar()
  }

  async function tirarDaLista(c) {
    setMenuAberto(null)
    if (!confirm(
      `Tirar ${c.nome} da lista?\n\nAs anotações continuam guardadas e ` +
      `você pode trazer de volta depois.`
    )) return
    await supabase.from('criancas').update({ arquivada: true }).eq('id', c.id)
    await carregar()
  }

  async function devolverParaLista(c) {
    await supabase.from('criancas').update({ arquivada: false }).eq('id', c.id)
    await carregar()
  }

  // Antes de abrir a confirmação, busca quantas anotações seriam perdidas —
  // é o dado que a pessoa precisa para decidir.
  async function pedirExclusao(c) {
    const { count } = await supabase
      .from('anotacoes').select('id', { count: 'exact', head: true })
      .eq('crianca_id', c.id)
    setExcluindoCrianca({ crianca: c, anotacoes: count || 0 })
  }

  async function excluirDefinitivo() {
    const { crianca } = excluindoCrianca
    setExcluindoCrianca(null)
    const { error } = await supabase.from('criancas').delete().eq('id', crianca.id)
    if (error) { setErro('Não foi possível excluir. Tente de novo.'); return }
    await carregar()
  }

  function abrirTurma(chave) {
    setTurmaAberta(chave)
    setBusca('')
    setAdicionando(false)
    // o formulário já abre com a turma em que a pessoa está
    setTurmaNova(chave === SEM_TURMA ? (turmas[0]?.id ?? '') : chave)
  }

  function voltarParaTurmas() {
    setTurmaAberta(null)
    setBusca('')
    setAdicionando(false)
  }

  // ---------- derivados ----------

  const contagens = {}
  for (const c of criancas) {
    const chave = c.turma_id || SEM_TURMA
    contagens[chave] = (contagens[chave] || 0) + 1
  }

  const semMatriculaPorTurma = {}
  for (const c of criancas) {
    if (!c.matricula) {
      const chave = c.turma_id || SEM_TURMA
      semMatriculaPorTurma[chave] = (semMatriculaPorTurma[chave] || 0) + 1
    }
  }

  const semMatricula = criancas.filter(c => !c.matricula).length

  const repetida = nomeNovo.trim().length >= 3
    ? [...criancas, ...arquivadas].find(
        c => normalizar(c.nome) === normalizar(nomeNovo)
      )
    : null

  // ---------- telas ----------

  if (criancaAberta) {
    return (
      <>
        <Topo />
        <Crianca
          crianca={criancaAberta}
          turmas={turmas}
          aoVoltar={() => setCriancaAberta(null)}
          aoMudarCrianca={carregar}
        />
      </>
    )
  }

  if (gerenciando) {
    return (
      <>
        <Topo />
        <GerenciarTurmas
          professorId={sessao.user.id}
          turmas={turmas}
          contagens={contagens}
          aoVoltar={() => setGerenciando(false)}
          aoMudar={carregar}
        />
      </>
    )
  }

  if (carregando) {
    return (<><Topo /><div className="carregando">Carregando…</div></>)
  }

  // ===== dentro de uma turma =====
  if (turmaAberta !== null) {
    const chave = turmaAberta
    const turma = turmas.find(t => t.id === chave)
    const ehSemTurma = chave === SEM_TURMA
    const titulo = turma ? turma.nome : 'Sem turma'

    const daTurma = criancas.filter(c =>
      chave === SEM_TURMA ? !c.turma_id : c.turma_id === chave
    )
    const visiveis = daTurma.filter(c =>
      !busca.trim() ||
      normalizar(c.nome).includes(normalizar(busca)) ||
      (c.matricula || '').includes(busca.trim())
    )

    return (
      <>
        <Topo />
        <div className="pagina">
          <button className="voltar" onClick={voltarParaTurmas}>
            <SetaEsquerda /> Todas as turmas
          </button>

          <h1 className="titulo">{titulo}</h1>
          <p className="contexto">
            {ehSemTurma
              ? 'Crianças que ainda não foram colocadas em nenhuma turma. ' +
                'Abra cada uma e use "Editar cadastro" para escolher a turma.'
              : daTurma.length === 0
                ? 'Nenhuma criança aqui ainda.'
                : 'Toque em um nome para escrever ou ver as anotações.'}
          </p>

          {erro && <div className="aviso" role="alert"><Alerta /><span>{erro}</span></div>}

          {semMatriculaPorTurma[chave] > 0 && (
            <div className="pendencia">
              {semMatriculaPorTurma[chave] === 1
                ? '1 criança aqui está sem matrícula.'
                : `${semMatriculaPorTurma[chave]} crianças aqui estão sem matrícula.`}
              {' '}Abra a criança e use "Editar cadastro" para preencher.
            </div>
          )}

          {daTurma.length > 3 && (
            <input className="busca" type="text" placeholder="Procurar por nome ou matrícula"
                   value={busca} onChange={e => setBusca(e.target.value)} />
          )}

          {visiveis.length > 0 && (
            <div className="criancas">
              {visiveis.map(c => (
                <div className="linha-crianca" key={c.id}>
                  <button className="crianca" onClick={() => setCriancaAberta(c)}>
                    <span className="inicial" aria-hidden="true">{primeiraLetra(c.nome)}</span>
                    <span style={{ minWidth: 0 }}>
                      <span className="nome">{c.nome}</span>
                      <span className="ultima">
                        {c.matricula
                          ? <span className="matricula">{c.matricula}</span>
                          : <span className="sem-matricula">sem matrícula</span>}
                        {ultimas[c.id]
                          ? `última anotação ${quandoCurto(ultimas[c.id])}`
                          : 'sem anotações'}
                      </span>
                    </span>
                    <span className="seta" aria-hidden="true"><SetaDireita /></span>
                  </button>

                  <button className="menu-botao"
                          aria-label={`Opções de ${c.nome}`}
                          onClick={() => setMenuAberto(c)}>
                    <TresPontos />
                  </button>
                </div>
              ))}
            </div>
          )}

          {busca.trim() && visiveis.length === 0 && (
            <div className="sem-anotacao" style={{ marginBottom: 18 }}>
              Nenhuma criança com esse nome ou matrícula.
            </div>
          )}

          {adicionando ? (
            <div className="painel">
              <div className="campo">
                <label htmlFor="nome-novo">Nome da criança</label>
                <input type="text" id="nome-novo" value={nomeNovo} autoFocus
                       placeholder="Ex.: Helena Martins"
                       onChange={e => { setNomeNovo(e.target.value); setErro('') }} />
                {repetida && (
                  <div className="ja-existe">
                    {repetida.arquivada
                      ? `${repetida.nome} está fora da lista. Em vez de criar outra, ` +
                        `use "Voltar à lista" para trazer de volta com as anotações.`
                      : `${repetida.nome} já está na sua lista.`}
                  </div>
                )}
              </div>

              <div className="campo">
                <label htmlFor="matricula-nova">
                  Matrícula <span className="opcional-rotulo">— pode preencher depois</span>
                </label>
                <span className="dica">
                  O número da criança na escola. Serve para diferenciar crianças
                  de mesmo nome e localizar registros antigos.
                </span>
                <input type="text" id="matricula-nova" value={matriculaNova}
                       placeholder="Ex.: 2026-0142"
                       onChange={e => { setMatriculaNova(e.target.value); setErro('') }}
                       onKeyDown={e => { if (e.key === 'Enter') adicionar() }} />
              </div>

              <div className="campo">
                <label htmlFor="turma-nova-crianca">Turma</label>
                <select id="turma-nova-crianca" value={turmaNova}
                        onChange={e => setTurmaNova(e.target.value)}>
                  {turmas.map(t => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              </div>

              <div className="acoes">
                <button className="botao cheio" onClick={adicionar}
                        disabled={!nomeNovo.trim() || salvando}>
                  {salvando ? 'Salvando…' : 'Adicionar'}
                </button>
                <button className="botao contorno"
                        onClick={() => {
                          setAdicionando(false); setNomeNovo('')
                          setMatriculaNova(''); setErro('')
                        }}>
                  Cancelar
                </button>
              </div>
              {!nomeNovo.trim() && <p className="nota-form">O nome é obrigatório.</p>}
              {nomeNovo.trim() && !matriculaNova.trim() && (
                <p className="nota-form">
                  Sem a matrícula a criança fica marcada na lista, para você
                  lembrar de preencher depois.
                </p>
              )}
            </div>
          ) : (
            // não se cadastra criança direto em "Sem turma": toda criança
            // nova nasce dentro de uma turma
            !ehSemTurma && (
              <button className="nova-crianca" onClick={() => setAdicionando(true)}>
                <Mais /> Adicionar criança
              </button>
            )
          )}
        </div>

        <MenuAcoes crianca={menuAberto}
                   aoFechar={() => setMenuAberto(null)}
                   aoAbrir={c => { setMenuAberto(null); setCriancaAberta(c) }}
                   aoTirar={tirarDaLista} />

        <CaixaExcluir alvo={excluindoCrianca}
                      aoConfirmar={excluirDefinitivo}
                      aoCancelar={() => setExcluindoCrianca(null)} />
      </>
    )
  }

  // ===== lista de turmas =====
  const buscaGlobal = busca.trim()
  const achados = buscaGlobal
    ? criancas.filter(c =>
        normalizar(c.nome).includes(normalizar(buscaGlobal)) ||
        (c.matricula || '').includes(buscaGlobal))
    : []

  return (
    <>
      <Topo />
      <div className="pagina">
        <h1 className="titulo">Minhas turmas</h1>
        <p className="contexto">
          {turmas.length === 0
            ? 'As crianças ficam dentro de uma turma.'
            : 'Toque em uma turma para ver as crianças.'}
        </p>

        {erro && <div className="aviso" role="alert"><Alerta /><span>{erro}</span></div>}

        {turmas.length === 0 && (
          <div className="vazio">
            <Logo tamanho={40} opacidade={0.35} />
            <h2>Crie sua primeira turma</h2>
            <p>
              Toda criança fica dentro de uma turma, então é preciso criar uma
              antes de cadastrar as crianças.
            </p>
            <button className="botao cheio" onClick={() => setGerenciando(true)}>
              <Mais /> Criar turma
            </button>
          </div>
        )}

        {semMatricula > 0 && (
          <div className="pendencia">
            {semMatricula === 1
              ? '1 criança ainda está sem matrícula.'
              : `${semMatricula} crianças ainda estão sem matrícula.`}
          </div>
        )}

        {criancas.length > 0 && (
          <input className="busca" type="text"
                 placeholder="Procurar criança em todas as turmas"
                 value={busca} onChange={e => setBusca(e.target.value)} />
        )}

        {buscaGlobal ? (
          achados.length > 0 ? (
            <div className="criancas">
              {achados.map(c => {
                const t = turmas.find(x => x.id === c.turma_id)
                return (
                  <div className="linha-crianca" key={c.id}>
                    <button className="crianca" onClick={() => setCriancaAberta(c)}>
                      <span className="inicial" aria-hidden="true">{primeiraLetra(c.nome)}</span>
                      <span style={{ minWidth: 0 }}>
                        <span className="nome">{c.nome}</span>
                        <span className="ultima">
                          {c.matricula
                            ? <span className="matricula">{c.matricula}</span>
                            : <span className="sem-matricula">sem matrícula</span>}
                          {t ? t.nome : 'sem turma'}
                        </span>
                      </span>
                      <span className="seta" aria-hidden="true"><SetaDireita /></span>
                    </button>
                    <button className="menu-botao"
                            aria-label={`Opções de ${c.nome}`}
                            onClick={() => setMenuAberto(c)}>
                      <TresPontos />
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="sem-anotacao" style={{ marginBottom: 18 }}>
              Nenhuma criança com esse nome ou matrícula.
            </div>
          )
        ) : (
          <div className="turmas-grade">
            {turmas.map(t => (
              <button className="card-turma" key={t.id} onClick={() => abrirTurma(t.id)}>
                <span className="icone-turma" aria-hidden="true"><Grupo /></span>
                <span className="info-turma">
                  <span className="nome-turma">{t.nome}</span>
                  <span className="qtd-turma">
                    {(contagens[t.id] || 0) === 0 ? 'nenhuma criança'
                      : (contagens[t.id] || 0) === 1 ? '1 criança'
                      : `${contagens[t.id]} crianças`}
                    {semMatriculaPorTurma[t.id] > 0 &&
                      ` · ${semMatriculaPorTurma[t.id]} sem matrícula`}
                  </span>
                </span>
                <span className="seta" aria-hidden="true"><SetaDireita /></span>
              </button>
            ))}

            {/* legado: crianças cadastradas antes de a turma ser obrigatória.
                O card some quando todas forem movidas para alguma turma. */}
            {(contagens[SEM_TURMA] || 0) > 0 && (
              <button className="card-turma" onClick={() => abrirTurma(SEM_TURMA)}>
                <span className="icone-turma" aria-hidden="true"><Grupo /></span>
                <span className="info-turma">
                  <span className="nome-turma">Sem turma</span>
                  <span className="qtd-turma">
                    {contagens[SEM_TURMA] === 1 ? '1 criança'
                      : `${contagens[SEM_TURMA]} crianças`}
                  </span>
                </span>
                <span className="seta" aria-hidden="true"><SetaDireita /></span>
              </button>
            )}
          </div>
        )}

        {!buscaGlobal && turmas.length > 0 && (
          <div className="acoes-secundarias">
            <button className="botao contorno menor" onClick={() => setGerenciando(true)}>
              Gerenciar turmas
            </button>
            {arquivadas.length > 0 && (
              <button className="botao contorno menor"
                      onClick={() => setVerArquivadas(v => !v)}>
                {verArquivadas ? 'Esconder' : 'Ver'} crianças fora da lista ({arquivadas.length})
              </button>
            )}
          </div>
        )}

        {!buscaGlobal && verArquivadas && arquivadas.length > 0 && (
          <ListaArquivadas arquivadas={arquivadas} aoDevolver={devolverParaLista} aoExcluir={pedirExclusao} />
        )}
      </div>

      <MenuAcoes crianca={menuAberto}
                 aoFechar={() => setMenuAberto(null)}
                 aoAbrir={c => { setMenuAberto(null); setCriancaAberta(c) }}
                 aoTirar={tirarDaLista} />

      <CaixaExcluir alvo={excluindoCrianca}
                    aoConfirmar={excluirDefinitivo}
                    aoCancelar={() => setExcluindoCrianca(null)} />
    </>
  )
}

// ---------- componentes auxiliares ----------

function CaixaExcluir({ alvo, aoConfirmar, aoCancelar }) {
  if (!alvo) return null
  const { crianca, anotacoes } = alvo
  return (
    <ConfirmarExclusao
      titulo={`Excluir ${crianca.nome} de vez`}
      explicacao={
        anotacoes === 0
          ? 'Esta criança não tem anotações. O cadastro será apagado e não tem como desfazer.'
          : anotacoes === 1
            ? 'O cadastro e a única anotação desta criança serão apagados. ' +
              'Não tem como desfazer.'
            : `O cadastro e as ${anotacoes} anotações desta criança serão apagados. ` +
              `Não tem como desfazer.`
      }
      aoConfirmar={aoConfirmar}
      aoCancelar={aoCancelar}
    />
  )
}

function MenuAcoes({ crianca, aoFechar, aoAbrir, aoTirar }) {
  if (!crianca) return null
  return (
    <>
      <div className="fundo-menu" onClick={aoFechar} />
      <div className="folha-acoes" role="dialog" aria-label={`Opções de ${crianca.nome}`}>
        <div className="folha-titulo">{crianca.nome}</div>
        <button onClick={() => aoAbrir(crianca)}>Abrir anotações</button>
        <button className="acao-perigo" onClick={() => aoTirar(crianca)}>
          Tirar da lista
        </button>
        <button className="acao-cancelar" onClick={aoFechar}>Cancelar</button>
      </div>
    </>
  )
}

function ListaArquivadas({ arquivadas, aoDevolver, aoExcluir }) {
  return (
    <>
      <p className="nota-form" style={{ marginTop: 18 }}>
        Estas crianças saíram da lista, mas as anotações continuam guardadas.
        Traga de volta quando quiser, ou apague de vez.
      </p>
      <div className="criancas" style={{ marginTop: 10 }}>
        {arquivadas.map(c => (
          <div className="item-arquivada" key={c.id}>
            <div className="dados-arquivada">
              <span className="inicial" aria-hidden="true">{primeiraLetra(c.nome)}</span>
              <span style={{ minWidth: 0 }}>
                <span className="nome">{c.nome}</span>
                <span className="ultima">
                  {c.matricula
                    ? <span className="matricula">{c.matricula}</span>
                    : <span className="sem-matricula">sem matrícula</span>}
                  anotações guardadas
                </span>
              </span>
            </div>
            <div className="acoes-arquivada">
              <button className="botao contorno menor" onClick={() => aoDevolver(c)}>
                Voltar à lista
              </button>
              <button className="perigo" onClick={() => aoExcluir(c)}>
                Excluir de vez
              </button>
            </div>
          </div>
        ))}
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
