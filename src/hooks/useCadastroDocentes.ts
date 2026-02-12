import { useState, useEffect, useCallback, useRef } from 'react';
import { CadastroDocente, Atribuicao } from '../types';

const STORAGE_KEY = 'cadastro-docentes';

export function useCadastroDocentes(atribuicoes: Atribuicao[]) {
  const [docentes, setDocentes] = useState<CadastroDocente[]>([]);
  const carregouDoStorage = useRef(false);

  // Carregar docentes do localStorage (apenas uma vez)
  useEffect(() => {
    if (!carregouDoStorage.current) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const docentesSalvos = JSON.parse(saved);
          if (Array.isArray(docentesSalvos)) {
            setDocentes(docentesSalvos);
          }
        } catch (e) {
          console.error('Erro ao carregar cadastro de docentes:', e);
        }
      }
      carregouDoStorage.current = true;
    }
  }, []);

  // Salvar no localStorage quando mudar (mas só depois de carregar)
  useEffect(() => {
    if (carregouDoStorage.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(docentes));
    }
  }, [docentes]);

  // Sincronizar com atribuições - criar cadastros básicos para novos docentes
  const sincronizarComAtribuicoes = useCallback(() => {
    const nomesAtribuicoes = [...new Set(atribuicoes.map(a => a.docente))];
    
    setDocentes(docentesAtuais => {
      const nomesExistentes = docentesAtuais.map(d => d.nome.toLowerCase());
      
      const novosDocentes: CadastroDocente[] = [];
      
      nomesAtribuicoes.forEach(nome => {
        if (!nomesExistentes.includes(nome.toLowerCase())) {
          novosDocentes.push({
            id: crypto.randomUUID(),
            nome: nome,
            dataCadastro: new Date().toISOString(),
            dataAtualizacao: new Date().toISOString(),
          });
        }
      });

      if (novosDocentes.length > 0) {
        return [...docentesAtuais, ...novosDocentes];
      }
      return docentesAtuais;
    });
    
    // Retornar quantidade estimada (não é preciso, mas funcional)
    const nomesExistentes = docentes.map(d => d.nome.toLowerCase());
    return nomesAtribuicoes.filter(nome => !nomesExistentes.includes(nome.toLowerCase())).length;
  }, [atribuicoes, docentes]);

  // Adicionar novo docente
  const adicionarDocente = useCallback((docente: Omit<CadastroDocente, 'id' | 'dataCadastro' | 'dataAtualizacao'>) => {
    const novoDocente: CadastroDocente = {
      ...docente,
      id: crypto.randomUUID(),
      dataCadastro: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
    };
    setDocentes(prev => [...prev, novoDocente]);
    return novoDocente;
  }, []);

  // Atualizar docente
  const atualizarDocente = useCallback((id: string, dados: Partial<CadastroDocente>) => {
    setDocentes(prev => prev.map(d => 
      d.id === id 
        ? { ...d, ...dados, dataAtualizacao: new Date().toISOString() }
        : d
    ));
  }, []);

  // Remover docente
  const removerDocente = useCallback((id: string) => {
    setDocentes(prev => prev.filter(d => d.id !== id));
  }, []);

  // Buscar docente por ID
  const buscarPorId = useCallback((id: string) => {
    return docentes.find(d => d.id === id);
  }, [docentes]);

  // Buscar docente por nome
  const buscarPorNome = useCallback((nome: string) => {
    return docentes.find(d => d.nome.toLowerCase() === nome.toLowerCase());
  }, [docentes]);

  // Obter resumo de atribuições de um docente
  const obterResumoAtribuicoes = useCallback((nomeDocente: string) => {
    const atribuicoesDocente = atribuicoes.filter(a => a.docente === nomeDocente);
    
    const turmas = [...new Set(atribuicoesDocente.map(a => a.turma))];
    const disciplinas = [...new Set(atribuicoesDocente.map(a => a.disciplina))];
    const totalAulas = atribuicoesDocente.reduce((sum, a) => sum + a.aulas, 0);
    
    const detalhesPorTurma = turmas.map(turma => {
      const atribsTurma = atribuicoesDocente.filter(a => a.turma === turma);
      return {
        turma,
        disciplinas: atribsTurma.map(a => ({
          nome: a.disciplina,
          aulas: a.aulas
        })),
        totalAulas: atribsTurma.reduce((sum, a) => sum + a.aulas, 0)
      };
    });

    return {
      turmas,
      disciplinas,
      totalAulas,
      detalhesPorTurma,
      quantidadeTurmas: turmas.length,
      quantidadeDisciplinas: disciplinas.length
    };
  }, [atribuicoes]);

  // Exportar docentes
  const exportarDocentes = useCallback(() => {
    return JSON.stringify(docentes, null, 2);
  }, [docentes]);

  // Importar docentes
  const importarDocentes = useCallback((json: string) => {
    try {
      const dados = JSON.parse(json);
      if (Array.isArray(dados)) {
        setDocentes(dados);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // Restaurar docentes (para backup)
  const restaurarDocentes = useCallback((docentesBackup: CadastroDocente[]) => {
    setDocentes(docentesBackup);
  }, []);

  // Limpar docentes duplicados (por nome)
  const limparDuplicados = useCallback(() => {
    setDocentes(docentesAtuais => {
      const nomesVistos = new Set<string>();
      const docentesUnicos: CadastroDocente[] = [];
      
      docentesAtuais.forEach(docente => {
        const nomeNormalizado = docente.nome.toLowerCase().trim();
        if (!nomesVistos.has(nomeNormalizado)) {
          nomesVistos.add(nomeNormalizado);
          docentesUnicos.push(docente);
        }
      });
      
      return docentesUnicos;
    });
  }, []);

  return {
    docentes,
    sincronizarComAtribuicoes,
    adicionarDocente,
    atualizarDocente,
    removerDocente,
    buscarPorId,
    buscarPorNome,
    obterResumoAtribuicoes,
    exportarDocentes,
    importarDocentes,
    limparDuplicados,
    restaurarDocentes,
  };
}
