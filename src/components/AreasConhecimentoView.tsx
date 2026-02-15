import { useAreasConhecimento } from '../hooks/useAreasConhecimento';
import { AreasConhecimento } from './AreasConhecimento';

interface AreasConhecimentoViewProps {
  docentes: string[];
}

// Horários padrão das aulas
const HORARIOS_PADRAO = [
  { numero: 1, inicio: '07:00', fim: '07:50' },
  { numero: 2, inicio: '07:50', fim: '08:40' },
  { numero: 3, inicio: '08:40', fim: '09:30' },
  { numero: 4, inicio: '09:50', fim: '10:40' },
  { numero: 5, inicio: '10:40', fim: '11:30' },
  { numero: 6, inicio: '11:30', fim: '12:20' },
  { numero: 7, inicio: '12:20', fim: '13:10' },
  { numero: 8, inicio: '13:10', fim: '14:00' },
  { numero: 9, inicio: '14:00', fim: '14:50' },
];

export function AreasConhecimentoView({ docentes }: AreasConhecimentoViewProps) {
  const {
    areas,
    bloqueiosArea,
    adicionarArea,
    removerArea,
    vincularDocente,
    desvincularDocente,
    adicionarBloqueioArea,
    removerBloqueioArea,
    docentesSemArea,
  } = useAreasConhecimento(docentes);

  return (
    <AreasConhecimento
      areas={areas}
      bloqueiosArea={bloqueiosArea}
      docentesSemArea={docentesSemArea}
      horarios={HORARIOS_PADRAO}
      onAdicionarArea={adicionarArea}
      onRemoverArea={removerArea}
      onVincularDocente={vincularDocente}
      onDesvincularDocente={desvincularDocente}
      onAdicionarBloqueio={adicionarBloqueioArea}
      onRemoverBloqueio={removerBloqueioArea}
    />
  );
}
