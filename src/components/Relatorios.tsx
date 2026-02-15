import { useState, useRef } from 'react';
import { Atribuicao, DocenteResumo, DisciplinaResumo, TurmaResumo } from '../types';

interface RelatoriosProps {
  atribuicoes: Atribuicao[];
  docentesResumo: DocenteResumo[];
  disciplinasResumo: DisciplinaResumo[];
  turmasResumo: TurmaResumo[];
  totalAulas: number;
}

type TipoRelatorio = 'geral' | 'docente' | 'turma' | 'disciplina';

export function Relatorios({
  atribuicoes,
  docentesResumo,
  disciplinasResumo,
  turmasResumo,
  totalAulas,
}: RelatoriosProps) {
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio>('geral');
  const [docenteSelecionado, setDocenteSelecionado] = useState<string>('');
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>('');
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState<string>('');
  const [mostrarPreview, setMostrarPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const docentes = [...new Set(atribuicoes.map(a => a.docente))].sort();
  const turmas = [...new Set(atribuicoes.map(a => a.turma))].sort();
  const disciplinas = [...new Set(atribuicoes.map(a => a.disciplina))].sort();

  const dataAtual = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório - Atribuição de Aulas</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header h1 {
            font-size: 18px;
            margin-bottom: 5px;
          }
          .header p {
            font-size: 12px;
            color: #666;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-size: 14px;
            font-weight: bold;
            background: #f0f0f0;
            padding: 8px 10px;
            margin-bottom: 10px;
            border-left: 4px solid #333;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 11px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background: #f5f5f5;
            font-weight: bold;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .summary-box {
            display: inline-block;
            background: #f5f5f5;
            padding: 10px 20px;
            margin: 5px;
            border-radius: 5px;
            text-align: center;
          }
          .summary-box strong {
            display: block;
            font-size: 18px;
            color: #333;
          }
          .summary-box span {
            font-size: 11px;
            color: #666;
          }
          .summary-container {
            text-align: center;
            margin-bottom: 20px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 10px;
            color: #666;
          }
          .docente-header {
            background: #e8e8e8;
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 5px;
          }
          .docente-header h3 {
            font-size: 14px;
            margin-bottom: 5px;
          }
          .docente-header p {
            font-size: 11px;
            color: #666;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    // Aguarda o carregamento e usa evento para fechar após impressão
    printWindow.onload = () => {
      printWindow.print();
    };
    
    // Fecha a janela apenas quando o usuário terminar de imprimir ou cancelar
    printWindow.onafterprint = () => {
      printWindow.close();
    };
  };

  const gerarPreview = () => {
    setMostrarPreview(true);
  };

  // Relatório Geral
  const RelatorioGeral = () => (
    <div>
      <div className="header">
        <h1>RELATÓRIO GERAL DE ATRIBUIÇÃO DE AULAS</h1>
        <p>Gerado em {dataAtual}</p>
      </div>

      <div className="summary-container">
        <div className="summary-box">
          <strong>{atribuicoes.length}</strong>
          <span>Atribuições</span>
        </div>
        <div className="summary-box">
          <strong>{totalAulas}</strong>
          <span>Total de Aulas</span>
        </div>
        <div className="summary-box">
          <strong>{docentesResumo.length}</strong>
          <span>Docentes</span>
        </div>
        <div className="summary-box">
          <strong>{turmasResumo.length}</strong>
          <span>Turmas</span>
        </div>
        <div className="summary-box">
          <strong>{disciplinasResumo.length}</strong>
          <span>Disciplinas</span>
        </div>
      </div>

      <div className="section">
        <div className="section-title">📊 Resumo por Docente</div>
        <table>
          <thead>
            <tr>
              <th>Docente</th>
              <th className="text-center">Turmas</th>
              <th className="text-center">Disciplinas</th>
              <th className="text-center">Total de Aulas</th>
            </tr>
          </thead>
          <tbody>
            {docentesResumo.map((docente) => (
              <tr key={docente.nome}>
                <td>{docente.nome}</td>
                <td className="text-center">{docente.turmas.length}</td>
                <td className="text-center">{docente.disciplinas.length}</td>
                <td className="text-center"><strong>{docente.totalAulas}</strong></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f0f0f0' }}>
              <td><strong>TOTAL</strong></td>
              <td className="text-center"><strong>{turmasResumo.length}</strong></td>
              <td className="text-center"><strong>{disciplinasResumo.length}</strong></td>
              <td className="text-center"><strong>{totalAulas}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="section">
        <div className="section-title">📚 Resumo por Disciplina</div>
        <table>
          <thead>
            <tr>
              <th>Disciplina</th>
              <th className="text-center">Docentes</th>
              <th className="text-center">Total de Aulas</th>
            </tr>
          </thead>
          <tbody>
            {disciplinasResumo.map((disciplina) => (
              <tr key={disciplina.nome}>
                <td>{disciplina.nome}</td>
                <td className="text-center">{disciplina.docentes.length}</td>
                <td className="text-center"><strong>{disciplina.totalAulas}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section">
        <div className="section-title">🏫 Resumo por Turma</div>
        <table>
          <thead>
            <tr>
              <th>Turma</th>
              <th className="text-center">Docentes</th>
              <th className="text-center">Disciplinas</th>
              <th className="text-center">Total de Aulas</th>
            </tr>
          </thead>
          <tbody>
            {turmasResumo.map((turma) => (
              <tr key={turma.nome}>
                <td>{turma.nome}</td>
                <td className="text-center">{turma.docentes.length}</td>
                <td className="text-center">{turma.disciplinas.length}</td>
                <td className="text-center"><strong>{turma.totalAulas}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="footer">
        <p>Sistema de Gestão Escolar - Atribuição de Aulas</p>
        <p>Documento gerado automaticamente em {dataAtual}</p>
      </div>
    </div>
  );

  // Relatório por Docente
  const RelatorioDocente = () => {
    const docentesFiltrados = docenteSelecionado
      ? docentesResumo.filter(d => d.nome === docenteSelecionado)
      : docentesResumo;

    return (
      <div>
        <div className="header">
          <h1>RELATÓRIO DE ATRIBUIÇÃO DE AULAS POR DOCENTE</h1>
          <p>
            {docenteSelecionado ? `Docente: ${docenteSelecionado}` : 'Todos os Docentes'}
            {' • '}Gerado em {dataAtual}
          </p>
        </div>

        {docentesFiltrados.map((docente) => {
          const atribuicoesDocente = atribuicoes.filter(a => a.docente === docente.nome);
          const turmasAgrupadas = new Map<string, { disciplina: string; aulas: number }[]>();
          
          atribuicoesDocente.forEach(a => {
            if (!turmasAgrupadas.has(a.turma)) {
              turmasAgrupadas.set(a.turma, []);
            }
            turmasAgrupadas.get(a.turma)!.push({ disciplina: a.disciplina, aulas: a.aulas });
          });

          return (
            <div key={docente.nome} className="section" style={{ pageBreakInside: 'avoid' }}>
              <div className="docente-header">
                <h3>👤 {docente.nome}</h3>
                <p>
                  {docente.turmas.length} turma(s) • {docente.disciplinas.length} disciplina(s) • {docente.totalAulas} aula(s)
                </p>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Turma</th>
                    <th>Disciplina</th>
                    <th className="text-center">Aulas</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(turmasAgrupadas.entries()).map(([turma, disciplinas]) => (
                    disciplinas.map((disc, idx) => (
                      <tr key={`${turma}-${disc.disciplina}`}>
                        {idx === 0 && (
                          <td rowSpan={disciplinas.length} style={{ verticalAlign: 'middle', fontWeight: 'bold' }}>
                            {turma}
                          </td>
                        )}
                        <td>{disc.disciplina}</td>
                        <td className="text-center">{disc.aulas}</td>
                      </tr>
                    ))
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f0f0f0' }}>
                    <td colSpan={2}><strong>Total de Aulas</strong></td>
                    <td className="text-center"><strong>{docente.totalAulas}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          );
        })}

        <div className="footer">
          <p>Sistema de Gestão Escolar - Atribuição de Aulas</p>
          <p>Documento gerado automaticamente em {dataAtual}</p>
        </div>
      </div>
    );
  };

  // Relatório por Turma
  const RelatorioTurma = () => {
    const turmasFiltradas = turmaSelecionada
      ? turmasResumo.filter(t => t.nome === turmaSelecionada)
      : turmasResumo;

    return (
      <div>
        <div className="header">
          <h1>RELATÓRIO DE ATRIBUIÇÃO DE AULAS POR TURMA</h1>
          <p>
            {turmaSelecionada ? `Turma: ${turmaSelecionada}` : 'Todas as Turmas'}
            {' • '}Gerado em {dataAtual}
          </p>
        </div>

        {turmasFiltradas.map((turma) => {
          const atribuicoesTurma = atribuicoes
            .filter(a => a.turma === turma.nome)
            .sort((a, b) => a.disciplina.localeCompare(b.disciplina));

          return (
            <div key={turma.nome} className="section" style={{ pageBreakInside: 'avoid' }}>
              <div className="section-title">🏫 Turma: {turma.nome}</div>

              <table>
                <thead>
                  <tr>
                    <th>Disciplina</th>
                    <th>Docente</th>
                    <th className="text-center">Aulas</th>
                  </tr>
                </thead>
                <tbody>
                  {atribuicoesTurma.map((a, idx) => (
                    <tr key={idx}>
                      <td>{a.disciplina}</td>
                      <td>{a.docente}</td>
                      <td className="text-center">{a.aulas}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f0f0f0' }}>
                    <td><strong>Total</strong></td>
                    <td><strong>{turma.docentes.length} docente(s)</strong></td>
                    <td className="text-center"><strong>{turma.totalAulas}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          );
        })}

        <div className="footer">
          <p>Sistema de Gestão Escolar - Atribuição de Aulas</p>
          <p>Documento gerado automaticamente em {dataAtual}</p>
        </div>
      </div>
    );
  };

  // Relatório por Disciplina
  const RelatorioDisciplina = () => {
    const disciplinasFiltradas = disciplinaSelecionada
      ? disciplinasResumo.filter(d => d.nome === disciplinaSelecionada)
      : disciplinasResumo;

    return (
      <div>
        <div className="header">
          <h1>RELATÓRIO DE ATRIBUIÇÃO DE AULAS POR DISCIPLINA</h1>
          <p>
            {disciplinaSelecionada ? `Disciplina: ${disciplinaSelecionada}` : 'Todas as Disciplinas'}
            {' • '}Gerado em {dataAtual}
          </p>
        </div>

        {disciplinasFiltradas.map((disciplina) => {
          const atribuicoesDisciplina = atribuicoes
            .filter(a => a.disciplina === disciplina.nome)
            .sort((a, b) => a.docente.localeCompare(b.docente));

          return (
            <div key={disciplina.nome} className="section" style={{ pageBreakInside: 'avoid' }}>
              <div className="section-title">📚 Disciplina: {disciplina.nome}</div>

              <table>
                <thead>
                  <tr>
                    <th>Docente</th>
                    <th>Turma</th>
                    <th className="text-center">Aulas</th>
                  </tr>
                </thead>
                <tbody>
                  {atribuicoesDisciplina.map((a, idx) => (
                    <tr key={idx}>
                      <td>{a.docente}</td>
                      <td>{a.turma}</td>
                      <td className="text-center">{a.aulas}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f0f0f0' }}>
                    <td><strong>{disciplina.docentes.length} docente(s)</strong></td>
                    <td><strong>Total</strong></td>
                    <td className="text-center"><strong>{disciplina.totalAulas}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          );
        })}

        <div className="footer">
          <p>Sistema de Gestão Escolar - Atribuição de Aulas</p>
          <p>Documento gerado automaticamente em {dataAtual}</p>
        </div>
      </div>
    );
  };

  const renderRelatorio = () => {
    switch (tipoRelatorio) {
      case 'geral':
        return <RelatorioGeral />;
      case 'docente':
        return <RelatorioDocente />;
      case 'turma':
        return <RelatorioTurma />;
      case 'disciplina':
        return <RelatorioDisciplina />;
      default:
        return <RelatorioGeral />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Seleção de Tipo de Relatório */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Configurar Relatório
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => { setTipoRelatorio('geral'); setMostrarPreview(false); }}
            className={`p-4 rounded-xl border-2 transition-all ${
              tipoRelatorio === 'geral'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <div className="text-3xl mb-2">📊</div>
            <div className="font-semibold">Relatório Geral</div>
            <div className="text-xs text-gray-500 mt-1">Visão completa de todos os dados</div>
          </button>

          <button
            onClick={() => { setTipoRelatorio('docente'); setMostrarPreview(false); }}
            className={`p-4 rounded-xl border-2 transition-all ${
              tipoRelatorio === 'docente'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <div className="text-3xl mb-2">👤</div>
            <div className="font-semibold">Por Docente</div>
            <div className="text-xs text-gray-500 mt-1">Atribuições por professor</div>
          </button>

          <button
            onClick={() => { setTipoRelatorio('turma'); setMostrarPreview(false); }}
            className={`p-4 rounded-xl border-2 transition-all ${
              tipoRelatorio === 'turma'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <div className="text-3xl mb-2">🏫</div>
            <div className="font-semibold">Por Turma</div>
            <div className="text-xs text-gray-500 mt-1">Grade de cada turma</div>
          </button>

          <button
            onClick={() => { setTipoRelatorio('disciplina'); setMostrarPreview(false); }}
            className={`p-4 rounded-xl border-2 transition-all ${
              tipoRelatorio === 'disciplina'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <div className="text-3xl mb-2">📚</div>
            <div className="font-semibold">Por Disciplina</div>
            <div className="text-xs text-gray-500 mt-1">Docentes por matéria</div>
          </button>
        </div>

        {/* Filtros específicos */}
        {tipoRelatorio === 'docente' && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecionar Docente (opcional)
            </label>
            <select
              value={docenteSelecionado}
              onChange={(e) => { setDocenteSelecionado(e.target.value); setMostrarPreview(false); }}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os docentes</option>
              {docentes.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        )}

        {tipoRelatorio === 'turma' && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecionar Turma (opcional)
            </label>
            <select
              value={turmaSelecionada}
              onChange={(e) => { setTurmaSelecionada(e.target.value); setMostrarPreview(false); }}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as turmas</option>
              {turmas.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        )}

        {tipoRelatorio === 'disciplina' && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecionar Disciplina (opcional)
            </label>
            <select
              value={disciplinaSelecionada}
              onChange={(e) => { setDisciplinaSelecionada(e.target.value); setMostrarPreview(false); }}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as disciplinas</option>
              {disciplinas.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={gerarPreview}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Visualizar Relatório
          </button>

          {mostrarPreview && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir Relatório
            </button>
          )}
        </div>
      </div>

      {/* Preview do Relatório */}
      {mostrarPreview && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-medium">Pré-visualização do Relatório</span>
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir
            </button>
          </div>
          
          <div 
            ref={printRef}
            className="p-6 bg-white max-h-[70vh] overflow-y-auto custom-scrollbar"
            style={{ fontFamily: 'Arial, sans-serif' }}
          >
            {renderRelatorio()}
          </div>
        </div>
      )}

      {/* Instruções quando não há preview */}
      {!mostrarPreview && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <div className="text-5xl mb-4">🖨️</div>
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Gere Relatórios para Impressão
          </h3>
          <p className="text-blue-600 max-w-md mx-auto">
            Selecione o tipo de relatório acima, configure os filtros se necessário, 
            e clique em "Visualizar Relatório" para ver a pré-visualização antes de imprimir.
          </p>
        </div>
      )}
    </div>
  );
}
