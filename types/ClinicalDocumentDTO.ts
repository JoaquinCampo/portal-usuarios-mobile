import type { ClinicDTO } from './ClinicDTO';
import type { HealthWorkerDTO } from './HealthWorkerDTO';

export interface ClinicalDocumentDTO {
  id: string;
  title: string;
  description: string;
  content: string;
  contentType: string;
  contentUrl: string;
  healthWorker: HealthWorkerDTO;
  clinic: ClinicDTO;
  createdAt: string;
}
