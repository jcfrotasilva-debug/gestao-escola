import { useState, useCallback, useMemo } from 'react';
import { Atribuicao, DocenteResumo, DisciplinaResumo, TurmaResumo } from '../types';

const STORAGE_KEY = 'atribuicao-aulas';

export function useAtribuicoes() {
  const [atribuicoes, setAtribuicoes] = useState<Atribuicao[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const saveAtribuicoes = useCallback((data: Atribuicao[]) => {
    setAtribuicoes(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  const importData = useCallback((data: Omit<Atribuicao, 'id'>[]) => {
    const newData: Atribuicao[] = data.map((item, index) => ({
      ...item,
      id: `${Date.now()}-${index}`,
    }));
    saveAtribuicoes(newData);
  }, [saveAtribuicoes]);

  const addAtribuicao = useCallback((data: Omit<Atribuicao, 'id'>) => {
    const newItem: Atribuicao = {
      ...data,
      id: Date.now().toString(),
    };
    saveAtribuicoes([...atribuicoes, newItem]);
  }, [atribuicoes, saveAtribuicoes]);

  const updateAtribuicao = useCallback((id: string, data: Partial<Atribuicao>) => {
    saveAtribuicoes(atribuicoes.map(item => 
      item.id === id ? { ...item, ...data } : item
    ));
  }, [atribuicoes, saveAtribuicoes]);

  const deleteAtribuicao = useCallback((id: string) => {
    saveAtribuicoes(atribuicoes.filter(item => item.id !== id));
  }, [atribuicoes, saveAtribuicoes]);

  const clearData = useCallback(() => {
    saveAtribuicoes([]);
  }, [saveAtribuicoes]);

  // Estatísticas por docente
  const docentesResumo = useMemo((): DocenteResumo[] => {
    const map = new Map<string, DocenteResumo>();
    
    atribuicoes.forEach(item => {
      const docente = item.docente.trim();
      if (!map.has(docente)) {
        map.set(docente, {
          nome: docente,
          totalAulas: 0,
          disciplinas: [],
          turmas: [],
        });
      }
      const resumo = map.get(docente)!;
      resumo.totalAulas += item.aulas;
      if (!resumo.disciplinas.includes(item.disciplina)) {
        resumo.disciplinas.push(item.disciplina);
      }
      if (!resumo.turmas.includes(item.turma)) {
        resumo.turmas.push(item.turma);
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalAulas - a.totalAulas);
  }, [atribuicoes]);

  // Estatísticas por disciplina
  const disciplinasResumo = useMemo((): DisciplinaResumo[] => {
    const map = new Map<string, DisciplinaResumo>();
    
    atribuicoes.forEach(item => {
      const disciplina = item.disciplina.trim();
      if (!map.has(disciplina)) {
        map.set(disciplina, {
          nome: disciplina,
          totalAulas: 0,
          docentes: [],
        });
      }
      const resumo = map.get(disciplina)!;
      resumo.totalAulas += item.aulas;
      if (!resumo.docentes.includes(item.docente)) {
        resumo.docentes.push(item.docente);
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalAulas - a.totalAulas);
  }, [atribuicoes]);

  // Estatísticas por turma
  const turmasResumo = useMemo((): TurmaResumo[] => {
    const map = new Map<string, TurmaResumo>();
    
    atribuicoes.forEach(item => {
      const turma = item.turma.trim();
      if (!map.has(turma)) {
        map.set(turma, {
          nome: turma,
          totalAulas: 0,
          docentes: [],
          disciplinas: [],
        });
      }
      const resumo = map.get(turma)!;
      resumo.totalAulas += item.aulas;
      if (!resumo.docentes.includes(item.docente)) {
        resumo.docentes.push(item.docente);
      }
      if (!resumo.disciplinas.includes(item.disciplina)) {
        resumo.disciplinas.push(item.disciplina);
      }
    });

    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [atribuicoes]);

  const totalAulas = useMemo(() => 
    atribuicoes.reduce((acc, item) => acc + item.aulas, 0)
  , [atribuicoes]);

  return {
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
  };
}
