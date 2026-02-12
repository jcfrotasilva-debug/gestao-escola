import { useState, useEffect, useCallback } from 'react';
import { Aluno, TurmaAlunos, SituacaoAluno } from '../types';

const STORAGE_KEY = 'gestao-escolar-alunos';

// Função para calcular idade
const calcularIdade = (dataNascimento: string): number => {
  if (!dataNascimento) return 0;
  
  // Tenta diferentes formatos de data
  let data: Date | null = null;
  
  // Formato DD/MM/YYYY
  if (dataNascimento.includes('/')) {
    const [dia, mes, ano] = dataNascimento.split('/');
    data = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
  } 
  // Formato YYYY-MM-DD
  else if (dataNascimento.includes('-')) {
    data = new Date(dataNascimento);
  }
  // Formato numérico do Excel (dias desde 1900)
  else if (!isNaN(Number(dataNascimento))) {
    const excelDate = parseInt(dataNascimento);
    data = new Date((excelDate - 25569) * 86400 * 1000);
  }
  
  if (!data || isNaN(data.getTime())) return 0;
  
  const hoje = new Date();
  let idade = hoje.getFullYear() - data.getFullYear();
  const m = hoje.getMonth() - data.getMonth();
  
  if (m < 0 || (m === 0 && hoje.getDate() < data.getDate())) {
    idade--;
  }
  
  return idade;
};

// Função para formatar data
const formatarData = (data: string): string => {
  if (!data) return '';
  
  // Se já está no formato DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
    return data;
  }
  
  // Formato numérico do Excel
  if (!isNaN(Number(data))) {
    const excelDate = parseInt(data);
    const d = new Date((excelDate - 25569) * 86400 * 1000);
    if (!isNaN(d.getTime())) {
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    }
  }
  
  // Formato YYYY-MM-DD
  if (data.includes('-')) {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }
  
  return data;
};

// Normalizar situação
const normalizarSituacao = (situacao: string): SituacaoAluno => {
  const s = situacao?.toLowerCase().trim() || '';
  
  if (s.includes('ativo') || s === 'a' || s === 'ativa') return 'Ativo';
  if (s.includes('transfer')) return 'Transferido';
  if (s.includes('evad')) return 'Evadido';
  if (s.includes('conclu')) return 'Concluído';
  if (s.includes('remanej')) return 'Remanejado';
  if (s.includes('falec')) return 'Falecido';
  if (s.includes('não compar') || s.includes('nao compar') || s.includes('nc')) return 'Não Compareceu';
  
  return 'Ativo'; // Default
};

