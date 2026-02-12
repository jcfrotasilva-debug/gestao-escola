export interface Atribuicao {
  id: string;
  docente: string;
  turma: string;
  disciplina: string;
  aulas: number;
}

export interface DocenteResumo {
  nome: string;
  totalAulas: number;
  disciplinas: string[];
  turmas: string[];
}

export interface DisciplinaResumo {
  nome: string;
  totalAulas: number;
  docentes: string[];
}

export interface TurmaResumo {
  nome: string;
  totalAulas: number;
  docentes: string[];
  disciplinas: string[];
}

// Tipos para o Gerador de Horário
export type DiaSemana = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta';

export interface HorarioAula {
  numero: number;
  inicio: string;
  fim: string;
}

export interface ConfiguracaoHorario {
  diasSemana: DiaSemana[];
  horarios: HorarioAula[];
  maxAulasPorDisciplinaPorDia: number;
}

export interface Bloqueio {
  id: string;
  tipo: 'geral' | 'docente' | 'turma';
  entidade: string; // nome do docente ou turma (vazio para 'geral')
  dia: DiaSemana;
  aulas: number[]; // números das aulas bloqueadas
  motivo?: string;
}

export interface AulaHorario {
  turma: string;
  disciplina: string;
  docente: string;
}

export interface SlotHorario {
  dia: DiaSemana;
  aula: number;
  conteudo: AulaHorario | null;
  bloqueado: boolean;
  motivoBloqueio?: string;
}

export interface GradeHorario {
  turma: string;
  slots: SlotHorario[];
}

export interface HorarioDocente {
  docente: string;
  slots: (SlotHorario & { turma: string })[];
}

// Tipos para análise de conflitos
export interface ConflitoDetalhado {
  id: string;
  docente: string;
  turma: string;
  disciplina: string;
  aulasNecessarias: number;
  aulasAlocadas: number;
  aulasFaltando: number;
  motivos: string[];
  sugestoes: string[];
}

export interface AnaliseConflitos {
  conflitos: ConflitoDetalhado[];
  totalConflitos: number;
  aulasNaoAlocadas: number;
}

export interface SugestaoTroca {
  id: string;
  conflito: ConflitoDetalhado;
  // Aula que será trocada (vai liberar espaço)
  aulaOrigem: {
    turma: string;
    dia: DiaSemana;
    aula: number;
    docente: string;
    disciplina: string;
  };
  // Para onde a aula vai
  aulaDestino: {
    turma: string;
    dia: DiaSemana;
    aula: number;
  };
  // Benefício da troca
  beneficio: string;
}

// Tipos para Área de Conhecimento
export interface AreaConhecimento {
  id: string;
  nome: string;
  cor: string; // cor para identificação visual
  docentes: string[]; // lista de nomes de docentes vinculados
}

export interface BloqueioArea {
  id: string;
  areaId: string;
  dia: DiaSemana;
  aulas: number[]; // números das aulas bloqueadas
  motivo?: string;
}

// Tipos para Habilitações Especiais
export type Habilitacao = 
  | 'libras'
  | 'braille'
  | 'aee'
  | 'educacao_especial'
  | 'deficiencia_visual'
  | 'deficiencia_auditiva'
  | 'deficiencia_intelectual'
  | 'tea'
  | 'altas_habilidades'
  | 'soroban'
  | 'comunicacao_alternativa'
  | 'outro';

// Tipos para Função/Atuação
export type FuncaoDocente = 
  | 'regente'
  | 'aee'
  | 'coordenador'
  | 'vice_diretor'
  | 'diretor'
  | 'readaptado'
  | 'eventual'
  | 'estagiario'
  | 'interprete_libras'
  | 'cuidador'
  | 'outro';

// Formação Complementar
export interface FormacaoComplementar {
  id: string;
  tipo: 'pos_graduacao' | 'mestrado' | 'doutorado' | 'especializacao' | 'curso' | 'capacitacao';
  nome: string;
  instituicao?: string;
  anoConclusao?: string;
  cargaHoraria?: number;
}

// Atuação no AEE
export interface AtuacaoAEE {
  atuaNoAEE: boolean;
  deficienciasAtendidas: TipoDeficiencia[];
  salaRecursos: boolean;
  itinerante: boolean;
  observacoes?: string;
}

