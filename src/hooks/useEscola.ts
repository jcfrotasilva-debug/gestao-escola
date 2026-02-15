import { useState, useEffect, useCallback } from 'react';
import { 
  Escola, 
  ProjetoEscolar, 
  TurmaProjeto, 
  AtribuicaoProjeto,
  TipoEnsino,
  Turno,
  AtendimentoAEE,
  AnoSerie,
  Infraestrutura,
  TipoDeficiencia
} from '../types';

const STORAGE_KEY_ESCOLA = 'escola-cadastro';
const STORAGE_KEY_PROJETOS = 'escola-projetos';
const STORAGE_KEY_TURMAS = 'escola-turmas-projetos';
const STORAGE_KEY_ATRIBUICOES = 'escola-atribuicoes-projetos';

const escolaInicial: Escola = {
  nome: '',
  cnpj: '',
  codigoInep: '',
  email: '',
  telefone: '',
  endereco: {
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    cep: ''
  },
  tiposEnsino: [],
  anosSeries: [],
  turnos: [],
  aee: {
    possui: false,
    salaRecursos: false,
    salaRecursosQuantidade: 0,
    deficienciasAtendidas: [],
    profissionaisAEE: 0,
    observacoes: ''
  },
  projetos: [],
  infraestrutura: {
    acessibilidade: {
      rampa: false,
      elevador: false,
      banheiroAdaptado: false,
      pisoTatil: false,
      sinalizacaoBraille: false
    },
    espacos: {
      salaRecursos: false,
      salaRecursosQuantidade: 0,
      laboratorioInformatica: false,
      laboratorioCiencias: false,
      biblioteca: false,
      quadraEsportiva: false,
      quadraCoberta: false,
      auditorio: false,
      refeitorio: false,
      parqueInfantil: false
    },
    totalSalas: 0
  },
  diretor: '',
  viceDiretor: ''
};

