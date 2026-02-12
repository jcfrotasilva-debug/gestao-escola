import { useState } from 'react';
import { Atribuicao, DiaSemana } from '../types';
import { useHorario } from '../hooks/useHorario';
import { useAreasConhecimento } from '../hooks/useAreasConhecimento';
import { AreasConhecimento } from './AreasConhecimento';

interface GeradorHorarioProps {
  atribuicoes: Atribuicao[];
}

type TabView = 'configuracao' | 'bloqueios' | 'gerar' | 'visualizar' | 'docentes' | 'geral' | 'conflitos' | 'disponibilidade' | 'alocacao' | 'trocas' | 'areas';

const diasSemanaLabels: Record<DiaSemana, string> = {
  segunda: 'Segunda',
  terca: 'Terça',
  quarta: 'Quarta',
  quinta: 'Quinta',
  sexta: 'Sexta',
};

// Cores para disciplinas
const coresDisciplinas = [
  'bg-blue-100 text-blue-800 border-blue-300',
  'bg-green-100 text-green-800 border-green-300',
  'bg-purple-100 text-purple-800 border-purple-300',
  'bg-orange-100 text-orange-800 border-orange-300',
  'bg-pink-100 text-pink-800 border-pink-300',
  'bg-teal-100 text-teal-800 border-teal-300',
  'bg-indigo-100 text-indigo-800 border-indigo-300',
  'bg-yellow-100 text-yellow-800 border-yellow-300',
  'bg-red-100 text-red-800 border-red-300',
  'bg-cyan-100 text-cyan-800 border-cyan-300',
];

