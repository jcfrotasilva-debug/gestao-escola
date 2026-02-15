import { useState, useCallback, useMemo } from 'react';
import {
  ConfiguracaoHorario,
  Bloqueio,
  GradeHorario,
  SlotHorario,
  DiaSemana,
  Atribuicao,
  AulaHorario,
  ConflitoDetalhado,
  AnaliseConflitos,
  SugestaoTroca,
} from '../types';

const STORAGE_KEY_CONFIG = 'horario-config';
const STORAGE_KEY_BLOQUEIOS = 'horario-bloqueios';
const STORAGE_KEY_GRADES = 'horario-grades';

const defaultConfig: ConfiguracaoHorario = {
  diasSemana: ['segunda', 'terca', 'quarta', 'quinta', 'sexta'],
  horarios: [
    { numero: 1, inicio: '07:00', fim: '07:50' },
    { numero: 2, inicio: '07:50', fim: '08:40' },
    { numero: 3, inicio: '08:40', fim: '09:30' },
    { numero: 4, inicio: '09:50', fim: '10:40' },
    { numero: 5, inicio: '10:40', fim: '11:30' },
    { numero: 6, inicio: '11:30', fim: '12:20' },
    { numero: 7, inicio: '13:20', fim: '14:10' },
    { numero: 8, inicio: '14:10', fim: '15:00' },
    { numero: 9, inicio: '15:00', fim: '15:50' },
  ],
  maxAulasPorDisciplinaPorDia: 2,
};

