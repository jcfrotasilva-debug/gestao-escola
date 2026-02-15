import { useState, useEffect, useCallback } from 'react';
import { AreaConhecimento, BloqueioArea, DiaSemana } from '../types';

const STORAGE_KEY_AREAS = 'areasConhecimento';
const STORAGE_KEY_BLOQUEIOS_AREA = 'bloqueiosArea';

const CORES_AREAS = [
  '#3B82F6', // Azul
  '#10B981', // Verde
  '#F59E0B', // Amarelo
  '#EF4444', // Vermelho
  '#8B5CF6', // Roxo
  '#EC4899', // Rosa
  '#06B6D4', // Ciano
  '#F97316', // Laranja
];

export function useAreasConhecimento(docentes: string[]) {
  const [areas, setAreas] = useState<AreaConhecimento[]>([]);
  const [bloqueiosArea, setBloqueiosArea] = useState<BloqueioArea[]>([]);

  // Carregar dados do localStorage
  useEffect(() => {
    const areasStorage = localStorage.getItem(STORAGE_KEY_AREAS);
    const bloqueiosStorage = localStorage.getItem(STORAGE_KEY_BLOQUEIOS_AREA);

    if (areasStorage) {
      setAreas(JSON.parse(areasStorage));
    }
    if (bloqueiosStorage) {
      setBloqueiosArea(JSON.parse(bloqueiosStorage));
    }
  }, []);

  // Salvar áreas no localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_AREAS, JSON.stringify(areas));
  }, [areas]);

  // Salvar bloqueios no localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BLOQUEIOS_AREA, JSON.stringify(bloqueiosArea));
  }, [bloqueiosArea]);

  // Adicionar nova área
  const adicionarArea = useCallback((nome: string) => {
    const novaArea: AreaConhecimento = {
      id: Date.now().toString(),
      nome,
      cor: CORES_AREAS[areas.length % CORES_AREAS.length],
      docentes: [],
    };
    setAreas(prev => [...prev, novaArea]);
    return novaArea;
  }, [areas.length]);

  // Remover área
  const removerArea = useCallback((areaId: string) => {
    setAreas(prev => prev.filter(a => a.id !== areaId));
    // Remover também os bloqueios dessa área
    setBloqueiosArea(prev => prev.filter(b => b.areaId !== areaId));
  }, []);

  // Atualizar área
  const atualizarArea = useCallback((areaId: string, dados: Partial<AreaConhecimento>) => {
    setAreas(prev => prev.map(a => 
      a.id === areaId ? { ...a, ...dados } : a
    ));
  }, []);

  // Vincular docente a uma área
  const vincularDocente = useCallback((areaId: string, docente: string) => {
    // Primeiro, remove o docente de qualquer outra área
    setAreas(prev => prev.map(a => ({
      ...a,
      docentes: a.id === areaId 
        ? [...a.docentes.filter(d => d !== docente), docente]
        : a.docentes.filter(d => d !== docente)
    })));
  }, []);

  // Desvincular docente de uma área
  const desvincularDocente = useCallback((areaId: string, docente: string) => {
    setAreas(prev => prev.map(a => 
      a.id === areaId 
        ? { ...a, docentes: a.docentes.filter(d => d !== docente) }
        : a
    ));
  }, []);

  // Adicionar bloqueio por área
  const adicionarBloqueioArea = useCallback((areaId: string, dia: DiaSemana, aulas: number[], motivo?: string) => {
    const novoBloqueio: BloqueioArea = {
      id: Date.now().toString(),
      areaId,
      dia,
      aulas,
      motivo,
    };
    setBloqueiosArea(prev => [...prev, novoBloqueio]);
    return novoBloqueio;
  }, []);

  // Remover bloqueio por área
  const removerBloqueioArea = useCallback((bloqueioId: string) => {
    setBloqueiosArea(prev => prev.filter(b => b.id !== bloqueioId));
  }, []);

  // Obter área de um docente
  const getAreaDocente = useCallback((docente: string): AreaConhecimento | null => {
    return areas.find(a => a.docentes.includes(docente)) || null;
  }, [areas]);

  // Obter todos os bloqueios de um docente (baseado na área)
  const getBloqueiosDocente = useCallback((docente: string): BloqueioArea[] => {
    const area = getAreaDocente(docente);
    if (!area) return [];
    return bloqueiosArea.filter(b => b.areaId === area.id);
  }, [getAreaDocente, bloqueiosArea]);

  // Verificar se um docente está bloqueado em determinado dia/aula
  const isDocenteBloqueadoPorArea = useCallback((docente: string, dia: DiaSemana, aula: number): boolean => {
    // Encontrar a área do docente
    const area = areas.find(a => a.docentes.includes(docente));
    if (!area) return false;
    
    // Verificar se há bloqueio para essa área neste dia/aula
    const bloqueioEncontrado = bloqueiosArea.some(
      b => b.areaId === area.id && b.dia === dia && b.aulas.includes(aula)
    );
    
    return bloqueioEncontrado;
  }, [areas, bloqueiosArea]);

  // Obter docentes sem área
  const docentesSemArea = docentes.filter(d => !getAreaDocente(d));

  // Obter motivo do bloqueio
  const getMotivoBloqueioArea = useCallback((docente: string, dia: DiaSemana, aula: number): string | undefined => {
    // Encontrar a área do docente
    const area = areas.find(a => a.docentes.includes(docente));
    if (!area) return undefined;
    
    // Encontrar o bloqueio específico
    const bloqueio = bloqueiosArea.find(
      b => b.areaId === area.id && b.dia === dia && b.aulas.includes(aula)
    );
    
    if (bloqueio) {
      return bloqueio.motivo || `ATPC - ${area.nome}`;
    }
    return undefined;
  }, [areas, bloqueiosArea]);

  return {
    areas,
    bloqueiosArea,
    adicionarArea,
    removerArea,
    atualizarArea,
    vincularDocente,
    desvincularDocente,
    adicionarBloqueioArea,
    removerBloqueioArea,
    getAreaDocente,
    getBloqueiosDocente,
    isDocenteBloqueadoPorArea,
    getMotivoBloqueioArea,
    docentesSemArea,
  };
}
