import { HealthWorkerDTO } from "./HealthWorkerDTO";

export interface ClinicDTO {
    id?: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    createdAt: string;
    updatedAt: string;
    healthWorkers?: HealthWorkerDTO[];
}