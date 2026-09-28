// Contexto interno do Chip (DS-12): diz ao `Chip` que ele está dentro de uma `ChipList`, para
// renderizar `<li>` em vez de `<span>`. Arquivo à parte para os dois componentes o importarem sem
// exportar não-componentes dos arquivos .tsx (regra react-refresh).
import { createContext } from 'react';

export const DentroDeChipList = createContext(false);
