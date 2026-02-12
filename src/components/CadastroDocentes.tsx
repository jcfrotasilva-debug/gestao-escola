import React, { useState, useRef, useEffect } from 'react';
import { CadastroDocente, Atribuicao, AreaConhecimento, FuncaoDocente, Habilitacao, TipoDeficiencia, Projeto } from '../types';
import { useCadastroDocentes } from '../hooks/useCadastroDocentes';
import { useEscola } from '../hooks/useEscola';

// Labels para Funções
const funcoesLabels: Record<FuncaoDocente, string> = {
  regente: 'Professor Regente',
  aee: 'Professor de AEE',
  coordenador: 'Coordenador Pedagógico',
  vice_diretor: 'Vice-Diretor',
  diretor: 'Diretor',
  readaptado: 'Readaptado',
  eventual: 'Professor Eventual',
  estagiario: 'Estagiário',
  interprete_libras: 'Intérprete de Libras',
  cuidador: 'Cuidador/Apoio',
  outro: 'Outro'
};

// Labels para Habilitações
const habilitacoesLabels: Record<Habilitacao, string> = {
  libras: 'LIBRAS',
  braille: 'Braille',
  aee: 'AEE - Atendimento Educacional Especializado',
  educacao_especial: 'Educação Especial',
  deficiencia_visual: 'Deficiência Visual',
  deficiencia_auditiva: 'Deficiência Auditiva',
  deficiencia_intelectual: 'Deficiência Intelectual',
  tea: 'TEA - Transtorno do Espectro Autista',
  altas_habilidades: 'Altas Habilidades / Superdotação',
  soroban: 'Soroban',
  comunicacao_alternativa: 'Comunicação Alternativa',
  outro: 'Outra'
};

// Labels para Deficiências
const deficienciasLabels: Record<TipoDeficiencia, string> = {
  visual_cegueira: 'Cegueira',
  visual_baixa_visao: 'Baixa Visão',
  auditiva_surdez: 'Surdez',
  auditiva_hipoacusia: 'Hipoacusia',
  fisica: 'Deficiência Física',
  intelectual: 'Deficiência Intelectual',
  tea: 'TEA',
  altas_habilidades: 'Altas Habilidades',
  deficiencia_multipla: 'Múltipla',
  tgd: 'TGD'
};

interface CadastroDocentesProps {
  atribuicoes: Atribuicao[];
  areas: AreaConhecimento[];
  projetos?: Projeto[];
}

type AbaAtiva = 'lista' | 'ficha';

