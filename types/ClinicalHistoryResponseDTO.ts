import type { ClinicalDocumentDTO } from './ClinicalDocumentDTO';
import type { HealthUserDTO } from './HealthUserDTO';

export interface ClinicalHistoryResponseDTO {
  healthUser: HealthUserDTO;
  documents: ClinicalDocumentDTO[];
  hasAccess: boolean;
  accessMessage: string;
}
