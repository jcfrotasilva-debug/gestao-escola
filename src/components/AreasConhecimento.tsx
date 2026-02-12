import React, { useState } from 'react';
import { AreaConhecimento, BloqueioArea, DiaSemana } from '../types';

interface AreasConhecimentoProps {
  areas: AreaConhecimento[];
  bloqueiosArea: BloqueioArea[];
  docentesSemArea: string[];
  horarios: { numero: number; inicio: string; fim: string }[];
  onAdicionarArea: (nome: string) => void;
  onRemoverArea: (areaId: string) => void;
  onVincularDocente: (areaId: string, docente: string) => void;
  onDesvincularDocente: (areaId: string, docente: string) => void;
  onAdicionarBloqueio: (areaId: string, dia: DiaSemana, aulas: number[], motivo?: string) => void;
  onRemoverBloqueio: (bloqueioId: string) => void;
}

const DIAS_SEMANA: { value: DiaSemana; label: string }[] = [
  { value: 'segunda', label: 'Segunda-feira' },
  { value: 'terca', label: 'Terça-feira' },
  { value: 'quarta', label: 'Quarta-feira' },
  { value: 'quinta', label: 'Quinta-feira' },
  { value: 'sexta', label: 'Sexta-feira' },
];

export const AreasConhecimento: React.FC<AreasConhecimentoProps> = ({
  areas,
  bloqueiosArea,
  docentesSemArea,
  horarios,
  onAdicionarArea,
  onRemoverArea,
  onVincularDocente,
  onDesvincularDocente,
  onAdicionarBloqueio,
  onRemoverBloqueio,
}) => {
  const [novaAreaNome, setNovaAreaNome] = useState('');
  const [abaAtiva, setAbaAtiva] = useState<'areas' | 'vincular' | 'bloqueios'>('areas');
  const [areaSelecionadaVincular, setAreaSelecionadaVincular] = useState<string>('');
  
  // Estado para novo bloqueio
  const [novoBloqueio, setNovoBloqueio] = useState({
    areaId: '',
    dia: 'segunda' as DiaSemana,
    aulas: [] as number[],
    motivo: '',
  });

  const handleAdicionarArea = () => {
    if (novaAreaNome.trim()) {
      onAdicionarArea(novaAreaNome.trim());
      setNovaAreaNome('');
    }
  };

  const handleToggleAula = (aula: number) => {
    setNovoBloqueio(prev => ({
      ...prev,
      aulas: prev.aulas.includes(aula)
        ? prev.aulas.filter(a => a !== aula)
        : [...prev.aulas, aula],
    }));
  };

  const handleAdicionarBloqueio = () => {
    if (novoBloqueio.areaId && novoBloqueio.aulas.length > 0) {
      onAdicionarBloqueio(
        novoBloqueio.areaId,
        novoBloqueio.dia,
        novoBloqueio.aulas,
        novoBloqueio.motivo || undefined
      );
      setNovoBloqueio({
        areaId: '',
        dia: 'segunda',
        aulas: [],
        motivo: '',
      });
    }
  };

  const getNomeArea = (areaId: string) => {
    return areas.find(a => a.id === areaId)?.nome || '';
  };

  const getDiaLabel = (dia: DiaSemana) => {
    return DIAS_SEMANA.find(d => d.value === dia)?.label || dia;
  };

  return (
    <div className="space-y-6">
      {/* Abas */}
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => setAbaAtiva('areas')}
          className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
            abaAtiva === 'areas'
              ? 'bg-purple-100 text-purple-700 border-b-2 border-purple-500'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          📚 Áreas
        </button>
        <button
          onClick={() => setAbaAtiva('vincular')}
          className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
            abaAtiva === 'vincular'
              ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          👥 Vincular Docentes
          {docentesSemArea.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
              {docentesSemArea.length} sem área
            </span>
          )}
        </button>
        <button
          onClick={() => setAbaAtiva('bloqueios')}
          className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
            abaAtiva === 'bloqueios'
              ? 'bg-red-100 text-red-700 border-b-2 border-red-500'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          🚫 Bloqueios ATPC
        </button>
      </div>

      {/* Aba: Áreas */}
      {abaAtiva === 'areas' && (
        <div className="space-y-4">
          {/* Formulário para adicionar área */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="font-medium text-purple-800 mb-3">Adicionar Nova Área de Conhecimento</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={novaAreaNome}
                onChange={(e) => setNovaAreaNome(e.target.value)}
                placeholder="Ex: Linguagens, Ciências da Natureza, Matemática..."
                className="flex-1 px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                onKeyPress={(e) => e.key === 'Enter' && handleAdicionarArea()}
              />
              <button
                onClick={handleAdicionarArea}
                disabled={!novaAreaNome.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Adicionar
              </button>
            </div>
          </div>

          {/* Lista de áreas */}
          {areas.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Nenhuma área cadastrada</p>
              <p className="text-sm text-gray-400 mt-1">
                Adicione áreas como: Linguagens, Matemática, Ciências da Natureza, Ciências Humanas
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {areas.map((area) => (
                <div
                  key={area.id}
                  className="bg-white rounded-lg shadow-md border-l-4 p-4"
                  style={{ borderLeftColor: area.cor }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: area.cor }}
                      />
                      <h4 className="font-semibold text-gray-800">{area.nome}</h4>
                    </div>
                    <button
                      onClick={() => onRemoverArea(area.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                      title="Remover área"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{area.docentes.length}</span> docente(s) vinculado(s)
                  </div>
                  
                  {area.docentes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {area.docentes.slice(0, 3).map((docente) => (
                        <span
                          key={docente}
                          className="px-2 py-0.5 text-xs rounded-full"
                          style={{ 
                            backgroundColor: `${area.cor}20`,
                            color: area.cor 
                          }}
                        >
                          {docente.split(' ')[0]}
                        </span>
                      ))}
                      {area.docentes.length > 3 && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                          +{area.docentes.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Bloqueios da área */}
                  {bloqueiosArea.filter(b => b.areaId === area.id).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-xs text-gray-500 font-medium mb-1">Bloqueios ATPC:</div>
                      {bloqueiosArea
                        .filter(b => b.areaId === area.id)
                        .map((bloqueio) => (
                          <div
                            key={bloqueio.id}
                            className="text-xs text-red-600 flex items-center gap-1"
                          >
                            <span>🚫</span>
                            <span>{getDiaLabel(bloqueio.dia)}</span>
                            <span>- Aulas: {bloqueio.aulas.sort((a, b) => a - b).join(', ')}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Aba: Vincular Docentes */}
      {abaAtiva === 'vincular' && (
        <div className="space-y-4">
          {/* Seletor de área */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-3">Selecione uma Área para Vincular Docentes</h3>
            <select
              value={areaSelecionadaVincular}
              onChange={(e) => setAreaSelecionadaVincular(e.target.value)}
              className="w-full md:w-auto px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Selecione uma área --</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.nome} ({area.docentes.length} docentes)
                </option>
              ))}
            </select>
          </div>

          {areas.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Primeiro, cadastre as áreas de conhecimento</p>
              <button
                onClick={() => setAbaAtiva('areas')}
                className="mt-2 text-purple-600 hover:text-purple-800 underline"
              >
                Ir para cadastro de áreas →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Docentes sem área */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-3 flex items-center gap-2">
                  <span>⚠️</span>
                  Docentes SEM Área ({docentesSemArea.length})
                </h4>
                {docentesSemArea.length === 0 ? (
                  <p className="text-sm text-green-600">✅ Todos os docentes estão vinculados!</p>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {docentesSemArea.map((docente) => (
                      <div
                        key={docente}
                        className="flex items-center justify-between bg-white rounded p-2"
                      >
                        <span className="text-sm text-gray-700">{docente}</span>
                        {areaSelecionadaVincular && (
                          <button
                            onClick={() => onVincularDocente(areaSelecionadaVincular, docente)}
                            className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            + Vincular
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Docentes por área */}
              <div className="space-y-4">
                {areas.map((area) => (
                  <div
                    key={area.id}
                    className="bg-white rounded-lg shadow p-4 border-l-4"
                    style={{ borderLeftColor: area.cor }}
                  >
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: area.cor }}
                      />
                      {area.nome} ({area.docentes.length})
                    </h4>
                    {area.docentes.length === 0 ? (
                      <p className="text-sm text-gray-400">Nenhum docente vinculado</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {area.docentes.map((docente) => (
                          <span
                            key={docente}
                            className="inline-flex items-center gap-1 px-2 py-1 text-sm rounded-full"
                            style={{ 
                              backgroundColor: `${area.cor}15`,
                              color: area.cor 
                            }}
                          >
                            {docente}
                            <button
                              onClick={() => onDesvincularDocente(area.id, docente)}
                              className="ml-1 text-red-500 hover:text-red-700 font-bold"
                              title="Remover da área"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vincular todos de uma vez */}
          {areaSelecionadaVincular && docentesSemArea.length > 0 && (
            <div className="bg-green-50 rounded-lg p-4">
              <button
                onClick={() => {
                  docentesSemArea.forEach(docente => {
                    onVincularDocente(areaSelecionadaVincular, docente);
                  });
                }}
                className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Vincular TODOS os {docentesSemArea.length} docentes sem área → {getNomeArea(areaSelecionadaVincular)}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Aba: Bloqueios ATPC */}
      {abaAtiva === 'bloqueios' && (
        <div className="space-y-4">
          {/* Formulário para adicionar bloqueio */}
          <div className="bg-red-50 rounded-lg p-4">
            <h3 className="font-medium text-red-800 mb-3">
              Adicionar Bloqueio ATPC por Área de Conhecimento
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Área */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
                <select
                  value={novoBloqueio.areaId}
                  onChange={(e) => setNovoBloqueio(prev => ({ ...prev, areaId: e.target.value }))}
                  className="w-full px-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="">-- Selecione --</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dia da Semana</label>
                <select
                  value={novoBloqueio.dia}
                  onChange={(e) => setNovoBloqueio(prev => ({ ...prev, dia: e.target.value as DiaSemana }))}
                  className="w-full px-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  {DIAS_SEMANA.map((dia) => (
                    <option key={dia.value} value={dia.value}>
                      {dia.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (opcional)</label>
                <input
                  type="text"
                  value={novoBloqueio.motivo}
                  onChange={(e) => setNovoBloqueio(prev => ({ ...prev, motivo: e.target.value }))}
                  placeholder="Ex: ATPC Linguagens"
                  className="w-full px-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Botão */}
              <div className="flex items-end">
                <button
                  onClick={handleAdicionarBloqueio}
                  disabled={!novoBloqueio.areaId || novoBloqueio.aulas.length === 0}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Adicionar Bloqueio
                </button>
              </div>
            </div>

            {/* Seleção de aulas */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecione as Aulas Bloqueadas:
              </label>
              <div className="flex flex-wrap gap-2">
                {horarios.map((h) => (
                  <button
                    key={h.numero}
                    onClick={() => handleToggleAula(h.numero)}
                    className={`px-3 py-2 rounded-lg border-2 transition-colors ${
                      novoBloqueio.aulas.includes(h.numero)
                        ? 'border-red-500 bg-red-100 text-red-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-red-300'
                    }`}
                  >
                    <div className="font-medium">{h.numero}ª Aula</div>
                    <div className="text-xs">{h.inicio} - {h.fim}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Lista de bloqueios por área */}
          {areas.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Primeiro, cadastre as áreas de conhecimento</p>
              <button
                onClick={() => setAbaAtiva('areas')}
                className="mt-2 text-purple-600 hover:text-purple-800 underline"
              >
                Ir para cadastro de áreas →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700">Bloqueios Cadastrados:</h4>
              
              {bloqueiosArea.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Nenhum bloqueio cadastrado</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {areas.map((area) => {
                    const bloqueiosDaArea = bloqueiosArea.filter(b => b.areaId === area.id);
                    if (bloqueiosDaArea.length === 0) return null;
                    
                    return (
                      <div
                        key={area.id}
                        className="bg-white rounded-lg shadow p-4 border-l-4"
                        style={{ borderLeftColor: area.cor }}
                      >
                        <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: area.cor }}
                          />
                          {area.nome}
                        </h5>
                        <div className="space-y-2">
                          {bloqueiosDaArea.map((bloqueio) => (
                            <div
                              key={bloqueio.id}
                              className="flex items-center justify-between bg-red-50 rounded p-2"
                            >
                              <div>
                                <div className="text-sm font-medium text-red-700">
                                  {getDiaLabel(bloqueio.dia)}
                                </div>
                                <div className="text-xs text-red-600">
                                  Aulas: {bloqueio.aulas.sort((a, b) => a - b).join(', ')}
                                  {bloqueio.motivo && ` - ${bloqueio.motivo}`}
                                </div>
                              </div>
                              <button
                                onClick={() => onRemoverBloqueio(bloqueio.id)}
                                className="text-red-500 hover:text-red-700 text-lg"
                                title="Remover bloqueio"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Resumo por dia */}
              {bloqueiosArea.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <h4 className="font-medium text-gray-700 mb-3">📅 Resumo por Dia da Semana:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    {DIAS_SEMANA.map((dia) => {
                      const bloqueiosDoDia = bloqueiosArea.filter(b => b.dia === dia.value);
                      const areasAfetadas = [...new Set(bloqueiosDoDia.map(b => b.areaId))];
                      
                      return (
                        <div key={dia.value} className="bg-white rounded p-3 text-center">
                          <div className="font-medium text-gray-700">{dia.label.split('-')[0]}</div>
                          {areasAfetadas.length === 0 ? (
                            <div className="text-xs text-gray-400 mt-1">Sem bloqueios</div>
                          ) : (
                            <div className="mt-1 space-y-1">
                              {areasAfetadas.map(areaId => {
                                const area = areas.find(a => a.id === areaId);
                                const bloqueio = bloqueiosDoDia.find(b => b.areaId === areaId);
                                return (
                                  <div
                                    key={areaId}
                                    className="text-xs px-2 py-1 rounded"
                                    style={{ 
                                      backgroundColor: `${area?.cor}20`,
                                      color: area?.cor 
                                    }}
                                  >
                                    {area?.nome}: {bloqueio?.aulas.sort((a, b) => a - b).join(', ')}ª
                                  </div>
                                );
                              })}
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
        </div>
      )}
    </div>
  );
};