const estadosBrasil = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export function CadastroDocentes({ atribuicoes, areas, projetos = [] }: CadastroDocentesProps) {
  const { escola } = useEscola();
  const {
    docentes,
    sincronizarComAtribuicoes,
    adicionarDocente,
    atualizarDocente,
    removerDocente,
    obterResumoAtribuicoes,
    limparDuplicados,
  } = useCadastroDocentes(atribuicoes);

  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('lista');
  const [busca, setBusca] = useState('');
  const [filtroArea, setFiltroArea] = useState('');
  const [filtroVinculo, setFiltroVinculo] = useState('');
  const [docenteSelecionado, setDocenteSelecionado] = useState<CadastroDocente | null>(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [formData, setFormData] = useState<Partial<CadastroDocente>>({});
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const sincronizouRef = useRef(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Limpar duplicados ao carregar (apenas uma vez)
  useEffect(() => {
    if (docentes.length > 0) {
      // Verificar se há duplicados
      const nomes = docentes.map(d => d.nome.toLowerCase().trim());
      const nomesUnicos = new Set(nomes);
      if (nomes.length !== nomesUnicos.size) {
        limparDuplicados();
        setMensagem({ tipo: 'sucesso', texto: 'Docentes duplicados foram removidos automaticamente!' });
        setTimeout(() => setMensagem(null), 3000);
      }
    }
  }, []);

  // Sincronizar docentes ao carregar (apenas uma vez)
  useEffect(() => {
    if (!sincronizouRef.current && atribuicoes.length > 0) {
      sincronizouRef.current = true;
      const novos = sincronizarComAtribuicoes();
      if (novos > 0) {
        setMensagem({ tipo: 'sucesso', texto: `${novos} docente(s) importado(s) da atribuição de aulas!` });
        setTimeout(() => setMensagem(null), 3000);
      }
    }
  }, [atribuicoes.length]);

  // Filtrar docentes
  const docentesFiltrados = docentes.filter(d => {
    const matchBusca = d.nome.toLowerCase().includes(busca.toLowerCase()) ||
                       d.email?.toLowerCase().includes(busca.toLowerCase()) ||
                       d.matricula?.toLowerCase().includes(busca.toLowerCase());
    const matchArea = !filtroArea || d.areaConhecimento === filtroArea;
    const matchVinculo = !filtroVinculo || d.vinculo === filtroVinculo;
    return matchBusca && matchArea && matchVinculo;
  });

  // Abrir ficha do docente
  const abrirFicha = (docente: CadastroDocente) => {
    setDocenteSelecionado(docente);
    setFormData(docente);
    setModoEdicao(false);
    setAbaAtiva('ficha');
  };

  // Novo docente
  const novoDocente = () => {
    setDocenteSelecionado(null);
    setFormData({ nome: '' });
    setModoEdicao(true);
    setAbaAtiva('ficha');
  };

  // Salvar docente
  const salvarDocente = () => {
    if (!formData.nome?.trim()) {
      setMensagem({ tipo: 'erro', texto: 'O nome é obrigatório!' });
      setTimeout(() => setMensagem(null), 3000);
      return;
    }

    if (docenteSelecionado) {
      atualizarDocente(docenteSelecionado.id, formData);
      setDocenteSelecionado({ ...docenteSelecionado, ...formData } as CadastroDocente);
      setMensagem({ tipo: 'sucesso', texto: 'Docente atualizado com sucesso!' });
    } else {
      const novo = adicionarDocente(formData as any);
      setDocenteSelecionado(novo);
    setMensagem({ tipo: 'sucesso', texto: 'Docente cadastrado com sucesso!' });
    }
    
    setModoEdicao(false);
    setTimeout(() => setMensagem(null), 3000);
  };

  // Excluir docente
  const excluirDocente = () => {
    if (docenteSelecionado && confirm('Tem certeza que deseja excluir este docente?')) {
      removerDocente(docenteSelecionado.id);
      setDocenteSelecionado(null);
      setAbaAtiva('lista');
      setMensagem({ tipo: 'sucesso', texto: 'Docente excluído!' });
      setTimeout(() => setMensagem(null), 3000);
    }
  };

  // Upload de foto
  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMensagem({ tipo: 'erro', texto: 'A foto deve ter no máximo 2MB!' });
        setTimeout(() => setMensagem(null), 3000);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, foto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Remover foto
  const removerFoto = () => {
    setFormData(prev => ({ ...prev, foto: undefined }));
  };

  // Formatar CPF
  const formatarCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .slice(0, 14);
  };

  // Formatar telefone
  const formatarTelefone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4,5})(\d{4})$/, '$1-$2')
      .slice(0, 15);
  };

  // Formatar CEP
  const formatarCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 9);
  };

  // Imprimir ficha
  const imprimirFicha = () => {
    if (!docenteSelecionado) return;
    
    const resumo = obterResumoAtribuicoes(docenteSelecionado.nome);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ficha do Docente - ${docenteSelecionado.nome}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .header h1 { font-size: 18px; margin-bottom: 5px; }
          .header h2 { font-size: 14px; font-weight: normal; color: #666; }
          .foto-container { text-align: center; margin: 20px 0; }
          .foto { width: 120px; height: 150px; object-fit: cover; border: 2px solid #333; }
          .foto-placeholder { width: 120px; height: 150px; border: 2px solid #333; display: inline-flex; align-items: center; justify-content: center; background: #f0f0f0; color: #666; }
          .section { margin: 15px 0; }
          .section-title { font-size: 14px; font-weight: bold; background: #333; color: white; padding: 5px 10px; margin-bottom: 10px; }
          .row { display: flex; margin-bottom: 5px; }
          .label { font-weight: bold; width: 150px; }
          .value { flex: 1; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #333; padding: 5px 8px; text-align: left; }
          th { background: #f0f0f0; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FICHA CADASTRAL DO DOCENTE</h1>
          <h2>Sistema de Gestão Escolar</h2>
        </div>

        <div class="foto-container">
          ${docenteSelecionado.foto 
            ? `<img src="${docenteSelecionado.foto}" class="foto" alt="Foto do docente" />`
            : `<div class="foto-placeholder">Sem Foto</div>`
          }
        </div>

        <div class="section">
          <div class="section-title">DADOS PESSOAIS</div>
          <div class="row"><span class="label">Nome:</span><span class="value">${docenteSelecionado.nome || '-'}</span></div>
          <div class="row"><span class="label">CPF:</span><span class="value">${docenteSelecionado.cpf || '-'}</span></div>
          <div class="row"><span class="label">RG:</span><span class="value">${docenteSelecionado.rg || '-'}</span></div>
          <div class="row"><span class="label">Data de Nascimento:</span><span class="value">${docenteSelecionado.dataNascimento ? new Date(docenteSelecionado.dataNascimento).toLocaleDateString('pt-BR') : '-'}</span></div>
          <div class="row"><span class="label">Sexo:</span><span class="value">${docenteSelecionado.sexo === 'M' ? 'Masculino' : docenteSelecionado.sexo === 'F' ? 'Feminino' : docenteSelecionado.sexo || '-'}</span></div>
          <div class="row"><span class="label">Estado Civil:</span><span class="value">${docenteSelecionado.estadoCivil || '-'}</span></div>
        </div>

        <div class="section">
          <div class="section-title">CONTATO</div>
          <div class="row"><span class="label">E-mail:</span><span class="value">${docenteSelecionado.email || '-'}</span></div>
          <div class="row"><span class="label">Telefone:</span><span class="value">${docenteSelecionado.telefone || '-'}</span></div>
          <div class="row"><span class="label">Celular:</span><span class="value">${docenteSelecionado.celular || '-'}</span></div>
        </div>

        <div class="section">
          <div class="section-title">ENDEREÇO</div>
          <div class="row"><span class="label">Logradouro:</span><span class="value">${docenteSelecionado.endereco || '-'}, ${docenteSelecionado.numero || 's/n'} ${docenteSelecionado.complemento || ''}</span></div>
          <div class="row"><span class="label">Bairro:</span><span class="value">${docenteSelecionado.bairro || '-'}</span></div>
          <div class="row"><span class="label">Cidade/UF:</span><span class="value">${docenteSelecionado.cidade || '-'} / ${docenteSelecionado.estado || '-'}</span></div>
          <div class="row"><span class="label">CEP:</span><span class="value">${docenteSelecionado.cep || '-'}</span></div>
        </div>

        <div class="section">
          <div class="section-title">DADOS PROFISSIONAIS</div>
          <div class="row"><span class="label">Matrícula:</span><span class="value">${docenteSelecionado.matricula || '-'}</span></div>
          <div class="row"><span class="label">Cargo:</span><span class="value">${docenteSelecionado.cargo || '-'}</span></div>
          <div class="row"><span class="label">Vínculo:</span><span class="value">${docenteSelecionado.vinculo || '-'}</span></div>
          <div class="row"><span class="label">Carga Horária:</span><span class="value">${docenteSelecionado.cargaHoraria ? docenteSelecionado.cargaHoraria + ' horas' : '-'}</span></div>
          <div class="row"><span class="label">Data de Admissão:</span><span class="value">${docenteSelecionado.dataAdmissao ? new Date(docenteSelecionado.dataAdmissao).toLocaleDateString('pt-BR') : '-'}</span></div>
          <div class="row"><span class="label">Formação:</span><span class="value">${docenteSelecionado.formacao || '-'}</span></div>
          <div class="row"><span class="label">Especialização:</span><span class="value">${docenteSelecionado.especializacao || '-'}</span></div>
          <div class="row"><span class="label">Área de Conhecimento:</span><span class="value">${docenteSelecionado.areaConhecimento || '-'}</span></div>
        </div>

        <div class="section">
          <div class="section-title">ATRIBUIÇÃO DE AULAS</div>
          <div class="row"><span class="label">Total de Aulas:</span><span class="value">${resumo.totalAulas} aulas/semana</span></div>
          <div class="row"><span class="label">Turmas:</span><span class="value">${resumo.turmas.join(', ') || '-'}</span></div>
          <div class="row"><span class="label">Disciplinas:</span><span class="value">${resumo.disciplinas.join(', ') || '-'}</span></div>
          
          ${resumo.detalhesPorTurma.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Turma</th>
                  <th>Disciplina</th>
                  <th>Aulas</th>
                </tr>
              </thead>
              <tbody>
                ${resumo.detalhesPorTurma.flatMap(t => 
                  t.disciplinas.map((d, i) => `
                    <tr>
                      ${i === 0 ? `<td rowspan="${t.disciplinas.length}">${t.turma}</td>` : ''}
                      <td>${d.nome}</td>
                      <td>${d.aulas}</td>
                    </tr>
                  `)
                ).join('')}
              </tbody>
            </table>
          ` : '<p>Nenhuma atribuição de aulas.</p>'}
        </div>

        ${docenteSelecionado.observacoes ? `
          <div class="section">
            <div class="section-title">OBSERVAÇÕES</div>
            <p>${docenteSelecionado.observacoes}</p>
          </div>
        ` : ''}

        <div class="footer">
          <p>Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.onafterprint = () => printWindow.close();
      printWindow.print();
    };
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Mensagem */}
      {mensagem && (
        <div className={`mb-4 p-3 rounded-lg ${mensagem.tipo === 'sucesso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {mensagem.texto}
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">👤</span>
          <h2 className="text-2xl font-bold text-gray-800">Cadastro de Docentes</h2>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {docentes.length} docente(s)
          </span>
        </div>
        
        {abaAtiva === 'lista' ? (
          <div className="flex gap-2">
            <button
              onClick={() => {
                limparDuplicados();
                setMensagem({ tipo: 'sucesso', texto: 'Duplicados removidos!' });
                setTimeout(() => setMensagem(null), 3000);
              }}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2"
              title="Remover docentes duplicados"
            >
              <span>🧹</span> Limpar Duplicados
            </button>
            <button
              onClick={novoDocente}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <span>➕</span> Novo Docente
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAbaAtiva('lista')}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
          >
            <span>←</span> Voltar para Lista
          </button>
        )}
      </div>

      {/* Abas */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setAbaAtiva('lista')}
          className={`px-4 py-2 font-medium transition-colors ${
            abaAtiva === 'lista'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📋 Lista de Docentes
        </button>
        {docenteSelecionado && (
          <button
            onClick={() => setAbaAtiva('ficha')}
            className={`px-4 py-2 font-medium transition-colors ${
              abaAtiva === 'ficha'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📄 Ficha do Docente
          </button>
        )}
      </div>

      {/* Lista de Docentes */}
      {abaAtiva === 'lista' && (
        <div>
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <input
              type="text"
              placeholder="🔍 Buscar por nome, email ou matrícula..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="col-span-2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filtroArea}
              onChange={(e) => setFiltroArea(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as Áreas</option>
              {areas.map(a => (
                <option key={a.id} value={a.nome}>{a.nome}</option>
              ))}
            </select>
            <select
              value={filtroVinculo}
              onChange={(e) => setFiltroVinculo(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os Vínculos</option>
              <option value="Efetivo">Efetivo</option>
              <option value="Contratado">Contratado</option>
              <option value="Temporário">Temporário</option>
              <option value="Substituto">Substituto</option>
            </select>
          </div>

          {/* Grid de Docentes */}
          {docentesFiltrados.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <span className="text-6xl mb-4 block">👤</span>
              <p className="text-xl">Nenhum docente encontrado</p>
              {docentes.length === 0 && (
                <p className="mt-2">Importe uma planilha de atribuição ou cadastre manualmente.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {docentesFiltrados.map(docente => {
                const resumo = obterResumoAtribuicoes(docente.nome);
                return (
                  <div
                    key={docente.id}
                    onClick={() => abrirFicha(docente)}
                    className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer bg-white hover:bg-gray-50"
                  >
                    <div className="flex items-start gap-4">
                      {/* Foto */}
                      <div className="flex-shrink-0">
                        {docente.foto ? (
                          <img
                            src={docente.foto}
                            alt={docente.nome}
                            className="w-16 h-20 object-cover rounded-lg border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-16 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                            {docente.nome.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Informações */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-800 truncate">{docente.nome}</h3>
                        
                        {docente.cargo && (
                          <p className="text-sm text-gray-600">{docente.cargo}</p>
                        )}
                        
                        {docente.areaConhecimento && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                            {docente.areaConhecimento}
                          </span>
                        )}

                        {docente.vinculo && (
                          <span className={`inline-block ml-1 mt-1 px-2 py-0.5 text-xs rounded-full ${
                            docente.vinculo === 'Efetivo' ? 'bg-green-100 text-green-700' :
                            docente.vinculo === 'Contratado' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {docente.vinculo}
                          </span>
                        )}

                        {/* Resumo de Atribuições */}
                        <div className="mt-2 flex gap-3 text-xs text-gray-500">
                          <span>📚 {resumo.totalAulas} aulas</span>
                          <span>🏫 {resumo.quantidadeTurmas} turmas</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Ficha do Docente */}
      {abaAtiva === 'ficha' && (
        <div>
          {/* Botões de Ação */}
          <div className="flex gap-2 mb-6">
            {!modoEdicao ? (
              <>
                <button
                  onClick={() => setModoEdicao(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <span>✏️</span> Editar
                </button>
                <button
                  onClick={imprimirFicha}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                >
                  <span>🖨️</span> Imprimir
                </button>
                {docenteSelecionado && (
                  <button
                    onClick={excluirDocente}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 ml-auto"
                  >
                    <span>🗑️</span> Excluir
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={salvarDocente}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <span>💾</span> Salvar
                </button>
                <button
                  onClick={() => {
                    setModoEdicao(false);
                    if (docenteSelecionado) {
                      setFormData(docenteSelecionado);
                    } else {
                      setAbaAtiva('lista');
                    }
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
                >
                  <span>❌</span> Cancelar
                </button>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna da Foto */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <h3 className="font-bold text-gray-700 mb-4">📷 Foto do Docente</h3>
                
                {formData.foto ? (
                  <div className="relative inline-block">
                    <img
                      src={formData.foto}
                      alt="Foto do docente"
                      className="w-40 h-52 object-cover rounded-lg border-4 border-white shadow-lg mx-auto"
                    />
                    {modoEdicao && (
                      <button
                        onClick={removerFoto}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="w-40 h-52 bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg flex items-center justify-center mx-auto border-4 border-white shadow-lg">
                    <span className="text-6xl text-white">👤</span>
                  </div>
                )}

                {modoEdicao && (
                  <div className="mt-4">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFotoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      📷 {formData.foto ? 'Alterar Foto' : 'Adicionar Foto'}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">Máximo: 2MB</p>
                  </div>
                )}

                {/* Resumo de Atribuições */}
                {docenteSelecionado && !modoEdicao && (
                  <div className="mt-6 text-left">
                    <h4 className="font-bold text-gray-700 mb-3">📚 Atribuição de Aulas</h4>
                    {(() => {
                      const resumo = obterResumoAtribuicoes(docenteSelecionado.nome);
                      return (
                        <>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between p-2 bg-white rounded">
                              <span>Total de Aulas:</span>
                              <span className="font-bold">{resumo.totalAulas}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-white rounded">
                              <span>Turmas:</span>
                              <span className="font-bold">{resumo.quantidadeTurmas}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-white rounded">
                              <span>Disciplinas:</span>
                              <span className="font-bold">{resumo.quantidadeDisciplinas}</span>
                            </div>
                          </div>

                          {resumo.detalhesPorTurma.length > 0 && (
                            <div className="mt-4">
                              <h5 className="font-medium text-gray-600 mb-2">Detalhamento:</h5>
                              <div className="space-y-2">
                                {resumo.detalhesPorTurma.map((t, i) => (
                                  <div key={i} className="bg-white p-2 rounded text-xs">
                                    <div className="font-bold text-blue-600">{t.turma}</div>
                                    {t.disciplinas.map((d, j) => (
                                      <div key={j} className="flex justify-between text-gray-600 ml-2">
                                        <span>{d.nome}</span>
                                        <span>{d.aulas} aulas</span>
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Formulário */}
            <div className="lg:col-span-2 space-y-6">
              {/* Dados Pessoais */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <span>👤</span> Dados Pessoais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      value={formData.nome || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      disabled={!modoEdicao}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="Nome completo do docente"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">CPF</label>
                    <input
                      type="text"
                      value={formData.cpf || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, cpf: formatarCPF(e.target.value) }))}
                      disabled={!modoEdicao}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">RG</label>
                    <input
                      type="text"
                      value={formData.rg || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, rg: e.target.value }))}
                      disabled={!modoEdicao}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="00.000.000-0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Data de Nascimento</label>
                    <input
                      type="date"
                      value={formData.dataNascimento || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, dataNascimento: e.target.value }))}
                      disabled={!modoEdicao}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Sexo</label>
                    <select
                      value={formData.sexo || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, sexo: e.target.value as any }))}
                      disabled={!modoEdicao}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Selecione</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Estado Civil</label>
                    <select
                      value={formData.estadoCivil || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, estadoCivil: e.target.value as any }))}
                      disabled={!modoEdicao}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Selecione</option>
                      <option value="Solteiro(a)">Solteiro(a)</option>
                      <option value="Casado(a)">Casado(a)</option>
                      <option value="Divorciado(a)">Divorciado(a)</option>
                      <option value="Viúvo(a)">Viúvo(a)</option>
                      <option value="União Estável">União Estável</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contato */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <span>📞</span> Contato
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">E-mail</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={!modoEdicao}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Telefone</label>
                    <input
                      type="text"
                      value={formData.telefone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefone: formatarTelefone(e.target.value) }))}
                      disabled={!modoEdicao}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="(00) 0000-0000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Celular</label>
                    <input
                      type="text"
                      value={formData.celular || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, celular: formatarTelefone(e.target.value) }))}
                      disabled={!modoEdicao}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <span>🏠</span> Endereço
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Logradouro</label>
                    <input
                      type="text"
                      value={formData.endereco || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                      disabled={!modoEdicao}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="Rua, Avenida, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Número</label>
                    <input
                      type="text"
                      value={formData.numero || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                      disabled={!modoEdicao}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="Nº"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Complemento</label>
                    <input
                      type="text"
                      value={formData.complemento || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, complemento: e.target.value }))}
                      disabled={!modoEdicao}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="Apto, Bloco, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Bairro</label>
                    <input
                      type="text"
                      value={formData.bairro || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
                      disabled={!modoEdicao}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="Bairro"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Cidade</label>
                    <input
                      type="text"
                      value={formData.cidade || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                      disabled={!modoEdicao}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="Cidade"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Estado</label>
                    <select
                      value={formData.estado || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                      disabled={!modoEdicao}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">UF</option>
                      {estadosBrasil.map(uf => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">CEP</label>
                    <input
                      type="text"
                      value={formData.cep || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, cep: formatarCEP(e.target.value) }))}
                      disabled={!modoEdicao}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </div>

              {/* Dados Profissionais */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <span>💼</span> Dados Profissionais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Matrícula</label>
                    <input
                      type="text"
                      value={formData.matricula || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, matricula: e.target.value }))}
                      disabled={!modoEdicao}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="Nº da matrícula"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Cargo</label>
                    <input
                      type="text"
                      value={formData.cargo || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
                      disabled={!modoEdicao}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="Ex: Professor PEB II"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Vínculo</label>
                    <select
                      value={formData.vinculo || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, vinculo: e.target.value as any }))}
                      disabled={!modoEdicao}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Selecione</option>
                      <option value="Efetivo">Efetivo</option>
                      <option value="Contratado">Contratado</option>
                      <option value="Temporário">Temporário</option>
                      <option value="Substituto">Substituto</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Carga Horária</label>
                    <input
                      type="number"
                      value={formData.cargaHoraria || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, cargaHoraria: parseInt(e.target.value) || undefined }))}
                      disabled={!modoEdicao}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="Horas semanais"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Data de Admissão</label>
                    <input
                      type="date"
                      value={formData.dataAdmissao || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, dataAdmissao: e.target.value }))}
                      disabled={!modoEdicao}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Área de Conhecimento</label>
                    <select
                      value={formData.areaConhecimento || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, areaConhecimento: e.target.value }))}
                      disabled={!modoEdicao}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Selecione</option>
                      {areas.map(a => (
                        <option key={a.id} value={a.nome}>{a.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Formação</label>
                    <input
                      type="text"
                      value={formData.formacao || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, formacao: e.target.value }))}
                      disabled={!modoEdicao}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="Ex: Licenciatura em Matemática"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Especialização</label>
                    <input
                      type="text"
                      value={formData.especializacao || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, especializacao: e.target.value }))}
                      disabled={!modoEdicao}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="Ex: Pós-graduação em Educação Matemática"
                    />
                  </div>
                </div>
              </div>

              {/* Função/Atuação */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <span>🎯</span> Função / Atuação
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Função Principal</label>
                    <select
                      value={formData.funcao || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, funcao: e.target.value as FuncaoDocente }))}
                      disabled={!modoEdicao}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Selecione</option>
                      {Object.entries(funcoesLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  {formData.funcao === 'outro' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Especificar Função</label>
                      <input
                        type="text"
                        value={formData.funcaoOutra || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, funcaoOutra: e.target.value }))}
                        disabled={!modoEdicao}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        placeholder="Descreva a função"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Habilitações Especiais */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <span>🎓</span> Habilitações Especiais
                </h3>
                <p className="text-sm text-gray-600 mb-3">Selecione as habilitações que o docente possui:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(habilitacoesLabels).map(([key, label]) => (
                    <div
                      key={key}
                      className={`p-2 rounded border cursor-pointer transition-all text-sm ${
                        formData.habilitacoes?.includes(key as Habilitacao)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${!modoEdicao ? 'cursor-default' : ''}`}
                      onClick={() => {
                        if (!modoEdicao) return;
                        const atual = formData.habilitacoes || [];
                        const novaLista = atual.includes(key as Habilitacao)
                          ? atual.filter(h => h !== key)
                          : [...atual, key as Habilitacao];
                        setFormData(prev => ({ ...prev, habilitacoes: novaLista }));
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.habilitacoes?.includes(key as Habilitacao) || false}
                          onChange={() => {}}
                          disabled={!modoEdicao}
                          className="h-4 w-4 text-purple-600 rounded"
                        />
                        <span className="text-xs">{label}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {formData.habilitacoes?.includes('outro') && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Especificar Outra Habilitação</label>
                    <input
                      type="text"
                      value={formData.habilitacaoOutra || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, habilitacaoOutra: e.target.value }))}
                      disabled={!modoEdicao}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="Descreva a habilitação"
                    />
                  </div>
                )}
              </div>

              {/* Atuação no AEE */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <span>♿</span> Atuação no AEE
                </h3>
                <div className="space-y-4">
                  <div
                    className={`p-3 rounded border cursor-pointer transition-all ${
                      formData.atuacaoAEE?.atuaNoAEE
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200'
                    } ${!modoEdicao ? 'cursor-default' : ''}`}
                    onClick={() => {
                      if (!modoEdicao) return;
                      setFormData(prev => ({
                        ...prev,
                        atuacaoAEE: {
                          ...prev.atuacaoAEE,
                          atuaNoAEE: !prev.atuacaoAEE?.atuaNoAEE,
                          deficienciasAtendidas: prev.atuacaoAEE?.deficienciasAtendidas || [],
                          salaRecursos: prev.atuacaoAEE?.salaRecursos || false,
                          itinerante: prev.atuacaoAEE?.itinerante || false
                        }
                      }));
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.atuacaoAEE?.atuaNoAEE || false}
                        onChange={() => {}}
                        disabled={!modoEdicao}
                        className="h-4 w-4 text-purple-600 rounded"
                      />
                      <span className="font-medium">O docente atua no Atendimento Educacional Especializado (AEE)</span>
                    </div>
                  </div>

                  {formData.atuacaoAEE?.atuaNoAEE && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div
                          className={`p-3 rounded border cursor-pointer ${
                            formData.atuacaoAEE?.salaRecursos ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                          } ${!modoEdicao ? 'cursor-default' : ''}`}
                          onClick={() => {
                            if (!modoEdicao) return;
                            setFormData(prev => ({
                              ...prev,
                              atuacaoAEE: { ...prev.atuacaoAEE!, salaRecursos: !prev.atuacaoAEE?.salaRecursos }
                            }));
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <input type="checkbox" checked={formData.atuacaoAEE?.salaRecursos || false} onChange={() => {}} disabled={!modoEdicao} className="h-4 w-4" />
                            <span className="text-sm">Sala de Recursos</span>
                          </div>
                        </div>
                        <div
                          className={`p-3 rounded border cursor-pointer ${
                            formData.atuacaoAEE?.itinerante ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                          } ${!modoEdicao ? 'cursor-default' : ''}`}
                          onClick={() => {
                            if (!modoEdicao) return;
                            setFormData(prev => ({
                              ...prev,
                              atuacaoAEE: { ...prev.atuacaoAEE!, itinerante: !prev.atuacaoAEE?.itinerante }
                            }));
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <input type="checkbox" checked={formData.atuacaoAEE?.itinerante || false} onChange={() => {}} disabled={!modoEdicao} className="h-4 w-4" />
                            <span className="text-sm">Itinerante</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Deficiências Atendidas:</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {Object.entries(deficienciasLabels).map(([key, label]) => (
                            <div
                              key={key}
                              className={`p-2 rounded border cursor-pointer text-sm ${
                                formData.atuacaoAEE?.deficienciasAtendidas?.includes(key as TipoDeficiencia)
                                  ? 'border-purple-500 bg-purple-50'
                                  : 'border-gray-200'
                              } ${!modoEdicao ? 'cursor-default' : ''}`}
                              onClick={() => {
                                if (!modoEdicao) return;
                                const atual = formData.atuacaoAEE?.deficienciasAtendidas || [];
                                const novaLista = atual.includes(key as TipoDeficiencia)
                                  ? atual.filter(d => d !== key)
                                  : [...atual, key as TipoDeficiencia];
                                setFormData(prev => ({
                                  ...prev,
                                  atuacaoAEE: { ...prev.atuacaoAEE!, deficienciasAtendidas: novaLista }
                                }));
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={formData.atuacaoAEE?.deficienciasAtendidas?.includes(key as TipoDeficiencia) || false}
                                  onChange={() => {}}
                                  disabled={!modoEdicao}
                                  className="h-3 w-3"
                                />
                                <span className="text-xs">{label}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Observações sobre AEE</label>
                        <textarea
                          value={formData.atuacaoAEE?.observacoes || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            atuacaoAEE: { ...prev.atuacaoAEE!, observacoes: e.target.value }
                          }))}
                          disabled={!modoEdicao}
                          rows={2}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm"
                          placeholder="Informações adicionais..."
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Projetos */}
              {(escola.projetos.length > 0 || projetos.length > 0) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <span>📋</span> Projetos que Participa
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[...escola.projetos, ...projetos].filter(p => p.ativo).map(projeto => (
                      <div
                        key={projeto.id}
                        className={`p-2 rounded border cursor-pointer text-sm ${
                          formData.projetosIds?.includes(projeto.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200'
                        } ${!modoEdicao ? 'cursor-default' : ''}`}
                        onClick={() => {
                          if (!modoEdicao) return;
                          const atual = formData.projetosIds || [];
                          const novaLista = atual.includes(projeto.id)
                            ? atual.filter(id => id !== projeto.id)
                            : [...atual, projeto.id];
                          setFormData(prev => ({ ...prev, projetosIds: novaLista }));
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.projetosIds?.includes(projeto.id) || false}
                            onChange={() => {}}
                            disabled={!modoEdicao}
                            className="h-4 w-4"
                          />
                          <span>{projeto.nome}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {escola.projetos.length === 0 && projetos.length === 0 && (
                    <p className="text-sm text-gray-500">Nenhum projeto cadastrado. Cadastre projetos no Cadastro da Escola.</p>
                  )}
                </div>
              )}

              {/* Observações */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <span>📝</span> Observações
                </h3>
                <textarea
                  value={formData.observacoes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  disabled={!modoEdicao}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="Observações adicionais sobre o docente..."
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
