import { apiClient } from './client';

export type HealthWorker = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  document: string;
  documentType: string;
  gender: string;
  licenseNumber: string;
  createdAt: string;
  updatedAt: string;
  clinicIds: string[];
  specialtyIds: string[];
};

const FALLBACK_WORKERS: HealthWorker[] = [
  {
    id: 'hw-1',
    firstName: 'Ana',
    lastName: 'Rodríguez',
    email: 'ana.rodriguez@hospital.com.uy',
    phone: '+598 2901 2345 ext. 101',
    address: 'Av. Italia 2500, Montevideo',
    document: '12345678',
    documentType: 'ID',
    gender: 'FEMALE',
    licenseNumber: 'MED-12345',
    createdAt: '2023-01-15',
    updatedAt: '2024-12-01',
    clinicIds: [],
    specialtyIds: [],
  },
  {
    id: 'hw-2',
    firstName: 'Carlos',
    lastName: 'Fernández',
    email: 'cfernandez@sanatorio.com.uy',
    phone: '+598 2711 5678 ext. 202',
    address: 'Calle 21 de Setiembre 1500, Montevideo',
    document: '23456789',
    documentType: 'ID',
    gender: 'MALE',
    licenseNumber: 'MED-23456',
    createdAt: '2023-03-20',
    updatedAt: '2024-11-15',
    clinicIds: [],
    specialtyIds: [],
  },
];

export async function fetchHealthWorkers(): Promise<HealthWorker[]> {
  try {
    const response = await apiClient.get<HealthWorker[]>('/health-workers');
    return response.data;
  } catch (error) {
    console.warn(
      '[api] Falling back to static health workers list. Configure BACKEND_URL to disable this message.',
      error,
    );
    return FALLBACK_WORKERS;
  }
}

export async function fetchHealthWorkerById(
  id: string,
): Promise<HealthWorker | undefined> {
  try {
    const response = await apiClient.get<HealthWorker>(`/health-workers/${id}`);
    return response.data;
  } catch (error) {
    console.warn(
      `[api] Falling back to static health worker detail for id "${id}". Configure BACKEND_URL to disable this message.`,
      error,
    );
    return FALLBACK_WORKERS.find(worker => worker.id === id);
  }
}

