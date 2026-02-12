import { useState, useEffect } from 'react';
import { useAtribuicoes } from './hooks/useAtribuicoes';
import { useEscola } from './hooks/useEscola';
import { useAlunos } from './hooks/useAlunos';
import { useCadastroDocentes } from './hooks/useCadastroDocentes';
import { useServidores } from './hooks/useServidores';
import { useAuth } from './hooks/useAuth';
import { useDatabase } from './hooks/useDatabase';
import { LoginPage } from './components/LoginPage';
import { FileUpload } from './components/FileUpload';
import { AtribuicaoTable } from './components/AtribuicaoTable';
import { AtribuicaoForm } from './components/AtribuicaoForm';
import { Dashboard } from './components/Dashboard';
import { DocentesTurmas } from './components/DocentesTurmas';
import { Relatorios } from './components/Relatorios';
import { BackupRestore } from './components/BackupRestore';
import { GeradorHorario } from './components/GeradorHorario';
import { CadastroDocentes } from './components/CadastroDocentes';
import { CadastroServidores } from './components/CadastroServidores';
import CadastroEscola from './components/CadastroEscola';
import CadastroAlunos from './components/CadastroAlunos';
import { AreasConhecimentoView } from './components/AreasConhecimentoView';
import { useAreasConhecimento } from './hooks/useAreasConhecimento';
import { Atribuicao } from './types';

type View = 'escola' | 'upload' | 'dados' | 'dashboard' | 'docentes-turmas' | 'cadastro-docentes' | 'areas-conhecimento' | 'cadastro-alunos' | 'cadastro-servidores' | 'relatorios' | 'horario';

