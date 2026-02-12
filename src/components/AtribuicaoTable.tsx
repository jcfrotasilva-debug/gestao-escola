import { useState } from 'react';
import { Atribuicao } from '../types';

interface AtribuicaoTableProps {
  atribuicoes: Atribuicao[];
  onEdit: (atribuicao: Atribuicao) => void;
  onDelete: (id: string) => void;
}

export function AtribuicaoTable({ atribuicoes, onEdit, onDelete }: AtribuicaoTableProps) {
  const [search, setSearch] = useState('');
  const [filterDocente, setFilterDocente] = useState('');
  const [filterTurma, setFilterTurma] = useState('');
  const [filterDisciplina, setFilterDisciplina] = useState('');
  const [sortBy, setSortBy] = useState<'docente' | 'turma' | 'disciplina' | 'aulas'>('docente');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Listas únicas para filtros
  const docentes = [...new Set(atribuicoes.map(a => a.docente))].sort();
  const turmas = [...new Set(atribuicoes.map(a => a.turma))].sort();
  const disciplinas = [...new Set(atribuicoes.map(a => a.disciplina))].sort();

  const filteredData = atribuicoes
    .filter(a => {
      const matchesSearch = 
        a.docente.toLowerCase().includes(search.toLowerCase()) ||
        a.turma.toLowerCase().includes(search.toLowerCase()) ||
        a.disciplina.toLowerCase().includes(search.toLowerCase());
      const matchesDocente = !filterDocente || a.docente === filterDocente;
      const matchesTurma = !filterTurma || a.turma === filterTurma;
      const matchesDisciplina = !filterDisciplina || a.disciplina === filterDisciplina;
      return matchesSearch && matchesDocente && matchesTurma && matchesDisciplina;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'aulas') {
        comparison = a.aulas - b.aulas;
      } else {
        comparison = a[sortBy].localeCompare(b[sortBy]);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const totalAulas = filteredData.reduce((acc, a) => acc + a.aulas, 0);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortBy }) => (
    <span className="ml-1">
      {sortBy === field ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  const exportCSV = () => {
    const headers = ['Docente', 'Turma', 'Disciplina', 'Aulas'];
    const rows = filteredData.map(a => [a.docente, a.turma, a.disciplina, a.aulas.toString()]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(';'))
      .join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `atribuicao-aulas-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const clearFilters = () => {
    setSearch('');
    setFilterDocente('');
    setFilterTurma('');
    setFilterDisciplina('');
  };

  const hasFilters = search || filterDocente || filterTurma || filterDisciplina;

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <h3 className="font-semibold text-gray-700 mr-2">Filtros:</h3>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpar filtros
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Buscar..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={filterDocente}
            onChange={(e) => setFilterDocente(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os docentes</option>
            {docentes.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={filterTurma}
            onChange={(e) => setFilterTurma(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as turmas</option>
            {turmas.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            value={filterDisciplina}
            onChange={(e) => setFilterDisciplina(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as disciplinas</option>
            {disciplinas.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="mt-4 pt-4 border-t flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-gray-600">
              <strong className="text-gray-800">{filteredData.length}</strong> registro(s)
            </span>
            <span className="text-gray-600">
              <strong className="text-blue-600">{totalAulas}</strong> aulas no total
            </span>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-sm font-medium cursor-pointer hover:bg-blue-700"
                  onClick={() => handleSort('docente')}
                >
                  Docente <SortIcon field="docente" />
                </th>
                <th 
                  className="px-6 py-3 text-left text-sm font-medium cursor-pointer hover:bg-blue-700"
                  onClick={() => handleSort('turma')}
                >
                  Turma <SortIcon field="turma" />
                </th>
                <th 
                  className="px-6 py-3 text-left text-sm font-medium cursor-pointer hover:bg-blue-700"
                  onClick={() => handleSort('disciplina')}
                >
                  Disciplina <SortIcon field="disciplina" />
                </th>
                <th 
                  className="px-6 py-3 text-center text-sm font-medium cursor-pointer hover:bg-blue-700"
                  onClick={() => handleSort('aulas')}
                >
                  Aulas <SortIcon field="aulas" />
                </th>
                <th className="px-6 py-3 text-right text-sm font-medium">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {item.docente.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800">{item.docente}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      {item.turma}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      {item.disciplina}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-700 rounded-full font-bold">
                      {item.aulas}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEdit(item)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Deseja excluir este registro?')) {
                            onDelete(item.id);
                          }
                        }}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg font-medium">Nenhum registro encontrado</p>
                    <p className="text-sm">Tente ajustar os filtros ou importe uma planilha</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
