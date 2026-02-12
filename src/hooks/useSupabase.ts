import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Atribuicao } from '../types';

// Hook para sincronizar atribuições com Supabase
export function useSupabaseAtribuicoes() {
  const [atribuicoes, setAtribuicoes] = useState<Atribuicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');

  // Carregar atribuições do Supabase
  const carregarAtribuicoes = useCallback(async () => {
    try {
      setLoading(true);
      setSyncStatus('syncing');
      
      const { data, error } = await supabase
        .from('atribuicoes')
        .select('*')
        .order('docente');

      if (error) throw error;

      const atribuicoesFormatadas: Atribuicao[] = (data || []).map((item) => ({
        id: item.id,
        docente: item.docente,
        turma: item.turma,
        disciplina: item.disciplina,
        aulas: item.aulas
      }));

      setAtribuicoes(atribuicoesFormatadas);
      setSyncStatus('synced');
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar atribuições:', err);
      setError('Erro ao carregar dados do servidor');
      setSyncStatus('error');
      
      // Fallback para localStorage
      const localData = localStorage.getItem('atribuicoes');
      if (localData) {
        setAtribuicoes(JSON.parse(localData));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Salvar atribuições no Supabase
  const salvarAtribuicoes = useCallback(async (novasAtribuicoes: Atribuicao[]) => {
    try {
      setSyncStatus('syncing');

      // Limpar tabela e inserir novos dados
      await supabase.from('atribuicoes').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      if (novasAtribuicoes.length > 0) {
        const dadosParaInserir = novasAtribuicoes.map(a => ({
          docente: a.docente,
          turma: a.turma,
          disciplina: a.disciplina,
          aulas: a.aulas
        }));

        const { error } = await supabase.from('atribuicoes').insert(dadosParaInserir);
        if (error) throw error;
      }

      setAtribuicoes(novasAtribuicoes);
      setSyncStatus('synced');
      
      // Backup local
      localStorage.setItem('atribuicoes', JSON.stringify(novasAtribuicoes));
    } catch (err) {
      console.error('Erro ao salvar atribuições:', err);
      setSyncStatus('error');
      
      // Salvar localmente em caso de erro
      localStorage.setItem('atribuicoes', JSON.stringify(novasAtribuicoes));
      setAtribuicoes(novasAtribuicoes);
    }
  }, []);

  // Adicionar atribuição
  const adicionarAtribuicao = useCallback(async (atribuicao: Omit<Atribuicao, 'id'>) => {
    try {
      setSyncStatus('syncing');
      
      const { data, error } = await supabase
        .from('atribuicoes')
        .insert([atribuicao])
        .select()
        .single();

      if (error) throw error;

      const novaAtribuicao: Atribuicao = {
        id: data.id,
        docente: data.docente,
        turma: data.turma,
        disciplina: data.disciplina,
        aulas: data.aulas
      };

      setAtribuicoes(prev => [...prev, novaAtribuicao]);
      setSyncStatus('synced');
      
      return novaAtribuicao;
    } catch (err) {
      console.error('Erro ao adicionar atribuição:', err);
      setSyncStatus('error');
      throw err;
    }
  }, []);

  // Atualizar atribuição
  const atualizarAtribuicao = useCallback(async (id: string, dados: Partial<Atribuicao>) => {
    try {
      setSyncStatus('syncing');
      
      const { error } = await supabase
        .from('atribuicoes')
        .update(dados)
        .eq('id', id);

      if (error) throw error;

      setAtribuicoes(prev => prev.map(a => a.id === id ? { ...a, ...dados } : a));
      setSyncStatus('synced');
    } catch (err) {
      console.error('Erro ao atualizar atribuição:', err);
      setSyncStatus('error');
      throw err;
    }
  }, []);

  // Remover atribuição
  const removerAtribuicao = useCallback(async (id: string) => {
    try {
      setSyncStatus('syncing');
      
      const { error } = await supabase
        .from('atribuicoes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAtribuicoes(prev => prev.filter(a => a.id !== id));
      setSyncStatus('synced');
    } catch (err) {
      console.error('Erro ao remover atribuição:', err);
      setSyncStatus('error');
      throw err;
    }
  }, []);

  useEffect(() => {
    carregarAtribuicoes();
  }, [carregarAtribuicoes]);

  return {
    atribuicoes,
    loading,
    error,
    syncStatus,
    carregarAtribuicoes,
    salvarAtribuicoes,
    adicionarAtribuicao,
    atualizarAtribuicao,
    removerAtribuicao
  };
}

// Hook para verificar conexão com Supabase
export function useSupabaseStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('escola').select('id').limit(1);
        setIsConnected(!error);
      } catch {
        setIsConnected(false);
      } finally {
        setChecking(false);
      }
    };

    checkConnection();
  }, []);

  return { isConnected, checking };
}
