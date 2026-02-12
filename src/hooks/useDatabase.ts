import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Escola, 
  CadastroDocente, 
  Aluno, 
  Servidor,
  AreaConhecimento,
  BloqueioArea,
  Atribuicao,
  Bloqueio,
  GradeHorario,
  ProjetoEscolar,
  TurmaProjeto,
  AtribuicaoProjeto
} from '../types';

// Função para gerar UUID válido
const gerarUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Função para validar se é UUID
const isValidUUID = (id: string | undefined): boolean => {
  if (!id) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// Função para garantir que o ID seja um UUID válido
const ensureValidUUID = (id: string | undefined): string => {
  if (!id || !isValidUUID(id)) {
    return gerarUUID();
  }
  return id;
};

interface DatabaseState {
  escola: Escola | null;
  projetos: ProjetoEscolar[];
  turmasProjetos: TurmaProjeto[];
  atribuicoesProjetos: AtribuicaoProjeto[];
  docentes: CadastroDocente[];
  alunos: Aluno[];
  servidores: Servidor[];
  areasConhecimento: AreaConhecimento[];
  bloqueiosArea: BloqueioArea[];
  atribuicoes: Atribuicao[];
  bloqueios: Bloqueio[];
  horarios: GradeHorario[];
}

interface SaveStatus {
  saving: boolean;
  lastSaved: Date | null;
  error: string | null;
  hasChanges: boolean;
}

const initialState: DatabaseState = {
  escola: null,
  projetos: [],
  turmasProjetos: [],
  atribuicoesProjetos: [],
  docentes: [],
  alunos: [],
  servidores: [],
  areasConhecimento: [],
  bloqueiosArea: [],
  atribuicoes: [],
  bloqueios: [],
  horarios: [],
};

export function useDatabase() {
  const [data, setData] = useState<DatabaseState>(initialState);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({
    saving: false,
    lastSaved: null,
    error: null,
    hasChanges: false,
  });

  // Carregar todos os dados do banco
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Carregar escola
      const { data: escolaData } = await supabase
        .from('escola')
        .select('*')
        .limit(1)
        .single();

      // Carregar projetos
      const { data: projetosData } = await supabase
        .from('projetos')
        .select('*');

      // Carregar turmas dos projetos
      const { data: turmasProjetosData } = await supabase
        .from('projeto_turmas')
        .select('*');

      // Carregar atribuições dos projetos
      const { data: atribuicoesProjetosData } = await supabase
        .from('projeto_atribuicoes')
        .select('*');

      // Carregar docentes
      const { data: docentesData } = await supabase
        .from('docentes')
        .select('*');

      // Carregar alunos
      const { data: alunosData } = await supabase
        .from('alunos')
        .select('*');

      // Carregar servidores
      const { data: servidoresData } = await supabase
        .from('servidores')
        .select('*');

      // Carregar áreas de conhecimento
      const { data: areasData } = await supabase
        .from('areas_conhecimento')
        .select('*');

      // Carregar bloqueios de área
      const { data: bloqueiosAreaData } = await supabase
        .from('bloqueios_area')
        .select('*');

      // Carregar atribuições
      const { data: atribuicoesData } = await supabase
        .from('atribuicoes')
        .select('*');

      // Carregar bloqueios
      const { data: bloqueiosData } = await supabase
        .from('bloqueios')
        .select('*');

      // Carregar horários
      const { data: horariosData } = await supabase
        .from('horarios')
        .select('*');

      setData({
        escola: escolaData || null,
        projetos: projetosData || [],
        turmasProjetos: turmasProjetosData || [],
        atribuicoesProjetos: atribuicoesProjetosData || [],
        docentes: docentesData || [],
        alunos: alunosData || [],
        servidores: servidoresData || [],
        areasConhecimento: areasData || [],
        bloqueiosArea: bloqueiosAreaData || [],
        atribuicoes: atribuicoesData || [],
        bloqueios: bloqueiosData || [],
        horarios: horariosData || [],
      });

      setSaveStatus(prev => ({ ...prev, hasChanges: false }));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Marcar que há alterações pendentes
  const markAsChanged = useCallback(() => {
    setSaveStatus(prev => ({ ...prev, hasChanges: true }));
  }, []);

  // Atualizar dados locais (sem salvar no banco)
  const updateLocal = useCallback(<K extends keyof DatabaseState>(
    key: K,
    value: DatabaseState[K]
  ) => {
    setData(prev => ({ ...prev, [key]: value }));
    markAsChanged();
  }, [markAsChanged]);

  // Salvar TODOS os dados no banco
  const saveAll = useCallback(async () => {
    setSaveStatus(prev => ({ ...prev, saving: true, error: null }));

    try {
      // Salvar escola
      if (data.escola) {
        const escolaData = {
          id: data.escola.id || crypto.randomUUID(),
          nome: data.escola.nome || '',
          cnpj: data.escola.cnpj || '',
          codigo_inep: data.escola.codigoInep || '',
          email: data.escola.email || '',
          telefone: data.escola.telefone || '',
          endereco_logradouro: data.escola.endereco?.logradouro || '',
          endereco_numero: data.escola.endereco?.numero || '',
          endereco_complemento: data.escola.endereco?.complemento || '',
          endereco_bairro: data.escola.endereco?.bairro || '',
          endereco_cidade: data.escola.endereco?.cidade || '',
          endereco_estado: data.escola.endereco?.uf || '',
          endereco_cep: data.escola.endereco?.cep || '',
          tipos_ensino: data.escola.tiposEnsino || [],
          anos_series: data.escola.anosSeries || [],
          turnos: data.escola.turnos || [],
          aee_possui_sala_recursos: data.escola.aee?.salaRecursos || false,
          aee_quantidade_alunos: data.escola.aee?.salaRecursosQuantidade || 0,
          aee_deficiencias_atendidas: data.escola.aee?.deficienciasAtendidas || [],
          aee_profissionais: data.escola.aee?.profissionaisAEE || 0,
          infraestrutura_acessibilidade: data.escola.infraestrutura?.acessibilidade || {},
          infraestrutura_espacos: data.escola.infraestrutura?.espacos || {},
          projetos: data.escola.projetos || [],
          diretor: data.escola.diretor || '',
          vice_diretor: data.escola.viceDiretor || '',
          updated_at: new Date().toISOString(),
        };
        
        const { error } = await supabase
          .from('escola')
          .upsert(escolaData);
        if (error) throw error;
      }

      // Salvar projetos
      if (data.projetos.length > 0) {
        // Deletar projetos existentes e inserir novos
        await supabase.from('projetos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { error } = await supabase.from('projetos').insert(
          data.projetos.map(p => ({
            id: ensureValidUUID(p.id),
            nome: p.nome,
            descricao: p.descricao,
            categoria: p.categoria,
            origem: p.origem,
            ativo: p.ativo,
          }))
        );
        if (error) throw error;
      }

      // Salvar turmas dos projetos
      if (data.turmasProjetos.length > 0) {
        await supabase.from('projeto_turmas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { error } = await supabase.from('projeto_turmas').insert(
          data.turmasProjetos.map(t => ({
            id: ensureValidUUID(t.id),
            projeto_id: ensureValidUUID(t.projetoId),
            nome: t.nome,
            descricao: t.descricao,
            vagas: t.vagas,
          }))
        );
        if (error) throw error;
      }

      // Salvar atribuições dos projetos
      if (data.atribuicoesProjetos.length > 0) {
        await supabase.from('projeto_atribuicoes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { error } = await supabase.from('projeto_atribuicoes').insert(
          data.atribuicoesProjetos.map(a => ({
            id: ensureValidUUID(a.id),
            projeto_id: ensureValidUUID(a.projetoId),
            turma_id: ensureValidUUID(a.turmaId),
            docente_nome: a.docenteNome,
            aulas: a.aulas,
          }))
        );
        if (error) throw error;
      }

      // Salvar docentes
      if (data.docentes.length > 0) {
        await supabase.from('docentes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { error } = await supabase.from('docentes').insert(
          data.docentes.map(d => ({
            id: ensureValidUUID(d.id),
            nome: d.nome,
            foto: d.foto,
            cpf: d.cpf,
            rg: d.rg,
            data_nascimento: d.dataNascimento,
            sexo: d.sexo,
            estado_civil: d.estadoCivil,
            email: d.email,
            telefone: d.telefone,
            celular: d.celular,
            endereco: d.endereco,
            matricula: d.matricula,
            cargo: d.cargo,
            funcao: d.funcao,
            vinculo: d.vinculo,
            carga_horaria: d.cargaHoraria,
            data_admissao: d.dataAdmissao,
            formacao: d.formacao,
            formacao_complementar: d.formacoesComplementares,
            habilitacoes: d.habilitacoes,
            area_conhecimento: d.areaConhecimento,
            atua_aee: d.atuacaoAEE?.atuaNoAEE || false,
            deficiencias_aee: d.atuacaoAEE?.deficienciasAtendidas || [],
            projetos: d.projetosIds || [],
            observacoes: d.observacoes,
          }))
        );
        if (error) throw error;
      }

      // Salvar alunos
      if (data.alunos.length > 0) {
        await supabase.from('alunos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { error } = await supabase.from('alunos').insert(
          data.alunos.map(a => ({
            id: ensureValidUUID(a.id),
            ano: a.ano,
            rm: a.rm,
            numero_chamada: a.numeroChamada,
            nome: a.nome,
            ra: a.ra,
            dv_ra: a.dvRa,
            uf_ra: a.ufRa,
            data_nascimento: a.dataNascimento,
            situacao: a.situacao,
            deficiencia: a.deficiencia,
            endereco: a.endereco,
            turma: a.turma,
            foto: a.foto,
            email: a.email,
            telefone: a.telefone,
            nome_mae: a.nomeMae,
            nome_pai: a.nomePai,
            observacoes: a.observacoes,
          }))
        );
        if (error) throw error;
      }

      // Salvar servidores
      if (data.servidores.length > 0) {
        await supabase.from('servidores').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { error } = await supabase.from('servidores').insert(
          data.servidores.map(s => ({
            id: ensureValidUUID(s.id),
            nome: s.nome,
            foto: s.foto,
            cpf: s.cpf,
            rg: s.rg,
            data_nascimento: s.dataNascimento,
            sexo: s.sexo,
            estado_civil: s.estadoCivil,
            email: s.email,
            telefone: s.telefone,
            celular: s.celular,
            endereco: s.endereco,
            matricula: s.matricula,
            cargo: s.cargo,
            setor: s.setor,
            vinculo: s.vinculo,
            carga_horaria: s.cargaHoraria,
            turno: s.turno,
            data_admissao: s.dataAdmissao,
            formacao: s.formacao,
            observacoes: s.observacoes,
          }))
        );
        if (error) throw error;
      }

      // Salvar áreas de conhecimento
      if (data.areasConhecimento.length > 0) {
        await supabase.from('areas_conhecimento').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { error } = await supabase.from('areas_conhecimento').insert(
          data.areasConhecimento.map(a => ({
            id: ensureValidUUID(a.id),
            nome: a.nome,
            docentes: a.docentes,
          }))
        );
        if (error) throw error;
      }

      // Salvar bloqueios de área
      if (data.bloqueiosArea.length > 0) {
        await supabase.from('bloqueios_area').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { error } = await supabase.from('bloqueios_area').insert(
          data.bloqueiosArea.map(b => ({
            id: ensureValidUUID(b.id),
            area_id: ensureValidUUID(b.areaId),
            dia: b.dia,
            aulas: b.aulas,
            motivo: b.motivo,
          }))
        );
        if (error) throw error;
      }

      // Salvar atribuições
      if (data.atribuicoes.length > 0) {
        await supabase.from('atribuicoes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { error } = await supabase.from('atribuicoes').insert(
          data.atribuicoes.map(a => ({
            id: ensureValidUUID(a.id),
            docente: a.docente,
            turma: a.turma,
            disciplina: a.disciplina,
            aulas: a.aulas,
          }))
        );
        if (error) throw error;
      }

      // Salvar bloqueios
      if (data.bloqueios.length > 0) {
        await supabase.from('bloqueios').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { error } = await supabase.from('bloqueios').insert(
          data.bloqueios.map(b => ({
            id: ensureValidUUID(b.id),
            tipo: b.tipo,
            dia: b.dia,
            aulas: b.aulas,
            entidade: b.entidade,
            motivo: b.motivo,
          }))
        );
        if (error) throw error;
      }

      // Salvar horários
      if (data.horarios.length > 0) {
        await supabase.from('horarios').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { error } = await supabase.from('horarios').insert(
          data.horarios.map(h => ({
            id: crypto.randomUUID(),
            turma: h.turma,
            slots: h.slots,
          }))
        );
        if (error) throw error;
      }

      setSaveStatus({
        saving: false,
        lastSaved: new Date(),
        error: null,
        hasChanges: false,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      setSaveStatus(prev => ({
        ...prev,
        saving: false,
        error: error.message || 'Erro ao salvar dados',
      }));
      return { success: false, error: error.message };
    }
  }, [data]);

  return {
    data,
    loading,
    saveStatus,
    loadData,
    updateLocal,
    saveAll,
    markAsChanged,
  };
}
