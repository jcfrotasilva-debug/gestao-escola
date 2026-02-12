import { useState } from 'react';
import { useEscola } from '../hooks/useEscola';
import { 
  TipoEnsino, 
  Turno, 
  TipoDeficiencia,
  Projeto,
  OrigemProjeto,
  AnoSerie
} from '../types';

type TabEscola = 'dados' | 'ensino' | 'turnos' | 'aee' | 'projetos' | 'infraestrutura' | 'gestao';

const tiposEnsinoLabels: Record<TipoEnsino, string> = {
  educacao_infantil: 'Educação Infantil',
  fundamental_1: 'Ensino Fundamental I (1º ao 5º ano)',
  fundamental_2: 'Ensino Fundamental II (6º ao 9º ano)',
  medio: 'Ensino Médio',
  eja: 'EJA - Educação de Jovens e Adultos',
  profissional: 'Ensino Profissional / Técnico'
};

const turnosLabels: Record<Turno['tipo'], { nome: string; icone: string }> = {
  manha: { nome: 'Manhã', icone: '🌅' },
  tarde: { nome: 'Tarde', icone: '☀️' },
  noite: { nome: 'Noite', icone: '🌙' },
  integral: { nome: 'Integral', icone: '📚' }
};

const deficienciasLabels: Record<TipoDeficiencia, string> = {
  visual_cegueira: 'Deficiência Visual - Cegueira',
  visual_baixa_visao: 'Deficiência Visual - Baixa Visão',
  auditiva_surdez: 'Deficiência Auditiva - Surdez',
  auditiva_hipoacusia: 'Deficiência Auditiva - Hipoacusia',
  fisica: 'Deficiência Física',
  intelectual: 'Deficiência Intelectual',
  tea: 'TEA - Transtorno do Espectro Autista',
  altas_habilidades: 'Altas Habilidades / Superdotação',
  deficiencia_multipla: 'Deficiência Múltipla',
  tgd: 'TGD - Transtornos Globais do Desenvolvimento'
};

const origensProjetoLabels: Record<OrigemProjeto, { nome: string; cor: string }> = {
  federal: { nome: 'Federal', cor: 'bg-green-100 text-green-800' },
  estadual: { nome: 'Estadual', cor: 'bg-blue-100 text-blue-800' },
  municipal: { nome: 'Municipal', cor: 'bg-purple-100 text-purple-800' },
  proprio: { nome: 'Próprio da Escola', cor: 'bg-orange-100 text-orange-800' }
};