// Tipos para Cadastro de Docentes
export interface CadastroDocente {
  id: string;
  nome: string;
  foto?: string; // base64 da foto
  // Dados Pessoais
  cpf?: string;
  rg?: string;
  dataNascimento?: string;
  sexo?: 'M' | 'F' | 'Outro';
  estadoCivil?: 'Solteiro(a)' | 'Casado(a)' | 'Divorciado(a)' | 'Viúvo(a)' | 'União Estável';
  // Contato
  email?: string;
  telefone?: string;
  celular?: string;
  // Endereço
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  // Dados Profissionais
  matricula?: string;
  cargo?: string;
  vinculo?: 'Efetivo' | 'Contratado' | 'Temporário' | 'Substituto';
  cargaHoraria?: number;
  dataAdmissao?: string;
  // Função/Atuação
  funcao?: FuncaoDocente;
  funcaoOutra?: string; // se funcao === 'outro'
  // Formação
  formacao?: string;
  especializacao?: string;
  formacoesComplementares?: FormacaoComplementar[];
  // Habilitações Especiais
  habilitacoes?: Habilitacao[];
  habilitacaoOutra?: string; // se habilitacoes inclui 'outro'
  // Atuação AEE
  atuacaoAEE?: AtuacaoAEE;
  // Área de Conhecimento
  areaConhecimento?: string;
  // Projetos que participa
  projetosIds?: string[]; // IDs dos projetos da escola
  // Observações
  observacoes?: string;
  // Metadados
  dataCadastro: string;
  dataAtualizacao: string;
}

// Tipos para Cadastro da Escola
export type TipoEnsino = 'educacao_infantil' | 'fundamental_1' | 'fundamental_2' | 'medio' | 'eja' | 'profissional';

export interface AnoSerie {
  id: string;
  nome: string; // Ex: "1º Ano", "6º Ano", "1ª Série"
  tipoEnsino: TipoEnsino;
  ativo: boolean;
}

export interface Turno {
  tipo: 'manha' | 'tarde' | 'noite' | 'integral';
  horaInicio: string;
  horaFim: string;
  ativo: boolean;
}

// Tipos de Deficiência para AEE
export type TipoDeficiencia = 
  | 'visual_cegueira'
  | 'visual_baixa_visao'
  | 'auditiva_surdez'
  | 'auditiva_hipoacusia'
  | 'fisica'
  | 'intelectual'
  | 'tea' // Transtorno do Espectro Autista
  | 'altas_habilidades'
  | 'deficiencia_multipla'
  | 'tgd'; // Transtornos Globais do Desenvolvimento

export interface AtendimentoAEE {
  possui: boolean;
  salaRecursos: boolean;
  salaRecursosQuantidade?: number;
  deficienciasAtendidas: TipoDeficiencia[];
  profissionaisAEE?: number;
  observacoes?: string;
}

// Tipos de Projetos
export type OrigemProjeto = 'federal' | 'estadual' | 'municipal' | 'proprio';

export interface Projeto {
  id: string;
  nome: string;
  origem: OrigemProjeto;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
  responsavel?: string;
  ativo: boolean;
}

// Infraestrutura da Escola
export interface Infraestrutura {
  acessibilidade: {
    rampa: boolean;
    elevador: boolean;
    banheiroAdaptado: boolean;
    pisoTatil: boolean;
    sinalizacaoBraille: boolean;
  };
  espacos: {
    salaRecursos: boolean;
    salaRecursosQuantidade: number;
    laboratorioInformatica: boolean;
    laboratorioCiencias: boolean;
    biblioteca: boolean;
    quadraEsportiva: boolean;
    quadraCoberta: boolean;
    auditorio: boolean;
    refeitorio: boolean;
    parqueInfantil: boolean;
  };
  totalSalas: number;
  totalAlunos?: number;
  totalFuncionarios?: number;
}

export interface Escola {
  id?: string;
  nome: string;
  cnpj?: string;
  codigoInep?: string;
  email?: string;
  telefone?: string;
  site?: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  tiposEnsino: TipoEnsino[];
  anosSeries: AnoSerie[];
  turnos: Turno[];
  aee: AtendimentoAEE;
  projetos: Projeto[];
  infraestrutura: Infraestrutura;
  diretor?: string;
  viceDiretor?: string;
  coordenadorPedagogico?: string;
  secretario?: string;
}

