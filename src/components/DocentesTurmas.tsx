import { useState } from 'react';
import { Atribuicao } from '../types';

interface DocentesTurmasProps {
  atribuicoes: Atribuicao[];
}

interface DocenteInfo {
  docente: string;
  turmas: {
    turma: string;
    disciplinas: {
      disciplina: string;
      aulas: number;
    }[];
    totalAulas: number;
  }[];
  totalAulas: number;
  totalTurmas: number;
  totalDisciplinas: number;
}

export function DocentesTurmas({ atribuicoes }: DocentesTurmasProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDocentes, setExpandedDocentes] = useState<Set<string>>(new Set());

  // Agrupa os dados por docente
  const docentesInfo: DocenteInfo[] = (() => {
    const docentesMap = new Map<string, Map<string, Map<string, number>>>();

    atribuicoes.forEach(attr => {
      if (!docentesMap.has(attr.docente)) {
        docentesMap.set(attr.docente, new Map());
      }
      const turmasMap = docentesMap.get(attr.docente)!;

      if (!turmasMap.has(attr.turma)) {
        turmasMap.set(attr.turma, new Map());
      }
      const disciplinasMap = turmasMap.get(attr.turma)!;

      const currentAulas = disciplinasMap.get(attr.disciplina) || 0;
      disciplinasMap.set(attr.disciplina, currentAulas + attr.aulas);
    });

    const result: DocenteInfo[] = [];

    docentesMap.forEach((turmasMap, docente) => {
      const turmas: DocenteInfo['turmas'] = [];
      let totalAulasDocente = 0;
      const disciplinasSet = new Set<string>();

      turmasMap.forEach((disciplinasMap, turma) => {
        const disciplinas: { disciplina: string; aulas: number }[] = [];
        let totalAulasTurma = 0;

        disciplinasMap.forEach((aulas, disciplina) => {
          disciplinas.push({ disciplina, aulas });
          totalAulasTurma += aulas;
          disciplinasSet.add(disciplina);
        });

        disciplinas.sort((a, b) => a.disciplina.localeCompare(b.disciplina));
        turmas.push({ turma, disciplinas, totalAulas: totalAulasTurma });
        totalAulasDocente += totalAulasTurma;
      });

      turmas.sort((a, b) => a.turma.localeCompare(b.turma));

      result.push({
        docente,
        turmas,
        totalAulas: totalAulasDocente,
        totalTurmas: turmas.length,
        totalDisciplinas: disciplinasSet.size,
      });
    });

    return result.sort((a, b) => a.docente.localeCompare(b.docente));
  })();

  // Filtra por busca
  const filteredDocentes = docentesInfo.filter(d =>
    d.docente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.turmas.some(t => t.turma.toLowerCase().includes(searchTerm.toLowerCase())) ||
    d.turmas.some(t => t.disciplinas.some(disc => disc.disciplina.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const toggleDocente = (docente: string) => {
    const newExpanded = new Set(expandedDocentes);
    if (newExpanded.has(docente)) {
      newExpanded.delete(docente);
    } else {
      newExpanded.add(docente);
    }
    setExpandedDocentes(newExpanded);
  };

  const expandAll = () => {
    setExpandedDocentes(new Set(filteredDocentes.map(d => d.docente)));
  };

  const collapseAll = () => {
    setExpandedDocentes(new Set());
  };

  // Cores para as turmas
  const turmaColors = [
    'bg-blue-100 text-blue-800 border-blue-200',
    'bg-green-100 text-green-800 border-green-200',
    'bg-purple-100 text-purple-800 border-purple-200',
    'bg-orange-100 text-orange-800 border-orange-200',
    'bg-pink-100 text-pink-800 border-pink-200',
    'bg-teal-100 text-teal-800 border-teal-200',
    'bg-indigo-100 text-indigo-800 border-indigo-200',
    'bg-yellow-100 text-yellow-800 border-yellow-200',
  ];

  const getTurmaColor = (index: number) => turmaColors[index % turmaColors.length];

  return (
    <div className="space-y-6">
      {/* Header com busca e ações */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Buscar por docente, turma ou disciplina..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Expandir Todos
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Recolher Todos
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {filteredDocentes.length} docente(s)
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {new Set(atribuicoes.map(a => a.turma)).size} turma(s)
          </span>
        </div>
      </div>

      {/* Lista de Docentes */}
      <div className="space-y-4">
        {filteredDocentes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-gray-600">Nenhum docente encontrado</p>
          </div>
        ) : (
          filteredDocentes.map((docente) => (
            <div key={docente.docente} className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* Cabeçalho do Docente */}
              <button
                onClick={() => toggleDocente(docente.docente)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {docente.docente.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-800 text-lg">{docente.docente}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {docente.totalTurmas} turma(s)
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        {docente.totalDisciplinas} disciplina(s)
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {docente.totalAulas} aula(s)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {docente.totalAulas} aulas
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedDocentes.has(docente.docente) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Detalhes das Turmas (expandível) */}
              {expandedDocentes.has(docente.docente) && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {docente.turmas.map((turma, turmaIndex) => (
                      <div
                        key={turma.turma}
                        className={`p-4 rounded-lg border ${getTurmaColor(turmaIndex)}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {turma.turma}
                          </h4>
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/50">
                            {turma.totalAulas} aulas
                          </span>
                        </div>

                        <div className="space-y-2">
                          {turma.disciplinas.map((disc) => (
                            <div
                              key={disc.disciplina}
                              className="flex items-center justify-between text-sm bg-white/50 rounded px-2 py-1"
                            >
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                {disc.disciplina}
                              </span>
                              <span className="font-medium">{disc.aulas} aula(s)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
