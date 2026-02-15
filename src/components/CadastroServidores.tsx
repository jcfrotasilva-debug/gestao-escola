import React, { useState, useRef } from 'react';
import { useServidores } from '../hooks/useServidores';
import { Servidor, CargoServidor, SetorServidor, VinculoServidor, SituacaoServidor, TurnoServidor, EscolaridadeServidor } from '../types';

type TabServidor = 'lista' | 'cadastro' | 'ficha' | 'importar';

const escolaridadeLabels: Record<EscolaridadeServidor, string> = {
  fundamental_incompleto: 'Fundamental Incompleto',
  fundamental: 'Fundamental Completo',
  medio_incompleto: 'Médio Incompleto',
  medio: 'Médio Completo',
  tecnico: 'Técnico',
  superior_incompleto: 'Superior Incompleto',
  superior: 'Superior Completo',
  pos_graduacao: 'Pós-Graduação'
};

const turnoLabels: Record<TurnoServidor, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
  integral: 'Integral'
};

export const CadastroServidores: React.FC = () => {
  const {
    servidores,
    loading,
    adicionarServidor,
    atualizarServidor,
    removerServidor,
    estatisticas,
    limparDuplicados,
    cargoLabels,
    setorLabels,
    vinculoLabels,
    situacaoLabels
  } = useServidores();

  const [activeTab, setActiveTab] = useState<TabServidor>('lista');
  const [servidorSelecionado, setServidorSelecionado] = useState<Servidor | null>(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroCargo, setFiltroCargo] = useState<CargoServidor | ''>('');
  const [filtroSetor, setFiltroSetor] = useState<SetorServidor | ''>('');
  const [filtroVinculo, setFiltroVinculo] = useState<VinculoServidor | ''>('');
  const [filtroSituacao, setFiltroSituacao] = useState<SituacaoServidor | ''>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado do formulário
  const [form, setForm] = useState<Partial<Servidor>>({
    nome: '',
    cargo: 'auxiliar_servicos',
    setor: 'outro',
    vinculo: 'contratado',
    situacao: 'ativo'
  });

  // Filtrar servidores
  const servidoresFiltrados = servidores.filter(s => {
    if (busca) {
      const termo = busca.toLowerCase();
      const match = 
        s.nome.toLowerCase().includes(termo) ||
        (s.email && s.email.toLowerCase().includes(termo)) ||
        (s.matricula && s.matricula.toLowerCase().includes(termo));
      if (!match) return false;
    }
    if (filtroCargo && s.cargo !== filtroCargo) return false;
    if (filtroSetor && s.setor !== filtroSetor) return false;
    if (filtroVinculo && s.vinculo !== filtroVinculo) return false;
    if (filtroSituacao && s.situacao !== filtroSituacao) return false;
    return true;
  });

  // Handler para foto
  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('A foto deve ter no máximo 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setForm(prev => ({ ...prev, foto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Salvar servidor
  const handleSalvar = () => {
    if (!form.nome?.trim()) {
      alert('O nome é obrigatório!');
      return;
    }

    if (modoEdicao && servidorSelecionado) {
      atualizarServidor(servidorSelecionado.id, form);
      setServidorSelecionado({ ...servidorSelecionado, ...form } as Servidor);
    } else {
      const novoServidor = adicionarServidor(form as Omit<Servidor, 'id' | 'dataCadastro' | 'dataAtualizacao'>);
      setServidorSelecionado(novoServidor);
    }
    setModoEdicao(false);
    setActiveTab('ficha');
  };

  // Novo servidor
  const handleNovoServidor = () => {
    setForm({
      nome: '',
      cargo: 'auxiliar_servicos',
      setor: 'outro',
      vinculo: 'contratado',
      situacao: 'ativo'
    });
    setServidorSelecionado(null);
    setModoEdicao(true);
    setActiveTab('cadastro');
  };

  // Editar servidor
  const handleEditarServidor = (servidor: Servidor) => {
    setForm(servidor);
    setServidorSelecionado(servidor);
    setModoEdicao(true);
    setActiveTab('cadastro');
  };

  // Ver ficha
  const handleVerFicha = (servidor: Servidor) => {
    setServidorSelecionado(servidor);
    setActiveTab('ficha');
  };

  // Excluir servidor
  const handleExcluirServidor = (servidor: Servidor) => {
    if (confirm(`Tem certeza que deseja excluir ${servidor.nome}?`)) {
      removerServidor(servidor.id);
      if (servidorSelecionado?.id === servidor.id) {
        setServidorSelecionado(null);
        setActiveTab('lista');
      }
    }
  };

  // Imprimir ficha
  const handleImprimir = (servidor: Servidor) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const cargoLabel = cargoLabels[servidor.cargo] || servidor.cargo;
    const setorLabel = setorLabels[servidor.setor] || servidor.setor;
    const vinculoLabel = vinculoLabels[servidor.vinculo] || servidor.vinculo;
    const situacaoLabel = situacaoLabels[servidor.situacao] || servidor.situacao;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ficha - ${servidor.nome}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .foto { width: 120px; height: 150px; border: 1px solid #ccc; margin: 10px auto; display: block; object-fit: cover; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 14px; font-weight: bold; background: #f0f0f0; padding: 5px 10px; margin-bottom: 10px; }
          .field { display: inline-block; width: 48%; margin-bottom: 8px; vertical-align: top; }
          .field-label { font-size: 11px; color: #666; }
          .field-value { font-size: 13px; font-weight: 500; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>FICHA DE SERVIDOR</h2>
        </div>
        ${servidor.foto ? `<img src="${servidor.foto}" class="foto" />` : '<div class="foto" style="display:flex;align-items:center;justify-content:center;background:#f0f0f0;">Sem foto</div>'}
        
        <div class="section">
          <div class="section-title">DADOS PESSOAIS</div>
          <div class="field"><div class="field-label">Nome</div><div class="field-value">${servidor.nome}</div></div>
          <div class="field"><div class="field-label">CPF</div><div class="field-value">${servidor.cpf || '-'}</div></div>
          <div class="field"><div class="field-label">RG</div><div class="field-value">${servidor.rg || '-'}</div></div>
          <div class="field"><div class="field-label">Data Nascimento</div><div class="field-value">${servidor.dataNascimento || '-'}</div></div>
          <div class="field"><div class="field-label">Sexo</div><div class="field-value">${servidor.sexo || '-'}</div></div>
          <div class="field"><div class="field-label">Estado Civil</div><div class="field-value">${servidor.estadoCivil || '-'}</div></div>
        </div>
        
        <div class="section">
          <div class="section-title">CONTATO</div>
          <div class="field"><div class="field-label">Email</div><div class="field-value">${servidor.email || '-'}</div></div>
          <div class="field"><div class="field-label">Telefone</div><div class="field-value">${servidor.telefone || '-'}</div></div>
          <div class="field"><div class="field-label">Celular</div><div class="field-value">${servidor.celular || '-'}</div></div>
        </div>
        
        <div class="section">
          <div class="section-title">DADOS PROFISSIONAIS</div>
          <div class="field"><div class="field-label">Matrícula</div><div class="field-value">${servidor.matricula || '-'}</div></div>
          <div class="field"><div class="field-label">Cargo</div><div class="field-value">${cargoLabel}</div></div>
          <div class="field"><div class="field-label">Setor</div><div class="field-value">${setorLabel}</div></div>
          <div class="field"><div class="field-label">Vínculo</div><div class="field-value">${vinculoLabel}</div></div>
          <div class="field"><div class="field-label">Situação</div><div class="field-value">${situacaoLabel}</div></div>
          <div class="field"><div class="field-label">Carga Horária</div><div class="field-value">${servidor.cargaHoraria ? servidor.cargaHoraria + 'h' : '-'}</div></div>
          <div class="field"><div class="field-label">Turno</div><div class="field-value">${servidor.turno ? turnoLabels[servidor.turno] : '-'}</div></div>
          <div class="field"><div class="field-label">Data Admissão</div><div class="field-value">${servidor.dataAdmissao || '-'}</div></div>
        </div>
        
        <div class="section">
          <div class="section-title">FORMAÇÃO</div>
          <div class="field"><div class="field-label">Escolaridade</div><div class="field-value">${servidor.escolaridade ? escolaridadeLabels[servidor.escolaridade] : '-'}</div></div>
          <div class="field"><div class="field-label">Formação</div><div class="field-value">${servidor.formacao || '-'}</div></div>
          <div class="field" style="width:100%"><div class="field-label">Cursos</div><div class="field-value">${servidor.cursos || '-'}</div></div>
        </div>
        
        ${servidor.observacoes ? `
        <div class="section">
          <div class="section-title">OBSERVAÇÕES</div>
          <p>${servidor.observacoes}</p>
        </div>
        ` : ''}
        
        <div style="margin-top: 40px; font-size: 11px; color: #666; text-align: center;">
          Impresso em: ${new Date().toLocaleString('pt-BR')}
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.onafterprint = () => printWindow.close();
    setTimeout(() => printWindow.print(), 250);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            🧑‍💼 Cadastro de Servidores
          </h1>
          <p className="text-gray-600">Gerencie os servidores da escola</p>
        </div>
        <button
          onClick={handleNovoServidor}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <span>➕</span> Novo Servidor
        </button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="text-3xl font-bold text-blue-600">{estatisticas.total}</div>
          <div className="text-gray-600 text-sm">Total de Servidores</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="text-3xl font-bold text-green-600">{estatisticas.ativos}</div>
          <div className="text-gray-600 text-sm">Ativos</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="text-3xl font-bold text-yellow-600">{estatisticas.afastados}</div>
          <div className="text-gray-600 text-sm">Afastados/Licença</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="text-3xl font-bold text-red-600">{estatisticas.desligados}</div>
          <div className="text-gray-600 text-sm">Desligados</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b flex overflow-x-auto">
          <button
            onClick={() => setActiveTab('lista')}
            className={`px-4 py-3 font-medium whitespace-nowrap ${activeTab === 'lista' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
          >
            📋 Lista de Servidores
          </button>
          <button
            onClick={() => setActiveTab('cadastro')}
            className={`px-4 py-3 font-medium whitespace-nowrap ${activeTab === 'cadastro' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
          >
            ✏️ {modoEdicao ? (servidorSelecionado ? 'Editar' : 'Novo') : 'Cadastro'}
          </button>
          {servidorSelecionado && (
            <button
              onClick={() => setActiveTab('ficha')}
              className={`px-4 py-3 font-medium whitespace-nowrap ${activeTab === 'ficha' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
            >
              📄 Ficha do Servidor
            </button>
          )}
        </div>

        <div className="p-4">
          {/* Lista de Servidores */}
          {activeTab === 'lista' && (
            <div className="space-y-4">
              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <input
                  type="text"
                  placeholder="🔍 Buscar por nome, email ou matrícula..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                />
                <select
                  value={filtroCargo}
                  onChange={(e) => setFiltroCargo(e.target.value as CargoServidor | '')}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="">Todos os Cargos</option>
                  {Object.entries(cargoLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <select
                  value={filtroSetor}
                  onChange={(e) => setFiltroSetor(e.target.value as SetorServidor | '')}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="">Todos os Setores</option>
                  {Object.entries(setorLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <select
                  value={filtroVinculo}
                  onChange={(e) => setFiltroVinculo(e.target.value as VinculoServidor | '')}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="">Todos os Vínculos</option>
                  {Object.entries(vinculoLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <select
                  value={filtroSituacao}
                  onChange={(e) => setFiltroSituacao(e.target.value as SituacaoServidor | '')}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="">Todas as Situações</option>
                  {Object.entries(situacaoLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Botão limpar duplicados */}
              {servidores.length > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      const removidos = limparDuplicados();
                      alert(removidos > 0 ? `${removidos} duplicado(s) removido(s)!` : 'Nenhum duplicado encontrado.');
                    }}
                    className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 text-sm flex items-center gap-1"
                  >
                    🧹 Limpar Duplicados
                  </button>
                </div>
              )}

              {/* Tabela */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Foto</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Nome</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Cargo</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Setor</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Vínculo</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Situação</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {servidoresFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          {servidores.length === 0 ? 'Nenhum servidor cadastrado.' : 'Nenhum servidor encontrado com os filtros aplicados.'}
                        </td>
                      </tr>
                    ) : (
                      servidoresFiltrados.map(servidor => (
                        <tr key={servidor.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {servidor.foto ? (
                              <img src={servidor.foto} alt={servidor.nome} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                {servidor.nome.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{servidor.nome}</div>
                            {servidor.matricula && <div className="text-sm text-gray-500">Mat: {servidor.matricula}</div>}
                          </td>
                          <td className="px-4 py-3 text-sm">{cargoLabels[servidor.cargo]}</td>
                          <td className="px-4 py-3 text-sm">{setorLabels[servidor.setor]}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              servidor.vinculo === 'efetivo' ? 'bg-green-100 text-green-800' :
                              servidor.vinculo === 'contratado' ? 'bg-blue-100 text-blue-800' :
                              servidor.vinculo === 'terceirizado' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {vinculoLabels[servidor.vinculo]}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              servidor.situacao === 'ativo' ? 'bg-green-100 text-green-800' :
                              servidor.situacao === 'desligado' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {situacaoLabels[servidor.situacao]}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleVerFicha(servidor)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Ver ficha"
                              >
                                👁️
                              </button>
                              <button
                                onClick={() => handleEditarServidor(servidor)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                title="Editar"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleImprimir(servidor)}
                                className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                                title="Imprimir"
                              >
                                🖨️
                              </button>
                              <button
                                onClick={() => handleExcluirServidor(servidor)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Excluir"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Formulário de Cadastro/Edição */}
          {activeTab === 'cadastro' && (
            <div className="space-y-6">
              {/* Foto */}
              <div className="flex justify-center">
                <div className="text-center">
                  {form.foto ? (
                    <img src={form.foto} alt="Foto" className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-gray-200" />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mx-auto text-4xl text-gray-400">
                      👤
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFotoChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    📷 {form.foto ? 'Alterar Foto' : 'Adicionar Foto'}
                  </button>
                </div>
              </div>

              {/* Dados Pessoais */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">👤 Dados Pessoais</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      value={form.nome || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Nome completo do servidor"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                    <input
                      type="text"
                      value={form.cpf || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, cpf: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RG</label>
                    <input
                      type="text"
                      value={form.rg || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, rg: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                    <input
                      type="date"
                      value={form.dataNascimento || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, dataNascimento: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                    <select
                      value={form.sexo || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, sexo: e.target.value as 'M' | 'F' | 'Outro' }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Selecione...</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado Civil</label>
                    <select
                      value={form.estadoCivil || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, estadoCivil: e.target.value as any }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Selecione...</option>
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
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">📞 Contato</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={form.email || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input
                      type="tel"
                      value={form.telefone || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, telefone: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
                    <input
                      type="tel"
                      value={form.celular || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, celular: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">🏠 Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logradouro</label>
                    <input
                      type="text"
                      value={form.endereco || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, endereco: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                    <input
                      type="text"
                      value={form.numero || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, numero: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                    <input
                      type="text"
                      value={form.complemento || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, complemento: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                    <input
                      type="text"
                      value={form.bairro || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, bairro: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                    <input
                      type="text"
                      value={form.cidade || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, cidade: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
                    <input
                      type="text"
                      value={form.estado || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, estado: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                    <input
                      type="text"
                      value={form.cep || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, cep: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Dados Profissionais */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">💼 Dados Profissionais</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula</label>
                    <input
                      type="text"
                      value={form.matricula || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, matricula: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cargo *</label>
                    <select
                      value={form.cargo || 'auxiliar_servicos'}
                      onChange={(e) => setForm(prev => ({ ...prev, cargo: e.target.value as CargoServidor }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {Object.entries(cargoLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  {form.cargo === 'outro' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Especifique o Cargo</label>
                      <input
                        type="text"
                        value={form.cargoDescricao || ''}
                        onChange={(e) => setForm(prev => ({ ...prev, cargoDescricao: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Setor *</label>
                    <select
                      value={form.setor || 'outro'}
                      onChange={(e) => setForm(prev => ({ ...prev, setor: e.target.value as SetorServidor }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {Object.entries(setorLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  {form.setor === 'outro' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Especifique o Setor</label>
                      <input
                        type="text"
                        value={form.setorDescricao || ''}
                        onChange={(e) => setForm(prev => ({ ...prev, setorDescricao: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vínculo *</label>
                    <select
                      value={form.vinculo || 'contratado'}
                      onChange={(e) => setForm(prev => ({ ...prev, vinculo: e.target.value as VinculoServidor }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {Object.entries(vinculoLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Situação *</label>
                    <select
                      value={form.situacao || 'ativo'}
                      onChange={(e) => setForm(prev => ({ ...prev, situacao: e.target.value as SituacaoServidor }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {Object.entries(situacaoLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Turno</label>
                    <select
                      value={form.turno || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, turno: e.target.value as TurnoServidor }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Selecione...</option>
                      {Object.entries(turnoLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Carga Horária</label>
                    <input
                      type="number"
                      value={form.cargaHoraria || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, cargaHoraria: parseInt(e.target.value) || undefined }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="horas/semana"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Admissão</label>
                    <input
                      type="date"
                      value={form.dataAdmissao || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, dataAdmissao: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Formação */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">🎓 Formação</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Escolaridade</label>
                    <select
                      value={form.escolaridade || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, escolaridade: e.target.value as EscolaridadeServidor }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Selecione...</option>
                      {Object.entries(escolaridadeLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Formação/Curso</label>
                    <input
                      type="text"
                      value={form.formacao || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, formacao: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Ex: Administração, Técnico em Informática..."
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cursos/Capacitações</label>
                    <textarea
                      value={form.cursos || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, cursos: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={2}
                      placeholder="Liste cursos e capacitações relevantes..."
                    />
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">📝 Observações</h3>
                <textarea
                  value={form.observacoes || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Observações gerais sobre o servidor..."
                />
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setActiveTab('lista');
                    setModoEdicao(false);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvar}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  💾 Salvar
                </button>
              </div>
            </div>
          )}

          {/* Ficha do Servidor */}
          {activeTab === 'ficha' && servidorSelecionado && (
            <div className="space-y-6">
              {/* Cabeçalho da ficha */}
              <div className="flex items-start gap-6">
                {servidorSelecionado.foto ? (
                  <img 
                    src={servidorSelecionado.foto} 
                    alt={servidorSelecionado.nome}
                    className="w-32 h-32 rounded-lg object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-lg bg-gray-200 flex items-center justify-center text-4xl text-gray-400">
                    👤
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{servidorSelecionado.nome}</h2>
                  <p className="text-lg text-gray-600">{cargoLabels[servidorSelecionado.cargo]}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      servidorSelecionado.situacao === 'ativo' ? 'bg-green-100 text-green-800' :
                      servidorSelecionado.situacao === 'desligado' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {situacaoLabels[servidorSelecionado.situacao]}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {setorLabels[servidorSelecionado.setor]}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                      {vinculoLabels[servidorSelecionado.vinculo]}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditarServidor(servidorSelecionado)}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleImprimir(servidorSelecionado)}
                    className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                  >
                    🖨️ Imprimir
                  </button>
                </div>
              </div>

              {/* Dados em grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dados Pessoais */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    👤 Dados Pessoais
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">CPF:</span>
                      <span className="font-medium">{servidorSelecionado.cpf || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">RG:</span>
                      <span className="font-medium">{servidorSelecionado.rg || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Data de Nascimento:</span>
                      <span className="font-medium">{servidorSelecionado.dataNascimento || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Sexo:</span>
                      <span className="font-medium">{servidorSelecionado.sexo || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Estado Civil:</span>
                      <span className="font-medium">{servidorSelecionado.estadoCivil || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Contato */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    📞 Contato
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email:</span>
                      <span className="font-medium">{servidorSelecionado.email || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Telefone:</span>
                      <span className="font-medium">{servidorSelecionado.telefone || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Celular:</span>
                      <span className="font-medium">{servidorSelecionado.celular || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Dados Profissionais */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    💼 Dados Profissionais
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Matrícula:</span>
                      <span className="font-medium">{servidorSelecionado.matricula || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cargo:</span>
                      <span className="font-medium">{cargoLabels[servidorSelecionado.cargo]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Setor:</span>
                      <span className="font-medium">{setorLabels[servidorSelecionado.setor]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vínculo:</span>
                      <span className="font-medium">{vinculoLabels[servidorSelecionado.vinculo]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Turno:</span>
                      <span className="font-medium">{servidorSelecionado.turno ? turnoLabels[servidorSelecionado.turno] : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Carga Horária:</span>
                      <span className="font-medium">{servidorSelecionado.cargaHoraria ? `${servidorSelecionado.cargaHoraria}h` : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Data de Admissão:</span>
                      <span className="font-medium">{servidorSelecionado.dataAdmissao || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Formação */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    🎓 Formação
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Escolaridade:</span>
                      <span className="font-medium">{servidorSelecionado.escolaridade ? escolaridadeLabels[servidorSelecionado.escolaridade] : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Formação:</span>
                      <span className="font-medium">{servidorSelecionado.formacao || '-'}</span>
                    </div>
                    {servidorSelecionado.cursos && (
                      <div>
                        <span className="text-gray-500">Cursos:</span>
                        <p className="font-medium mt-1">{servidorSelecionado.cursos}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Endereço */}
              {(servidorSelecionado.endereco || servidorSelecionado.cidade) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    🏠 Endereço
                  </h3>
                  <p className="text-sm">
                    {[
                      servidorSelecionado.endereco,
                      servidorSelecionado.numero,
                      servidorSelecionado.complemento,
                      servidorSelecionado.bairro,
                      servidorSelecionado.cidade,
                      servidorSelecionado.estado,
                      servidorSelecionado.cep
                    ].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}

              {/* Observações */}
              {servidorSelecionado.observacoes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    📝 Observações
                  </h3>
                  <p className="text-sm">{servidorSelecionado.observacoes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
