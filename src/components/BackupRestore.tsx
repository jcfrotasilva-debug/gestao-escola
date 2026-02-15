import { useRef, useState } from 'react';
import { Atribuicao, CadastroDocente, Aluno, Servidor, Escola, AreaConhecimento, BloqueioArea, Bloqueio, GradeHorario, ProjetoEscolar, TurmaProjeto, AtribuicaoProjeto } from '../types';

interface BackupData {
  version: string;
  exportDate: string;
  schoolName: string;
  // Dados incluídos
  atribuicoes?: Omit<Atribuicao, 'id'>[];
  docentes?: CadastroDocente[];
  alunos?: Aluno[];
  servidores?: Servidor[];
  escola?: Escola | null;
  areasConhecimento?: AreaConhecimento[];
  bloqueiosArea?: BloqueioArea[];
  bloqueios?: Bloqueio[];
  horarios?: GradeHorario[];
  projetos?: ProjetoEscolar[];
  projetoTurmas?: TurmaProjeto[];
  projetoAtribuicoes?: AtribuicaoProjeto[];
  // Contadores
  totalAtribuicoes?: number;
  totalDocentes?: number;
  totalAlunos?: number;
  totalServidores?: number;
  // Compatibilidade com versão antiga
  data?: any[];
}

interface BackupRestoreProps {
  // Atribuições
  atribuicoes: Atribuicao[];
  onRestoreAtribuicoes: (data: Omit<Atribuicao, 'id'>[]) => void;
  // Docentes
  docentes?: CadastroDocente[];
  onRestoreDocentes?: (data: CadastroDocente[]) => void;
  // Alunos
  alunos?: Aluno[];
  onRestoreAlunos?: (data: Aluno[]) => void;
  // Servidores
  servidores?: Servidor[];
  onRestoreServidores?: (data: Servidor[]) => void;
  // Escola
  escola?: Escola | null;
  onRestoreEscola?: (data: Escola) => void;
  // Áreas de Conhecimento
  areasConhecimento?: AreaConhecimento[];
  bloqueiosArea?: BloqueioArea[];
  onRestoreAreas?: (areas: AreaConhecimento[], bloqueios: BloqueioArea[]) => void;
  // Horários
  horarios?: GradeHorario[];
  bloqueios?: Bloqueio[];
  onRestoreHorarios?: (horarios: GradeHorario[], bloqueios: Bloqueio[]) => void;
  // Projetos
  projetos?: ProjetoEscolar[];
  projetoTurmas?: TurmaProjeto[];
  projetoAtribuicoes?: AtribuicaoProjeto[];
  onRestoreProjetos?: (projetos: ProjetoEscolar[], turmas: TurmaProjeto[], atribuicoes: AtribuicaoProjeto[]) => void;
  // Controle
  onClose: () => void;
}

