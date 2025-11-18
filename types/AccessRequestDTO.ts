import { ClinicDTO } from "./ClinicDTO";
import { HealthWorkerDTO } from "./HealthWorkerDTO";

export interface AccessRequestDTO {
  id: string;
  healthUserId?: string;
  healthUserCi: string;
  healthWorker?: HealthWorkerDTO;
  clinic: ClinicDTO;
  specialtyNames?: string[];
  createdAt?: string;
}
