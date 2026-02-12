import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
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

  // Carregar dados do Supabase
  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      setSyncStatus('syncing');

      // Carregar escola
      const { data: escolaData } = await supabase
        .from('escola')
        .select('*')
        .limit(1)
        .single();

      if (escolaData) {
        const escolaFormatada: Escola = {
          id: escolaData.id,
          nome: escolaData.nome || '',
          cnpj: escolaData.cnpj || '',
          codigoInep: escolaData.codigo_inep || '',
          email: escolaData.email || '',
          telefone: escolaData.telefone || '',
          endereco: escolaData.endereco as Escola['endereco'] || escolaInicial.endereco,
          tiposEnsino: escolaData.tipos_ensino as TipoEnsino[] || [],
          anosSeries: (escolaData.tipos_ensino as unknown as AnoSerie[]) || [],
          turnos: escolaData.turnos as Turno[] || [],
          aee: escolaData.aee as AtendimentoAEE || escolaInicial.aee,
          projetos: [],
          infraestrutura: escolaData.infraestrutura as Infraestrutura || escolaInicial.infraestrutura,
          diretor: escolaData.diretor || '',
          viceDiretor: escolaData.vice_diretor || ''
        };
        setEscola(escolaFormatada);
      }

      // Carregar projetos
      const { data: projetosData } = await supabase
        .from('projetos')
        .select('*')
        .order('nome');

      if (projetosData) {
        const projetosFormatados: ProjetoEscolar[] = projetosData.map(p => ({
          id: p.id,
          nome: p.nome,
          descricao: p.descricao || '',
          categoria: p.categoria as ProjetoEscolar['categoria'] || 'pedagogico',
          origem: p.origem as ProjetoEscolar['origem'] || 'proprio',
          ativo: p.ativo
        }));
        setProjetos(projetosFormatados);
      }

      // Carregar turmas dos projetos
      const { data: turmasData } = await supabase
        .from('projeto_turmas')
        .select('*');

      if (turmasData) {
        const turmasFormatadas: TurmaProjeto[] = turmasData.map(t => ({
          id: t.id,
          projetoId: t.projeto_id,
          nome: t.nome,
          descricao: t.descricao || '',
          vagas: t.vagas || 0
        }));
        setTurmasProjetos(turmasFormatadas);
      }

      // Carregar atribuições dos projetos
      const { data: atribuicoesData } = await supabase
        .from('projeto_atribuicoes')
        .select('*');

      if (atribuicoesData) {
        const atribuicoesFormatadas: AtribuicaoProjeto[] = atribuicoesData.map(a => ({
          id: a.id,
          projetoId: a.projeto_id,
          turmaId: a.turma_id,
          docenteNome: a.docente_nome,
          aulas: a.aulas || 0
        }));
        setAtribuicoesProjetos(atribuicoesFormatadas);
      }

      setSyncStatus('synced');
    } catch (err) {
      console.error('Erro ao carregar dados da escola:', err);
      setSyncStatus('error');
      
      // Fallback para localStorage
      const localEscola = localStorage.getItem('escola-cadastro');
      const localProjetos = localStorage.getItem('escola-projetos');
      const localTurmas = localStorage.getItem('escola-turmas-projetos');
      const localAtribuicoes = localStorage.getItem('escola-atribuicoes-projetos');
      
      if (localEscola) setEscola(JSON.parse(localEscola));
      if (localProjetos) setProjetos(JSON.parse(localProjetos));
      if (localTurmas) setTurmasProjetos(JSON.parse(localTurmas));
      if (localAtribuicoes) setAtribuicoesProjetos(JSON.parse(localAtribuicoes));
    } finally {
      setLoading(false);
    }
  }, []);

  // Salvar/Atualizar escola
  const salvarEscola = useCallback(async (dadosEscola: Escola) => {
    try {
      setSyncStatus('syncing');

      const dadosParaSalvar = {
        nome: dadosEscola.nome,
        cnpj: dadosEscola.cnpj,
        codigo_inep: dadosEscola.codigoInep,
        email: dadosEscola.email,
        telefone: dadosEscola.telefone,
        endereco: dadosEscola.endereco,
        tipos_ensino: dadosEscola.tiposEnsino,
        turnos: dadosEscola.turnos,
        aee: dadosEscola.aee,
        infraestrutura: dadosEscola.infraestrutura,
        diretor: dadosEscola.diretor,
        vice_diretor: dadosEscola.viceDiretor,
        updated_at: new Date().toISOString()
      };

      if (dadosEscola.id) {
        const { error } = await supabase
          .from('escola')
          .update(dadosParaSalvar)
          .eq('id', dadosEscola.id);
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('escola')
          .insert([dadosParaSalvar])
          .select()
          .single();
        
        if (error) throw error;
        dadosEscola.id = data.id;
      }

      setEscola(dadosEscola);
      setSyncStatus('synced');
      localStorage.setItem('escola-cadastro', JSON.stringify(dadosEscola));
    } catch (err) {
      console.error('Erro ao salvar escola:', err);
      setSyncStatus('error');
      localStorage.setItem('escola-cadastro', JSON.stringify(dadosEscola));
      setEscola(dadosEscola);
    }
  }, []);

  // Funções auxiliares para atualizar escola
  const atualizarEscola = useCallback((campo: keyof Escola, valor: unknown) => {
    setEscola(prev => {
      const novaEscola = { ...prev, [campo]: valor };
      salvarEscola(novaEscola);
      return novaEscola;
    });
  }, [salvarEscola]);

  const toggleTipoEnsino = useCallback((tipo: TipoEnsino) => {
    setEscola(prev => {
      const tipos = prev.tiposEnsino.includes(tipo)
        ? prev.tiposEnsino.filter(t => t !== tipo)
        : [...prev.tiposEnsino, tipo];
      const novaEscola = { ...prev, tiposEnsino: tipos };
      salvarEscola(novaEscola);
      return novaEscola;
    });
  }, [salvarEscola]);

  const toggleAnoSerie = useCallback((anoId: string) => {
    setEscola(prev => {
      const anos = prev.anosSeries.map(a => 
        a.id === anoId ? { ...a, ativo: !a.ativo } : a
      );
      const novaEscola = { ...prev, anosSeries: anos };
      salvarEscola(novaEscola);
      return novaEscola;
    });
  }, [salvarEscola]);

  const adicionarAnoSerie = useCallback((ano: Omit<AnoSerie, 'id'>) => {
    setEscola(prev => {
      const novoAno: AnoSerie = { ...ano, id: Date.now().toString() };
      const novaEscola = { ...prev, anosSeries: [...prev.anosSeries, novoAno] };
      salvarEscola(novaEscola);
      return novaEscola;
    });
  }, [salvarEscola]);

  const removerAnoSerie = useCallback((anoId: string) => {
    setEscola(prev => {
      const anos = prev.anosSeries.filter(a => a.id !== anoId);
      const novaEscola = { ...prev, anosSeries: anos };
      salvarEscola(novaEscola);
      return novaEscola;
    });
  }, [salvarEscola]);

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
      salvarEscola(novaEscola);
      return novaEscola;
    });
  }, [salvarEscola]);

  const atualizarTurno = useCallback((tipo: Turno['tipo'], campo: 'horaInicio' | 'horaFim', valor: string) => {
    setEscola(prev => {
      const turnos = prev.turnos.map(t => 
        t.tipo === tipo ? { ...t, [campo]: valor } : t
      );
      const novaEscola = { ...prev, turnos };
      salvarEscola(novaEscola);
      return novaEscola;
    });
  }, [salvarEscola]);

  const atualizarAEE = useCallback((campo: keyof AtendimentoAEE, valor: unknown) => {
    setEscola(prev => {
      const novaEscola = { ...prev, aee: { ...prev.aee, [campo]: valor } };
      salvarEscola(novaEscola);
      return novaEscola;
    });
  }, [salvarEscola]);

  const toggleDeficienciaAEE = useCallback((deficiencia: TipoDeficiencia) => {
    setEscola(prev => {
      const deficiencias = prev.aee.deficienciasAtendidas.includes(deficiencia)
        ? prev.aee.deficienciasAtendidas.filter(d => d !== deficiencia)
        : [...prev.aee.deficienciasAtendidas, deficiencia];
      const novaEscola = { ...prev, aee: { ...prev.aee, deficienciasAtendidas: deficiencias } };
      salvarEscola(novaEscola);
      return novaEscola;
    });
  }, [salvarEscola]);

  const atualizarInfraestrutura = useCallback((campo: keyof Infraestrutura, valor: unknown) => {
    setEscola(prev => {
      const novaEscola = { ...prev, infraestrutura: { ...prev.infraestrutura, [campo]: valor } };
      salvarEscola(novaEscola);
      return novaEscola;
    });
  }, [salvarEscola]);

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
      salvarEscola(novaEscola);
      return novaEscola;
    });
  }, [salvarEscola]);

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
      salvarEscola(novaEscola);
      return novaEscola;
    });
  }, [salvarEscola]);

  // Funções para Projetos
  const adicionarProjeto = useCallback(async (projeto: Omit<ProjetoEscolar, 'id'>) => {
    try {
      setSyncStatus('syncing');

      const { data, error } = await supabase
        .from('projetos')
        .insert([{
          nome: projeto.nome,
          descricao: projeto.descricao,
          categoria: projeto.categoria,
          origem: projeto.origem,
          ativo: projeto.ativo
        }])
        .select()
        .single();

      if (error) throw error;

      const novoProjeto: ProjetoEscolar = {
        id: data.id,
        nome: data.nome,
        descricao: data.descricao || '',
        categoria: data.categoria,
        origem: data.origem,
        ativo: data.ativo
      };

      setProjetos(prev => [...prev, novoProjeto]);
      setSyncStatus('synced');
      return novoProjeto.id;
    } catch (err) {
      console.error('Erro ao adicionar projeto:', err);
      setSyncStatus('error');
      // Fallback local
      const novoProjeto: ProjetoEscolar = {
        ...projeto,
        id: Date.now().toString()
      };
      setProjetos(prev => [...prev, novoProjeto]);
      return novoProjeto.id;
    }
  }, []);

  const atualizarProjeto = useCallback(async (id: string, dados: Partial<ProjetoEscolar>) => {
    try {
      setSyncStatus('syncing');

      const { error } = await supabase
        .from('projetos')
        .update({
          nome: dados.nome,
          descricao: dados.descricao,
          categoria: dados.categoria,
          origem: dados.origem,
          ativo: dados.ativo
        })
        .eq('id', id);

      if (error) throw error;

      setProjetos(prev => prev.map(p => p.id === id ? { ...p, ...dados } : p));
      setSyncStatus('synced');
    } catch (err) {
      console.error('Erro ao atualizar projeto:', err);
      setSyncStatus('error');
      setProjetos(prev => prev.map(p => p.id === id ? { ...p, ...dados } : p));
    }
  }, []);

  const removerProjeto = useCallback(async (id: string) => {
    try {
      setSyncStatus('syncing');

      const { error } = await supabase
        .from('projetos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProjetos(prev => prev.filter(p => p.id !== id));
      setTurmasProjetos(prev => prev.filter(t => t.projetoId !== id));
      setAtribuicoesProjetos(prev => prev.filter(a => a.projetoId !== id));
      setSyncStatus('synced');
    } catch (err) {
      console.error('Erro ao remover projeto:', err);
      setSyncStatus('error');
      setProjetos(prev => prev.filter(p => p.id !== id));
    }
  }, []);

  // Funções para Turmas de Projetos
  const adicionarTurmaProjeto = useCallback(async (turma: Omit<TurmaProjeto, 'id'>) => {
    try {
      setSyncStatus('syncing');

      const { data, error } = await supabase
        .from('projeto_turmas')
        .insert([{
          projeto_id: turma.projetoId,
          nome: turma.nome,
          descricao: turma.descricao,
          vagas: turma.vagas
        }])
        .select()
        .single();

      if (error) throw error;

      const novaTurma: TurmaProjeto = {
        id: data.id,
        projetoId: data.projeto_id,
        nome: data.nome,
        descricao: data.descricao || '',
        vagas: data.vagas || 0
      };

      setTurmasProjetos(prev => [...prev, novaTurma]);
      setSyncStatus('synced');
      return novaTurma.id;
    } catch (err) {
      console.error('Erro ao adicionar turma de projeto:', err);
      setSyncStatus('error');
      const novaTurma: TurmaProjeto = { ...turma, id: Date.now().toString() };
      setTurmasProjetos(prev => [...prev, novaTurma]);
      return novaTurma.id;
    }
  }, []);

  const removerTurmaProjeto = useCallback(async (id: string) => {
    try {
      setSyncStatus('syncing');

      const { error } = await supabase
        .from('projeto_turmas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTurmasProjetos(prev => prev.filter(t => t.id !== id));
      setAtribuicoesProjetos(prev => prev.filter(a => a.turmaId !== id));
      setSyncStatus('synced');
    } catch (err) {
      console.error('Erro ao remover turma de projeto:', err);
      setSyncStatus('error');
      setTurmasProjetos(prev => prev.filter(t => t.id !== id));
    }
  }, []);

  // Funções para Atribuições de Projetos
  const adicionarAtribuicaoProjeto = useCallback(async (atribuicao: Omit<AtribuicaoProjeto, 'id'>) => {
    try {
      setSyncStatus('syncing');

      const { data, error } = await supabase
        .from('projeto_atribuicoes')
        .insert([{
          projeto_id: atribuicao.projetoId,
          turma_id: atribuicao.turmaId,
          docente_nome: atribuicao.docenteNome,
          aulas: atribuicao.aulas
        }])
        .select()
        .single();

      if (error) throw error;

      const novaAtribuicao: AtribuicaoProjeto = {
        id: data.id,
        projetoId: data.projeto_id,
        turmaId: data.turma_id,
        docenteNome: data.docente_nome,
        aulas: data.aulas || 0
      };

      setAtribuicoesProjetos(prev => [...prev, novaAtribuicao]);
      setSyncStatus('synced');
      return novaAtribuicao.id;
    } catch (err) {
      console.error('Erro ao adicionar atribuição de projeto:', err);
      setSyncStatus('error');
      const novaAtribuicao: AtribuicaoProjeto = { ...atribuicao, id: Date.now().toString() };
      setAtribuicoesProjetos(prev => [...prev, novaAtribuicao]);
      return novaAtribuicao.id;
    }
  }, []);

  const removerAtribuicaoProjeto = useCallback(async (id: string) => {
    try {
      setSyncStatus('syncing');

      const { error } = await supabase
        .from('projeto_atribuicoes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAtribuicoesProjetos(prev => prev.filter(a => a.id !== id));
      setSyncStatus('synced');
    } catch (err) {
      console.error('Erro ao remover atribuição de projeto:', err);
      setSyncStatus('error');
      setAtribuicoesProjetos(prev => prev.filter(a => a.id !== id));
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Restaurar escola (para backup)
  const restaurarEscola = useCallback((escolaBackup: Escola) => {
    setEscola(escolaBackup);
    localStorage.setItem('escola-cadastro', JSON.stringify(escolaBackup));
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