// Tipos para Projetos com Turmas e Atribuições
export interface ProjetoEscolar {
  id: string;
  nome: string;
  descricao: string;
  categoria: 'esportivo' | 'artistico' | 'pedagogico' | 'inclusivo' | 'tecnologico' | 'ambiental' | 'cultural' | 'social' | 'outro';
  origem: 'federal' | 'estadual' | 'municipal' | 'proprio';
  ativo: boolean;
}

export interface TurmaProjeto {
  id: string;
  projetoId: string;
  nome: string;
  descricao: string;
  vagas: number;
}

export interface AtribuicaoProjeto {
  id: string;
  projetoId: string;
  turmaId: string;
  docenteNome: string;
  aulas: number;
}

// ==================== TIPOS PARA ALUNOS ====================

export type SituacaoAluno = 'Ativo' | 'Transferido' | 'Evadido' | 'Concluído' | 'Remanejado' | 'Falecido' | 'Não Compareceu';

export interface Aluno {
  id: string;
  ano: string;           // Ano escolar (6º, 7º, 8º, 9º)
  turma: string;         // Turma completa (6º A, 7º B)
  rm: string;            // Registro de Matrícula
  numeroChamada: number; // Número da chamada
  nome: string;          // Nome completo do aluno
  ra: string;            // Registro do Aluno
  dvRa: string;          // Dígito Verificador do RA
  ufRa: string;          // UF do RA (SP, MG, etc.)
  dataNascimento: string;// Data de nascimento
  idade?: number;        // Idade calculada
  situacao: SituacaoAluno;// Situação do aluno
  deficiencia: string;   // Tipo de deficiência (se houver)
  endereco: string;      // Endereço completo
  // Campos adicionais opcionais
  nomeMae?: string;
  nomePai?: string;
  responsavel?: string;
  telefone?: string;
  celular?: string;
  email?: string;
  observacoes?: string;
  foto?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TurmaAlunos {
  turma: string;
  ano: string;
  totalAlunos: number;
  alunosAtivos: number;
  alunosComDeficiencia: number;
  alunos: Aluno[];
}

// ==================== TIPOS PARA SERVIDORES ====================

export type CargoServidor = 
  | 'diretor'
  | 'vice_diretor'
  | 'coordenador'
  | 'secretario'
  | 'agente_organizacao'
  | 'inspetor'
  | 'merendeira'
  | 'zelador'
  | 'porteiro'
  | 'auxiliar_servicos'
  | 'auxiliar_administrativo'
  | 'bibliotecario'
  | 'tecnico_informatica'
  | 'cuidador'
  | 'interprete_libras'
  | 'outro';

export type VinculoServidor = 'efetivo' | 'contratado' | 'temporario' | 'terceirizado' | 'estagiario';

export type SetorServidor = 
  | 'direcao'
  | 'secretaria'
  | 'coordenacao'
  | 'biblioteca'
  | 'informatica'
  | 'cozinha'
  | 'limpeza'
  | 'portaria'
  | 'aee'
  | 'outro';

export type SituacaoServidor = 'ativo' | 'afastado' | 'licenca' | 'ferias' | 'desligado';

export type TurnoServidor = 'manha' | 'tarde' | 'noite' | 'integral';

export type EscolaridadeServidor = 'fundamental_incompleto' | 'fundamental' | 'medio_incompleto' | 'medio' | 'tecnico' | 'superior_incompleto' | 'superior' | 'pos_graduacao';

export interface Servidor {
  id: string;
  nome: string;
  foto?: string;
  
  // Dados pessoais
  cpf?: string;
  rg?: string;
  dataNascimento?: string;
  sexo?: 'M' | 'F' | 'Outro';
  estadoCivil?: 'Solteiro(a)' | 'Casado(a)' | 'Divorciado(a)' | 'Viúvo(a)' | 'União Estável';
  
  // Contato
  email?: string;
  telefone?: string;
  celular?: string;
  
  // Endereço
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  
  // Dados profissionais
  matricula?: string;
  cargo: CargoServidor;
  cargoDescricao?: string; // Para quando cargo = 'outro'
  setor: SetorServidor;
  setorDescricao?: string; // Para quando setor = 'outro'
  vinculo: VinculoServidor;
  cargaHoraria?: number;
  turno?: TurnoServidor;
  dataAdmissao?: string;
  
  // Formação
  escolaridade?: EscolaridadeServidor;
  formacao?: string;
  cursos?: string;
  
  // Situação
  situacao: SituacaoServidor;
  
  // Observações
  observacoes?: string;
  
  // Metadados
  dataCadastro: string;
  dataAtualizacao: string;
}