export function useAlunos() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar dados do localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAlunos(parsed);
      } catch (e) {
        console.error('Erro ao carregar alunos:', e);
      }
    }
    setLoading(false);
  }, []);

  // Salvar dados no localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(alunos));
    }
  }, [alunos, loading]);

  // Importar dados da planilha Excel
  const importarPlanilha = useCallback((dados: Record<string, unknown>[]) => {
    // Debug: mostrar as colunas da primeira linha
    if (dados.length > 0) {
      console.log('Colunas da planilha:', Object.keys(dados[0]));
    }

    const novosAlunos: Aluno[] = dados.map((row, index) => {
      // Encontrar os campos de forma flexível - busca exata primeiro, depois parcial
      const encontrarCampo = (campos: string[]): string => {
        const chaves = Object.keys(row);
        
        // Primeiro tenta busca exata (ignorando case e espaços extras)
        for (const campo of campos) {
          const chave = chaves.find(k => 
            k.toLowerCase().trim() === campo.toLowerCase().trim()
          );
          if (chave && row[chave] !== null && row[chave] !== undefined) {
            return String(row[chave]).trim();
          }
        }
        
        // Depois tenta busca parcial (contém)
        for (const campo of campos) {
          const chave = chaves.find(k => 
            k.toLowerCase().trim().includes(campo.toLowerCase()) ||
            campo.toLowerCase().includes(k.toLowerCase().trim())
          );
          if (chave && row[chave] !== null && row[chave] !== undefined) {
            return String(row[chave]).trim();
          }
        }
        
        return '';
      };

      // Mapear campos da planilha - usando nomes exatos informados pelo usuário
      const ano = encontrarCampo(['ano', 'ano escolar', 'série', 'serie']);
      const rm = encontrarCampo(['rm', 'r.m.', 'r.m', 'matrícula', 'matricula', 'registro matrícula', 'registro matricula']);
      const numeroChamada = encontrarCampo(['nº ch', 'nº ch.', 'n ch', 'num ch', 'número chamada', 'numero chamada', 'chamada', 'nº', 'n°', 'numero']);
      const nome = encontrarCampo(['nome do aluno', 'nome aluno', 'aluno', 'nome completo', 'nome']);
      const ra = encontrarCampo(['ra', 'r.a.', 'r.a', 'registro aluno', 'registro do aluno']);
      const dvRa = encontrarCampo(['dv ra', 'dv r.a.', 'dv', 'digito', 'dígito', 'digito verificador']);
      const ufRa = encontrarCampo(['uf ra', 'uf r.a.', 'uf do ra', 'uf', 'estado ra']);
      const dataNascimento = encontrarCampo(['data de nascimento', 'data nascimento', 'dt nascimento', 'nascimento', 'dt nasc', 'data nasc', 'nasc']);
      const situacao = encontrarCampo(['situação', 'situacao', 'status', 'sit', 'situação do aluno', 'situacao do aluno']);
      const deficiencia = encontrarCampo(['deficiência', 'deficiencia', 'def', 'nee', 'necessidade especial', 'necessidade', 'pcd', 'tipo deficiência', 'tipo deficiencia']);
      const endereco = encontrarCampo(['endereço do aluno', 'endereco do aluno', 'endereço aluno', 'endereco aluno', 'endereço', 'endereco', 'end', 'end.', 'logradouro']);

      // Construir a turma a partir do ano
      let turma = ano;
      
      // Se o ano inclui letra (ex: "6º A"), usa direto
      // Senão, tenta extrair de algum campo
      if (!turma.match(/[A-Za-z]$/)) {
        // Tenta pegar a turma de um campo específico
        const turmaField = encontrarCampo(['turma', 'classe', 'sala']);
        if (turmaField) {
          turma = turmaField;
        }
      }

      const dataNascFormatada = formatarData(dataNascimento);
      
      return {
        id: `aluno-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        ano: ano.replace(/[º°]/g, 'º'),
        turma: turma.replace(/[º°]/g, 'º'),
        rm,
        numeroChamada: parseInt(numeroChamada) || index + 1,
        nome,
        ra,
        dvRa,
        ufRa: ufRa || 'SP',
        dataNascimento: dataNascFormatada,
        idade: calcularIdade(dataNascFormatada),
        situacao: normalizarSituacao(situacao),
        deficiencia: deficiencia || '',
        endereco,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }).filter(a => a.nome); // Filtra linhas vazias

    setAlunos(novosAlunos);
    return novosAlunos.length;
  }, []);

  // Adicionar aluno
  const adicionarAluno = useCallback((aluno: Omit<Aluno, 'id' | 'createdAt' | 'updatedAt' | 'idade'>) => {
    const novoAluno: Aluno = {
      ...aluno,
      id: `aluno-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      idade: calcularIdade(aluno.dataNascimento),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setAlunos(prev => [...prev, novoAluno]);
    return novoAluno;
  }, []);

  // Atualizar aluno
  const atualizarAluno = useCallback((id: string, dados: Partial<Aluno>) => {
    setAlunos(prev => prev.map(a => {
      if (a.id === id) {
        const atualizado = {
          ...a,
          ...dados,
          updatedAt: new Date().toISOString(),
        };
        if (dados.dataNascimento) {
          atualizado.idade = calcularIdade(dados.dataNascimento);
        }
        return atualizado;
      }
      return a;
    }));
  }, []);

  // Remover aluno
  const removerAluno = useCallback((id: string) => {
    setAlunos(prev => prev.filter(a => a.id !== id));
  }, []);

  // Limpar todos os alunos
  const limparAlunos = useCallback(() => {
    setAlunos([]);
  }, []);

  // Restaurar alunos (para backup)
  const restaurarAlunos = useCallback((alunosBackup: Aluno[]) => {
    setAlunos(alunosBackup);
  }, []);

  // Obter lista de turmas únicas
  const turmas = [...new Set(alunos.map(a => a.turma))].sort();

  // Obter lista de anos únicos
  const anos = [...new Set(alunos.map(a => a.ano))].sort();

  // Obter resumo por turma
  const turmasResumo: TurmaAlunos[] = turmas.map(turma => {
    const alunosTurma = alunos.filter(a => a.turma === turma);
    const alunosAtivos = alunosTurma.filter(a => a.situacao === 'Ativo');
    const alunosComDeficiencia = alunosTurma.filter(a => a.deficiencia && a.deficiencia.trim() !== '' && a.deficiencia.toLowerCase() !== 'não' && a.deficiencia.toLowerCase() !== 'nenhuma');
    
    return {
      turma,
      ano: alunosTurma[0]?.ano || '',
      totalAlunos: alunosTurma.length,
      alunosAtivos: alunosAtivos.length,
      alunosComDeficiencia: alunosComDeficiencia.length,
      alunos: alunosTurma.sort((a, b) => a.numeroChamada - b.numeroChamada),
    };
  });

  // Estatísticas gerais
  const estatisticas = {
    totalAlunos: alunos.length,
    totalTurmas: turmas.length,
    totalAtivos: alunos.filter(a => a.situacao === 'Ativo').length,
    totalTransferidos: alunos.filter(a => a.situacao === 'Transferido').length,
    totalEvadidos: alunos.filter(a => a.situacao === 'Evadido').length,
    totalComDeficiencia: alunos.filter(a => a.deficiencia && a.deficiencia.trim() !== '' && a.deficiencia.toLowerCase() !== 'não' && a.deficiencia.toLowerCase() !== 'nenhuma').length,
    mediaPorTurma: turmas.length > 0 ? Math.round(alunos.length / turmas.length) : 0,
  };

  // Buscar alunos
  const buscarAlunos = useCallback((termo: string, filtroTurma?: string, filtroSituacao?: SituacaoAluno) => {
    return alunos.filter(a => {
      const matchTermo = !termo || 
        a.nome.toLowerCase().includes(termo.toLowerCase()) ||
        a.ra.includes(termo) ||
        a.rm.includes(termo);
      
      const matchTurma = !filtroTurma || a.turma === filtroTurma;
      const matchSituacao = !filtroSituacao || a.situacao === filtroSituacao;
      
      return matchTermo && matchTurma && matchSituacao;
    });
  }, [alunos]);

  // Obter alunos com deficiência (para AEE)
  const alunosAEE = alunos.filter(a => 
    a.deficiencia && 
    a.deficiencia.trim() !== '' && 
    a.deficiencia.toLowerCase() !== 'não' && 
    a.deficiencia.toLowerCase() !== 'nenhuma' &&
    a.situacao === 'Ativo'
  );

  return {
    alunos,
    turmas,
    anos,
    turmasResumo,
    estatisticas,
    alunosAEE,
    loading,
    importarPlanilha,
    adicionarAluno,
    atualizarAluno,
    removerAluno,
    limparAlunos,
    buscarAlunos,
    restaurarAlunos,
  };
}
