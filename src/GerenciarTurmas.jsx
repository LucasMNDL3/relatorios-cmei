import { useState } from 'react'
import { supabase } from './supabase'
import { SetaEsquerda, Mais, Alerta } from './icones'
import ConfirmarExclusao from './ConfirmarExclusao'

export default function GerenciarTurmas({ professorId, turmas, contagens, aoVoltar, aoMudar }) {
  const [nomeNovo, setNomeNovo] = useState('')
  const [editando, setEditando] = useState(null)
  const [nomeEdicao, setNomeEdicao] = useState('')
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [excluindo, setExcluindo] = useState(null)

  async function criar() {
    const nome = nomeNovo.trim()
    if (!nome) return
    setOcupado(true)
    setErro('')
    const { error } = await supabase.from('turmas')
      .insert({ professor_id: professorId, nome })
    setOcupado(false)
    if (error) { setErro('Não foi possível criar a turma. Tente de novo.'); return }
    setNomeNovo('')
    aoMudar()
  }

  async function salvarNome(id) {
    const nome = nomeEdicao.trim()
    if (!nome) return
    await supabase.from('turmas').update({ nome }).eq('id', id)
    setEditando(null)
    aoMudar()
  }

  async function excluirConfirmado() {
    const turma = excluindo
    setExcluindo(null)
    const { error } = await supabase.from('turmas').delete().eq('id', turma.id)
    if (error) {
      // 23503 = o banco barrou porque ainda existe criança apontando para a turma
      setErro(error.code === '23503'
        ? `Não dá para excluir ${turma.nome}: ainda há crianças nela. ` +
          `Mova para outra turma ou tire da lista antes.`
        : 'Não foi possível excluir. Tente de novo.')
      return
    }
    aoMudar()
  }

  return (
    <div className="pagina">
      <button className="voltar" onClick={aoVoltar}>
        <SetaEsquerda /> Todas as crianças
      </button>

      <h1 className="titulo">Turmas</h1>
      <p className="contexto">
        As turmas servem para separar as crianças na lista. Uma criança pode ficar
        sem turma se você preferir.
      </p>

      {erro && <div className="aviso" role="alert"><Alerta /><span>{erro}</span></div>}

      {turmas.length > 0 && (
        <div className="criancas" style={{ marginBottom: 18 }}>
          {turmas.map(t => {
            const qtd = contagens[t.id] || 0
            return (
              <div className="linha-turma" key={t.id}>
                {editando === t.id ? (
                  <div className="edicao-turma">
                    <input type="text" value={nomeEdicao} autoFocus
                           onChange={e => setNomeEdicao(e.target.value)}
                           onKeyDown={e => { if (e.key === 'Enter') salvarNome(t.id) }} />
                    <div className="acoes-linha">
                      <button className="botao contorno menor"
                              onClick={() => salvarNome(t.id)}>Salvar</button>
                      <button className="botao contorno menor"
                              onClick={() => setEditando(null)}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b>{t.nome}</b>
                      <small>
                        {qtd === 0 ? 'nenhuma criança · pode ser excluída'
                          : qtd === 1
                            ? '1 criança · mova ou tire ela da lista antes de excluir'
                            : `${qtd} crianças · mova ou tire todas da lista antes de excluir`}
                      </small>
                    </div>
                    <div className="acoes-linha">
                      <button className="botao contorno menor"
                              onClick={() => { setEditando(t.id); setNomeEdicao(t.nome) }}>
                        Renomear
                      </button>
                      <button className="perigo" disabled={qtd > 0}
                              onClick={() => setExcluindo(t)}>
                        Excluir turma
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {turmas.length === 0 && (
        <div className="sem-anotacao" style={{ marginBottom: 18 }}>
          Nenhuma turma criada ainda.
        </div>
      )}

      <div className="painel">
        <div className="campo">
          <label htmlFor="turma-nova">Nome da nova turma</label>
          <span className="dica">Escreva do jeito que você chama, por exemplo "Maternal II — manhã".</span>
          <input type="text" id="turma-nova" value={nomeNovo}
                 placeholder="Maternal II — manhã"
                 onChange={e => setNomeNovo(e.target.value)}
                 onKeyDown={e => { if (e.key === 'Enter') criar() }} />
        </div>
        <div className="acoes">
          <button className="botao cheio" onClick={criar}
                  disabled={!nomeNovo.trim() || ocupado}>
            <Mais /> Criar turma
          </button>
        </div>
      </div>

      {excluindo && (
        <ConfirmarExclusao
          titulo={`Excluir "${excluindo.nome}"`}
          explicacao={
            'Esta turma está vazia. Ela será apagada e não tem como desfazer. ' +
            'As crianças e as anotações não são afetadas.'
          }
          aoConfirmar={excluirConfirmado}
          aoCancelar={() => setExcluindo(null)}
        />
      )}
    </div>
  )
}