const estadosBrasileiros = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function CadastroEscola() {
  const {
    escola,
    loading,
    syncStatus,
    salvarEscola,
    toggleTipoEnsino,
    toggleAnoSerie,
    adicionarAnoSerie,
    removerAnoSerie,
    toggleTurno,
    atualizarTurno,
    atualizarAEE,
    toggleDeficienciaAEE,
    atualizarInfraestrutura,
    toggleAcessibilidade,
    toggleEspaco
  } = useEscola();

  const [activeTab, setActiveTab] = useState<TabEscola>('dados');
  const [novoAnoSerie, setNovoAnoSerie] = useState('');
  const [tipoEnsinoSelecionado, setTipoEnsinoSelecionado] = useState<TipoEnsino | ''>('');
  const [novoProjeto, setNovoProjeto] = useState<Omit<Projeto, 'id'>>({
    nome: '',
    origem: 'proprio',
    descricao: '',
    dataInicio: '',
    dataFim: '',
    responsavel: '',
    ativo: true
  });
  const [mostrarFormProjeto, setMostrarFormProjeto] = useState(false);

  const tabs: { id: TabEscola; label: string; icon: string }[] = [
    { id: 'dados', label: 'Dados Básicos', icon: '🏫' },
    { id: 'ensino', label: 'Tipos de Ensino', icon: '📚' },
    { id: 'turnos', label: 'Turnos', icon: '🕐' },
    { id: 'aee', label: 'AEE', icon: '♿' },
    { id: 'projetos', label: 'Projetos', icon: '📋' },
    { id: 'infraestrutura', label: 'Infraestrutura', icon: '🏗️' },
    { id: 'gestao', label: 'Gestão', icon: '👥' }
  ];

  // Função auxiliar para atualizar campos da escola
  const atualizarCampo = (campo: string, valor: unknown) => {
    const novaEscola = { ...escola, [campo]: valor };
    salvarEscola(novaEscola);
  };

  const atualizarEndereco = (campo: string, valor: string) => {
    const novaEscola = { 
      ...escola, 
      endereco: { ...escola.endereco, [campo]: valor } 
    };
    salvarEscola(novaEscola);
  };

  const handleAdicionarAnoSerie = () => {
    if (novoAnoSerie.trim() && tipoEnsinoSelecionado) {
      const novoAno: Omit<AnoSerie, 'id'> = {
        nome: novoAnoSerie.trim(),
        tipoEnsino: tipoEnsinoSelecionado,
        ativo: true
      };
      adicionarAnoSerie(novoAno);
      setNovoAnoSerie('');
    }
  };

  const handleAdicionarProjeto = () => {
    if (novoProjeto.nome.trim()) {
      const novaEscola = {
        ...escola,
        projetos: [...escola.projetos, { ...novoProjeto, id: Date.now().toString() }]
      };
      salvarEscola(novaEscola);
      setNovoProjeto({
        nome: '',
        origem: 'proprio',
        descricao: '',
        dataInicio: '',
        dataFim: '',
        responsavel: '',
        ativo: true
      });
      setMostrarFormProjeto(false);
    }
  };

  const handleAtualizarProjeto = (id: string, dados: Partial<Projeto>) => {
    const novaEscola = {
      ...escola,
      projetos: escola.projetos.map(p => p.id === id ? { ...p, ...dados } : p)
    };
    salvarEscola(novaEscola);
  };

  const handleRemoverProjeto = (id: string) => {
    const novaEscola = {
      ...escola,
      projetos: escola.projetos.filter(p => p.id !== id)
    };
    salvarEscola(novaEscola);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              🏫 Cadastro da Escola
            </h1>
            <p className="mt-2 text-blue-100">
              Configure os dados da sua instituição de ensino
            </p>
          </div>
          {/* Indicador de sincronização */}
          <div className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${
            syncStatus === 'synced' ? 'bg-green-500/20 text-green-100' :
            syncStatus === 'syncing' ? 'bg-yellow-500/20 text-yellow-100' :
            'bg-red-500/20 text-red-100'
          }`}>
            {syncStatus === 'synced' && '✅ Salvo'}
            {syncStatus === 'syncing' && '⏳ Salvando...'}
            {syncStatus === 'error' && '⚠️ Erro ao salvar'}
          </div>
        </div>
      </div>

      {/* Abas */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="flex flex-wrap border-b bg-gray-50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium flex items-center gap-2 transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Aba: Dados Básicos */}
          {activeTab === 'dados' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                🏫 Dados da Escola
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Escola *
                  </label>
                  <input
                    type="text"
                    value={escola.nome}
                    onChange={(e) => atualizarCampo('nome', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: E.E. Prof. João da Silva"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={escola.cnpj || ''}
                    onChange={(e) => atualizarCampo('cnpj', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código INEP
                  </label>
                  <input
                    type="text"
                    value={escola.codigoInep || ''}
                    onChange={(e) => atualizarCampo('codigoInep', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="00000000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={escola.email || ''}
                    onChange={(e) => atualizarCampo('email', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="escola@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={escola.telefone || ''}
                    onChange={(e) => atualizarCampo('telefone', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="(00) 0000-0000"
                  />
                </div>
              </div>

              {/* Endereço */}
              <h3 className="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
                📍 Endereço
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logradouro
                  </label>
                  <input
                    type="text"
                    value={escola.endereco.logradouro}
                    onChange={(e) => atualizarEndereco('logradouro', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Rua, Avenida, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número
                  </label>
                  <input
                    type="text"
                    value={escola.endereco.numero}
                    onChange={(e) => atualizarEndereco('numero', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={escola.endereco.bairro}
                    onChange={(e) => atualizarEndereco('bairro', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Bairro"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={escola.endereco.cidade}
                    onChange={(e) => atualizarEndereco('cidade', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Cidade"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    UF
                  </label>
                  <select
                    value={escola.endereco.uf}
                    onChange={(e) => atualizarEndereco('uf', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione</option>
                    {estadosBrasileiros.map(uf => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={escola.endereco.cep}
                    onChange={(e) => atualizarEndereco('cep', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Aba: Tipos de Ensino */}
          {activeTab === 'ensino' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">📚 Tipos de Ensino</h2>
              <p className="text-sm text-gray-600">
                Selecione os tipos de ensino que sua escola oferece.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Object.entries(tiposEnsinoLabels) as [TipoEnsino, string][]).map(([tipo, label]) => (
                  <div
                    key={tipo}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      escola.tiposEnsino.includes(tipo)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleTipoEnsino(tipo)}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={escola.tiposEnsino.includes(tipo)}
                        onChange={() => {}}
                        className="h-5 w-5 text-blue-600 rounded"
                      />
                      <span className="font-medium">{label}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Anos/Séries */}
              {escola.tiposEnsino.length > 0 && (
                <div className="mt-8 space-y-4">
                  <h3 className="text-md font-semibold text-gray-800">📋 Anos/Séries</h3>
                  
                  {escola.tiposEnsino.map(tipo => (
                    <div key={tipo} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-3">
                        {tiposEnsinoLabels[tipo]}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {escola.anosSeries
                          .filter(a => a.tipoEnsino === tipo)
                          .map(ano => (
                            <div
                              key={ano.id}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer ${
                                ano.ativo
                                  ? 'bg-blue-100 border-blue-300 text-blue-800'
                                  : 'bg-gray-100 border-gray-300 text-gray-500'
                              }`}
                              onClick={() => toggleAnoSerie(ano.id)}
                            >
                              <span>{ano.nome}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removerAnoSerie(ano.id);
                                }}
                                className="text-red-500 hover:text-red-700"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}

                  {/* Adicionar ano/série */}
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adicionar Ano/Série
                      </label>
                      <input
                        type="text"
                        value={novoAnoSerie}
                        onChange={(e) => setNovoAnoSerie(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Ex: 6º Ano"
                      />
                    </div>
                    <div>
                      <select
                        value={tipoEnsinoSelecionado}
                        onChange={(e) => setTipoEnsinoSelecionado(e.target.value as TipoEnsino)}
                        className="px-3 py-2 border rounded-lg"
                      >
                        <option value="">Tipo</option>
                        {escola.tiposEnsino.map(tipo => (
                          <option key={tipo} value={tipo}>{tiposEnsinoLabels[tipo]}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={handleAdicionarAnoSerie}
                      disabled={!novoAnoSerie.trim() || !tipoEnsinoSelecionado}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      + Adicionar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Aba: Turnos */}
          {activeTab === 'turnos' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">🕐 Turnos</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Object.entries(turnosLabels) as [Turno['tipo'], { nome: string; icone: string }][]).map(([tipo, { nome, icone }]) => {
                  const turno = escola.turnos.find(t => t.tipo === tipo);
                  const ativo = turno?.ativo ?? false;

                  return (
                    <div
                      key={tipo}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        ativo ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div 
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => toggleTurno(tipo)}
                      >
                        <input
                          type="checkbox"
                          checked={ativo}
                          onChange={() => {}}
                          className="h-5 w-5 text-blue-600 rounded"
                        />
                        <span className="text-2xl">{icone}</span>
                        <span className="font-medium">{nome}</span>
                      </div>

                      {ativo && turno && (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Início</label>
                            <input
                              type="time"
                              value={turno.horaInicio}
                              onChange={(e) => atualizarTurno(tipo, 'horaInicio', e.target.value)}
                              className="w-full px-2 py-1 border rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Fim</label>
                            <input
                              type="time"
                              value={turno.horaFim}
                              onChange={(e) => atualizarTurno(tipo, 'horaFim', e.target.value)}
                              className="w-full px-2 py-1 border rounded text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Aba: AEE */}
          {activeTab === 'aee' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">♿ AEE</h2>

              <div
                className={`p-4 rounded-lg border-2 cursor-pointer ${
                  escola.aee.possui ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                }`}
                onClick={() => atualizarAEE('possui', !escola.aee.possui)}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={escola.aee.possui}
                    onChange={() => {}}
                    className="h-5 w-5 text-purple-600 rounded"
                  />
                  <span className="font-medium">A escola possui AEE</span>
                </div>
              </div>

              {escola.aee.possui && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className={`p-4 rounded-lg border cursor-pointer ${
                        escola.aee.salaRecursos ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                      }`}
                      onClick={() => atualizarAEE('salaRecursos', !escola.aee.salaRecursos)}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={escola.aee.salaRecursos}
                          onChange={() => {}}
                          className="h-4 w-4 text-purple-600 rounded"
                        />
                        <span>Sala de Recursos</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Profissionais de AEE
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={escola.aee.profissionaisAEE || 0}
                        onChange={(e) => atualizarAEE('profissionaisAEE', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-md font-semibold text-gray-800 mb-3">Deficiências Atendidas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {(Object.entries(deficienciasLabels) as [TipoDeficiencia, string][]).map(([tipo, label]) => (
                        <div
                          key={tipo}
                          className={`p-3 rounded-lg border cursor-pointer ${
                            escola.aee.deficienciasAtendidas.includes(tipo)
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200'
                          }`}
                          onClick={() => toggleDeficienciaAEE(tipo)}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={escola.aee.deficienciasAtendidas.includes(tipo)}
                              onChange={() => {}}
                              className="h-4 w-4 text-purple-600 rounded"
                            />
                            <span className="text-sm">{label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Aba: Projetos */}
          {activeTab === 'projetos' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">📋 Projetos</h2>
                <button
                  onClick={() => setMostrarFormProjeto(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  + Novo Projeto
                </button>
              </div>

              {mostrarFormProjeto && (
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <h3 className="font-medium mb-4">Novo Projeto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                      <input
                        type="text"
                        value={novoProjeto.nome}
                        onChange={(e) => setNovoProjeto({ ...novoProjeto, nome: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Nome do projeto"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Origem</label>
                      <select
                        value={novoProjeto.origem}
                        onChange={(e) => setNovoProjeto({ ...novoProjeto, origem: e.target.value as OrigemProjeto })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        {(Object.entries(origensProjetoLabels) as [OrigemProjeto, { nome: string }][]).map(([tipo, { nome }]) => (
                          <option key={tipo} value={tipo}>{nome}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                      <input
                        type="text"
                        value={novoProjeto.responsavel || ''}
                        onChange={(e) => setNovoProjeto({ ...novoProjeto, responsavel: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                      <textarea
                        value={novoProjeto.descricao || ''}
                        onChange={(e) => setNovoProjeto({ ...novoProjeto, descricao: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg h-20"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => setMostrarFormProjeto(false)}
                      className="px-4 py-2 border rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAdicionarProjeto}
                      disabled={!novoProjeto.nome.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {escola.projetos.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum projeto cadastrado.
                  </div>
                ) : (
                  escola.projetos.map(projeto => (
                    <div key={projeto.id} className={`p-4 rounded-lg border ${projeto.ativo ? 'bg-white' : 'bg-gray-100'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{projeto.nome}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${origensProjetoLabels[projeto.origem].cor}`}>
                              {origensProjetoLabels[projeto.origem].nome}
                            </span>
                          </div>
                          {projeto.descricao && (
                            <p className="text-sm text-gray-600 mt-1">{projeto.descricao}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAtualizarProjeto(projeto.id, { ativo: !projeto.ativo })}
                            className={`px-3 py-1 rounded text-sm ${
                              projeto.ativo ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {projeto.ativo ? 'Desativar' : 'Ativar'}
                          </button>
                          <button
                            onClick={() => handleRemoverProjeto(projeto.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Aba: Infraestrutura */}
          {activeTab === 'infraestrutura' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">🏗️ Infraestrutura</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total de Salas</label>
                  <input
                    type="number"
                    min="0"
                    value={escola.infraestrutura.totalSalas}
                    onChange={(e) => atualizarInfraestrutura('totalSalas', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total de Alunos</label>
                  <input
                    type="number"
                    min="0"
                    value={escola.infraestrutura.totalAlunos || 0}
                    onChange={(e) => atualizarInfraestrutura('totalAlunos', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total de Funcionários</label>
                  <input
                    type="number"
                    min="0"
                    value={escola.infraestrutura.totalFuncionarios || 0}
                    onChange={(e) => atualizarInfraestrutura('totalFuncionarios', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-md font-semibold text-gray-800 mb-3">♿ Acessibilidade</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    { key: 'rampa', label: 'Rampa' },
                    { key: 'elevador', label: 'Elevador' },
                    { key: 'banheiroAdaptado', label: 'Banheiro Adaptado' },
                    { key: 'pisoTatil', label: 'Piso Tátil' },
                    { key: 'sinalizacaoBraille', label: 'Sinalização Braille' }
                  ].map(item => (
                    <div
                      key={item.key}
                      className={`p-3 rounded-lg border cursor-pointer ${
                        escola.infraestrutura.acessibilidade[item.key as keyof typeof escola.infraestrutura.acessibilidade]
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200'
                      }`}
                      onClick={() => toggleAcessibilidade(item.key as keyof typeof escola.infraestrutura.acessibilidade)}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={escola.infraestrutura.acessibilidade[item.key as keyof typeof escola.infraestrutura.acessibilidade]}
                          onChange={() => {}}
                          className="h-4 w-4 text-green-600 rounded"
                        />
                        <span className="text-sm">{item.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-md font-semibold text-gray-800 mb-3">🏠 Espaços</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    { key: 'salaRecursos', label: 'Sala de Recursos' },
                    { key: 'laboratorioInformatica', label: 'Lab. Informática' },
                    { key: 'laboratorioCiencias', label: 'Lab. Ciências' },
                    { key: 'biblioteca', label: 'Biblioteca' },
                    { key: 'quadraEsportiva', label: 'Quadra Esportiva' },
                    { key: 'auditorio', label: 'Auditório' },
                    { key: 'refeitorio', label: 'Refeitório' }
                  ].map(item => (
                    <div
                      key={item.key}
                      className={`p-3 rounded-lg border cursor-pointer ${
                        escola.infraestrutura.espacos[item.key as keyof typeof escola.infraestrutura.espacos]
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                      onClick={() => toggleEspaco(item.key as keyof typeof escola.infraestrutura.espacos)}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!escola.infraestrutura.espacos[item.key as keyof typeof escola.infraestrutura.espacos]}
                          onChange={() => {}}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <span className="text-sm">{item.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Aba: Gestão */}
          {activeTab === 'gestao' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">👥 Gestão</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diretor(a)</label>
                  <input
                    type="text"
                    value={escola.diretor || ''}
                    onChange={(e) => atualizarCampo('diretor', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vice-Diretor(a)</label>
                  <input
                    type="text"
                    value={escola.viceDiretor || ''}
                    onChange={(e) => atualizarCampo('viceDiretor', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coordenador(a) Pedagógico(a)</label>
                  <input
                    type="text"
                    value={escola.coordenadorPedagogico || ''}
                    onChange={(e) => atualizarCampo('coordenadorPedagogico', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secretário(a)</label>
                  <input
                    type="text"
                    value={escola.secretario || ''}
                    onChange={(e) => atualizarCampo('secretario', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