export function useHorario(
  atribuicoes: Atribuicao[],
  isDocenteBloqueadoPorArea?: (docente: string, dia: DiaSemana, aula: number) => boolean,
  getMotivoBloqueioArea?: (docente: string, dia: DiaSemana, aula: number) => string | undefined
) {
  const [config, setConfig] = useState<ConfiguracaoHorario>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_CONFIG);
    return stored ? JSON.parse(stored) : defaultConfig;
  });

  const [bloqueios, setBloqueios] = useState<Bloqueio[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_BLOQUEIOS);
    return stored ? JSON.parse(stored) : [];
  });

  const [grades, setGrades] = useState<GradeHorario[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_GRADES);
    return stored ? JSON.parse(stored) : [];
  });

  const [geracaoStatus, setGeracaoStatus] = useState<{
    gerando: boolean;
    sucesso: boolean | null;
    mensagem: string;
    conflitos: string[];
  }>({
    gerando: false,
    sucesso: null,
    mensagem: '',
    conflitos: [],
  });

  // Removido: opções de horário

  // Salvar configuração
  const saveConfig = useCallback((newConfig: ConfiguracaoHorario) => {
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(newConfig));
  }, []);

  // Salvar bloqueios
  const saveBloqueios = useCallback((newBloqueios: Bloqueio[]) => {
    setBloqueios(newBloqueios);
    localStorage.setItem(STORAGE_KEY_BLOQUEIOS, JSON.stringify(newBloqueios));
  }, []);

  // Salvar grades
  const saveGrades = useCallback((newGrades: GradeHorario[]) => {
    setGrades(newGrades);
    localStorage.setItem(STORAGE_KEY_GRADES, JSON.stringify(newGrades));
  }, []);

  // Adicionar bloqueio
  const addBloqueio = useCallback((bloqueio: Omit<Bloqueio, 'id'>) => {
    const newBloqueio: Bloqueio = {
      ...bloqueio,
      id: Date.now().toString(),
    };
    saveBloqueios([...bloqueios, newBloqueio]);
  }, [bloqueios, saveBloqueios]);

  // Remover bloqueio
  const removeBloqueio = useCallback((id: string) => {
    saveBloqueios(bloqueios.filter(b => b.id !== id));
  }, [bloqueios, saveBloqueios]);

  // Limpar grades
  const clearGrades = useCallback(() => {
    saveGrades([]);
    setGeracaoStatus({
      gerando: false,
      sucesso: null,
      mensagem: '',
      conflitos: [],
    });
  }, [saveGrades]);

  // Lista de turmas
  const turmas = useMemo(() => {
    return [...new Set(atribuicoes.map(a => a.turma))].sort();
  }, [atribuicoes]);

  // Lista de docentes
  const docentes = useMemo(() => {
    return [...new Set(atribuicoes.map(a => a.docente))].sort();
  }, [atribuicoes]);

  // Verificar se um slot está bloqueado por bloqueio geral
  const isSlotBloqueadoGeral = useCallback((dia: DiaSemana, aula: number): { bloqueado: boolean; motivo?: string } => {
    const bloqueio = bloqueios.find(
      b => b.tipo === 'geral' && b.dia === dia && b.aulas.includes(aula)
    );
    return bloqueio ? { bloqueado: true, motivo: bloqueio.motivo } : { bloqueado: false };
  }, [bloqueios]);

  // Verificar se um slot está bloqueado para uma turma (inclui bloqueio geral)
  const isSlotBloqueadoTurma = useCallback((turma: string, dia: DiaSemana, aula: number): { bloqueado: boolean; motivo?: string } => {
    // Primeiro verifica bloqueio geral
    const bloqueioGeral = isSlotBloqueadoGeral(dia, aula);
    if (bloqueioGeral.bloqueado) return bloqueioGeral;
    
    // Depois verifica bloqueio específico da turma
    const bloqueio = bloqueios.find(
      b => b.tipo === 'turma' && b.entidade === turma && b.dia === dia && b.aulas.includes(aula)
    );
    return bloqueio ? { bloqueado: true, motivo: bloqueio.motivo } : { bloqueado: false };
  }, [bloqueios, isSlotBloqueadoGeral]);

  // Verificar se um slot está bloqueado para um docente (inclui bloqueio geral e por área)
  const isSlotBloqueadoDocente = useCallback((docente: string, dia: DiaSemana, aula: number): { bloqueado: boolean; motivo?: string } => {
    // Primeiro verifica bloqueio geral
    const bloqueioGeral = isSlotBloqueadoGeral(dia, aula);
    if (bloqueioGeral.bloqueado) return bloqueioGeral;
    
    // Depois verifica bloqueio específico do docente
    const bloqueio = bloqueios.find(
      b => b.tipo === 'docente' && b.entidade === docente && b.dia === dia && b.aulas.includes(aula)
    );
    if (bloqueio) return { bloqueado: true, motivo: bloqueio.motivo };
    
    // Por fim, verifica bloqueio por área de conhecimento
    // Verifica se a função foi passada e se retorna true
    if (typeof isDocenteBloqueadoPorArea === 'function') {
      const estaBloqueado = isDocenteBloqueadoPorArea(docente, dia, aula);
      if (estaBloqueado) {
        const motivo = typeof getMotivoBloqueioArea === 'function' 
          ? getMotivoBloqueioArea(docente, dia, aula) 
          : 'ATPC por Área de Conhecimento';
        return { bloqueado: true, motivo: motivo || 'ATPC por Área de Conhecimento' };
      }
    }
    
    return { bloqueado: false };
  }, [bloqueios, isSlotBloqueadoGeral, isDocenteBloqueadoPorArea, getMotivoBloqueioArea]);

  // Verificar se é disciplina eletiva
  const isEletiva = (disciplina: string): boolean => {
    return disciplina.toUpperCase().includes('ELETIVA');
  };

  // Contar eletivas ignoradas para exibir aviso
  const eletivasIgnoradas = useMemo(() => {
    return atribuicoes.filter(a => isEletiva(a.disciplina));
  }, [atribuicoes]);

  // Gerar horário automático com ALGORITMO ULTRA AGRESSIVO DE RESOLUÇÃO DE CONFLITOS
  const gerarHorario = useCallback(() => {
    setGeracaoStatus({
      gerando: true,
      sucesso: null,
      mensagem: 'Gerando horário com algoritmo ULTRA AGRESSIVO...',
      conflitos: [],
    });

    try {
      const conflitos: string[] = [];
      
      // Mapa de ocupação de docentes: docente -> "dia-aula" -> turma
      const docenteOcupacao: Map<string, Map<string, string>> = new Map();
      
      // Criar grades para todas as turmas
      const novasGrades: GradeHorario[] = [];
      
      turmas.forEach(turma => {
        const novaGrade: GradeHorario = {
          turma,
          slots: []
        };
        
        config.diasSemana.forEach(dia => {
          config.horarios.forEach(horario => {
            const bloqueioInfo = isSlotBloqueadoTurma(turma, dia, horario.numero);
            novaGrade.slots.push({
              dia,
              aula: horario.numero,
              conteudo: null,
              bloqueado: bloqueioInfo.bloqueado,
              motivoBloqueio: bloqueioInfo.motivo,
            });
          });
        });
        
        novasGrades.push(novaGrade);
      });

      // Função para verificar se já tem 2 aulas consecutivas da mesma disciplina
      const temDuasAulasConsecutivas = (
        grade: GradeHorario, 
        dia: DiaSemana, 
        aula: number, 
        disciplina: string
      ): boolean => {
        // Verificar se ao adicionar aqui, criaria 3+ aulas consecutivas
        const slotAnterior = grade.slots.find(s => s.dia === dia && s.aula === aula - 1);
        const slotAnterior2 = grade.slots.find(s => s.dia === dia && s.aula === aula - 2);
        const slotPosterior = grade.slots.find(s => s.dia === dia && s.aula === aula + 1);
        const slotPosterior2 = grade.slots.find(s => s.dia === dia && s.aula === aula + 2);
        
        // Se já tem 2 aulas antes, não pode adicionar aqui
        if (slotAnterior?.conteudo?.disciplina === disciplina && 
            slotAnterior2?.conteudo?.disciplina === disciplina) return true;
        
        // Se já tem 2 aulas depois, não pode adicionar aqui
        if (slotPosterior?.conteudo?.disciplina === disciplina && 
            slotPosterior2?.conteudo?.disciplina === disciplina) return true;
        
        // Se tem 1 antes e 1 depois, não pode adicionar aqui (criaria 3 consecutivas)
        if (slotAnterior?.conteudo?.disciplina === disciplina && 
            slotPosterior?.conteudo?.disciplina === disciplina) return true;
        
        return false;
      };

      // NOVA FUNÇÃO: Verificar se já tem 2 aulas da mesma disciplina no mesmo dia
      const temDuasAulasNoDia = (
        grade: GradeHorario, 
        dia: DiaSemana, 
        disciplina: string
      ): boolean => {
        const aulasNoDia = grade.slots.filter(
          s => s.dia === dia && s.conteudo?.disciplina === disciplina
        ).length;
        return aulasNoDia >= 2;
      };

      // NOVA FUNÇÃO: Verificar se o mesmo docente já tem aula ADJACENTE nesta turma
      // (evita aulas seguidas do mesmo docente com disciplinas diferentes)
      const docenteTemAulaAdjacente = (
        grade: GradeHorario,
        dia: DiaSemana,
        aula: number,
        docente: string,
        disciplinaAtual: string
      ): boolean => {
        const slotAnterior = grade.slots.find(s => s.dia === dia && s.aula === aula - 1);
        const slotPosterior = grade.slots.find(s => s.dia === dia && s.aula === aula + 1);
        
        // Se o docente tem aula adjacente COM OUTRA DISCIPLINA, não pode
        if (slotAnterior?.conteudo?.docente === docente && 
            slotAnterior?.conteudo?.disciplina !== disciplinaAtual) {
          return true;
        }
        
        if (slotPosterior?.conteudo?.docente === docente && 
            slotPosterior?.conteudo?.disciplina !== disciplinaAtual) {
          return true;
        }
        
        return false;
      };

      // Função para verificar se um slot está disponível para um docente
      const isSlotDisponivelParaDocente = (
        grade: GradeHorario,
        dia: DiaSemana,
        aula: number,
        docente: string
      ): boolean => {
        const slot = grade.slots.find(s => s.dia === dia && s.aula === aula);
        if (!slot) return false;
        if (slot.conteudo !== null) return false;
        if (slot.bloqueado) return false;

        // Verificar se docente está bloqueado neste horário
        const bloqueioDocente = isSlotBloqueadoDocente(docente, dia, aula);
        if (bloqueioDocente.bloqueado) return false;

        // Verificar se docente já está ocupado em outra turma neste horário
        const chaveHorario = `${dia}-${aula}`;
        const docenteMap = docenteOcupacao.get(docente);
        if (docenteMap?.has(chaveHorario)) return false;

        return true;
      };

      // ==========================================
      // FASE 0: ALOCAR ELETIVAS PRIMEIRO (SEXTA 8ª E 9ª)
      // ==========================================
      novasGrades.forEach(grade => {
        // Buscar todas as eletivas desta turma
        const eletivasTurma = atribuicoes.filter(
          a => a.turma === grade.turma && isEletiva(a.disciplina)
        );

        if (eletivasTurma.length === 0) return;

        // Alocar TODAS as eletivas na sexta-feira, 8ª e 9ª aulas (bloco duplo)
        // Múltiplos docentes podem compartilhar o mesmo horário (duplas/trios)
        eletivasTurma.forEach(eletiva => {
          // Alocar na 8ª aula de sexta
          const slot8 = grade.slots.find(s => s.dia === 'sexta' && s.aula === 8);
          if (slot8 && !slot8.bloqueado) {
            // Para eletivas, permitimos múltiplos docentes no mesmo slot
            // Se já tem conteúdo, adicionamos o docente ao nome
            if (slot8.conteudo === null) {
              slot8.conteudo = {
                turma: grade.turma,
                disciplina: eletiva.disciplina,
                docente: eletiva.docente,
              };
            } else if (isEletiva(slot8.conteudo.disciplina)) {
              // Adiciona o docente ao slot existente (trabalho em dupla)
              slot8.conteudo = {
                ...slot8.conteudo,
                docente: slot8.conteudo.docente + ' / ' + eletiva.docente,
              };
            }
            
            // Marcar docente como ocupado
            const chaveHorario8 = 'sexta-8';
            if (!docenteOcupacao.has(eletiva.docente)) {
              docenteOcupacao.set(eletiva.docente, new Map());
            }
            docenteOcupacao.get(eletiva.docente)!.set(chaveHorario8, grade.turma);
          }

          // Alocar na 9ª aula de sexta
          const slot9 = grade.slots.find(s => s.dia === 'sexta' && s.aula === 9);
          if (slot9 && !slot9.bloqueado) {
            if (slot9.conteudo === null) {
              slot9.conteudo = {
                turma: grade.turma,
                disciplina: eletiva.disciplina,
                docente: eletiva.docente,
              };
            } else if (isEletiva(slot9.conteudo.disciplina)) {
              // Adiciona o docente ao slot existente (trabalho em dupla)
              slot9.conteudo = {
                ...slot9.conteudo,
                docente: slot9.conteudo.docente + ' / ' + eletiva.docente,
              };
            }
            
            // Marcar docente como ocupado
            const chaveHorario9 = 'sexta-9';
            if (!docenteOcupacao.has(eletiva.docente)) {
              docenteOcupacao.set(eletiva.docente, new Map());
            }
            docenteOcupacao.get(eletiva.docente)!.set(chaveHorario9, grade.turma);
          }
        });
      });

      // Função auxiliar para alocar uma aula
      const alocarAula = (
        grade: GradeHorario,
        dia: DiaSemana,
        aula: number,
        docente: string,
        disciplina: string
      ) => {
        const slot = grade.slots.find(s => s.dia === dia && s.aula === aula);
        if (!slot) return false;
        
        slot.conteudo = {
          turma: grade.turma,
          disciplina,
          docente,
        };

        const chaveHorario = `${dia}-${aula}`;
        if (!docenteOcupacao.has(docente)) {
          docenteOcupacao.set(docente, new Map());
        }
        docenteOcupacao.get(docente)!.set(chaveHorario, grade.turma);
        return true;
      };

      // ==========================================
      // ALGORITMO INTELIGENTE DE RESOLUÇÃO
      // ==========================================

      // ====== PRÉ-ANÁLISE: Calcular dificuldade de cada atribuição ======
      interface AtribuicaoComDificuldade {
        docente: string;
        disciplina: string;
        turma: string;
        quantidade: number;
        alocadas: number;
        dificuldade: number; // quanto maior, mais difícil de alocar
      }

      const todasAtribuicoes: AtribuicaoComDificuldade[] = [];

      atribuicoes.forEach(attr => {
        // Pular eletivas - já foram alocadas
        if (isEletiva(attr.disciplina)) return;

        // Calcular dificuldade baseada em:
        // 1. Quantos slots o docente tem bloqueados
        // 2. Quantas turmas o docente leciona
        // 3. Total de aulas do docente
        
        let slotsBloqueadosDocente = 0;
        config.diasSemana.forEach(dia => {
          config.horarios.forEach(horario => {
            const bloqueio = isSlotBloqueadoDocente(attr.docente, dia, horario.numero);
            if (bloqueio.bloqueado) slotsBloqueadosDocente++;
          });
        });

        const turmasDocente = atribuicoes.filter(a => a.docente === attr.docente).length;
        const totalAulasDocente = atribuicoes
          .filter(a => a.docente === attr.docente)
          .reduce((acc, a) => acc + a.aulas, 0);

        // Dificuldade = bloqueios + turmas + aulas (quanto mais, mais difícil)
        const dificuldade = slotsBloqueadosDocente * 2 + turmasDocente * 3 + totalAulasDocente;

        todasAtribuicoes.push({
          docente: attr.docente,
          disciplina: attr.disciplina,
          turma: attr.turma,
          quantidade: attr.aulas,
          alocadas: 0,
          dificuldade,
        });
      });

      // Ordenar por dificuldade (mais difíceis primeiro!)
      todasAtribuicoes.sort((a, b) => b.dificuldade - a.dificuldade);

      // ====== FASE 1: Alocar DUPLAS primeiro (mais difíceis primeiro) ======
      todasAtribuicoes.forEach(attrInfo => {
        const grade = novasGrades.find(g => g.turma === attrInfo.turma);
        if (!grade) return;

        const numDuplas = Math.floor(attrInfo.quantidade / 2);
        let duplasAlocadas = 0;

        // Tentar alocar duplas em cada dia
        for (const dia of config.diasSemana) {
          if (duplasAlocadas >= numDuplas) break;

          // Verificar se já tem 2 aulas desta disciplina neste dia (máximo!)
          if (temDuasAulasNoDia(grade, dia, attrInfo.disciplina)) continue;

          // Verificar se já tem alguma aula desta disciplina neste dia (para dupla, precisa estar vazio)
          const jaTemNoDia = grade.slots.some(
            s => s.dia === dia && s.conteudo?.disciplina === attrInfo.disciplina
          );
          if (jaTemNoDia) continue;

          // Procurar par de slots CONSECUTIVOS disponíveis
          for (let aulaNum = 1; aulaNum < config.horarios.length; aulaNum++) {
            if (duplasAlocadas >= numDuplas) break;

            const slot1Disponivel = isSlotDisponivelParaDocente(grade, dia, aulaNum, attrInfo.docente);
            const slot2Disponivel = isSlotDisponivelParaDocente(grade, dia, aulaNum + 1, attrInfo.docente);

            // Verificar se o docente não tem aula adjacente com outra disciplina
            const docenteAdjacenteSlot1 = docenteTemAulaAdjacente(grade, dia, aulaNum, attrInfo.docente, attrInfo.disciplina);
            const docenteAdjacenteSlot2 = docenteTemAulaAdjacente(grade, dia, aulaNum + 1, attrInfo.docente, attrInfo.disciplina);

            if (slot1Disponivel && slot2Disponivel && !docenteAdjacenteSlot1 && !docenteAdjacenteSlot2) {
              alocarAula(grade, dia, aulaNum, attrInfo.docente, attrInfo.disciplina);
              alocarAula(grade, dia, aulaNum + 1, attrInfo.docente, attrInfo.disciplina);
              attrInfo.alocadas += 2;
              duplasAlocadas++;
              break;
            }
          }
        }
      });

      // ====== FASE 2: Alocar aulas avulsas ======
      todasAtribuicoes.forEach(attrInfo => {
        const grade = novasGrades.find(g => g.turma === attrInfo.turma);
        if (!grade) return;

        let aulasRestantes = attrInfo.quantidade - attrInfo.alocadas;
        if (aulasRestantes <= 0) return;

        for (const dia of config.diasSemana) {
          if (aulasRestantes <= 0) break;

          // Verificar se já tem 2 aulas desta disciplina neste dia (máximo!)
          if (temDuasAulasNoDia(grade, dia, attrInfo.disciplina)) continue;

          for (let aulaNum = 1; aulaNum <= config.horarios.length; aulaNum++) {
            if (aulasRestantes <= 0) break;

            // Verificar limite de 2 aulas no dia novamente (pode ter alocado neste loop)
            if (temDuasAulasNoDia(grade, dia, attrInfo.disciplina)) break;

            // Verificar se não cria 3+ aulas consecutivas
            if (temDuasAulasConsecutivas(grade, dia, aulaNum, attrInfo.disciplina)) continue;

            // Verificar se docente não tem aula adjacente com outra disciplina
            if (docenteTemAulaAdjacente(grade, dia, aulaNum, attrInfo.docente, attrInfo.disciplina)) continue;

            if (isSlotDisponivelParaDocente(grade, dia, aulaNum, attrInfo.docente)) {
              alocarAula(grade, dia, aulaNum, attrInfo.docente, attrInfo.disciplina);
              attrInfo.alocadas++;
              aulasRestantes--;
            }
          }
        }
      });

      // ====== FASE 3: RESOLUÇÃO INTELIGENTE DE CONFLITOS ======
      // Para cada atribuição com aulas faltando, tentar MOVER outras aulas para abrir espaço
      
      const maxTentativasResolucao = 100; // ULTRA AGRESSIVO: 100 rodadas
      let tentativasResolucao = 0;
      let houveResolucao = true;

      while (houveResolucao && tentativasResolucao < maxTentativasResolucao) {
        houveResolucao = false;
        tentativasResolucao++;

        for (const attrInfo of todasAtribuicoes) {
          const aulasRestantes = attrInfo.quantidade - attrInfo.alocadas;
          if (aulasRestantes <= 0) continue;

          const grade = novasGrades.find(g => g.turma === attrInfo.turma);
          if (!grade) continue;

          // Procurar slots onde o docente está ocupado em OUTRA turma
          for (const dia of config.diasSemana) {
            if (attrInfo.alocadas >= attrInfo.quantidade) break;

            for (let aulaNum = 1; aulaNum <= config.horarios.length; aulaNum++) {
              if (attrInfo.alocadas >= attrInfo.quantidade) break;

              const slotAtual = grade.slots.find(s => s.dia === dia && s.aula === aulaNum);
              
              // Slot precisa estar livre E não bloqueado na turma alvo
              if (!slotAtual || slotAtual.bloqueado || slotAtual.conteudo !== null) continue;

              // Verificar se docente está bloqueado
              const bloqueioDocente = isSlotBloqueadoDocente(attrInfo.docente, dia, aulaNum);
              if (bloqueioDocente.bloqueado) continue;

              // Verificar se docente está ocupado em OUTRA turma neste horário
              const chaveHorario = `${dia}-${aulaNum}`;
              const docenteMap = docenteOcupacao.get(attrInfo.docente);
              
              if (!docenteMap?.has(chaveHorario)) {
                // Docente está livre! Verificar regras antes de alocar
                
                // Verificar se já tem 2 aulas desta disciplina neste dia
                if (temDuasAulasNoDia(grade, dia, attrInfo.disciplina)) continue;
                
                // Verificar se não cria 3+ consecutivas
                if (temDuasAulasConsecutivas(grade, dia, aulaNum, attrInfo.disciplina)) continue;
                
                // Verificar se docente não tem aula adjacente com outra disciplina
                if (docenteTemAulaAdjacente(grade, dia, aulaNum, attrInfo.docente, attrInfo.disciplina)) continue;
                
                alocarAula(grade, dia, aulaNum, attrInfo.docente, attrInfo.disciplina);
                attrInfo.alocadas++;
                houveResolucao = true;
                continue;
              }

              // Docente está ocupado em outra turma - tentar MOVER essa aula
              const turmaOcupada = docenteMap.get(chaveHorario)!;
              const gradeOcupada = novasGrades.find(g => g.turma === turmaOcupada);
              if (!gradeOcupada) continue;

              const slotOcupado = gradeOcupada.slots.find(
                s => s.dia === dia && s.aula === aulaNum && s.conteudo?.docente === attrInfo.docente
              );
              if (!slotOcupado || !slotOcupado.conteudo) continue;

              const disciplinaParaMover = slotOcupado.conteudo.disciplina;
              const docenteParaMover = slotOcupado.conteudo.docente;

              // Procurar slot alternativo para mover essa aula
              for (const diaAlt of config.diasSemana) {
                let moveu = false;
                
                for (let aulaAlt = 1; aulaAlt <= config.horarios.length; aulaAlt++) {
                  // Não pode ser o mesmo horário
                  if (diaAlt === dia && aulaAlt === aulaNum) continue;

                  const slotAlt = gradeOcupada.slots.find(s => s.dia === diaAlt && s.aula === aulaAlt);
                  if (!slotAlt || slotAlt.bloqueado || slotAlt.conteudo !== null) continue;

                  // Verificar se docente está bloqueado no horário alternativo
                  const bloqueioDocenteAlt = isSlotBloqueadoDocente(docenteParaMover, diaAlt, aulaAlt);
                  if (bloqueioDocenteAlt.bloqueado) continue;

                  // Verificar se docente está livre no horário alternativo (outras turmas)
                  const chaveHorarioAlt = `${diaAlt}-${aulaAlt}`;
                  const docenteMapMover = docenteOcupacao.get(docenteParaMover);
                  if (docenteMapMover?.has(chaveHorarioAlt)) continue;

                  // Verificar se não cria 3+ aulas consecutivas
                  if (temDuasAulasConsecutivas(gradeOcupada, diaAlt, aulaAlt, disciplinaParaMover)) continue;

                  // Verificar se já tem 2 aulas desta disciplina no dia alternativo
                  if (temDuasAulasNoDia(gradeOcupada, diaAlt, disciplinaParaMover)) continue;

                  // Verificar se docente não tem aula adjacente com outra disciplina
                  if (docenteTemAulaAdjacente(gradeOcupada, diaAlt, aulaAlt, docenteParaMover, disciplinaParaMover)) continue;

                  // PODEMOS MOVER! 🎉
                  // 1. Remover do slot original
                  slotOcupado.conteudo = null;
                  docenteMap.delete(chaveHorario);

                  // 2. Colocar no slot alternativo
                  slotAlt.conteudo = {
                    turma: turmaOcupada,
                    disciplina: disciplinaParaMover,
                    docente: docenteParaMover,
                  };
                  if (!docenteOcupacao.has(docenteParaMover)) {
                    docenteOcupacao.set(docenteParaMover, new Map());
                  }
                  docenteOcupacao.get(docenteParaMover)!.set(chaveHorarioAlt, turmaOcupada);

                  // 3. Agora podemos alocar a aula que precisávamos!
                  alocarAula(grade, dia, aulaNum, attrInfo.docente, attrInfo.disciplina);
                  attrInfo.alocadas++;
                  houveResolucao = true;
                  moveu = true;
                  break;
                }
                
                if (moveu) break;
              }
            }
          }
        }
      }

      // ====== FASE 4: TROCAS EM CADEIA (mais agressivo) ======
      // Se ainda há conflitos, tentar trocas mais complexas
      
      for (const attrInfo of todasAtribuicoes) {
        let aulasRestantes = attrInfo.quantidade - attrInfo.alocadas;
        if (aulasRestantes <= 0) continue;

        const grade = novasGrades.find(g => g.turma === attrInfo.turma);
        if (!grade) continue;

        // Procurar slots ocupados por OUTRA disciplina na mesma turma
        // e verificar se podemos trocar
        for (const dia of config.diasSemana) {
          if (aulasRestantes <= 0) break;

          for (let aulaNum = 1; aulaNum <= config.horarios.length; aulaNum++) {
            if (aulasRestantes <= 0) break;

            const slotAtual = grade.slots.find(s => s.dia === dia && s.aula === aulaNum);
            if (!slotAtual || slotAtual.bloqueado) continue;

            // Verificar se nosso docente pode dar aula aqui
            const bloqueioDocente = isSlotBloqueadoDocente(attrInfo.docente, dia, aulaNum);
            if (bloqueioDocente.bloqueado) continue;

            const chaveHorario = `${dia}-${aulaNum}`;
            const docenteMap = docenteOcupacao.get(attrInfo.docente);
            if (docenteMap?.has(chaveHorario)) continue; // Docente ocupado

            // Se slot está ocupado por outra disciplina, tentar mover
            if (slotAtual.conteudo !== null) {
              const outroDocente = slotAtual.conteudo.docente;
              const outraDisciplina = slotAtual.conteudo.disciplina;

              // Procurar outro slot para mover essa aula
              for (const diaAlt of config.diasSemana) {
                let trocou = false;

                for (let aulaAlt = 1; aulaAlt <= config.horarios.length; aulaAlt++) {
                  if (diaAlt === dia && aulaAlt === aulaNum) continue;

                  const slotAlt = grade.slots.find(s => s.dia === diaAlt && s.aula === aulaAlt);
                  if (!slotAlt || slotAlt.bloqueado || slotAlt.conteudo !== null) continue;

                  // Verificar se outro docente pode ir para o slot alternativo
                  const bloqueioOutro = isSlotBloqueadoDocente(outroDocente, diaAlt, aulaAlt);
                  if (bloqueioOutro.bloqueado) continue;

                  const chaveHorarioAlt = `${diaAlt}-${aulaAlt}`;
                  const outroDocenteMap = docenteOcupacao.get(outroDocente);
                  if (outroDocenteMap?.has(chaveHorarioAlt)) continue;

                  if (temDuasAulasConsecutivas(grade, diaAlt, aulaAlt, outraDisciplina)) continue;

                  // Verificar se já tem 2 aulas da outra disciplina no dia alternativo
                  if (temDuasAulasNoDia(grade, diaAlt, outraDisciplina)) continue;

                  // Verificar se outro docente não tem aula adjacente com outra disciplina
                  if (docenteTemAulaAdjacente(grade, diaAlt, aulaAlt, outroDocente, outraDisciplina)) continue;

                  // Verificar se já tem 2 aulas da nossa disciplina no dia atual
                  if (temDuasAulasNoDia(grade, dia, attrInfo.disciplina)) continue;

                  // Verificar se nosso docente não tem aula adjacente com outra disciplina
                  if (docenteTemAulaAdjacente(grade, dia, aulaNum, attrInfo.docente, attrInfo.disciplina)) continue;

                  // TROCA POSSÍVEL!
                  // 1. Mover aula atual para slot alternativo
                  slotAlt.conteudo = {
                    turma: attrInfo.turma,
                    disciplina: outraDisciplina,
                    docente: outroDocente,
                  };
                  if (!docenteOcupacao.has(outroDocente)) {
                    docenteOcupacao.set(outroDocente, new Map());
                  }
                  docenteOcupacao.get(outroDocente)!.delete(chaveHorario);
                  docenteOcupacao.get(outroDocente)!.set(chaveHorarioAlt, attrInfo.turma);

                  // 2. Colocar nossa aula no slot atual
                  slotAtual.conteudo = {
                    turma: attrInfo.turma,
                    disciplina: attrInfo.disciplina,
                    docente: attrInfo.docente,
                  };
                  if (!docenteOcupacao.has(attrInfo.docente)) {
                    docenteOcupacao.set(attrInfo.docente, new Map());
                  }
                  docenteOcupacao.get(attrInfo.docente)!.set(chaveHorario, attrInfo.turma);

                  attrInfo.alocadas++;
                  aulasRestantes--;
                  trocou = true;
                  break;
                }

                if (trocou) break;
              }
            }
          }
        }

        // NÃO registrar conflito ainda - vamos tentar mais fases!
      }

      // ====== FASE 5: TROCAS EM CADEIA LONGA (3, 4, 5 movimentos) ======
      // Tentar resolver conflitos restantes com trocas mais complexas
      
      const maxCadeias = 50;
      let tentativasCadeia = 0;
      
      for (const attrInfo of todasAtribuicoes) {
        let aulasRestantes = attrInfo.quantidade - attrInfo.alocadas;
        if (aulasRestantes <= 0) continue;
        if (tentativasCadeia >= maxCadeias) break;

        const grade = novasGrades.find(g => g.turma === attrInfo.turma);
        if (!grade) continue;

        // Procurar slot onde nosso docente poderia dar aula SE outra aula fosse movida
        for (const dia of config.diasSemana) {
          if (aulasRestantes <= 0) break;

          for (let aulaNum = 1; aulaNum <= config.horarios.length; aulaNum++) {
            if (aulasRestantes <= 0) break;

            const slotAlvo = grade.slots.find(s => s.dia === dia && s.aula === aulaNum);
            if (!slotAlvo || slotAlvo.bloqueado) continue;

            // Verificar se nosso docente está bloqueado
            const bloqueioDocente = isSlotBloqueadoDocente(attrInfo.docente, dia, aulaNum);
            if (bloqueioDocente.bloqueado) continue;

            const chaveHorario = `${dia}-${aulaNum}`;
            const docenteMap = docenteOcupacao.get(attrInfo.docente);
            
            // Se o docente está livre E o slot está ocupado por outra disciplina na mesma turma
            // Tentar cadeia de 3 movimentos
            if (!docenteMap?.has(chaveHorario) && slotAlvo.conteudo !== null) {
              const disciplinaA = slotAlvo.conteudo.disciplina;
              const docenteA = slotAlvo.conteudo.docente;
              
              // Procurar slot B para mover a disciplina A
              for (const diaB of config.diasSemana) {
                let resolveuCadeia = false;
                
                for (let aulaB = 1; aulaB <= config.horarios.length; aulaB++) {
                  if (diaB === dia && aulaB === aulaNum) continue;
                  
                  const slotB = grade.slots.find(s => s.dia === diaB && s.aula === aulaB);
                  if (!slotB) continue;
                  
                  // Se slot B está livre, podemos mover A para B
                  if (slotB.conteudo === null && !slotB.bloqueado) {
                    const bloqueioA = isSlotBloqueadoDocente(docenteA, diaB, aulaB);
                    if (bloqueioA.bloqueado) continue;
                    
                    const chaveB = `${diaB}-${aulaB}`;
                    const docenteAMap = docenteOcupacao.get(docenteA);
                    if (docenteAMap?.has(chaveB)) continue;

                    // Verificar se já tem 2 aulas da disciplina A no dia B
                    if (temDuasAulasNoDia(grade, diaB, disciplinaA)) continue;

                    // Verificar se não cria 3+ consecutivas
                    if (temDuasAulasConsecutivas(grade, diaB, aulaB, disciplinaA)) continue;

                    // Verificar se docente A não tem aula adjacente com outra disciplina
                    if (docenteTemAulaAdjacente(grade, diaB, aulaB, docenteA, disciplinaA)) continue;

                    // Verificar se já tem 2 aulas da nossa disciplina no dia original
                    if (temDuasAulasNoDia(grade, dia, attrInfo.disciplina)) continue;

                    // Verificar se nosso docente não tem aula adjacente
                    if (docenteTemAulaAdjacente(grade, dia, aulaNum, attrInfo.docente, attrInfo.disciplina)) continue;
                    
                    // PODEMOS FAZER A CADEIA!
                    // 1. Mover A para B
                    slotB.conteudo = {
                      turma: attrInfo.turma,
                      disciplina: disciplinaA,
                      docente: docenteA,
                    };
                    if (!docenteOcupacao.has(docenteA)) {
                      docenteOcupacao.set(docenteA, new Map());
                    }
                    docenteOcupacao.get(docenteA)!.delete(chaveHorario);
                    docenteOcupacao.get(docenteA)!.set(chaveB, attrInfo.turma);
                    
                    // 2. Colocar nossa aula no slot original
                    slotAlvo.conteudo = {
                      turma: attrInfo.turma,
                      disciplina: attrInfo.disciplina,
                      docente: attrInfo.docente,
                    };
                    if (!docenteOcupacao.has(attrInfo.docente)) {
                      docenteOcupacao.set(attrInfo.docente, new Map());
                    }
                    docenteOcupacao.get(attrInfo.docente)!.set(chaveHorario, attrInfo.turma);
                    
                    attrInfo.alocadas++;
                    aulasRestantes--;
                    tentativasCadeia++;
                    resolveuCadeia = true;
                    break;
                  }
                  
                  // Se slot B está ocupado, tentar cadeia de 3 (A→B, B→C, nossa→A)
                  if (slotB.conteudo !== null && !slotB.bloqueado) {
                    const disciplinaB = slotB.conteudo.disciplina;
                    const docenteB = slotB.conteudo.docente;
                    
                    // Procurar slot C para mover B
                    for (const diaC of config.diasSemana) {
                      for (let aulaC = 1; aulaC <= config.horarios.length; aulaC++) {
                        if ((diaC === dia && aulaC === aulaNum) || (diaC === diaB && aulaC === aulaB)) continue;
                        
                        const slotC = grade.slots.find(s => s.dia === diaC && s.aula === aulaC);
                        if (!slotC || slotC.bloqueado || slotC.conteudo !== null) continue;
                        
                        const bloqueioB = isSlotBloqueadoDocente(docenteB, diaC, aulaC);
                        if (bloqueioB.bloqueado) continue;
                        
                        const chaveC = `${diaC}-${aulaC}`;
                        const docenteBMap = docenteOcupacao.get(docenteB);
                        if (docenteBMap?.has(chaveC)) continue;
                        
                        // Verificar se docenteA pode ir para B
                        const bloqueioAB = isSlotBloqueadoDocente(docenteA, diaB, aulaB);
                        if (bloqueioAB.bloqueado) continue;

                        // Verificar regras para cada movimento
                        // Movimento B → C
                        if (temDuasAulasNoDia(grade, diaC, disciplinaB)) continue;
                        if (temDuasAulasConsecutivas(grade, diaC, aulaC, disciplinaB)) continue;
                        if (docenteTemAulaAdjacente(grade, diaC, aulaC, docenteB, disciplinaB)) continue;

                        // Movimento A → B
                        if (temDuasAulasNoDia(grade, diaB, disciplinaA)) continue;
                        if (temDuasAulasConsecutivas(grade, diaB, aulaB, disciplinaA)) continue;
                        if (docenteTemAulaAdjacente(grade, diaB, aulaB, docenteA, disciplinaA)) continue;

                        // Nossa aula no slot original
                        if (temDuasAulasNoDia(grade, dia, attrInfo.disciplina)) continue;
                        if (docenteTemAulaAdjacente(grade, dia, aulaNum, attrInfo.docente, attrInfo.disciplina)) continue;
                        
                        const chaveBkey = `${diaB}-${aulaB}`;
                        // docenteA já está ocupando o slot original, vamos movê-lo
                        
                        // CADEIA DE 3 MOVIMENTOS!
                        // 1. Mover B para C
                        slotC.conteudo = {
                          turma: attrInfo.turma,
                          disciplina: disciplinaB,
                          docente: docenteB,
                        };
                        if (!docenteOcupacao.has(docenteB)) {
                          docenteOcupacao.set(docenteB, new Map());
                        }
                        docenteOcupacao.get(docenteB)!.delete(chaveBkey);
                        docenteOcupacao.get(docenteB)!.set(chaveC, attrInfo.turma);
                        
                        // 2. Mover A para B
                        slotB.conteudo = {
                          turma: attrInfo.turma,
                          disciplina: disciplinaA,
                          docente: docenteA,
                        };
                        if (!docenteOcupacao.has(docenteA)) {
                          docenteOcupacao.set(docenteA, new Map());
                        }
                        docenteOcupacao.get(docenteA)!.delete(chaveHorario);
                        docenteOcupacao.get(docenteA)!.set(chaveBkey, attrInfo.turma);
                        
                        // 3. Colocar nossa aula no slot original
                        slotAlvo.conteudo = {
                          turma: attrInfo.turma,
                          disciplina: attrInfo.disciplina,
                          docente: attrInfo.docente,
                        };
                        if (!docenteOcupacao.has(attrInfo.docente)) {
                          docenteOcupacao.set(attrInfo.docente, new Map());
                        }
                        docenteOcupacao.get(attrInfo.docente)!.set(chaveHorario, attrInfo.turma);
                        
                        attrInfo.alocadas++;
                        aulasRestantes--;
                        tentativasCadeia++;
                        resolveuCadeia = true;
                        break;
                      }
                      if (resolveuCadeia) break;
                    }
                  }
                  
                  if (resolveuCadeia) break;
                }
                if (resolveuCadeia) break;
              }
            }
          }
        }
      }

      // ====== FASE 6: ÚLTIMA TENTATIVA ======
      // Tenta alocar em slots restantes, MAS RESPEITANDO TODAS AS REGRAS
      // NÃO permite 3 aulas consecutivas nem docente com aulas adjacentes de disciplinas diferentes
      
      for (const attrInfo of todasAtribuicoes) {
        let aulasRestantes = attrInfo.quantidade - attrInfo.alocadas;
        if (aulasRestantes <= 0) continue;

        const grade = novasGrades.find(g => g.turma === attrInfo.turma);
        if (!grade) continue;

        // Tentar slots disponíveis RESPEITANDO TODAS AS REGRAS
        for (const dia of config.diasSemana) {
          if (aulasRestantes <= 0) break;

          // Verificar se já tem 2 aulas desta disciplina neste dia (LIMITE ABSOLUTO)
          if (temDuasAulasNoDia(grade, dia, attrInfo.disciplina)) continue;

          for (let aulaNum = 1; aulaNum <= config.horarios.length; aulaNum++) {
            if (aulasRestantes <= 0) break;

            // Verificar novamente o limite de 2 aulas por dia
            if (temDuasAulasNoDia(grade, dia, attrInfo.disciplina)) break;

            const slotAlvo = grade.slots.find(s => s.dia === dia && s.aula === aulaNum);
            if (!slotAlvo || slotAlvo.bloqueado || slotAlvo.conteudo !== null) continue;

            // Verificar se nosso docente está bloqueado
            const bloqueioDocente = isSlotBloqueadoDocente(attrInfo.docente, dia, aulaNum);
            if (bloqueioDocente.bloqueado) continue;

            const chaveHorario = `${dia}-${aulaNum}`;
            const docenteMap = docenteOcupacao.get(attrInfo.docente);
            if (docenteMap?.has(chaveHorario)) continue;

            // Verificar se não cria 3+ aulas consecutivas (REGRA ABSOLUTA)
            if (temDuasAulasConsecutivas(grade, dia, aulaNum, attrInfo.disciplina)) continue;

            // Verificar se docente não tem aula adjacente com outra disciplina (REGRA ABSOLUTA)
            if (docenteTemAulaAdjacente(grade, dia, aulaNum, attrInfo.docente, attrInfo.disciplina)) continue;

            // ALOCAR! (respeitando todas as regras)
            alocarAula(grade, dia, aulaNum, attrInfo.docente, attrInfo.disciplina);
            attrInfo.alocadas++;
            aulasRestantes--;
          }
        }

        // Registrar conflito APENAS se ainda restam aulas após todas as fases
        if (aulasRestantes > 0) {
          // Análise detalhada do motivo
          let motivos: string[] = [];
          
          // Contar quantos slots o docente tem bloqueados
          let bloqueiosDocente = 0;
          let ocupadoOutrasTurmas = 0;
          let slotsTurmaBloqueados = 0;
          let slotsLivres = 0;
          
          config.diasSemana.forEach(dia => {
            config.horarios.forEach(horario => {
              const slot = grade.slots.find(s => s.dia === dia && s.aula === horario.numero);
              
              if (slot?.bloqueado) {
                slotsTurmaBloqueados++;
                return;
              }
              
              const bloqueio = isSlotBloqueadoDocente(attrInfo.docente, dia, horario.numero);
              if (bloqueio.bloqueado) {
                bloqueiosDocente++;
                return;
              }
              
              const chave = `${dia}-${horario.numero}`;
              if (docenteOcupacao.get(attrInfo.docente)?.has(chave)) {
                ocupadoOutrasTurmas++;
                return;
              }
              
              if (!slot?.conteudo) {
                slotsLivres++;
              }
            });
          });
          
          if (bloqueiosDocente > 0) {
            motivos.push(`${bloqueiosDocente} horários bloqueados (ATPC/Área)`);
          }
          if (ocupadoOutrasTurmas > 0) {
            motivos.push(`Docente ocupa ${ocupadoOutrasTurmas} slots em outras turmas`);
          }
          if (slotsTurmaBloqueados > 0) {
            motivos.push(`${slotsTurmaBloqueados} slots da turma bloqueados`);
          }
          if (slotsLivres === 0) {
            motivos.push(`IMPOSSÍVEL: Nenhum slot disponível!`);
          }
          
          const motivoTexto = motivos.length > 0 ? ` [${motivos.join('; ')}]` : '';
          
          conflitos.push(
            `${attrInfo.disciplina} (${attrInfo.docente}) - ${attrInfo.turma}: ${aulasRestantes} aula(s) faltando${motivoTexto}`
          );
        }
      }

      saveGrades(novasGrades);
      
      // Calcular estatísticas de resolução
      const totalAulasAlocadas = todasAtribuicoes.reduce((acc, a) => acc + a.alocadas, 0);
      const totalAulasEsperadas = todasAtribuicoes.reduce((acc, a) => acc + a.quantidade, 0);
      const taxaSucesso = totalAulasEsperadas > 0 
        ? Math.round((totalAulasAlocadas / totalAulasEsperadas) * 100) 
        : 100;
      
      // Mensagem sobre eletivas alocadas automaticamente
      const qtdEletivas = eletivasIgnoradas.length;
      let mensagemEletivas = '';
      if (qtdEletivas > 0) {
        const turmasComEletiva = [...new Set(eletivasIgnoradas.map(e => e.turma))].length;
        mensagemEletivas = `\n\n✅ ${qtdEletivas} ELETIVA(S) alocadas automaticamente na Sexta-feira, 8ª e 9ª aulas (${turmasComEletiva} turma(s)).`;
      }
      
      // Mensagem sobre resolução inteligente
      const mensagemResolucao = `\n\n🧠 Algoritmo ULTRA AGRESSIVO:\n   • ${tentativasResolucao} rodadas de otimização\n   • ${tentativasCadeia} trocas em cadeia executadas\n   • 6 fases de resolução aplicadas`;
      
      const mensagemTaxa = `\n📊 Taxa de alocação: ${taxaSucesso}% (${totalAulasAlocadas}/${totalAulasEsperadas} aulas)`;
      
      setGeracaoStatus({
        gerando: false,
        sucesso: conflitos.length === 0,
        mensagem: conflitos.length === 0 
          ? `✅ Horário gerado com sucesso!` + mensagemTaxa + mensagemEletivas + mensagemResolucao
          : `⚠️ Horário gerado com ${conflitos.length} conflito(s)` + mensagemTaxa + mensagemEletivas + mensagemResolucao,
        conflitos,
      });
    } catch (error) {
      setGeracaoStatus({
        gerando: false,
        sucesso: false,
        mensagem: 'Erro ao gerar horário',
        conflitos: [(error as Error).message],
      });
    }
  }, [atribuicoes, turmas, config, isSlotBloqueadoTurma, isSlotBloqueadoDocente, saveGrades, eletivasIgnoradas]);

  // Atualizar um slot manualmente
  const updateSlot = useCallback((turma: string, dia: DiaSemana, aula: number, conteudo: AulaHorario | null) => {
    const novasGrades = grades.map(grade => {
      if (grade.turma !== turma) return grade;
      
      return {
        ...grade,
        slots: grade.slots.map(slot => {
          if (slot.dia !== dia || slot.aula !== aula) return slot;
          return { ...slot, conteudo };
        }),
      };
    });
    
    saveGrades(novasGrades);
  }, [grades, saveGrades]);

  // Obter grade de uma turma
  const getGradeTurma = useCallback((turma: string): GradeHorario | undefined => {
    return grades.find(g => g.turma === turma);
  }, [grades]);

  // Obter horário de um docente
  const getHorarioDocente = useCallback((docente: string) => {
    const slots: (SlotHorario & { turma: string })[] = [];
    
    config.diasSemana.forEach(dia => {
      config.horarios.forEach(horario => {
        const bloqueioInfo = isSlotBloqueadoDocente(docente, dia, horario.numero);
        
        // Procurar em todas as grades se o docente tem aula neste horário
        let conteudo: AulaHorario | null = null;
        let turmaAula = '';
        
        grades.forEach(grade => {
          const slot = grade.slots.find(
            s => s.dia === dia && s.aula === horario.numero && s.conteudo?.docente === docente
          );
          if (slot?.conteudo) {
            conteudo = slot.conteudo;
            turmaAula = grade.turma;
          }
        });

        slots.push({
          dia,
          aula: horario.numero,
          conteudo,
          bloqueado: bloqueioInfo.bloqueado,
          motivoBloqueio: bloqueioInfo.motivo,
          turma: turmaAula,
        });
      });
    });

    return { docente, slots };
  }, [config, grades, isSlotBloqueadoDocente]);

  // Estatísticas
  const estatisticas = useMemo(() => {
    let totalAulasAlocadas = 0;
    let totalSlotsDisponiveis = 0;
    let totalSlotsBloqueados = 0;
    let totalEletivasAlocadas = 0;

    grades.forEach(grade => {
      grade.slots.forEach(slot => {
        if (slot.bloqueado) {
          totalSlotsBloqueados++;
        } else if (slot.conteudo) {
          totalAulasAlocadas++;
          // Contar eletivas separadamente (cada docente em eletiva conta como uma aula)
          if (isEletiva(slot.conteudo.disciplina)) {
            // Contar quantos docentes estão no slot (trabalho em dupla/trio)
            const numDocentes = slot.conteudo.docente.split(' / ').length;
            // Já contamos 1, então adicionamos os extras
            totalEletivasAlocadas += numDocentes;
            // Ajustar: já contamos 1 no totalAulasAlocadas, precisamos adicionar os extras
            totalAulasAlocadas += (numDocentes - 1);
          }
        } else {
          totalSlotsDisponiveis++;
        }
      });
    });

    const totalAulasEsperadas = atribuicoes.reduce((acc, a) => acc + a.aulas, 0);
    const percentualAlocado = totalAulasEsperadas > 0 
      ? Math.round((totalAulasAlocadas / totalAulasEsperadas) * 100)
      : 0;

    return {
      totalAulasAlocadas,
      totalAulasEsperadas,
      totalSlotsDisponiveis,
      totalSlotsBloqueados,
      totalEletivasAlocadas,
      percentualAlocado,
    };
  }, [grades, atribuicoes]);

  // Analisar conflitos detalhadamente
  const analisarConflitos = useCallback((): AnaliseConflitos => {
    const conflitos: ConflitoDetalhado[] = [];
    
    // Para cada atribuição, verificar se todas as aulas foram alocadas
    atribuicoes.forEach(attr => {
      // Ignorar eletivas - elas são alocadas automaticamente na sexta 8ª e 9ª
      // e múltiplos docentes podem compartilhar o slot (trabalho em dupla)
      if (isEletiva(attr.disciplina)) return;
      
      const grade = grades.find(g => g.turma === attr.turma);
      if (!grade) return;
      
      // Contar quantas aulas desta disciplina foram alocadas para esta turma
      const aulasAlocadas = grade.slots.filter(
        s => s.conteudo?.disciplina === attr.disciplina && s.conteudo?.docente === attr.docente
      ).length;
      
      const aulasFaltando = attr.aulas - aulasAlocadas;
      
      if (aulasFaltando > 0) {
        const motivos: string[] = [];
        const sugestoes: string[] = [];
        
        // Analisar por que não foi possível alocar
        let slotsLivres = 0;
        let slotsBloqueadosDocente = 0;
        let slotsBloqueadosTurma = 0;
        let slotsDocenteOcupado = 0;
        
        config.diasSemana.forEach(dia => {
          config.horarios.forEach(horario => {
            const slot = grade.slots.find(s => s.dia === dia && s.aula === horario.numero);
            
            if (!slot) return;
            
            // Verificar se slot está livre
            if (slot.conteudo === null && !slot.bloqueado) {
              // Verificar bloqueio do docente
              const bloqueioDocente = isSlotBloqueadoDocente(attr.docente, dia, horario.numero);
              if (bloqueioDocente.bloqueado) {
                slotsBloqueadosDocente++;
                return;
              }
              
              // Verificar se docente está ocupado em outra turma
              const docenteOcupadoOutraTurma = grades.some(g => 
                g.turma !== attr.turma && 
                g.slots.some(s => 
                  s.dia === dia && 
                  s.aula === horario.numero && 
                  s.conteudo?.docente === attr.docente
                )
              );
              
              if (docenteOcupadoOutraTurma) {
                slotsDocenteOcupado++;
                return;
              }
              
              slotsLivres++;
            } else if (slot.bloqueado) {
              slotsBloqueadosTurma++;
            }
          });
        });
        
        // Determinar motivos
        if (slotsDocenteOcupado > 0) {
          motivos.push(`Docente ocupado em outra(s) turma(s) em ${slotsDocenteOcupado} horário(s)`);
          sugestoes.push('Verificar se é possível trocar aulas com outro docente');
        }
        
        if (slotsBloqueadosDocente > 0) {
          motivos.push(`${slotsBloqueadosDocente} horário(s) bloqueado(s) para este docente`);
          sugestoes.push('Revisar os bloqueios do docente');
        }
        
        // Limite de aulas por dia removido
        
        if (slotsBloqueadosTurma > 0) {
          motivos.push(`${slotsBloqueadosTurma} horário(s) bloqueado(s) para esta turma`);
          sugestoes.push('Revisar os bloqueios da turma');
        }
        
        if (slotsLivres === 0 && motivos.length === 0) {
          motivos.push('Nenhum slot disponível na grade');
          sugestoes.push('A turma pode ter muitas disciplinas para o número de aulas disponíveis');
        }
        
        conflitos.push({
          id: attr.id,
          docente: attr.docente,
          turma: attr.turma,
          disciplina: attr.disciplina,
          aulasNecessarias: attr.aulas,
          aulasAlocadas,
          aulasFaltando,
          motivos,
          sugestoes,
        });
      }
    });
    
    return {
      conflitos,
      totalConflitos: conflitos.length,
      aulasNaoAlocadas: conflitos.reduce((acc, c) => acc + c.aulasFaltando, 0),
    };
  }, [atribuicoes, grades, config, isSlotBloqueadoDocente]);

  // Obter slots disponíveis para um docente
  const getSlotsDisponiveisDocente = useCallback((docente: string) => {
    const slotsDisponiveis: { dia: DiaSemana; aula: number; turmasDisponiveis: string[] }[] = [];
    
    config.diasSemana.forEach(dia => {
      config.horarios.forEach(horario => {
        // Verificar bloqueio do docente
        const bloqueioDocente = isSlotBloqueadoDocente(docente, dia, horario.numero);
        if (bloqueioDocente.bloqueado) return;
        
        // Verificar se docente já está ocupado
        const docenteOcupado = grades.some(g => 
          g.slots.some(s => 
            s.dia === dia && 
            s.aula === horario.numero && 
            s.conteudo?.docente === docente
          )
        );
        
        if (docenteOcupado) return;
        
        // Encontrar turmas com slot livre neste horário
        const turmasDisponiveis: string[] = [];
        grades.forEach(grade => {
          const slot = grade.slots.find(s => s.dia === dia && s.aula === horario.numero);
          if (slot && !slot.bloqueado && slot.conteudo === null) {
            turmasDisponiveis.push(grade.turma);
          }
        });
        
        if (turmasDisponiveis.length > 0) {
          slotsDisponiveis.push({ dia, aula: horario.numero, turmasDisponiveis });
        }
      });
    });
    
    return slotsDisponiveis;
  }, [config, grades, isSlotBloqueadoDocente]);

  // Verificar se pode alocar manualmente
  const podeAlocarManualmente = useCallback((
    turma: string,
    dia: DiaSemana,
    aula: number,
    docente: string,
    disciplina: string
  ): { pode: boolean; motivo?: string } => {
    const grade = grades.find(g => g.turma === turma);
    if (!grade) return { pode: false, motivo: 'Turma não encontrada' };
    
    const slot = grade.slots.find(s => s.dia === dia && s.aula === aula);
    if (!slot) return { pode: false, motivo: 'Slot não encontrado' };
    
    if (slot.bloqueado) return { pode: false, motivo: 'Slot bloqueado para a turma' };
    if (slot.conteudo !== null) return { pode: false, motivo: 'Slot já ocupado' };
    
    // Verificar bloqueio do docente
    const bloqueioDocente = isSlotBloqueadoDocente(docente, dia, aula);
    if (bloqueioDocente.bloqueado) {
      return { pode: false, motivo: `Docente bloqueado: ${bloqueioDocente.motivo || 'sem motivo'}` };
    }
    
    // Verificar se docente está ocupado em outra turma
    const docenteOcupadoOutraTurma = grades.some(g => 
      g.turma !== turma && 
      g.slots.some(s => 
        s.dia === dia && 
        s.aula === aula && 
        s.conteudo?.docente === docente
      )
    );
    
    if (docenteOcupadoOutraTurma) {
      return { pode: false, motivo: 'Docente já está em outra turma neste horário' };
    }
    
    // Limite de aulas por dia removido - aulas duplas são permitidas
    
    // Verificar se a disciplina já atingiu o limite semanal de aulas
    const atribuicao = atribuicoes.find(
      a => a.turma === turma && a.disciplina === disciplina && a.docente === docente
    );
    
    if (atribuicao) {
      const aulasAlocadas = grade.slots.filter(
        s => s.conteudo?.disciplina === disciplina && s.conteudo?.docente === docente
      ).length;
      
      if (aulasAlocadas >= atribuicao.aulas) {
        return { 
          pode: false, 
          motivo: `⚠️ LIMITE SEMANAL ATINGIDO! Esta disciplina já tem ${aulasAlocadas}/${atribuicao.aulas} aulas alocadas` 
        };
      }
    }
    
    return { pode: true };
  }, [grades, isSlotBloqueadoDocente, atribuicoes]);

  // Encontrar sugestões de troca para resolver conflitos
  const encontrarSugestoesTroca = useCallback((): SugestaoTroca[] => {
    const sugestoes: SugestaoTroca[] = [];
    const analise = analisarConflitos();
    
    analise.conflitos.forEach(conflito => {
      const grade = grades.find(g => g.turma === conflito.turma);
      if (!grade) return;
      
      // Para cada conflito, procurar slots onde o docente está ocupado em outra turma
      // e verificar se podemos mover essa outra aula para liberar espaço
      
      config.diasSemana.forEach(dia => {
        config.horarios.forEach(horario => {
          const slot = grade.slots.find(s => s.dia === dia && s.aula === horario.numero);
          
          // Pular slots bloqueados ou já ocupados
          if (!slot || slot.bloqueado || slot.conteudo !== null) return;
          
          // Verificar se o docente do conflito está ocupado neste horário em outra turma
          const outraTurmaOcupada = grades.find(g => {
            if (g.turma === conflito.turma) return false;
            const slotOutra = g.slots.find(s => 
              s.dia === dia && 
              s.aula === horario.numero && 
              s.conteudo?.docente === conflito.docente
            );
            return slotOutra !== undefined;
          });
          
          if (!outraTurmaOcupada) return;
          
          const slotOcupado = outraTurmaOcupada.slots.find(s => 
            s.dia === dia && 
            s.aula === horario.numero && 
            s.conteudo?.docente === conflito.docente
          );
          
          if (!slotOcupado || !slotOcupado.conteudo) return;
          
          // Agora precisamos encontrar um slot alternativo para mover essa aula
          // Procurar slots livres na outra turma onde o docente também está livre
          
          for (const diaAlt of config.diasSemana) {
            for (const horarioAlt of config.horarios) {
              // Não pode ser o mesmo horário
              if (diaAlt === dia && horarioAlt.numero === horario.numero) continue;
              
              const slotAlternativo = outraTurmaOcupada.slots.find(s => 
                s.dia === diaAlt && s.aula === horarioAlt.numero
              );
              
              // Slot alternativo deve estar livre e não bloqueado
              if (!slotAlternativo || slotAlternativo.bloqueado || slotAlternativo.conteudo !== null) continue;
              
              // Verificar se o docente está livre neste horário alternativo
              const docenteLivreNoAlt = !grades.some(g => 
                g.slots.some(s => 
                  s.dia === diaAlt && 
                  s.aula === horarioAlt.numero && 
                  s.conteudo?.docente === slotOcupado.conteudo?.docente
                )
              );
              
              if (!docenteLivreNoAlt) continue;
              
              // Verificar bloqueio do docente no horário alternativo
              const bloqueioDocente = isSlotBloqueadoDocente(
                slotOcupado.conteudo.docente, 
                diaAlt, 
                horarioAlt.numero
              );
              if (bloqueioDocente.bloqueado) continue;
              
              // Limite de aulas por dia removido
              
              // Encontramos uma troca válida!
              const diasLabels: Record<DiaSemana, string> = {
                segunda: 'Seg',
                terca: 'Ter',
                quarta: 'Qua',
                quinta: 'Qui',
                sexta: 'Sex'
              };
              
              sugestoes.push({
                id: `${conflito.id}-${dia}-${horario.numero}-${diaAlt}-${horarioAlt.numero}`,
                conflito,
                aulaOrigem: {
                  turma: outraTurmaOcupada.turma,
                  dia,
                  aula: horario.numero,
                  docente: slotOcupado.conteudo.docente,
                  disciplina: slotOcupado.conteudo.disciplina,
                },
                aulaDestino: {
                  turma: outraTurmaOcupada.turma,
                  dia: diaAlt,
                  aula: horarioAlt.numero,
                },
                beneficio: `Libera ${diasLabels[dia]} ${horario.numero}ª aula para ${conflito.disciplina} na turma ${conflito.turma}`,
              });
              
              // Limitar a 3 sugestões por conflito
              if (sugestoes.filter(s => s.conflito.id === conflito.id).length >= 3) return;
            }
          }
        });
      });
    });
    
    return sugestoes;
  }, [grades, config, analisarConflitos, isSlotBloqueadoDocente]);

  // Aplicar uma troca sugerida
  const aplicarTroca = useCallback((sugestao: SugestaoTroca) => {
    const { aulaOrigem, aulaDestino } = sugestao;
    
    // Mover a aula de origem para o destino
    const novasGrades = grades.map(grade => {
      if (grade.turma !== aulaOrigem.turma) return grade;
      
      const novosSlots = grade.slots.map(slot => {
        // Limpar o slot de origem
        if (slot.dia === aulaOrigem.dia && slot.aula === aulaOrigem.aula) {
          return { ...slot, conteudo: null };
        }
        
        // Colocar a aula no slot de destino
        if (slot.dia === aulaDestino.dia && slot.aula === aulaDestino.aula) {
          return { 
            ...slot, 
            conteudo: {
              turma: aulaOrigem.turma,
              disciplina: aulaOrigem.disciplina,
              docente: aulaOrigem.docente,
            }
          };
        }
        
        return slot;
      });
      
      return { ...grade, slots: novosSlots };
    });
    
    saveGrades(novasGrades);
  }, [grades, saveGrades]);

  // Removido: saveOpcoesHorario

  // Removido: gerarOpcoesHorario, selecionarOpcao, limparOpcoes

  return {
    config,
    saveConfig,
    bloqueios,
    addBloqueio,
    removeBloqueio,
    grades,
    gerarHorario,
    clearGrades,
    updateSlot,
    getGradeTurma,
    getHorarioDocente,
    geracaoStatus,
    turmas,
    docentes,
    estatisticas,
    analisarConflitos,
    getSlotsDisponiveisDocente,
    podeAlocarManualmente,
    isSlotBloqueadoDocente,
    encontrarSugestoesTroca,
    aplicarTroca,
  };
}