export function GeradorHorario({ atribuicoes }: GeradorHorarioProps) {
  // Lista de docentes para o hook de áreas
  const listaDocentes = [...new Set(atribuicoes.map(a => a.docente))].sort();
  
  // Hook para gerenciar áreas de conhecimento
  const areasHook = useAreasConhecimento(listaDocentes);
  
  // Hook para gerenciar horário (passando as funções de bloqueio por área)
  const {
    config,
    saveConfig,
    bloqueios,
    addBloqueio,
    removeBloqueio,
    grades,
    gerarHorario,
    clearGrades,
    getGradeTurma,
    getHorarioDocente,
    geracaoStatus,
    turmas,
    docentes,
    estatisticas,
    analisarConflitos,
    getSlotsDisponiveisDocente,
    podeAlocarManualmente,
    updateSlot,
    encontrarSugestoesTroca,
    aplicarTroca,
  } = useHorario(atribuicoes, areasHook.isDocenteBloqueadoPorArea, areasHook.getMotivoBloqueioArea);

  const [activeTab, setActiveTab] = useState<TabView>('gerar');
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>('');
  const [docenteSelecionado, setDocenteSelecionado] = useState<string>('');
  
  // Estado para o formulário de bloqueio
  const [novoBloqueio, setNovoBloqueio] = useState<{
    tipo: 'geral' | 'docente' | 'turma';
    entidade: string;
    dia: DiaSemana;
    aulas: number[];
    motivo: string;
  }>({
    tipo: 'geral',
    entidade: '',
    dia: 'segunda',
    aulas: [],
    motivo: '',
  });

  // Mapa de cores para disciplinas
  const disciplinasUnicas = [...new Set(atribuicoes.map(a => a.disciplina))].sort();
  const mapaCoresDisciplinas = new Map<string, string>();
  disciplinasUnicas.forEach((disc, index) => {
    mapaCoresDisciplinas.set(disc, coresDisciplinas[index % coresDisciplinas.length]);
  });

  const handleAddBloqueio = () => {
    // Para bloqueio geral, não precisa de entidade
    if (novoBloqueio.tipo !== 'geral' && !novoBloqueio.entidade) return;
    if (novoBloqueio.aulas.length === 0) return;
    
    addBloqueio({
      tipo: novoBloqueio.tipo,
      entidade: novoBloqueio.tipo === 'geral' ? 'TODOS' : novoBloqueio.entidade,
      dia: novoBloqueio.dia,
      aulas: novoBloqueio.aulas,
      motivo: novoBloqueio.motivo,
    });

    setNovoBloqueio({
      tipo: 'geral',
      entidade: '',
      dia: 'segunda',
      aulas: [],
      motivo: '',
    });
  };

  const toggleAulaBloqueio = (aula: number) => {
    setNovoBloqueio(prev => ({
      ...prev,
      aulas: prev.aulas.includes(aula)
        ? prev.aulas.filter(a => a !== aula)
        : [...prev.aulas, aula].sort((a, b) => a - b),
    }));
  };

  const handlePrint = (tipo: 'turma' | 'docente') => {
    const printContent = document.getElementById(`print-${tipo}`);
    if (!printContent) return;

    const printWindow = window.open('', '', 'height=600,width=900');
    if (!printWindow) return;

    const titulo = tipo === 'turma' 
      ? `Horário - Turma ${turmaSelecionada}` 
      : `Horário - ${docenteSelecionado}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${titulo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
          .header h1 { font-size: 18px; margin-bottom: 5px; }
          .header p { font-size: 12px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 11px; }
          th { background: #f0f0f0; font-weight: bold; }
          .aula-cell { min-height: 50px; vertical-align: middle; }
          .disciplina { font-weight: bold; }
          .docente { font-size: 10px; color: #666; }
          .bloqueado { background: #fee2e2; color: #991b1b; }
          .vazio { background: #f9fafb; }
          .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #666; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
        <div class="footer">
          <p>Sistema de Gestão Escolar - Gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    // Aguarda o carregamento e usa evento para fechar após impressão
    printWindow.onload = () => {
      printWindow.print();
    };
    
    // Fecha a janela apenas quando o usuário terminar de imprimir ou cancelar
    printWindow.onafterprint = () => {
      printWindow.close();
    };
  };

  const gradeTurma = turmaSelecionada ? getGradeTurma(turmaSelecionada) : null;
  const horarioDocente = docenteSelecionado ? getHorarioDocente(docenteSelecionado) : null;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md p-2">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'gerar', icon: '⚡', label: 'Gerar Horário' },
            { id: 'bloqueios', icon: '🚫', label: 'Bloqueios' },
            { id: 'geral', icon: '🏫', label: 'Visão Geral' },
            { id: 'visualizar', icon: '📋', label: 'Por Turma' },
            { id: 'docentes', icon: '👤', label: 'Por Docente' },
            { id: 'conflitos', icon: '⚠️', label: 'Conflitos' },
            { id: 'disponibilidade', icon: '🗺️', label: 'Disponibilidade' },
            { id: 'alocacao', icon: '✏️', label: 'Alocação Manual' },
            { id: 'trocas', icon: '🔄', label: 'Sugestão de Trocas' },
            { id: 'areas', icon: '📚', label: 'Áreas de Conhecimento' },
            { id: 'configuracao', icon: '⚙️', label: 'Configuração' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabView)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Gerar Horário */}
      {activeTab === 'gerar' && (
        <div className="space-y-6">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="text-3xl mb-2">📚</div>
              <div className="text-2xl font-bold text-gray-800">{turmas.length}</div>
              <div className="text-sm text-gray-500">Turmas</div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="text-3xl mb-2">👨‍🏫</div>
              <div className="text-2xl font-bold text-gray-800">{docentes.length}</div>
              <div className="text-sm text-gray-500">Docentes</div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="text-3xl mb-2">🚫</div>
              <div className="text-2xl font-bold text-gray-800">{bloqueios.length}</div>
              <div className="text-sm text-gray-500">Bloqueios</div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-2xl font-bold text-gray-800">{estatisticas.percentualAlocado}%</div>
              <div className="text-sm text-gray-500">Alocado</div>
            </div>
          </div>

          {/* Painel de Geração */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>⚡</span> Gerador de Horário
            </h3>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-800 mb-2">Configuração Atual:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">Dias:</span>
                  <span className="ml-2 font-medium text-blue-800">{config.diasSemana.length}</span>
                </div>
                <div>
                  <span className="text-blue-600">Aulas/dia:</span>
                  <span className="ml-2 font-medium text-blue-800">{config.horarios.length}</span>
                </div>
                <div>
                  <span className="text-blue-600">Total slots/turma:</span>
                  <span className="ml-2 font-medium text-blue-800">
                    {config.diasSemana.length * config.horarios.length}
                  </span>
                </div>
              </div>
            </div>

            {grades.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-green-800 mb-2">Estatísticas do Horário Atual:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-green-600">Aulas alocadas:</span>
                    <span className="ml-2 font-medium text-green-800">{estatisticas.totalAulasAlocadas}</span>
                  </div>
                  <div>
                    <span className="text-green-600">Aulas esperadas:</span>
                    <span className="ml-2 font-medium text-green-800">{estatisticas.totalAulasEsperadas}</span>
                  </div>
                  <div>
                    <span className="text-green-600">Slots livres:</span>
                    <span className="ml-2 font-medium text-green-800">{estatisticas.totalSlotsDisponiveis}</span>
                  </div>
                  <div>
                    <span className="text-green-600">Slots bloqueados:</span>
                    <span className="ml-2 font-medium text-green-800">{estatisticas.totalSlotsBloqueados}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Status da geração */}
            {geracaoStatus.mensagem && (
              <div className={`mb-6 p-4 rounded-lg ${
                geracaoStatus.sucesso === true
                  ? 'bg-green-50 border border-green-200'
                  : geracaoStatus.sucesso === false
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex items-start gap-3">
                  {geracaoStatus.sucesso === true && (
                    <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {geracaoStatus.sucesso === false && (
                    <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <div>
                    <p className={`font-medium ${
                      geracaoStatus.sucesso === true ? 'text-green-800' : 
                      geracaoStatus.sucesso === false ? 'text-red-800' : 'text-yellow-800'
                    }`}>
                      {geracaoStatus.mensagem}
                    </p>
                    {geracaoStatus.conflitos.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-red-700 font-medium">Conflitos encontrados:</p>
                        <ul className="mt-1 text-sm text-red-600 list-disc list-inside">
                          {geracaoStatus.conflitos.map((conflito, idx) => (
                            <li key={idx}>{conflito}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => gerarHorario()}
                disabled={geracaoStatus.gerando || atribuicoes.length === 0}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                  geracaoStatus.gerando || atribuicoes.length === 0
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                }`}
              >
                {geracaoStatus.gerando ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Gerando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Gerar Horário Automático
                  </>
                )}
              </button>

              {grades.length > 0 && (
                <button
                  onClick={clearGrades}
                  className="flex items-center gap-2 px-6 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Limpar Horário
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: 3 Opções removida */}

      {/* Tab: Bloqueios */}
      {activeTab === 'bloqueios' && (
        <div className="space-y-6">
          {/* Formulário de Novo Bloqueio */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>🚫</span> Adicionar Bloqueio
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Bloqueio</label>
                <select
                  value={novoBloqueio.tipo}
                  onChange={(e) => setNovoBloqueio({
                    ...novoBloqueio,
                    tipo: e.target.value as 'geral' | 'docente' | 'turma',
                    entidade: '',
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="geral">🌐 Geral (Todos)</option>
                  <option value="docente">👤 Docente Específico</option>
                  <option value="turma">🏫 Turma Específica</option>
                </select>
                {novoBloqueio.tipo === 'geral' && (
                  <p className="text-xs text-blue-600 mt-1">
                    ⓘ Bloqueia este horário para TODAS as turmas e docentes (ex: ATPC, reuniões)
                  </p>
                )}
              </div>

              {novoBloqueio.tipo !== 'geral' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {novoBloqueio.tipo === 'docente' ? 'Docente' : 'Turma'}
                  </label>
                  <select
                    value={novoBloqueio.entidade}
                    onChange={(e) => setNovoBloqueio({ ...novoBloqueio, entidade: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione...</option>
                    {(novoBloqueio.tipo === 'docente' ? docentes : turmas).map(item => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
              )}

              {novoBloqueio.tipo === 'geral' && (
                <div className="flex items-center justify-center bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="text-center">
                    <div className="text-2xl mb-1">🌐</div>
                    <span className="text-sm font-medium text-amber-800">Bloqueio Geral</span>
                    <p className="text-xs text-amber-600">Afeta todos</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dia da Semana</label>
                <select
                  value={novoBloqueio.dia}
                  onChange={(e) => setNovoBloqueio({ ...novoBloqueio, dia: e.target.value as DiaSemana })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {config.diasSemana.map(dia => (
                    <option key={dia} value={dia}>{diasSemanaLabels[dia]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (opcional)</label>
                <input
                  type="text"
                  value={novoBloqueio.motivo}
                  onChange={(e) => setNovoBloqueio({ ...novoBloqueio, motivo: e.target.value })}
                  placeholder="Ex: Reunião pedagógica"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecione as aulas bloqueadas:
              </label>
              <div className="flex flex-wrap gap-2">
                {config.horarios.map(horario => (
                  <button
                    key={horario.numero}
                    onClick={() => toggleAulaBloqueio(horario.numero)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      novoBloqueio.aulas.includes(horario.numero)
                        ? 'bg-red-100 border-red-500 text-red-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:border-red-300'
                    }`}
                  >
                    <div className="font-medium">{horario.numero}ª aula</div>
                    <div className="text-xs">{horario.inicio}-{horario.fim}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAddBloqueio}
              disabled={(novoBloqueio.tipo !== 'geral' && !novoBloqueio.entidade) || novoBloqueio.aulas.length === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                (novoBloqueio.tipo !== 'geral' && !novoBloqueio.entidade) || novoBloqueio.aulas.length === 0
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Adicionar Bloqueio
            </button>
          </div>

          {/* Lista de Bloqueios */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>📋</span> Bloqueios Cadastrados ({bloqueios.length})
            </h3>

            {bloqueios.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🚫</div>
                <p>Nenhum bloqueio cadastrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bloqueios.map(bloqueio => (
                  <div
                    key={bloqueio.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      bloqueio.tipo === 'geral' 
                        ? 'bg-amber-50 border-amber-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          bloqueio.tipo === 'geral'
                            ? 'bg-amber-100 text-amber-700'
                            : bloqueio.tipo === 'docente' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-purple-100 text-purple-700'
                        }`}>
                          {bloqueio.tipo === 'geral' ? '🌐 Geral' : bloqueio.tipo === 'docente' ? '👤 Docente' : '🏫 Turma'}
                        </span>
                        <span className="font-medium text-gray-800">
                          {bloqueio.tipo === 'geral' ? 'TODOS (Docentes e Turmas)' : bloqueio.entidade}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        <span className="font-medium">{diasSemanaLabels[bloqueio.dia]}</span>
                        {' - '}
                        <span>Aula(s): {bloqueio.aulas.join(', ')}</span>
                        {bloqueio.motivo && (
                          <span className="ml-2 text-gray-500">({bloqueio.motivo})</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeBloqueio(bloqueio.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Visualizar por Turma */}
      {activeTab === 'visualizar' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex flex-wrap items-center gap-4">
              <select
                value={turmaSelecionada}
                onChange={(e) => setTurmaSelecionada(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione uma turma</option>
                {turmas.map(turma => (
                  <option key={turma} value={turma}>{turma}</option>
                ))}
              </select>

              {turmaSelecionada && gradeTurma && (
                <button
                  onClick={() => handlePrint('turma')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Imprimir
                </button>
              )}
            </div>
          </div>

          {!turmaSelecionada ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Selecione uma Turma</h3>
              <p className="text-gray-500">Escolha uma turma para visualizar o horário</p>
            </div>
          ) : !gradeTurma || grades.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Horário não gerado</h3>
              <p className="text-gray-500">Gere o horário primeiro na aba "Gerar Horário"</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div id="print-turma">
                <div className="header p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <h1 className="text-xl font-bold text-center">Horário - Turma {turmaSelecionada}</h1>
                  <p className="text-center text-blue-100 text-sm mt-1">
                    {config.horarios.length} aulas por dia • Segunda a Sexta
                  </p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-3 py-2 text-left text-sm font-medium text-gray-600 border">Aula</th>
                        {config.diasSemana.map(dia => (
                          <th key={dia} className="px-3 py-2 text-center text-sm font-medium text-gray-600 border">
                            {diasSemanaLabels[dia]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {config.horarios.map(horario => (
                        <tr key={horario.numero} className="hover:bg-gray-50">
                          <td className="px-3 py-2 border text-center">
                            <div className="font-medium text-gray-800">{horario.numero}ª</div>
                            <div className="text-xs text-gray-500">{horario.inicio}-{horario.fim}</div>
                          </td>
                          {config.diasSemana.map(dia => {
                            const slot = gradeTurma.slots.find(
                              s => s.dia === dia && s.aula === horario.numero
                            );
                            
                            if (slot?.bloqueado) {
                              return (
                                <td key={dia} className="px-2 py-2 border bg-red-50 text-center">
                                  <div className="text-red-600 text-xs font-medium">🚫 Bloqueado</div>
                                  {slot.motivoBloqueio && (
                                    <div className="text-red-500 text-xs">{slot.motivoBloqueio}</div>
                                  )}
                                </td>
                              );
                            }

                            if (!slot?.conteudo) {
                              return (
                                <td key={dia} className="px-2 py-2 border bg-gray-50 text-center">
                                  <span className="text-gray-400 text-xs">—</span>
                                </td>
                              );
                            }

                            const corDisciplina = mapaCoresDisciplinas.get(slot.conteudo.disciplina) || 'bg-gray-100 text-gray-800';

                            return (
                              <td key={dia} className="px-2 py-2 border">
                                <div className={`rounded p-2 ${corDisciplina}`}>
                                  <div className="font-medium text-sm">{slot.conteudo.disciplina}</div>
                                  <div className="text-xs opacity-75">{slot.conteudo.docente}</div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Visualizar por Docente */}
      {activeTab === 'docentes' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex flex-wrap items-center gap-4">
              <select
                value={docenteSelecionado}
                onChange={(e) => setDocenteSelecionado(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um docente</option>
                {docentes.map(docente => (
                  <option key={docente} value={docente}>{docente}</option>
                ))}
              </select>

              {docenteSelecionado && horarioDocente && grades.length > 0 && (
                <button
                  onClick={() => handlePrint('docente')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Imprimir
                </button>
              )}
            </div>
          </div>

          {!docenteSelecionado ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-5xl mb-4">👤</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Selecione um Docente</h3>
              <p className="text-gray-500">Escolha um docente para visualizar o horário</p>
            </div>
          ) : grades.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Horário não gerado</h3>
              <p className="text-gray-500">Gere o horário primeiro na aba "Gerar Horário"</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div id="print-docente">
                <div className="header p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  <h1 className="text-xl font-bold text-center">Horário - {docenteSelecionado}</h1>
                  <p className="text-center text-purple-100 text-sm mt-1">
                    {config.horarios.length} aulas por dia • Segunda a Sexta
                  </p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-3 py-2 text-left text-sm font-medium text-gray-600 border">Aula</th>
                        {config.diasSemana.map(dia => (
                          <th key={dia} className="px-3 py-2 text-center text-sm font-medium text-gray-600 border">
                            {diasSemanaLabels[dia]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {config.horarios.map(horario => (
                        <tr key={horario.numero} className="hover:bg-gray-50">
                          <td className="px-3 py-2 border text-center">
                            <div className="font-medium text-gray-800">{horario.numero}ª</div>
                            <div className="text-xs text-gray-500">{horario.inicio}-{horario.fim}</div>
                          </td>
                          {config.diasSemana.map(dia => {
                            const slot = horarioDocente?.slots.find(
                              s => s.dia === dia && s.aula === horario.numero
                            );
                            
                            if (slot?.bloqueado) {
                              return (
                                <td key={dia} className="px-2 py-2 border bg-red-50 text-center">
                                  <div className="text-red-600 text-xs font-medium">🚫 Bloqueado</div>
                                  {slot.motivoBloqueio && (
                                    <div className="text-red-500 text-xs">{slot.motivoBloqueio}</div>
                                  )}
                                </td>
                              );
                            }

                            if (!slot?.conteudo) {
                              return (
                                <td key={dia} className="px-2 py-2 border bg-gray-50 text-center">
                                  <span className="text-gray-400 text-xs">—</span>
                                </td>
                              );
                            }

                            const corDisciplina = mapaCoresDisciplinas.get(slot.conteudo.disciplina) || 'bg-gray-100 text-gray-800';

                            return (
                              <td key={dia} className="px-2 py-2 border">
                                <div className={`rounded p-2 ${corDisciplina}`}>
                                  <div className="font-medium text-sm">{slot.turma}</div>
                                  <div className="text-xs opacity-75">{slot.conteudo.disciplina}</div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Visão Geral */}
      {activeTab === 'geral' && (
        <div className="space-y-6">
          {grades.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Horário não gerado</h3>
              <p className="text-gray-500">Gere o horário primeiro na aba "Gerar Horário"</p>
            </div>
          ) : (
            <>
              {/* Botão de Impressão Geral */}
              <div className="bg-white rounded-xl shadow-md p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏫</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">Visão Geral - Todas as Turmas</h3>
                    <p className="text-sm text-gray-500">{grades.length} turmas com horário • {config.diasSemana.length} dias • {config.horarios.length} aulas/dia</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const printContent = document.getElementById('print-geral');
                    if (!printContent) return;

                    const printWindow = window.open('', '', 'height=800,width=1200');
                    if (!printWindow) return;

                    printWindow.document.write(`
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <title>Horário Geral - Todas as Turmas</title>
                        <style>
                          * { margin: 0; padding: 0; box-sizing: border-box; }
                          body { font-family: Arial, sans-serif; padding: 10px; font-size: 10px; }
                          .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                          .header h1 { font-size: 16px; margin-bottom: 3px; }
                          .header p { font-size: 10px; color: #666; }
                          .dia-section { margin-bottom: 20px; page-break-inside: avoid; }
                          .dia-header { background: #2563eb; color: white; padding: 8px; text-align: center; font-weight: bold; font-size: 12px; }
                          table { width: 100%; border-collapse: collapse; }
                          th, td { border: 1px solid #ddd; padding: 4px; text-align: center; font-size: 9px; }
                          th { background: #f0f0f0; font-weight: bold; }
                          .aula-num { background: #f0f0f0; font-weight: bold; width: 50px; }
                          .disciplina { font-weight: bold; font-size: 8px; }
                          .docente { font-size: 7px; color: #666; }
                          .bloqueado { background: #fee2e2; color: #991b1b; font-size: 8px; }
                          .vazio { background: #f9fafb; color: #ccc; }
                          .footer { margin-top: 15px; text-align: center; font-size: 9px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
                          @media print { 
                            body { padding: 5px; }
                            .dia-section { page-break-inside: avoid; }
                          }
                        </style>
                      </head>
                      <body>
                        ${printContent.innerHTML}
                        <div class="footer">
                          <p>Sistema de Gestão Escolar - Horário Geral - Gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
                        </div>
                      </body>
                      </html>
                    `);

                    printWindow.document.close();
                    printWindow.focus();
                    
                    // Aguarda o carregamento e usa evento para fechar após impressão
                    printWindow.onload = () => {
                      printWindow.print();
                    };
                    
                    // Fecha a janela apenas quando o usuário terminar de imprimir ou cancelar
                    printWindow.onafterprint = () => {
                      printWindow.close();
                    };
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Imprimir Visão Geral
                </button>
              </div>

              {/* Grade Geral por Dia */}
              <div id="print-geral" className="space-y-6">
                <div className="header text-center mb-4 hidden print:block">
                  <h1 className="text-xl font-bold">Horário Geral - Todas as Turmas</h1>
                  <p className="text-gray-600">{turmas.length} turmas • Segunda a Sexta • {config.horarios.length} aulas/dia</p>
                </div>

                {(() => {
                  // Usar as turmas que têm grade gerada
                  const turmasComGrade = grades.map(g => g.turma).sort();
                  
                  return config.diasSemana.map(dia => (
                    <div key={dia} className="dia-section bg-white rounded-xl shadow-md overflow-hidden">
                      <div className="dia-header bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3">
                        <h3 className="text-lg font-bold text-center">{diasSemanaLabels[dia]}</h3>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border sticky left-0 bg-gray-100 z-10 min-w-[60px]">
                                Aula
                              </th>
                              {turmasComGrade.map(turma => (
                                <th key={turma} className="px-2 py-2 text-center text-xs font-medium text-gray-600 border min-w-[100px]">
                                  {turma}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {config.horarios.map(horario => (
                              <tr key={horario.numero} className="hover:bg-gray-50">
                                <td className="aula-num px-2 py-2 border text-center sticky left-0 bg-gray-50 z-10">
                                  <div className="font-bold text-gray-800">{horario.numero}ª</div>
                                  <div className="text-xs text-gray-500">{horario.inicio}</div>
                                </td>
                                {turmasComGrade.map(turma => {
                                  const gradeTurma = getGradeTurma(turma);
                                const slot = gradeTurma?.slots.find(
                                  s => s.dia === dia && s.aula === horario.numero
                                );

                                if (slot?.bloqueado) {
                                  return (
                                    <td key={turma} className="bloqueado px-1 py-1 border bg-red-50 text-center">
                                      <div className="text-red-600 text-xs font-medium">🚫</div>
                                      <div className="text-red-500 text-xs truncate" title={slot.motivoBloqueio}>
                                        {slot.motivoBloqueio || 'Bloqueado'}
                                      </div>
                                    </td>
                                  );
                                }

                                if (!slot?.conteudo) {
                                  return (
                                    <td key={turma} className="vazio px-1 py-1 border bg-gray-50 text-center">
                                      <span className="text-gray-300 text-xs">—</span>
                                    </td>
                                  );
                                }

                                const corDisciplina = mapaCoresDisciplinas.get(slot.conteudo.disciplina) || 'bg-gray-100 text-gray-800';

                                return (
                                  <td key={turma} className="px-1 py-1 border">
                                    <div className={`rounded p-1 ${corDisciplina}`}>
                                      <div className="disciplina font-medium text-xs truncate" title={slot.conteudo.disciplina}>
                                        {slot.conteudo.disciplina}
                                      </div>
                                      <div className="docente text-xs opacity-75 truncate" title={slot.conteudo.docente}>
                                        {slot.conteudo.docente.split(' ')[0]}
                                      </div>
                                    </div>
                                  </td>
                                );
                              })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              {/* Legenda de Disciplinas */}
              <div className="bg-white rounded-xl shadow-md p-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>🎨</span> Legenda de Disciplinas
                </h4>
                <div className="flex flex-wrap gap-2">
                  {disciplinasUnicas.map(disciplina => {
                    const cor = mapaCoresDisciplinas.get(disciplina) || 'bg-gray-100 text-gray-800';
                    return (
                      <span
                        key={disciplina}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${cor}`}
                      >
                        {disciplina}
                      </span>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab: Análise de Conflitos */}
      {activeTab === 'conflitos' && (
        <div className="space-y-6">
          {grades.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Horário não gerado</h3>
              <p className="text-gray-500">Gere o horário primeiro na aba "Gerar Horário"</p>
            </div>
          ) : (
            <>
              {(() => {
                const analise = analisarConflitos();
                return (
                  <>
                    {/* Resumo */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className={`rounded-xl shadow-md p-6 ${analise.totalConflitos === 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                        <div className="text-3xl mb-2">{analise.totalConflitos === 0 ? '✅' : '⚠️'}</div>
                        <div className="text-2xl font-bold text-gray-800">{analise.totalConflitos}</div>
                        <div className="text-sm text-gray-600">Conflitos encontrados</div>
                      </div>
                      <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="text-3xl mb-2">📚</div>
                        <div className="text-2xl font-bold text-gray-800">{analise.aulasNaoAlocadas}</div>
                        <div className="text-sm text-gray-600">Aulas não alocadas</div>
                      </div>
                      <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="text-3xl mb-2">📊</div>
                        <div className="text-2xl font-bold text-gray-800">{estatisticas.percentualAlocado}%</div>
                        <div className="text-sm text-gray-600">Taxa de alocação</div>
                      </div>
                    </div>

                    {analise.totalConflitos === 0 ? (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                        <div className="text-5xl mb-4">🎉</div>
                        <h3 className="text-xl font-semibold text-green-800 mb-2">Nenhum conflito encontrado!</h3>
                        <p className="text-green-600">Todas as aulas foram alocadas com sucesso.</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="bg-red-500 text-white px-6 py-3">
                          <h3 className="font-semibold">Lista de Conflitos ({analise.totalConflitos})</h3>
                        </div>
                        <div className="divide-y">
                          {analise.conflitos.map((conflito) => (
                            <div key={conflito.id} className="p-4 hover:bg-gray-50">
                              <div className="flex flex-wrap items-start gap-4">
                                <div className="flex-1 min-w-[200px]">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm font-medium">
                                      {conflito.aulasFaltando} aula(s) faltando
                                    </span>
                                  </div>
                                  <div className="font-medium text-gray-800">{conflito.disciplina}</div>
                                  <div className="text-sm text-gray-600">
                                    <span className="mr-3">👤 {conflito.docente}</span>
                                    <span>🏫 {conflito.turma}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    Necessário: {conflito.aulasNecessarias} | Alocado: {conflito.aulasAlocadas}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-[200px]">
                                  <div className="text-sm">
                                    <div className="font-medium text-red-700 mb-1">Motivos:</div>
                                    <ul className="list-disc list-inside text-red-600 text-xs space-y-1">
                                      {conflito.motivos.map((motivo, idx) => (
                                        <li key={idx}>{motivo}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                                <div className="flex-1 min-w-[200px]">
                                  <div className="text-sm">
                                    <div className="font-medium text-blue-700 mb-1">Sugestões:</div>
                                    <ul className="list-disc list-inside text-blue-600 text-xs space-y-1">
                                      {conflito.sugestoes.map((sugestao, idx) => (
                                        <li key={idx}>{sugestao}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* Tab: Mapa de Disponibilidade */}
      {activeTab === 'disponibilidade' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex flex-wrap items-center gap-4">
              <select
                value={docenteSelecionado}
                onChange={(e) => setDocenteSelecionado(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um docente</option>
                {docentes.map(docente => (
                  <option key={docente} value={docente}>{docente}</option>
                ))}
              </select>
              
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 bg-green-100 border border-green-300 rounded"></span>
                  Disponível
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></span>
                  Ocupado
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 bg-red-100 border border-red-300 rounded"></span>
                  Bloqueado
                </span>
              </div>
            </div>
          </div>

          {!docenteSelecionado ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-5xl mb-4">🗺️</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Selecione um Docente</h3>
              <p className="text-gray-500">Escolha um docente para ver o mapa de disponibilidade</p>
            </div>
          ) : (
            <>
              {(() => {
                const slotsDisponiveis = getSlotsDisponiveisDocente(docenteSelecionado);
                const horarioDocente = getHorarioDocente(docenteSelecionado);
                
                let totalDisponiveis = 0;
                let totalOcupados = 0;
                let totalBloqueados = 0;
                
                horarioDocente.slots.forEach(slot => {
                  if (slot.bloqueado) totalBloqueados++;
                  else if (slot.conteudo) totalOcupados++;
                  else totalDisponiveis++;
                });
                
                return (
                  <>
                    {/* Estatísticas */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-green-700">{totalDisponiveis}</div>
                        <div className="text-sm text-green-600">Slots Disponíveis</div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-blue-700">{totalOcupados}</div>
                        <div className="text-sm text-blue-600">Slots Ocupados</div>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-red-700">{totalBloqueados}</div>
                        <div className="text-sm text-red-600">Slots Bloqueados</div>
                      </div>
                    </div>

                    {/* Mapa */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                      <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-3">
                        <h3 className="font-semibold text-center">Mapa de Disponibilidade - {docenteSelecionado}</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="px-3 py-2 text-left text-sm font-medium text-gray-600 border">Aula</th>
                              {config.diasSemana.map(dia => (
                                <th key={dia} className="px-3 py-2 text-center text-sm font-medium text-gray-600 border">
                                  {diasSemanaLabels[dia]}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {config.horarios.map(horario => (
                              <tr key={horario.numero}>
                                <td className="px-3 py-2 border bg-gray-50 text-center">
                                  <div className="font-medium text-gray-800">{horario.numero}ª</div>
                                  <div className="text-xs text-gray-500">{horario.inicio}</div>
                                </td>
                                {config.diasSemana.map(dia => {
                                  const slot = horarioDocente.slots.find(
                                    s => s.dia === dia && s.aula === horario.numero
                                  );
                                  
                                  if (slot?.bloqueado) {
                                    return (
                                      <td key={dia} className="px-2 py-2 border bg-red-50 text-center">
                                        <div className="text-red-600 text-xs font-medium">🚫 Bloqueado</div>
                                        {slot.motivoBloqueio && (
                                          <div className="text-red-500 text-xs">{slot.motivoBloqueio}</div>
                                        )}
                                      </td>
                                    );
                                  }

                                  if (slot?.conteudo) {
                                    return (
                                      <td key={dia} className="px-2 py-2 border bg-blue-50">
                                        <div className="text-blue-800 font-medium text-sm">{slot.turma}</div>
                                        <div className="text-blue-600 text-xs">{slot.conteudo.disciplina}</div>
                                      </td>
                                    );
                                  }

                                  // Slot disponível - verificar turmas disponíveis
                                  const slotInfo = slotsDisponiveis.find(
                                    s => s.dia === dia && s.aula === horario.numero
                                  );
                                  
                                  return (
                                    <td key={dia} className="px-2 py-2 border bg-green-50 text-center">
                                      <div className="text-green-600 text-xs font-medium">✓ Disponível</div>
                                      {slotInfo && slotInfo.turmasDisponiveis.length > 0 && (
                                        <div className="text-green-500 text-xs mt-1">
                                          {slotInfo.turmasDisponiveis.length} turma(s)
                                        </div>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* Tab: Alocação Manual */}
      {activeTab === 'alocacao' && (
        <div className="space-y-6">
          {grades.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Horário não gerado</h3>
              <p className="text-gray-500">Gere o horário primeiro na aba "Gerar Horário"</p>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex gap-3">
                  <span className="text-2xl">💡</span>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Como usar a Alocação Manual:</p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-700">
                      <li>Selecione uma turma abaixo</li>
                      <li>Clique em um slot vazio (verde) na grade</li>
                      <li>Escolha a disciplina para alocar</li>
                      <li>O sistema validará automaticamente se é possível</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-4">
                <select
                  value={turmaSelecionada}
                  onChange={(e) => setTurmaSelecionada(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione uma turma</option>
                  {turmas.map(turma => (
                    <option key={turma} value={turma}>{turma}</option>
                  ))}
                </select>
              </div>

              {!turmaSelecionada ? (
                <div className="bg-white rounded-xl shadow-md p-12 text-center">
                  <div className="text-5xl mb-4">✏️</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Selecione uma Turma</h3>
                  <p className="text-gray-500">Escolha uma turma para fazer alocação manual</p>
                </div>
              ) : (
                <>
                  {(() => {
                    const gradeTurmaAtual = getGradeTurma(turmaSelecionada);
                    if (!gradeTurmaAtual) return null;
                    
                    // Atribuições disponíveis para esta turma
                    const atribuicoesTurma = atribuicoes.filter(a => a.turma === turmaSelecionada);
                    
                    // Função para contar aulas alocadas por disciplina
                    const contarAulasAlocadas = (disciplina: string, docente: string): number => {
                      return gradeTurmaAtual.slots.filter(
                        slot => slot.conteudo?.disciplina === disciplina && slot.conteudo?.docente === docente
                      ).length;
                    };
                    
                    // Função para obter aulas necessárias
                    const getAulasNecessarias = (disciplina: string, docente: string): number => {
                      const attr = atribuicoesTurma.find(a => a.disciplina === disciplina && a.docente === docente);
                      return attr?.aulas || 0;
                    };
                    
                    // Calcular status de cada disciplina
                    const statusDisciplinas = atribuicoesTurma.map(attr => {
                      const alocadas = contarAulasAlocadas(attr.disciplina, attr.docente);
                      const necessarias = getAulasNecessarias(attr.disciplina, attr.docente);
                      const status = alocadas === necessarias ? 'completo' : alocadas > necessarias ? 'excedido' : 'pendente';
                      return {
                        ...attr,
                        alocadas,
                        necessarias,
                        status,
                      };
                    });
                    
                    const totalAlocadas = statusDisciplinas.reduce((acc, d) => acc + d.alocadas, 0);
                    const totalNecessarias = statusDisciplinas.reduce((acc, d) => acc + d.necessarias, 0);
                    
                    return (
                      <div className="space-y-4">
                      {/* Painel de Status das Disciplinas */}
                      <div className="bg-white rounded-xl shadow-md p-4">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <span>📊</span> Status das Aulas - {turmaSelecionada}
                          <span className={`ml-auto px-3 py-1 rounded-full text-sm font-medium ${
                            totalAlocadas === totalNecessarias 
                              ? 'bg-green-100 text-green-700' 
                              : totalAlocadas > totalNecessarias 
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {totalAlocadas}/{totalNecessarias} aulas
                          </span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {statusDisciplinas.map(disc => (
                            <div 
                              key={disc.id}
                              className={`p-2 rounded-lg border flex items-center justify-between ${
                                disc.status === 'completo' 
                                  ? 'bg-green-50 border-green-200' 
                                  : disc.status === 'excedido'
                                    ? 'bg-red-50 border-red-200'
                                    : 'bg-yellow-50 border-yellow-200'
                              }`}
                            >
                              <div>
                                <div className="font-medium text-sm text-gray-800">{disc.disciplina}</div>
                                <div className="text-xs text-gray-500">{disc.docente.split(' ')[0]}</div>
                              </div>
                              <div className={`flex items-center gap-1 text-sm font-bold ${
                                disc.status === 'completo' 
                                  ? 'text-green-600' 
                                  : disc.status === 'excedido'
                                    ? 'text-red-600'
                                    : 'text-yellow-600'
                              }`}>
                                {disc.status === 'completo' && <span>✅</span>}
                                {disc.status === 'excedido' && <span>⚠️</span>}
                                {disc.status === 'pendente' && <span>⏳</span>}
                                {disc.alocadas}/{disc.necessarias}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Legenda */}
                        <div className="mt-3 pt-3 border-t flex flex-wrap gap-4 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <span className="w-3 h-3 bg-green-100 border border-green-300 rounded"></span>
                            ✅ Completo
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></span>
                            ⏳ Pendente
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-3 h-3 bg-red-100 border border-red-300 rounded"></span>
                            ⚠️ Excedido (mais aulas que o necessário)
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3">
                          <h3 className="font-semibold text-center">Alocação Manual - {turmaSelecionada}</h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="px-3 py-2 text-left text-sm font-medium text-gray-600 border">Aula</th>
                                {config.diasSemana.map(dia => (
                                  <th key={dia} className="px-3 py-2 text-center text-sm font-medium text-gray-600 border">
                                    {diasSemanaLabels[dia]}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {config.horarios.map(horario => (
                                <tr key={horario.numero}>
                                  <td className="px-3 py-2 border bg-gray-50 text-center">
                                    <div className="font-medium text-gray-800">{horario.numero}ª</div>
                                    <div className="text-xs text-gray-500">{horario.inicio}</div>
                                  </td>
                                  {config.diasSemana.map(dia => {
                                    const slot = gradeTurmaAtual.slots.find(
                                      s => s.dia === dia && s.aula === horario.numero
                                    );
                                    
                                    if (slot?.bloqueado) {
                                      return (
                                        <td key={dia} className="px-2 py-2 border bg-red-50 text-center">
                                          <div className="text-red-600 text-xs font-medium">🚫 Bloqueado</div>
                                        </td>
                                      );
                                    }

                                    if (slot?.conteudo) {
                                      const corDisciplina = mapaCoresDisciplinas.get(slot.conteudo.disciplina) || 'bg-gray-100 text-gray-800';
                                      return (
                                        <td key={dia} className="px-2 py-2 border">
                                          <div className={`rounded p-2 ${corDisciplina}`}>
                                            <div className="font-medium text-sm">{slot.conteudo.disciplina}</div>
                                            <div className="text-xs opacity-75">{slot.conteudo.docente}</div>
                                            <button
                                              onClick={() => updateSlot(turmaSelecionada, dia, horario.numero, null)}
                                              className="mt-1 text-xs text-red-600 hover:text-red-800 underline"
                                            >
                                              Remover
                                            </button>
                                          </div>
                                        </td>
                                      );
                                    }

                                    // Slot vazio - permitir alocação
                                    return (
                                      <td key={dia} className="px-2 py-2 border bg-green-50">
                                        <select
                                          className="w-full text-xs p-1 border border-green-300 rounded bg-white"
                                          defaultValue=""
                                          onChange={(e) => {
                                            if (!e.target.value) return;
                                            const [docente, disciplina] = e.target.value.split('|||');
                                            
                                            const validacao = podeAlocarManualmente(
                                              turmaSelecionada,
                                              dia,
                                              horario.numero,
                                              docente,
                                              disciplina
                                            );
                                            
                                            if (!validacao.pode) {
                                              alert(`Não é possível alocar: ${validacao.motivo}`);
                                              e.target.value = '';
                                              return;
                                            }
                                            
                                            updateSlot(turmaSelecionada, dia, horario.numero, {
                                              turma: turmaSelecionada,
                                              disciplina,
                                              docente,
                                            });
                                            e.target.value = '';
                                          }}
                                        >
                                          <option value="">+ Alocar</option>
                                          {atribuicoesTurma.map(attr => {
                                            const validacao = podeAlocarManualmente(
                                              turmaSelecionada,
                                              dia,
                                              horario.numero,
                                              attr.docente,
                                              attr.disciplina
                                            );
                                            return (
                                              <option
                                                key={attr.id}
                                                value={`${attr.docente}|||${attr.disciplina}`}
                                                disabled={!validacao.pode}
                                              >
                                                {attr.disciplina} ({attr.docente.split(' ')[0]})
                                                {!validacao.pode ? ' ❌' : ''}
                                              </option>
                                            );
                                          })}
                                        </select>
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab: Sugestão de Trocas */}
      {activeTab === 'trocas' && (
        <div className="space-y-6">
          {grades.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Horário não gerado</h3>
              <p className="text-gray-500">Gere o horário primeiro na aba "Gerar Horário"</p>
            </div>
          ) : (
            <>
              {(() => {
                const sugestoes = encontrarSugestoesTroca();
                const analise = analisarConflitos();
                
                if (analise.totalConflitos === 0) {
                  return (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                      <div className="text-5xl mb-4">🎉</div>
                      <h3 className="text-xl font-semibold text-green-800 mb-2">Nenhum conflito encontrado!</h3>
                      <p className="text-green-600">Todas as aulas foram alocadas com sucesso. Não há necessidade de trocas.</p>
                    </div>
                  );
                }
                
                if (sugestoes.length === 0) {
                  return (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
                      <div className="text-5xl mb-4">🤔</div>
                      <h3 className="text-xl font-semibold text-yellow-800 mb-2">Nenhuma troca automática encontrada</h3>
                      <p className="text-yellow-600 mb-4">
                        O sistema não encontrou trocas simples que possam resolver os conflitos.
                      </p>
                      <p className="text-sm text-yellow-700">
                        Sugestões:
                      </p>
                      <ul className="text-sm text-yellow-600 list-disc list-inside mt-2">
                        <li>Use a aba "Alocação Manual" para ajustar manualmente</li>
                        <li>Verifique os bloqueios cadastrados</li>
                        <li>Considere aumentar o limite de aulas por dia nas configurações</li>
                      </ul>
                    </div>
                  );
                }
                
                // Agrupar sugestões por conflito
                const sugestoesPorConflito = new Map<string, typeof sugestoes>();
                sugestoes.forEach(s => {
                  const key = s.conflito.id;
                  if (!sugestoesPorConflito.has(key)) {
                    sugestoesPorConflito.set(key, []);
                  }
                  sugestoesPorConflito.get(key)!.push(s);
                });
                
                return (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex gap-3">
                        <span className="text-2xl">💡</span>
                        <div className="text-sm text-blue-800">
                          <p className="font-medium mb-1">Como funcionam as sugestões de troca:</p>
                          <p className="text-blue-700">
                            O sistema analisa os conflitos e identifica aulas que podem ser movidas para 
                            liberar espaço para o docente que está com problema. Ao aplicar uma troca, 
                            a aula será movida automaticamente.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-red-700">{analise.totalConflitos}</div>
                        <div className="text-sm text-red-600">Conflitos</div>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-700">{analise.aulasNaoAlocadas}</div>
                        <div className="text-sm text-yellow-600">Aulas não alocadas</div>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-green-700">{sugestoes.length}</div>
                        <div className="text-sm text-green-600">Sugestões de troca</div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {Array.from(sugestoesPorConflito.entries()).map(([conflitoId, sugestoesConflito]) => {
                        const conflito = sugestoesConflito[0].conflito;
                        
                        return (
                          <div key={conflitoId} className="bg-white rounded-xl shadow-md overflow-hidden">
                            <div className="bg-red-500 text-white px-4 py-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-semibold">⚠️ Conflito: {conflito.disciplina}</span>
                                  <span className="ml-2 text-red-100">({conflito.aulasFaltando} aula(s) faltando)</span>
                                </div>
                                <div className="text-sm text-red-100">
                                  👤 {conflito.docente} • 🏫 {conflito.turma}
                                </div>
                              </div>
                            </div>
                            
                            <div className="p-4">
                              <p className="text-sm text-gray-600 mb-4">
                                <strong>Sugestões de troca para resolver este conflito:</strong>
                              </p>
                              
                              <div className="space-y-3">
                                {sugestoesConflito.map((sugestao) => {
                                  const diasLabels: Record<DiaSemana, string> = {
                                    segunda: 'Segunda',
                                    terca: 'Terça',
                                    quarta: 'Quarta',
                                    quinta: 'Quinta',
                                    sexta: 'Sexta'
                                  };
                                  
                                  return (
                                    <div 
                                      key={sugestao.id} 
                                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                                    >
                                      <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div className="flex-1 min-w-[250px]">
                                          <div className="flex items-center gap-2 mb-2">
                                            <span className="text-lg">🔄</span>
                                            <span className="font-medium text-gray-800">Trocar aula de:</span>
                                          </div>
                                          
                                          <div className="bg-gray-100 rounded-lg p-3 mb-2">
                                            <div className="text-sm">
                                              <span className="font-medium text-gray-700">{sugestao.aulaOrigem.disciplina}</span>
                                              <span className="text-gray-500"> ({sugestao.aulaOrigem.docente.split(' ')[0]})</span>
                                            </div>
                                            <div className="text-sm text-gray-600">
                                              Turma: <strong>{sugestao.aulaOrigem.turma}</strong>
                                            </div>
                                            <div className="text-sm text-gray-600">
                                              De: <strong>{diasLabels[sugestao.aulaOrigem.dia]}</strong>, {sugestao.aulaOrigem.aula}ª aula
                                            </div>
                                            <div className="text-sm text-gray-600">
                                              Para: <strong>{diasLabels[sugestao.aulaDestino.dia]}</strong>, {sugestao.aulaDestino.aula}ª aula
                                            </div>
                                          </div>
                                          
                                          <div className="text-sm text-green-700 bg-green-50 rounded p-2">
                                            ✅ {sugestao.beneficio}
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center">
                                          <button
                                            onClick={() => {
                                              aplicarTroca(sugestao);
                                              alert('Troca aplicada com sucesso! Agora você pode alocar a aula na aba "Alocação Manual".');
                                            }}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                          >
                                            <span>✓</span>
                                            Aplicar Troca
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* Tab: Áreas de Conhecimento */}
      {activeTab === 'areas' && (
        <div className="space-y-6">
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="flex gap-3">
              <span className="text-2xl">💡</span>
              <div className="text-sm text-purple-800">
                <p className="font-medium mb-1">Áreas de Conhecimento - ATPC por Área</p>
                <p className="text-purple-700">
                  Cadastre as áreas de conhecimento (Linguagens, Ciências, Humanas, etc.), 
                  vincule os docentes às suas respectivas áreas e defina bloqueios de ATPC 
                  por área. Assim, todos os docentes de uma área serão bloqueados automaticamente 
                  no dia/horário definido.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <AreasConhecimento
              areas={areasHook.areas}
              bloqueiosArea={areasHook.bloqueiosArea}
              docentesSemArea={areasHook.docentesSemArea}
              horarios={config.horarios}
              onAdicionarArea={areasHook.adicionarArea}
              onRemoverArea={areasHook.removerArea}
              onVincularDocente={areasHook.vincularDocente}
              onDesvincularDocente={areasHook.desvincularDocente}
              onAdicionarBloqueio={areasHook.adicionarBloqueioArea}
              onRemoverBloqueio={areasHook.removerBloqueioArea}
            />
          </div>
          
          {/* Resumo de Bloqueios por Área */}
          {areasHook.areas.length > 0 && areasHook.bloqueiosArea.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>📊</span> Resumo: Docentes Bloqueados por ATPC
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {areasHook.areas.map(area => {
                  const bloqueiosDaArea = areasHook.bloqueiosArea.filter(b => b.areaId === area.id);
                  if (bloqueiosDaArea.length === 0) return null;
                  
                  return (
                    <div 
                      key={area.id}
                      className="rounded-lg border-l-4 p-4 bg-gray-50"
                      style={{ borderLeftColor: area.cor }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: area.cor }}
                        />
                        <span className="font-semibold text-gray-800">{area.nome}</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {area.docentes.length} docente(s) afetado(s)
                      </div>
                      <div className="space-y-1">
                        {bloqueiosDaArea.map(bloqueio => (
                          <div key={bloqueio.id} className="text-sm text-red-600">
                            🚫 {bloqueio.dia.charAt(0).toUpperCase() + bloqueio.dia.slice(1)}: 
                            {' '}Aulas {bloqueio.aulas.sort((a, b) => a - b).join(', ')}
                            {bloqueio.motivo && ` (${bloqueio.motivo})`}
                          </div>
                        ))}
                      </div>
                      {area.docentes.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="text-xs text-gray-500">
                            Docentes: {area.docentes.slice(0, 3).map(d => d.split(' ')[0]).join(', ')}
                            {area.docentes.length > 3 && ` +${area.docentes.length - 3}`}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Configuração */}
      {activeTab === 'configuracao' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>⚙️</span> Configuração do Horário
          </h3>

          <div className="space-y-6">
            {/* Horários */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horários das Aulas (9 aulas de 50 minutos)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {config.horarios.map((horario, index) => (
                  <div key={horario.numero} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700 w-16">{horario.numero}ª Aula:</span>
                    <input
                      type="time"
                      value={horario.inicio}
                      onChange={(e) => {
                        const novosHorarios = [...config.horarios];
                        novosHorarios[index] = { ...horario, inicio: e.target.value };
                        saveConfig({ ...config, horarios: novosHorarios });
                      }}
                      className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="time"
                      value={horario.fim}
                      onChange={(e) => {
                        const novosHorarios = [...config.horarios];
                        novosHorarios[index] = { ...horario, fim: e.target.value };
                        saveConfig({ ...config, horarios: novosHorarios });
                      }}
                      className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Configuração padrão para escola integral:</p>
                  <ul className="list-disc list-inside text-blue-700 space-y-1">
                    <li>9 aulas de 50 minutos por dia</li>
                    <li>Segunda a Sexta-feira</li>
                    <li>Aulas duplas permitidas quando necessário</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
