import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Escola, CadastroDocente, Aluno, Servidor, Atribuicao, AreaConhecimento, Bloqueio, GradeHorario, Projeto } from '../types';

// ===========================================
// HOOK SIMPLIFICADO PARA BANCO DE DADOS
// ===========================================

export interface DadosCompletos {
  escola: Escola | null;
  docentes: CadastroDocente[];
  alunos: Aluno[];
  servidores: Servidor[];
  atribuicoes: Atribuicao[];
  areas: AreaConhecimento[];
  bloqueios: Bloqueio[];
  horarios: GradeHorario[];
  projetos: Projeto[];
}

export function useDatabase() {
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ultimoSave, setUltimoSave] = useState<Date | null>(null);

  // ===========================================
  // FUNÇÃO PARA SALVAR TODOS OS DADOS
  // ===========================================
  const salvarTudo = useCallback(async (dados: DadosCompletos): Promise<boolean> => {
    setSalvando(true);
    setErro(null);
    
    console.log('💾 Iniciando salvamento...');
    console.log('📦 Dados a salvar:', dados);

    try {
      // Salvar ESCOLA
      console.log('1️⃣ Salvando escola...');
      const { error: erroEscola } = await supabase
        .from('escola')
        .update({ dados: dados.escola || {} })
        .eq('id', 1);
      
      if (erroEscola) {
        console.error('❌ Erro ao salvar escola:', erroEscola);
        throw new Error('Erro ao salvar escola: ' + erroEscola.message);
      }
      console.log('✅ Escola salva!');

      // Salvar DOCENTES
      console.log('2️⃣ Salvando docentes...');
      const { error: erroDocentes } = await supabase
        .from('docentes')
        .update({ dados: dados.docentes || [] })
        .eq('id', 1);
      
      if (erroDocentes) {
        console.error('❌ Erro ao salvar docentes:', erroDocentes);
        throw new Error('Erro ao salvar docentes: ' + erroDocentes.message);
      }
      console.log('✅ Docentes salvos!');

      // Salvar ALUNOS
      console.log('3️⃣ Salvando alunos...');
      const { error: erroAlunos } = await supabase
        .from('alunos')
        .update({ dados: dados.alunos || [] })
        .eq('id', 1);
      
      if (erroAlunos) {
        console.error('❌ Erro ao salvar alunos:', erroAlunos);
        throw new Error('Erro ao salvar alunos: ' + erroAlunos.message);
      }
      console.log('✅ Alunos salvos!');

      // Salvar SERVIDORES
      console.log('4️⃣ Salvando servidores...');
      const { error: erroServidores } = await supabase
        .from('servidores')
        .update({ dados: dados.servidores || [] })
        .eq('id', 1);
      
      if (erroServidores) {
        console.error('❌ Erro ao salvar servidores:', erroServidores);
        throw new Error('Erro ao salvar servidores: ' + erroServidores.message);
      }
      console.log('✅ Servidores salvos!');

      // Salvar ATRIBUIÇÕES
      console.log('5️⃣ Salvando atribuições...');
      const { error: erroAtribuicoes } = await supabase
        .from('atribuicoes')
        .update({ dados: dados.atribuicoes || [] })
        .eq('id', 1);
      
      if (erroAtribuicoes) {
        console.error('❌ Erro ao salvar atribuições:', erroAtribuicoes);
        throw new Error('Erro ao salvar atribuições: ' + erroAtribuicoes.message);
      }
      console.log('✅ Atribuições salvas!');

      // Salvar ÁREAS DE CONHECIMENTO
      console.log('6️⃣ Salvando áreas de conhecimento...');
      const { error: erroAreas } = await supabase
        .from('areas_conhecimento')
        .update({ dados: dados.areas || [] })
        .eq('id', 1);
      
      if (erroAreas) {
        console.error('❌ Erro ao salvar áreas:', erroAreas);
        throw new Error('Erro ao salvar áreas: ' + erroAreas.message);
      }
      console.log('✅ Áreas salvas!');

      // Salvar BLOQUEIOS
      console.log('7️⃣ Salvando bloqueios...');
      const { error: erroBloqueios } = await supabase
        .from('bloqueios')
        .update({ dados: dados.bloqueios || [] })
        .eq('id', 1);
      
      if (erroBloqueios) {
        console.error('❌ Erro ao salvar bloqueios:', erroBloqueios);
        throw new Error('Erro ao salvar bloqueios: ' + erroBloqueios.message);
      }
      console.log('✅ Bloqueios salvos!');

      // Salvar HORÁRIOS
      console.log('8️⃣ Salvando horários...');
      const { error: erroHorarios } = await supabase
        .from('horarios')
        .update({ dados: dados.horarios || [] })
        .eq('id', 1);
      
      if (erroHorarios) {
        console.error('❌ Erro ao salvar horários:', erroHorarios);
        throw new Error('Erro ao salvar horários: ' + erroHorarios.message);
      }
      console.log('✅ Horários salvos!');

      // Salvar PROJETOS
      console.log('9️⃣ Salvando projetos...');
      const { error: erroProjetos } = await supabase
        .from('projetos')
        .update({ dados: dados.projetos || [] })
        .eq('id', 1);
      
      if (erroProjetos) {
        console.error('❌ Erro ao salvar projetos:', erroProjetos);
        throw new Error('Erro ao salvar projetos: ' + erroProjetos.message);
      }
      console.log('✅ Projetos salvos!');

      // SUCESSO!
      setUltimoSave(new Date());
      console.log('🎉 TUDO SALVO COM SUCESSO!');
      return true;

    } catch (error: any) {
      console.error('❌ ERRO AO SALVAR:', error);
      setErro(error.message || 'Erro desconhecido');
      return false;
    } finally {
      setSalvando(false);
    }
  }, []);

  // ===========================================
  // FUNÇÃO PARA CARREGAR TODOS OS DADOS
  // ===========================================
  const carregarTudo = useCallback(async (): Promise<DadosCompletos | null> => {
    setCarregando(true);
    setErro(null);
    
    console.log('📥 Iniciando carregamento...');

    try {
      // Carregar ESCOLA
      console.log('1️⃣ Carregando escola...');
      const { data: escolaData, error: erroEscola } = await supabase
        .from('escola')
        .select('dados')
        .eq('id', 1)
        .single();
      
      if (erroEscola) {
        console.error('❌ Erro ao carregar escola:', erroEscola);
      }
      console.log('✅ Escola carregada:', escolaData?.dados);

      // Carregar DOCENTES
      console.log('2️⃣ Carregando docentes...');
      const { data: docentesData, error: erroDocentes } = await supabase
        .from('docentes')
        .select('dados')
        .eq('id', 1)
        .single();
      
      if (erroDocentes) {
        console.error('❌ Erro ao carregar docentes:', erroDocentes);
      }
      console.log('✅ Docentes carregados:', docentesData?.dados);

      // Carregar ALUNOS
      console.log('3️⃣ Carregando alunos...');
      const { data: alunosData, error: erroAlunos } = await supabase
        .from('alunos')
        .select('dados')
        .eq('id', 1)
        .single();
      
      if (erroAlunos) {
        console.error('❌ Erro ao carregar alunos:', erroAlunos);
      }
      console.log('✅ Alunos carregados:', alunosData?.dados);

      // Carregar SERVIDORES
      console.log('4️⃣ Carregando servidores...');
      const { data: servidoresData, error: erroServidores } = await supabase
        .from('servidores')
        .select('dados')
        .eq('id', 1)
        .single();
      
      if (erroServidores) {
        console.error('❌ Erro ao carregar servidores:', erroServidores);
      }
      console.log('✅ Servidores carregados:', servidoresData?.dados);

      // Carregar ATRIBUIÇÕES
      console.log('5️⃣ Carregando atribuições...');
      const { data: atribuicoesData, error: erroAtribuicoes } = await supabase
        .from('atribuicoes')
        .select('dados')
        .eq('id', 1)
        .single();
      
      if (erroAtribuicoes) {
        console.error('❌ Erro ao carregar atribuições:', erroAtribuicoes);
      }
      console.log('✅ Atribuições carregadas:', atribuicoesData?.dados);

      // Carregar ÁREAS DE CONHECIMENTO
      console.log('6️⃣ Carregando áreas...');
      const { data: areasData, error: erroAreas } = await supabase
        .from('areas_conhecimento')
        .select('dados')
        .eq('id', 1)
        .single();
      
      if (erroAreas) {
        console.error('❌ Erro ao carregar áreas:', erroAreas);
      }
      console.log('✅ Áreas carregadas:', areasData?.dados);

      // Carregar BLOQUEIOS
      console.log('7️⃣ Carregando bloqueios...');
      const { data: bloqueiosData, error: erroBloqueios } = await supabase
        .from('bloqueios')
        .select('dados')
        .eq('id', 1)
        .single();
      
      if (erroBloqueios) {
        console.error('❌ Erro ao carregar bloqueios:', erroBloqueios);
      }
      console.log('✅ Bloqueios carregados:', bloqueiosData?.dados);

      // Carregar HORÁRIOS
      console.log('8️⃣ Carregando horários...');
      const { data: horariosData, error: erroHorarios } = await supabase
        .from('horarios')
        .select('dados')
        .eq('id', 1)
        .single();
      
      if (erroHorarios) {
        console.error('❌ Erro ao carregar horários:', erroHorarios);
      }
      console.log('✅ Horários carregados:', horariosData?.dados);

      // Carregar PROJETOS
      console.log('9️⃣ Carregando projetos...');
      const { data: projetosData, error: erroProjetos } = await supabase
        .from('projetos')
        .select('dados')
        .eq('id', 1)
        .single();
      
      if (erroProjetos) {
        console.error('❌ Erro ao carregar projetos:', erroProjetos);
      }
      console.log('✅ Projetos carregados:', projetosData?.dados);

      // Montar objeto com todos os dados
      const dados: DadosCompletos = {
        escola: escolaData?.dados || null,
        docentes: docentesData?.dados || [],
        alunos: alunosData?.dados || [],
        servidores: servidoresData?.dados || [],
        atribuicoes: atribuicoesData?.dados || [],
        areas: areasData?.dados || [],
        bloqueios: bloqueiosData?.dados || [],
        horarios: horariosData?.dados || [],
        projetos: projetosData?.dados || [],
      };

      console.log('🎉 TUDO CARREGADO COM SUCESSO!');
      console.log('📦 Dados completos:', dados);
      
      return dados;

    } catch (error: any) {
      console.error('❌ ERRO AO CARREGAR:', error);
      setErro(error.message || 'Erro desconhecido');
      return null;
    } finally {
      setCarregando(false);
    }
  }, []);

  return {
    salvarTudo,
    carregarTudo,
    salvando,
    carregando,
    erro,
    ultimoSave
  };
}
