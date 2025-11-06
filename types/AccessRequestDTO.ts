import { ClinicDTO } from "./ClinicDTO";
import { HealthWorkerDTO } from "./HealthWorkerDTO";

export interface AccessRequestDTO {
  id: string;
  healthUserId: string;
  healthWorker: HealthWorkerDTO;
  clinic: ClinicDTO;
  createdAt?: string;
}