export function useEscola() {
  const [escola, setEscola] = useState<Escola>(escolaInicial);
  const [projetos, setProjetos] = useState<ProjetoEscolar[]>([]);
  const [turmasProjetos, setTurmasProjetos] = useState<TurmaProjeto[]>([]);
  const [atribuicoesProjetos, setAtribuicoesProjetos] = useState<AtribuicaoProjeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');

  // Carregar dados do localStorage
  const carregarDados = useCallback(() => {
    try {
      setLoading(true);

      const localEscola = localStorage.getItem(STORAGE_KEY_ESCOLA);
      const localProjetos = localStorage.getItem(STORAGE_KEY_PROJETOS);
      const localTurmas = localStorage.getItem(STORAGE_KEY_TURMAS);
      const localAtribuicoes = localStorage.getItem(STORAGE_KEY_ATRIBUICOES);
      
      if (localEscola) setEscola(JSON.parse(localEscola));
      if (localProjetos) setProjetos(JSON.parse(localProjetos));
      if (localTurmas) setTurmasProjetos(JSON.parse(localTurmas));
      if (localAtribuicoes) setAtribuicoesProjetos(JSON.parse(localAtribuicoes));
      
      setSyncStatus('synced');
    } catch (err) {
      console.error('Erro ao carregar dados da escola:', err);
      setSyncStatus('error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Salvar escola no localStorage (chamado ao alterar qualquer campo)
  const salvarEscola = useCallback((dadosEscola: Escola) => {
    setEscola(dadosEscola);
    localStorage.setItem(STORAGE_KEY_ESCOLA, JSON.stringify(dadosEscola));
  }, []);

  // Funções auxiliares para atualizar escola (apenas atualizam estado local)
  const atualizarEscola = useCallback((campo: keyof Escola, valor: unknown) => {
    setEscola(prev => {
      const novaEscola = { ...prev, [campo]: valor };
      localStorage.setItem(STORAGE_KEY_ESCOLA, JSON.stringify(novaEscola));
      return novaEscola;
    });
  }, []);

  const toggleTipoEnsino = useCallback((tipo: TipoEnsino) => {
    setEscola(prev => {
      const tipos = prev.tiposEnsino.includes(tipo)
        ? prev.tiposEnsino.filter(t => t !== tipo)
        : [...prev.tiposEnsino, tipo];
      const novaEscola = { ...prev, tiposEnsino: tipos };
      localStorage.setItem(STORAGE_KEY_ESCOLA, JSON.stringify(novaEscola));
      return novaEscola;
    });
  }, []);

  const toggleAnoSerie = useCallback((anoId: string) => {
    setEscola(prev => {
      const anos = prev.anosSeries.map(a => 
        a.id === anoId ? { ...a, ativo: !a.ativo } : a
      );
      const novaEscola = { ...prev, anosSeries: anos };
      localStorage.setItem(STORAGE_KEY_ESCOLA, JSON.stringify(novaEscola));
      return novaEscola;
    });
  }, []);

  const adicionarAnoSerie = useCallback((ano: Omit<AnoSerie, 'id'>) => {
    setEscola(prev => {
      const novoAno: AnoSerie = { ...ano, id: Date.now().toString() };
      const novaEscola = { ...prev, anosSeries: [...prev.anosSeries, novoAno] };
      localStorage.setItem(STORAGE_KEY_ESCOLA, JSON.stringify(novaEscola));
      return novaEscola;
    });
  }, []);

  const removerAnoSerie = useCallback((anoId: string) => {
    setEscola(prev => {
      const anos = prev.anosSeries.filter(a => a.id !== anoId);
      const novaEscola = { ...prev, anosSeries: anos };
      localStorage.setItem(STORAGE_KEY_ESCOLA, JSON.stringify(novaEscola));
      return novaEscola;
    });
  }, []);

  const toggleTurno = useCallback((tipo: Turno['tipo']) => {
    setEscola(prev => {
      const turnoExiste = prev.turnos.find(t => t.tipo === tipo);
      let turnos: Turno[];
      if (turnoExiste) {
        turnos = prev.turnos.map(t => 
          t.tipo === tipo ? { ...t, ativo: !t.ativo } : t
        );
      } else {
        const novoTurno: Turno = {
          tipo,
          horaInicio: tipo === 'manha' ? '07:00' : tipo === 'tarde' ? '13:00' : tipo === 'noite' ? '19:00' : '07:00',
          horaFim: tipo === 'manha' ? '12:00' : tipo === 'tarde' ? '18:00' : tipo === 'noite' ? '22:00' : '16:00',
          ativo: true
        };
        turnos = [...prev.turnos, novoTurno];
      }
      const novaEscola = { ...prev, turnos };
      localStorage.setItem(STORAGE_KEY_ESCOLA, JSON.stringify(novaEscola));
      return novaEscola;
    });
  }, []);

  const atualizarTurno = useCallback((tipo: Turno['tipo'], campo: 'horaInicio' | 'horaFim', valor: string) => {
    setEscola(prev => {
      const turnos = prev.turnos.map(t => 
        t.tipo === tipo ? { ...t, [campo]: valor } : t
      );
      const novaEscola = { ...prev, turnos };
      localStorage.setItem(STORAGE_KEY_ESCOLA, JSON.stringify(novaEscola));
      return novaEscola;
    });
  }, []);

  const atualizarAEE = useCallback((campo: keyof AtendimentoAEE, valor: unknown) => {
    setEscola(prev => {
      const novaEscola = { ...prev, aee: { ...prev.aee, [campo]: valor } };
      localStorage.setItem(STORAGE_KEY_ESCOLA, JSON.stringify(novaEscola));
      return novaEscola;
    });
  }, []);

  const toggleDeficienciaAEE = useCallback((deficiencia: TipoDeficiencia) => {
    setEscola(prev => {
      const deficiencias = prev.aee.deficienciasAtendidas.includes(deficiencia)
        ? prev.aee.deficienciasAtendidas.filter(d => d !== deficiencia)
        : [...prev.aee.deficienciasAtendidas, deficiencia];
      const novaEscola = { ...prev, aee: { ...prev.aee, deficienciasAtendidas: deficiencias } };
      localStorage.setItem(STORAGE_KEY_ESCOLA, JSON.stringify(novaEscola));
      return novaEscola;
    });
  }, []);

  const atualizarInfraestrutura = useCallback((campo: keyof Infraestrutura, valor: unknown) => {
    setEscola(prev => {
      const novaEscola = { ...prev, infraestrutura: { ...prev.infraestrutura, [campo]: valor } };
      localStorage.setItem(STORAGE_KEY_ESCOLA, JSON.stringify(novaEscola));
      return novaEscola;
    });
  }, []);

  const toggleAcessibilidade = useCallback((campo: keyof Infraestrutura['acessibilidade']) => {
    setEscola(prev => {
      const novaEscola = {
        ...prev,
        infraestrutura: {
          ...prev.infraestrutura,
          acessibilidade: {
            ...prev.infraestrutura.acessibilidade,
            [campo]: !prev.infraestrutura.acessibilidade[campo]
          }
        }
      };
      localStorage.setItem(STORAGE_KEY_ESCOLA, JSON.stringify(novaEscola));
      return novaEscola;
    });
  }, []);

  const toggleEspaco = useCallback((campo: keyof Infraestrutura['espacos']) => {
    setEscola(prev => {
      const valorAtual = prev.infraestrutura.espacos[campo];
      const novoValor = typeof valorAtual === 'boolean' ? !valorAtual : valorAtual;
      const novaEscola = {
        ...prev,
        infraestrutura: {
          ...prev.infraestrutura,
          espacos: {
            ...prev.infraestrutura.espacos,
            [campo]: novoValor
          }
        }
      };
      localStorage.setItem(STORAGE_KEY_ESCOLA, JSON.stringify(novaEscola));
      return novaEscola;
    });
  }, []);

  // Funções para Projetos (salvam no localStorage)
  const adicionarProjeto = useCallback((projeto: Omit<ProjetoEscolar, 'id'>) => {
    const novoProjeto: ProjetoEscolar = {
      ...projeto,
      id: Date.now().toString()
    };
    setProjetos(prev => {
      const novosProjetos = [...prev, novoProjeto];
      localStorage.setItem(STORAGE_KEY_PROJETOS, JSON.stringify(novosProjetos));
      return novosProjetos;
    });
    return novoProjeto.id;
  }, []);

  const atualizarProjeto = useCallback((id: string, dados: Partial<ProjetoEscolar>) => {
    setProjetos(prev => {
      const novosProjetos = prev.map(p => p.id === id ? { ...p, ...dados } : p);
      localStorage.setItem(STORAGE_KEY_PROJETOS, JSON.stringify(novosProjetos));
      return novosProjetos;
    });
  }, []);

  const removerProjeto = useCallback((id: string) => {
    setProjetos(prev => {
      const novosProjetos = prev.filter(p => p.id !== id);
      localStorage.setItem(STORAGE_KEY_PROJETOS, JSON.stringify(novosProjetos));
      return novosProjetos;
    });
    setTurmasProjetos(prev => {
      const novasTurmas = prev.filter(t => t.projetoId !== id);
      localStorage.setItem(STORAGE_KEY_TURMAS, JSON.stringify(novasTurmas));
      return novasTurmas;
    });
    setAtribuicoesProjetos(prev => {
      const novasAtribuicoes = prev.filter(a => a.projetoId !== id);
      localStorage.setItem(STORAGE_KEY_ATRIBUICOES, JSON.stringify(novasAtribuicoes));
      return novasAtribuicoes;
    });
  }, []);

  // Funções para Turmas de Projetos
  const adicionarTurmaProjeto = useCallback((turma: Omit<TurmaProjeto, 'id'>) => {
    const novaTurma: TurmaProjeto = { ...turma, id: Date.now().toString() };
    setTurmasProjetos(prev => {
      const novasTurmas = [...prev, novaTurma];
      localStorage.setItem(STORAGE_KEY_TURMAS, JSON.stringify(novasTurmas));
      return novasTurmas;
    });
    return novaTurma.id;
  }, []);

  const removerTurmaProjeto = useCallback((id: string) => {
    setTurmasProjetos(prev => {
      const novasTurmas = prev.filter(t => t.id !== id);
      localStorage.setItem(STORAGE_KEY_TURMAS, JSON.stringify(novasTurmas));
      return novasTurmas;
    });
    setAtribuicoesProjetos(prev => {
      const novasAtribuicoes = prev.filter(a => a.turmaId !== id);
      localStorage.setItem(STORAGE_KEY_ATRIBUICOES, JSON.stringify(novasAtribuicoes));
      return novasAtribuicoes;
    });
  }, []);

  // Funções para Atribuições de Projetos
  const adicionarAtribuicaoProjeto = useCallback((atribuicao: Omit<AtribuicaoProjeto, 'id'>) => {
    const novaAtribuicao: AtribuicaoProjeto = { ...atribuicao, id: Date.now().toString() };
    setAtribuicoesProjetos(prev => {
      const novasAtribuicoes = [...prev, novaAtribuicao];
      localStorage.setItem(STORAGE_KEY_ATRIBUICOES, JSON.stringify(novasAtribuicoes));
      return novasAtribuicoes;
    });
    return novaAtribuicao.id;
  }, []);

  const removerAtribuicaoProjeto = useCallback((id: string) => {
    setAtribuicoesProjetos(prev => {
      const novasAtribuicoes = prev.filter(a => a.id !== id);
      localStorage.setItem(STORAGE_KEY_ATRIBUICOES, JSON.stringify(novasAtribuicoes));
      return novasAtribuicoes;
    });
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Restaurar escola (para backup)
  const restaurarEscola = useCallback((escolaBackup: Escola) => {
    setEscola(escolaBackup);
    localStorage.setItem(STORAGE_KEY_ESCOLA, JSON.stringify(escolaBackup));
  }, []);

  return {
    escola,
    projetos,
    turmasProjetos,
    atribuicoesProjetos,
    loading,
    syncStatus,
    // Funções de escola
    salvarEscola,
    atualizarEscola,
    restaurarEscola,
    toggleTipoEnsino,
    toggleAnoSerie,
    adicionarAnoSerie,
    removerAnoSerie,
    toggleTurno,
    atualizarTurno,
    atualizarAEE,
    toggleDeficienciaAEE,
    atualizarInfraestrutura,
    toggleAcessibilidade,
    toggleEspaco,
    // Funções de projetos
    adicionarProjeto,
    atualizarProjeto,
    removerProjeto,
    adicionarTurmaProjeto,
    removerTurmaProjeto,
    adicionarAtribuicaoProjeto,
    removerAtribuicaoProjeto,
    recarregar: carregarDados
  };
}
