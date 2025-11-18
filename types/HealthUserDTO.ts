import type { ClinicDTO } from "./ClinicDTO";

export enum Gender {
    MALE = "MALE",
    FEMALE = "FEMALE",
    OTHER = "OTHER",
}

export interface HealthUserDTO {
    id: string;
    ci: string;
    firstName: string;
    lastName: string;
    gender: Gender;
    email?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    createdAt?: string;
    updatedAt?: string;
    clinics?: ClinicDTO[];
}