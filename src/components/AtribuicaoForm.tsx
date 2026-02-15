import { useState, useEffect } from 'react';
import { Atribuicao } from '../types';

interface AtribuicaoFormProps {
  onSubmit: (data: Omit<Atribuicao, 'id'>) => void;
  onCancel: () => void;
  initialData?: Atribuicao;
}

export function AtribuicaoForm({ onSubmit, onCancel, initialData }: AtribuicaoFormProps) {
  const [formData, setFormData] = useState({
    docente: '',
    turma: '',
    disciplina: '',
    aulas: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        docente: initialData.docente,
        turma: initialData.turma,
        disciplina: initialData.disciplina,
        aulas: initialData.aulas.toString(),
      });
    }
  }, [initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.docente.trim()) {
      newErrors.docente = 'Docente é obrigatório';
    }
    if (!formData.turma.trim()) {
      newErrors.turma = 'Turma é obrigatória';
    }
    if (!formData.disciplina.trim()) {
      newErrors.disciplina = 'Disciplina é obrigatória';
    }
    if (!formData.aulas || parseInt(formData.aulas) <= 0) {
      newErrors.aulas = 'Quantidade de aulas deve ser maior que zero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      docente: formData.docente.trim(),
      turma: formData.turma.trim(),
      disciplina: formData.disciplina.trim(),
      aulas: parseInt(formData.aulas),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            {initialData ? 'Editar Atribuição' : 'Nova Atribuição'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Docente *
            </label>
            <input
              type="text"
              value={formData.docente}
              onChange={(e) => setFormData({ ...formData, docente: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.docente ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nome do professor(a)"
            />
            {errors.docente && (
              <p className="text-red-500 text-sm mt-1">{errors.docente}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Turma *
            </label>
            <input
              type="text"
              value={formData.turma}
              onChange={(e) => setFormData({ ...formData, turma: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.turma ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: 1º A, 2º B, etc."
            />
            {errors.turma && (
              <p className="text-red-500 text-sm mt-1">{errors.turma}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Disciplina *
            </label>
            <input
              type="text"
              value={formData.disciplina}
              onChange={(e) => setFormData({ ...formData, disciplina: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.disciplina ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: Matemática, Português, etc."
            />
            {errors.disciplina && (
              <p className="text-red-500 text-sm mt-1">{errors.disciplina}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantidade de Aulas *
            </label>
            <input
              type="number"
              min="1"
              value={formData.aulas}
              onChange={(e) => setFormData({ ...formData, aulas: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.aulas ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: 4"
            />
            {errors.aulas && (
              <p className="text-red-500 text-sm mt-1">{errors.aulas}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {initialData ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
