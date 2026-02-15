import { useState, useEffect, useCallback } from 'react';
import { Servidor, CargoServidor, SetorServidor, VinculoServidor, SituacaoServidor } from '../types';

const STORAGE_KEY = 'gestao-escolar-servidores';

const cargoLabels: Record<CargoServidor, string> = {
  diretor: 'Diretor(a)',
  vice_diretor: 'Vice-Diretor(a)',
  coordenador: 'Coordenador(a)',
  secretario: 'Secretário(a)',
  agente_organizacao: 'Agente de Organização Escolar',
  inspetor: 'Inspetor(a) de Alunos',
  merendeira: 'Merendeira',
  zelador: 'Zelador(a)',
  porteiro: 'Porteiro(a)',
  auxiliar_servicos: 'Auxiliar de Serviços Gerais',
  auxiliar_administrativo: 'Auxiliar Administrativo',
  bibliotecario: 'Bibliotecário(a)',
  tecnico_informatica: 'Técnico(a) de Informática',
  cuidador: 'Cuidador(a)',
  interprete_libras: 'Intérprete de Libras',
  outro: 'Outro'
};

const setorLabels: Record<SetorServidor, string> = {
  direcao: 'Direção',
  secretaria: 'Secretaria',
  coordenacao: 'Coordenação',
  biblioteca: 'Biblioteca',
  informatica: 'Informática',
  cozinha: 'Cozinha',
  limpeza: 'Limpeza',
  portaria: 'Portaria',
  aee: 'AEE',
  outro: 'Outro'
};

const vinculoLabels: Record<VinculoServidor, string> = {
  efetivo: 'Efetivo',
  contratado: 'Contratado',
  temporario: 'Temporário',
  terceirizado: 'Terceirizado',
  estagiario: 'Estagiário'
};

const situacaoLabels: Record<SituacaoServidor, string> = {
  ativo: 'Ativo',
  afastado: 'Afastado',
  licenca: 'Em Licença',
  ferias: 'Em Férias',
  desligado: 'Desligado'
};

export const useServidores = () => {
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar dados do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setServidores(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Erro ao carregar servidores:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Salvar no localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(servidores));
    }
  }, [servidores, loading]);

  // Função para gerar UUID válido
  const gerarUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Adicionar servidor
  const adicionarServidor = useCallback((servidor: Omit<Servidor, 'id' | 'dataCadastro' | 'dataAtualizacao'>) => {
    const novoServidor: Servidor = {
      ...servidor,
      id: gerarUUID(),
      dataCadastro: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString()
    };
    setServidores(prev => [...prev, novoServidor]);
    return novoServidor;
  }, []);

  // Atualizar servidor
  const atualizarServidor = useCallback((id: string, dados: Partial<Servidor>) => {
    setServidores(prev =>
      prev.map(s =>
        s.id === id
          ? { ...s, ...dados, dataAtualizacao: new Date().toISOString() }
          : s
      )
    );
  }, []);

  // Remover servidor
  const removerServidor = useCallback((id: string) => {
    setServidores(prev => prev.filter(s => s.id !== id));
  }, []);

  // Buscar servidor por ID
  const buscarServidor = useCallback((id: string) => {
    return servidores.find(s => s.id === id);
  }, [servidores]);

  // Filtrar servidores
  const filtrarServidores = useCallback((
    filtros: {
      busca?: string;
      cargo?: CargoServidor;
      setor?: SetorServidor;
      vinculo?: VinculoServidor;
      situacao?: SituacaoServidor;
      turno?: string;
    }
  ) => {
    return servidores.filter(s => {
      // Busca por nome, email ou matrícula
      if (filtros.busca) {
        const termo = filtros.busca.toLowerCase();
        const match = 
          s.nome.toLowerCase().includes(termo) ||
          (s.email && s.email.toLowerCase().includes(termo)) ||
          (s.matricula && s.matricula.toLowerCase().includes(termo));
        if (!match) return false;
      }
      
      if (filtros.cargo && s.cargo !== filtros.cargo) return false;
      if (filtros.setor && s.setor !== filtros.setor) return false;
      if (filtros.vinculo && s.vinculo !== filtros.vinculo) return false;
      if (filtros.situacao && s.situacao !== filtros.situacao) return false;
      if (filtros.turno && s.turno !== filtros.turno) return false;
      
      return true;
    });
  }, [servidores]);

  // Estatísticas
  const estatisticas = {
    total: servidores.length,
    ativos: servidores.filter(s => s.situacao === 'ativo').length,
    afastados: servidores.filter(s => s.situacao === 'afastado' || s.situacao === 'licenca' || s.situacao === 'ferias').length,
    desligados: servidores.filter(s => s.situacao === 'desligado').length,
    porCargo: Object.entries(cargoLabels).map(([cargo, label]) => ({
      cargo,
      label,
      quantidade: servidores.filter(s => s.cargo === cargo).length
    })).filter(c => c.quantidade > 0),
    porSetor: Object.entries(setorLabels).map(([setor, label]) => ({
      setor,
      label,
      quantidade: servidores.filter(s => s.setor === setor).length
    })).filter(s => s.quantidade > 0),
    porVinculo: Object.entries(vinculoLabels).map(([vinculo, label]) => ({
      vinculo,
      label,
      quantidade: servidores.filter(s => s.vinculo === vinculo).length
    })).filter(v => v.quantidade > 0)
  };

  // Importar servidores de planilha
  const importarServidores = useCallback((novosServidores: Omit<Servidor, 'id' | 'dataCadastro' | 'dataAtualizacao'>[]) => {
    const servidoresComId = novosServidores.map(s => ({
      ...s,
      id: gerarUUID(),
      dataCadastro: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString()
    }));
    setServidores(prev => [...prev, ...servidoresComId]);
    return servidoresComId.length;
  }, []);

  // Limpar duplicados
  const limparDuplicados = useCallback(() => {
    const nomesVistos = new Set<string>();
    const servidoresUnicos: Servidor[] = [];
    
    for (const servidor of servidores) {
      const nomeNormalizado = servidor.nome.toLowerCase().trim();
      if (!nomesVistos.has(nomeNormalizado)) {
        nomesVistos.add(nomeNormalizado);
        servidoresUnicos.push(servidor);
      }
    }
    
    const removidos = servidores.length - servidoresUnicos.length;
    if (removidos > 0) {
      setServidores(servidoresUnicos);
    }
    return removidos;
  }, [servidores]);

  // Restaurar servidores (para backup)
  const restaurarServidores = useCallback((dados: Servidor[]) => {
    setServidores(dados);
  }, []);

  return {
    servidores,
    loading,
    adicionarServidor,
    atualizarServidor,
    removerServidor,
    buscarServidor,
    filtrarServidores,
    estatisticas,
    importarServidores,
    limparDuplicados,
    restaurarServidores,
    cargoLabels,
    setorLabels,
    vinculoLabels,
    situacaoLabels
  };
};
