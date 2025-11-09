import { ClinicDTO } from "./ClinicDTO";
import { HealthWorkerDTO } from "./HealthWorkerDTO";

export interface AccessRequestDTO {
  id: string;
  healthUserCi: string;
  healthWorker: HealthWorkerDTO;
  clinic: ClinicDTO;
  createdAt?: string;
}
