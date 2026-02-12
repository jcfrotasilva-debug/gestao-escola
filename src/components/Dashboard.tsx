import { DocenteResumo, DisciplinaResumo, TurmaResumo } from '../types';

interface DashboardProps {
  totalRegistros: number;
  totalAulas: number;
  docentesResumo: DocenteResumo[];
  disciplinasResumo: DisciplinaResumo[];
  turmasResumo: TurmaResumo[];
}

export function Dashboard({
  totalRegistros,
  totalAulas,
  docentesResumo,
  disciplinasResumo,
  turmasResumo,
}: DashboardProps) {
  const maxAulasDocente = Math.max(...docentesResumo.map(d => d.totalAulas), 1);

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total de Registros</p>
              <p className="text-3xl font-bold mt-1">{totalRegistros}</p>
            </div>
            <div className="bg-blue-400/30 p-3 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total de Aulas</p>
              <p className="text-3xl font-bold mt-1">{totalAulas}</p>
            </div>
            <div className="bg-green-400/30 p-3 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Docentes</p>
              <p className="text-3xl font-bold mt-1">{docentesResumo.length}</p>
            </div>
            <div className="bg-purple-400/30 p-3 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Turmas</p>
              <p className="text-3xl font-bold mt-1">{turmasResumo.length}</p>
            </div>
            <div className="bg-orange-400/30 p-3 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos e Resumos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aulas por Docente */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Aulas por Docente
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {docentesResumo.map((docente) => (
              <div key={docente.nome}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium truncate mr-2">{docente.nome}</span>
                  <span className="text-blue-600 font-bold whitespace-nowrap">{docente.totalAulas} aulas</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-4 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                    style={{ width: `${(docente.totalAulas / maxAulasDocente) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {docente.turmas.length} turma(s) • {docente.disciplinas.length} disciplina(s)
                </p>
              </div>
            ))}
            {docentesResumo.length === 0 && (
              <p className="text-gray-500 text-center py-8">Nenhum dado disponível</p>
            )}
          </div>
        </div>

        {/* Aulas por Disciplina */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Aulas por Disciplina
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {disciplinasResumo.map((disciplina) => (
              <div key={disciplina.nome} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {disciplina.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{disciplina.nome}</p>
                    <p className="text-xs text-gray-500">{disciplina.docentes.length} docente(s)</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-bold text-sm">
                  {disciplina.totalAulas} aulas
                </span>
              </div>
            ))}
            {disciplinasResumo.length === 0 && (
              <p className="text-gray-500 text-center py-8">Nenhum dado disponível</p>
            )}
          </div>
        </div>
      </div>

      {/* Resumo por Turma */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Resumo por Turma
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {turmasResumo.map((turma) => (
            <div key={turma.nome} className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 bg-purple-500 text-white rounded-lg font-bold text-sm">
                  {turma.nome}
                </span>
                <span className="text-purple-700 font-bold">{turma.totalAulas} aulas</span>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-gray-600">
                  <span className="font-medium">Docentes:</span> {turma.docentes.length}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Disciplinas:</span> {turma.disciplinas.length}
                </p>
              </div>
            </div>
          ))}
          {turmasResumo.length === 0 && (
            <p className="text-gray-500 text-center py-8 col-span-full">Nenhum dado disponível</p>
          )}
        </div>
      </div>
    </div>
  );
}