export function BackupRestore({ 
  atribuicoes, 
  onRestoreAtribuicoes,
  docentes = [],
  onRestoreDocentes,
  alunos = [],
  onRestoreAlunos,
  servidores = [],
  onRestoreServidores,
  escola,
  onRestoreEscola,
  areasConhecimento = [],
  bloqueiosArea = [],
  onRestoreAreas,
  horarios = [],
  bloqueios = [],
  onRestoreHorarios,
  projetos = [],
  projetoTurmas = [],
  projetoAtribuicoes = [],
  onRestoreProjetos,
  onClose 
}: BackupRestoreProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [importedData, setImportedData] = useState<BackupData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mode, setMode] = useState<'menu' | 'export' | 'import'>('menu');

  // Contadores
  const totalAtribuicoes = atribuicoes.length;
  const totalDocentes = docentes.length;
  const totalAlunos = alunos.length;
  const totalServidores = servidores.length;
  const totalAreas = areasConhecimento.length;
  const totalHorarios = horarios.length;
  const totalProjetos = projetos.length;
  const temDados = totalAtribuicoes > 0 || totalDocentes > 0 || totalAlunos > 0 || totalServidores > 0 || escola || totalAreas > 0 || totalHorarios > 0 || totalProjetos > 0;

  const handleExport = () => {
    const dataToExport: BackupData = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      schoolName: escola?.nome || 'Sistema de Gestão Escolar',
      // Atribuições
      atribuicoes: atribuicoes.map(({ id, ...rest }) => rest),
      totalAtribuicoes: atribuicoes.length,
      // Docentes
      docentes: docentes,
      totalDocentes: docentes.length,
      // Alunos
      alunos: alunos,
      totalAlunos: alunos.length,
      // Servidores
      servidores: servidores,
      totalServidores: servidores.length,
      // Escola
      escola: escola,
      // Áreas de Conhecimento
      areasConhecimento: areasConhecimento,
      bloqueiosArea: bloqueiosArea,
      // Horários
      horarios: horarios,
      bloqueios: bloqueios,
      // Projetos
      projetos: projetos,
      projetoTurmas: projetoTurmas,
      projetoAtribuicoes: projetoAtribuicoes,
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-completo-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setSuccess('Backup COMPLETO exportado com sucesso!');
    setMode('export');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    setError(null);
    setImportedData(null);

    if (!file.name.endsWith('.json')) {
      setError('Por favor, selecione um arquivo JSON válido.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content) as BackupData;
        
        // Validar estrutura básica
        if (!parsed.version) {
          setError('Arquivo inválido: estrutura de dados não reconhecida.');
          return;
        }

        // Verificar se tem algum dado
        const temAlgumDado = 
          (parsed.atribuicoes && parsed.atribuicoes.length > 0) ||
          (parsed.docentes && parsed.docentes.length > 0) ||
          (parsed.alunos && parsed.alunos.length > 0) ||
          parsed.escola ||
          (parsed.areasConhecimento && parsed.areasConhecimento.length > 0) ||
          (parsed.horarios && parsed.horarios.length > 0) ||
          (parsed.projetos && parsed.projetos.length > 0);

        if (!temAlgumDado) {
          // Tentar formato antigo (versão 1.0)
          if (parsed.data && Array.isArray(parsed.data)) {
            const validData = parsed.data.filter((item: any) => {
              return item.docente && item.turma && item.disciplina && typeof item.aulas === 'number';
            });
            if (validData.length > 0) {
              parsed.atribuicoes = validData;
              parsed.totalAtribuicoes = validData.length;
            }
          }
        }

        if (!parsed.atribuicoes?.length && !parsed.docentes?.length && !parsed.alunos?.length && !parsed.escola && !parsed.areasConhecimento?.length) {
          setError('Nenhum dado válido encontrado no arquivo.');
          return;
        }

        setImportedData(parsed);
        setSuccess('Arquivo de backup válido!');
      } catch (err) {
        setError('Erro ao ler o arquivo. Verifique se é um arquivo de backup válido.');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleConfirmRestore = () => {
    if (importedData) {
      // Restaurar Atribuições
      if (importedData.atribuicoes && importedData.atribuicoes.length > 0) {
        onRestoreAtribuicoes(importedData.atribuicoes);
      }

      // Restaurar Docentes
      if (importedData.docentes && importedData.docentes.length > 0 && onRestoreDocentes) {
        onRestoreDocentes(importedData.docentes);
      }

      // Restaurar Alunos
      if (importedData.alunos && importedData.alunos.length > 0 && onRestoreAlunos) {
        onRestoreAlunos(importedData.alunos);
      }

      // Restaurar Servidores
      if (importedData.servidores && importedData.servidores.length > 0 && onRestoreServidores) {
        onRestoreServidores(importedData.servidores);
      }

      // Restaurar Escola
      if (importedData.escola && onRestoreEscola) {
        onRestoreEscola(importedData.escola);
      }

      // Restaurar Áreas
      if (onRestoreAreas) {
        onRestoreAreas(
          importedData.areasConhecimento || [],
          importedData.bloqueiosArea || []
        );
      }

      // Restaurar Horários
      if (onRestoreHorarios) {
        onRestoreHorarios(
          importedData.horarios || [],
          importedData.bloqueios || []
        );
      }

      // Restaurar Projetos
      if (onRestoreProjetos) {
        onRestoreProjetos(
          importedData.projetos || [],
          importedData.projetoTurmas || [],
          importedData.projetoAtribuicoes || []
        );
      }

      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">Backup e Restauração</h2>
                <p className="text-purple-100 text-sm">Backup COMPLETO do sistema</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {mode === 'menu' && (
            <div className="space-y-4">
              <p className="text-gray-600 text-center mb-6">
                Exporte ou importe <strong>TODOS</strong> os dados do sistema:
              </p>

              {/* Resumo dos dados */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalAtribuicoes}</div>
                  <div className="text-xs text-blue-600">Atribuições</div>
                </div>
                <div className="bg-teal-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-teal-600">{totalDocentes}</div>
                  <div className="text-xs text-teal-600">Docentes</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{totalAlunos}</div>
                  <div className="text-xs text-purple-600">Alunos</div>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-amber-600">{totalServidores}</div>
                  <div className="text-xs text-amber-600">Servidores</div>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-indigo-600">{totalAreas}</div>
                  <div className="text-xs text-indigo-600">Áreas</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{totalHorarios}</div>
                  <div className="text-xs text-green-600">Horários</div>
                </div>
                <div className="bg-rose-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-rose-600">{totalProjetos}</div>
                  <div className="text-xs text-rose-600">Projetos</div>
                </div>
              </div>

              {/* Export Option */}
              <button
                onClick={handleExport}
                disabled={!temDados}
                className={`w-full p-5 rounded-xl border-2 transition-all text-left flex items-start gap-4 ${
                  !temDados
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    : 'border-green-200 hover:border-green-400 hover:bg-green-50'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  !temDados ? 'bg-gray-200' : 'bg-green-100'
                }`}>
                  <svg className={`w-6 h-6 ${!temDados ? 'text-gray-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${!temDados ? 'text-gray-400' : 'text-gray-800'}`}>
                    Exportar Backup COMPLETO
                  </h3>
                  <p className={`text-sm mt-1 ${!temDados ? 'text-gray-400' : 'text-gray-500'}`}>
                    {!temDados
                      ? 'Nenhum dado para exportar'
                      : 'Baixar arquivo com TODOS os dados do sistema'
                    }
                  </p>
                </div>
                {temDados && (
                  <svg className="w-5 h-5 text-green-500 mt-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>

              {/* Import Option */}
              <button
                onClick={() => setMode('import')}
                className="w-full p-5 rounded-xl border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left flex items-start gap-4"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">Importar Backup</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Restaurar dados de um arquivo de backup
                  </p>
                </div>
                <svg className="w-5 h-5 text-blue-500 mt-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Info Box */}
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-green-800">
                    <p className="font-medium">O backup inclui:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-green-700">
                      <li>Cadastro da Escola e Projetos</li>
                      <li>Cadastro de Docentes (fichas completas)</li>
                      <li>Cadastro de Alunos</li>
                      <li>Atribuição de Aulas</li>
                      <li>Áreas de Conhecimento e Bloqueios</li>
                      <li>Horários Gerados</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {mode === 'export' && success && (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Backup Concluído!</h3>
              <p className="text-gray-600 mb-6">{success}</p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
                <p className="font-medium text-gray-700 mb-2">Dados exportados:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>✅ {totalAtribuicoes} atribuições</div>
                  <div>✅ {totalDocentes} docentes</div>
                  <div>✅ {totalAlunos} alunos</div>
                  <div>✅ {totalAreas} áreas</div>
                  <div>✅ {totalHorarios} horários</div>
                  <div>✅ {totalProjetos} projetos</div>
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-6">
                Envie o arquivo baixado para seu colega por WhatsApp, email ou qualquer outro meio.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => { setMode('menu'); setSuccess(null); }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}

          {mode === 'import' && (
            <div className="space-y-4">
              <button
                onClick={() => { setMode('menu'); setImportedData(null); setError(null); setSuccess(null); }}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Voltar
              </button>

              {/* Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-gray-700 font-medium">
                  Arraste o arquivo de backup aqui
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  ou clique para selecionar
                </p>
                <p className="text-xs text-gray-400 mt-3">
                  Aceita arquivo .json exportado do sistema
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Success Message & Confirm */}
              {importedData && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-green-800 font-medium">{success}</p>
                        <p className="text-sm text-green-600 mt-1">
                          Versão: {importedData.version} | Data: {new Date(importedData.exportDate).toLocaleDateString('pt-BR')}
                        </p>
                        
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                          {importedData.atribuicoes && importedData.atribuicoes.length > 0 && (
                            <div className="bg-white p-2 rounded border border-green-200 flex items-center gap-2">
                              <span className="text-green-500">✓</span>
                              <span className="text-gray-600">{importedData.atribuicoes.length} atribuições</span>
                            </div>
                          )}
                          {importedData.docentes && importedData.docentes.length > 0 && (
                            <div className="bg-white p-2 rounded border border-green-200 flex items-center gap-2">
                              <span className="text-green-500">✓</span>
                              <span className="text-gray-600">{importedData.docentes.length} docentes</span>
                            </div>
                          )}
                          {importedData.alunos && importedData.alunos.length > 0 && (
                            <div className="bg-white p-2 rounded border border-green-200 flex items-center gap-2">
                              <span className="text-green-500">✓</span>
                              <span className="text-gray-600">{importedData.alunos.length} alunos</span>
                            </div>
                          )}
                          {importedData.escola && (
                            <div className="bg-white p-2 rounded border border-green-200 flex items-center gap-2">
                              <span className="text-green-500">✓</span>
                              <span className="text-gray-600">Dados da escola</span>
                            </div>
                          )}
                          {importedData.areasConhecimento && importedData.areasConhecimento.length > 0 && (
                            <div className="bg-white p-2 rounded border border-green-200 flex items-center gap-2">
                              <span className="text-green-500">✓</span>
                              <span className="text-gray-600">{importedData.areasConhecimento.length} áreas</span>
                            </div>
                          )}
                          {importedData.horarios && importedData.horarios.length > 0 && (
                            <div className="bg-white p-2 rounded border border-green-200 flex items-center gap-2">
                              <span className="text-green-500">✓</span>
                              <span className="text-gray-600">{importedData.horarios.length} horários</span>
                            </div>
                          )}
                          {importedData.projetos && importedData.projetos.length > 0 && (
                            <div className="bg-white p-2 rounded border border-green-200 flex items-center gap-2">
                              <span className="text-green-500">✓</span>
                              <span className="text-gray-600">{importedData.projetos.length} projetos</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-amber-700 text-sm">
                      <strong>Atenção:</strong> Os dados atuais serão substituídos pelos dados do backup.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => { setImportedData(null); setSuccess(null); }}
                      className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirmRestore}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Confirmar Importação
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