export function App() {
  // Auth Hook
  const { user, loading: authLoading, login, logout, isAuthenticated } = useAuth();
  
  // Database Hook (para salvar no Supabase)
  const { 
    data: dbData,
    saveStatus, 
    saveAll, 
    loadData,
    updateLocal
  } = useDatabase();

  const {
    atribuicoes,
    importData,
    addAtribuicao,
    updateAtribuicao,
    deleteAtribuicao,
    clearData,
    docentesResumo,
    disciplinasResumo,
    turmasResumo,
    totalAulas,
  } = useAtribuicoes();

  const { escola, restaurarEscola } = useEscola();
  const { alunos, estatisticas: estatisticasAlunos, restaurarAlunos } = useAlunos();
  const { docentes, restaurarDocentes } = useCadastroDocentes(atribuicoes);
  const { servidores, estatisticas: estatisticasServidores, restaurarServidores } = useServidores();
  const docentesNomes = [...new Set(atribuicoes.map(a => a.docente))];
  const { areas } = useAreasConhecimento(docentesNomes);

  const [currentView, setCurrentView] = useState<View>('escola');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Atribuicao | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [docentesMenuOpen, setDocentesMenuOpen] = useState(false);

  // Carregar dados do Supabase ao fazer login
  useEffect(() => {
    if (isAuthenticated && user) {
      loadData().then(() => {
        // Quando os dados carregarem, eles estarão em dbData
        if (dbData.atribuicoes?.length) importData(dbData.atribuicoes);
        if (dbData.escola) restaurarEscola(dbData.escola);
        if (dbData.docentes?.length) restaurarDocentes(dbData.docentes);
        if (dbData.alunos?.length) restaurarAlunos(dbData.alunos);
        if (dbData.servidores?.length) restaurarServidores(dbData.servidores);
      });
    }
  }, [isAuthenticated, user]);

  // Atualizar dados locais quando os estados mudarem
  useEffect(() => {
    if (isAuthenticated) {
      updateLocal('atribuicoes', atribuicoes);
      updateLocal('docentes', docentes);
      updateLocal('alunos', alunos);
      updateLocal('servidores', servidores);
      if (escola) updateLocal('escola', escola);
    }
  }, [atribuicoes, escola, docentes, alunos, servidores, isAuthenticated]);

  // Função para salvar todos os dados
  const handleSaveAll = async () => {
    const result = await saveAll();
    if (result.success) {
      alert('✅ Dados salvos com sucesso!');
    } else {
      alert('❌ Erro ao salvar: ' + (result.error || 'Erro desconhecido'));
    }
  };

  // Função para fazer logout
  const handleLogout = async () => {
    if (saveStatus.hasChanges) {
      const confirmar = confirm('Você tem alterações não salvas. Deseja salvar antes de sair?');
      if (confirmar) {
        await handleSaveAll();
      }
    }
    await logout();
  };

  // Se não está autenticado, mostra tela de login
  if (!isAuthenticated) {
    return <LoginPage onLogin={login} isLoading={authLoading} />;
  }

  const handleImport = (data: Omit<Atribuicao, 'id'>[]) => {
    importData(data);
    setCurrentView('dados');
  };

  const handleEdit = (item: Atribuicao) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleFormSubmit = (data: Omit<Atribuicao, 'id'>) => {
    if (editingItem) {
      updateAtribuicao(editingItem.id, data);
    } else {
      addAtribuicao(data);
    }
    setShowForm(false);
    setEditingItem(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleClearData = () => {
    if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
      clearData();
      setCurrentView('upload');
    }
  };

  const isDocentesView = ['cadastro-docentes', 'docentes-turmas', 'areas-conhecimento'].includes(currentView);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Bar com Usuário e Botão Salvar */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            👤 <span className="font-medium">{user?.email}</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Status de Salvamento */}
          {saveStatus.lastSaved && (
            <span className="text-xs text-gray-500 hidden sm:block">
              Último save: {saveStatus.lastSaved.toLocaleTimeString()}
            </span>
          )}
          {saveStatus.hasChanges && (
            <span className="text-xs text-amber-600 font-medium hidden sm:block">
              ● Alterações pendentes
            </span>
          )}
          
          {/* Botão Salvar */}
          <button
            onClick={handleSaveAll}
            disabled={saveStatus.saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              saveStatus.saving
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : saveStatus.hasChanges
                ? 'bg-green-500 text-white hover:bg-green-600 shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {saveStatus.saving ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Salvando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                💾 Salvar
              </>
            )}
          </button>

          {/* Botão Sair */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-md p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="font-bold text-gray-800">{escola.nome || 'Gestão Escolar'}</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-72 bg-white shadow-xl transform transition-transform duration-300 lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h1 className="font-bold text-white">Gestão Escolar</h1>
                  <p className="text-xs text-blue-100">Sistema Integrado</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {/* Seção: Cadastros */}
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Cadastros
              </div>

              {/* Cadastro da Escola */}
              <button
                onClick={() => { setCurrentView('escola'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  currentView === 'escola'
                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-indigo-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="flex-1 text-left font-medium">Cadastro da Escola</span>
              </button>

              {/* Menu Docentes (Expansível) */}
              <div className="space-y-1">
                <button
                  onClick={() => setDocentesMenuOpen(!docentesMenuOpen)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isDocentesView
                      ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-teal-50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="flex-1 text-left font-medium">Docentes</span>
                  <svg className={`w-4 h-4 transition-transform ${docentesMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  {docentesResumo.length > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isDocentesView ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-700'}`}>
                      {docentesResumo.length}
                    </span>
                  )}
                </button>

                {/* Submenu Docentes */}
                {docentesMenuOpen && (
                  <div className="ml-4 pl-4 border-l-2 border-teal-200 space-y-1">
                    <button
                      onClick={() => { setCurrentView('cadastro-docentes'); setSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm ${
                        currentView === 'cadastro-docentes'
                          ? 'bg-teal-100 text-teal-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                      Fichas Cadastrais
                    </button>

                    <button
                      onClick={() => { setCurrentView('docentes-turmas'); setSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm ${
                        currentView === 'docentes-turmas'
                          ? 'bg-teal-100 text-teal-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Docentes e Turmas
                    </button>

                    <button
                      onClick={() => { setCurrentView('areas-conhecimento'); setSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm ${
                        currentView === 'areas-conhecimento'
                          ? 'bg-teal-100 text-teal-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Áreas de Conhecimento
                    </button>
                  </div>
                )}
              </div>

              {/* Cadastro de Alunos */}
              <button
                onClick={() => { setCurrentView('cadastro-alunos'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  currentView === 'cadastro-alunos'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-purple-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="flex-1 text-left font-medium">Cadastro de Alunos</span>
                {estatisticasAlunos.totalAlunos > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    currentView === 'cadastro-alunos' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {estatisticasAlunos.totalAlunos}
                  </span>
                )}
              </button>

              {/* Cadastro de Servidores */}
              <button
                onClick={() => { setCurrentView('cadastro-servidores'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  currentView === 'cadastro-servidores'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-amber-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="flex-1 text-left font-medium">Cadastro de Servidores</span>
                {estatisticasServidores.total > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    currentView === 'cadastro-servidores' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {estatisticasServidores.total}
                  </span>
                )}
              </button>

              {/* Separador */}
              <div className="my-4 border-t border-gray-200"></div>

              {/* Seção: Atribuição */}
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Atribuição de Aulas
              </div>

              <button
                onClick={() => { setCurrentView('upload'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  currentView === 'upload'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="font-medium">Importar Planilha</span>
              </button>

              <button
                onClick={() => { setCurrentView('dados'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  currentView === 'dados'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">Dados</span>
                {atribuicoes.length > 0 && (
                  <span className="ml-auto bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    {atribuicoes.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => { setCurrentView('dashboard'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  currentView === 'dashboard'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="font-medium">Dashboard</span>
              </button>

              <button
                onClick={() => { setCurrentView('relatorios'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  currentView === 'relatorios'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span className="font-medium">Relatórios</span>
              </button>

              {/* Separador */}
              <div className="my-4 border-t border-gray-200"></div>

              {/* Seção: Ferramentas */}
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Ferramentas
              </div>

              {/* Gerador de Horário */}
              <button
                onClick={() => { setCurrentView('horario'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  currentView === 'horario'
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                    : 'text-orange-600 hover:bg-orange-50 border border-orange-200'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="flex-1 text-left font-medium">Gerador de Horário</span>
              </button>

              {/* Backup Button */}
              <button
                onClick={() => { setShowBackup(true); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-purple-600 hover:bg-purple-50 border border-purple-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span className="flex-1 text-left font-medium">Backup / Compartilhar</span>
              </button>
            </nav>

            {/* Actions */}
            <div className="p-4 space-y-2 border-t border-gray-200">
              {atribuicoes.length > 0 && (
                <>
                  <button
                    onClick={() => { setShowForm(true); setSidebarOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Adicionar Manual
                  </button>
                  
                  <button
                    onClick={handleClearData}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Limpar Dados
                  </button>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="text-center text-xs text-gray-500">
                <p className="font-medium">Sistema de Gestão Escolar</p>
                <p className="mt-1">v2.0 - {new Date().getFullYear()}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 min-h-screen">
          <div className="max-w-7xl mx-auto">
            {/* Cadastro da Escola */}
            {currentView === 'escola' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Cadastro da Escola</h2>
                  <p className="text-gray-600 mt-1">
                    Configure os dados da sua escola, tipos de ensino e turnos
                  </p>
                </div>
                <CadastroEscola />
              </div>
            )}

            {/* Cadastro Docentes */}
            {currentView === 'cadastro-docentes' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Fichas Cadastrais de Docentes</h2>
                  <p className="text-gray-600 mt-1">
                    Gerencie as fichas cadastrais completas dos docentes com foto
                  </p>
                </div>
                <CadastroDocentes atribuicoes={atribuicoes} areas={areas} projetos={escola.projetos} />
              </div>
            )}

            {/* Docentes e Turmas */}
            {currentView === 'docentes-turmas' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Docentes e Turmas</h2>
                  <p className="text-gray-600 mt-1">
                    Visualize os docentes e suas respectivas turmas e disciplinas
                  </p>
                </div>
                
                {atribuicoes.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-md p-12 text-center">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Sem dados para exibir</h3>
                    <p className="text-gray-500 mb-6">Importe uma planilha para ver os docentes</p>
                    <button
                      onClick={() => setCurrentView('upload')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Importar Planilha
                    </button>
                  </div>
                ) : (
                  <DocentesTurmas atribuicoes={atribuicoes} />
                )}
              </div>
            )}

            {/* Áreas de Conhecimento */}
            {currentView === 'areas-conhecimento' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Áreas de Conhecimento</h2>
                  <p className="text-gray-600 mt-1">
                    Gerencie as áreas de conhecimento e vincule docentes para ATPC
                  </p>
                </div>
                <AreasConhecimentoView docentes={docentesNomes} />
              </div>
            )}

            {/* Cadastro de Alunos */}
            {currentView === 'cadastro-alunos' && (
              <CadastroAlunos />
            )}

            {/* Cadastro de Servidores */}
            {currentView === 'cadastro-servidores' && (
              <CadastroServidores />
            )}

            {currentView === 'upload' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Importar Planilha</h2>
                  <p className="text-gray-600 mt-1">
                    Faça upload da sua planilha Excel com as atribuições de aulas
                  </p>
                </div>
                <FileUpload onImport={handleImport} hasData={atribuicoes.length > 0} />
                
                {atribuicoes.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-green-800 font-medium">Dados carregados com sucesso!</p>
                      <p className="text-green-600 text-sm">
                        {atribuicoes.length} registro(s) • {totalAulas} aula(s) total
                      </p>
                      <button
                        onClick={() => setCurrentView('dados')}
                        className="mt-2 text-sm text-green-700 underline hover:text-green-800"
                      >
                        Ver dados →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentView === 'dados' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Atribuições de Aulas</h2>
                  <p className="text-gray-600 mt-1">
                    Visualize e gerencie as atribuições importadas
                  </p>
                </div>
                
                {atribuicoes.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-md p-12 text-center">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum dado importado</h3>
                    <p className="text-gray-500 mb-6">Importe uma planilha Excel para começar</p>
                    <button
                      onClick={() => setCurrentView('upload')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Importar Planilha
                    </button>
                  </div>
                ) : (
                  <AtribuicaoTable
                    atribuicoes={atribuicoes}
                    onEdit={handleEdit}
                    onDelete={deleteAtribuicao}
                  />
                )}
              </div>
            )}

            {currentView === 'dashboard' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
                  <p className="text-gray-600 mt-1">
                    Visão geral das atribuições de aulas
                  </p>
                </div>
                
                {atribuicoes.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-md p-12 text-center">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Sem dados para exibir</h3>
                    <p className="text-gray-500 mb-6">Importe uma planilha para ver o dashboard</p>
                    <button
                      onClick={() => setCurrentView('upload')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Importar Planilha
                    </button>
                  </div>
                ) : (
                  <Dashboard
                    totalRegistros={atribuicoes.length}
                    totalAulas={totalAulas}
                    docentesResumo={docentesResumo}
                    disciplinasResumo={disciplinasResumo}
                    turmasResumo={turmasResumo}
                  />
                )}
              </div>
            )}

            {currentView === 'relatorios' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Relatórios para Impressão</h2>
                  <p className="text-gray-600 mt-1">
                    Gere relatórios formatados para impressão ou arquivamento
                  </p>
                </div>
                
                {atribuicoes.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-md p-12 text-center">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Sem dados para gerar relatórios</h3>
                    <p className="text-gray-500 mb-6">Importe uma planilha para gerar relatórios</p>
                    <button
                      onClick={() => setCurrentView('upload')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Importar Planilha
                    </button>
                  </div>
                ) : (
                  <Relatorios
                    atribuicoes={atribuicoes}
                    docentesResumo={docentesResumo}
                    disciplinasResumo={disciplinasResumo}
                    turmasResumo={turmasResumo}
                    totalAulas={totalAulas}
                  />
                )}
              </div>
            )}

            {currentView === 'horario' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Gerador de Horário Escolar</h2>
                  <p className="text-gray-600 mt-1">
                    Gere automaticamente o horário de aulas da sua escola
                  </p>
                </div>
                
                {atribuicoes.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-md p-12 text-center">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Sem dados para gerar horário</h3>
                    <p className="text-gray-500 mb-6">Importe uma planilha com as atribuições de aulas primeiro</p>
                    <button
                      onClick={() => setCurrentView('upload')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Importar Planilha
                    </button>
                  </div>
                ) : (
                  <GeradorHorario atribuicoes={atribuicoes} />
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Form Modal */}
      {showForm && (
        <AtribuicaoForm
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          initialData={editingItem || undefined}
        />
      )}

      {/* Backup Modal */}
      {showBackup && (
        <BackupRestore
          atribuicoes={atribuicoes}
          onRestoreAtribuicoes={(data) => {
            importData(data);
            setCurrentView('dados');
          }}
          docentes={docentes}
          onRestoreDocentes={restaurarDocentes}
          alunos={alunos}
          onRestoreAlunos={restaurarAlunos}
          escola={escola}
          onRestoreEscola={restaurarEscola}
          onClose={() => setShowBackup(false)}
        />
      )}
    </div>
  );
}
