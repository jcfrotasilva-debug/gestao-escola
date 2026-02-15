import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Atribuicao } from '../types';

interface FileUploadProps {
  onImport: (data: Omit<Atribuicao, 'id'>[]) => void;
  hasData: boolean;
}

export function FileUpload({ onImport, hasData }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Omit<Atribuicao, 'id'>[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError(null);
    setPreview(null);

    // Detectar se é um arquivo JSON de backup
    if (file.name.endsWith('.json')) {
      setError('Este é um arquivo de backup (.json). Para importar backups, use o botão "Backup / Compartilhar" no menu lateral (botão roxo).');
      return;
    }

    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV. Para arquivos de backup (.json), use o botão "Backup / Compartilhar".');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as unknown[][];

        if (jsonData.length < 2) {
          setError('A planilha está vazia ou não contém dados suficientes');
          return;
        }

        // Encontrar os índices das colunas
        const headers = (jsonData[0] as string[]).map(h => 
          String(h || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
        );

        const docenteIndex = headers.findIndex(h => 
          h.includes('docente') || h.includes('professor') || h.includes('nome')
        );
        const turmaIndex = headers.findIndex(h => 
          h.includes('turma') || h.includes('classe') || h.includes('sala')
        );
        const disciplinaIndex = headers.findIndex(h => 
          h.includes('disciplina') || h.includes('materia') || h.includes('componente')
        );
        const aulasIndex = headers.findIndex(h => 
          h.includes('aula') || h.includes('quantidade') || h.includes('qtd') || h.includes('carga')
        );

        // Se não encontrar pelos nomes, tenta pela posição (Docente, Turma, Disciplina, Aulas)
        const finalDocenteIndex = docenteIndex >= 0 ? docenteIndex : 0;
        const finalTurmaIndex = turmaIndex >= 0 ? turmaIndex : 1;
        const finalDisciplinaIndex = disciplinaIndex >= 0 ? disciplinaIndex : 2;
        const finalAulasIndex = aulasIndex >= 0 ? aulasIndex : 3;

        const parsedData: Omit<Atribuicao, 'id'>[] = [];

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as (string | number)[];
          
          if (!row || row.length === 0) continue;

          const docente = String(row[finalDocenteIndex] || '').trim();
          const turma = String(row[finalTurmaIndex] || '').trim();
          const disciplina = String(row[finalDisciplinaIndex] || '').trim();
          const aulas = parseInt(String(row[finalAulasIndex] || '0'), 10) || 0;

          if (docente && turma && disciplina) {
            parsedData.push({ docente, turma, disciplina, aulas });
          }
        }

        if (parsedData.length === 0) {
          setError('Não foi possível extrair dados válidos da planilha. Verifique se contém as colunas: Docente, Turma, Disciplina, Aulas');
          return;
        }

        setPreview(parsedData);
      } catch (err) {
        console.error(err);
        setError('Erro ao processar o arquivo. Verifique se é um arquivo Excel válido.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleConfirmImport = () => {
    if (preview) {
      onImport(preview);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Área de Upload */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }
        `}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv,.json"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className={`p-4 rounded-full ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <svg className={`w-12 h-12 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-700">
              {isDragging ? 'Solte o arquivo aqui' : 'Arraste uma planilha ou clique para selecionar'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Suporta arquivos .xlsx, .xls e .csv
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
            <p className="text-sm text-blue-800 font-medium mb-2">📋 Formato esperado da planilha:</p>
            <div className="text-xs text-blue-700 font-mono bg-white rounded p-2">
              <div className="grid grid-cols-4 gap-2 font-bold border-b pb-1 mb-1">
                <span>Docente</span>
                <span>Turma</span>
                <span>Disciplina</span>
                <span>Aulas</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <span>Maria Silva</span>
                <span>1º A</span>
                <span>Matemática</span>
                <span>4</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-red-800 font-medium">Erro ao importar</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Preview dos dados */}
      {preview && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <h3 className="font-bold text-lg">Pré-visualização dos Dados</h3>
            <p className="text-blue-100 text-sm">
              {preview.length} registro(s) encontrado(s) • {preview.reduce((acc, i) => acc + i.aulas, 0)} aulas no total
            </p>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Docente</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Turma</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Disciplina</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-600">Aulas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.slice(0, 20).map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-800">{item.docente}</td>
                    <td className="px-4 py-2 text-gray-600">{item.turma}</td>
                    <td className="px-4 py-2 text-gray-600">{item.disciplina}</td>
                    <td className="px-4 py-2 text-center font-medium text-blue-600">{item.aulas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 20 && (
              <div className="px-4 py-2 bg-gray-50 text-center text-sm text-gray-500">
                ... e mais {preview.length - 20} registros
              </div>
            )}
          </div>

          <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmImport}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {hasData ? 'Substituir Dados' : 'Importar Dados'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
