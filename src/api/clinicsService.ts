import { apiClient } from './client';

export type Clinic = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  domain: string;
  type: string;
  createdAt: string;
  updatedAt: string;
};

const FALLBACK_CLINICS: Clinic[] = [
  {
    id: 'fallback-1',
    name: 'Clínica de ejemplo',
    email: 'demo@example.com',
    phone: '+598 0000 0000',
    address: 'Dirección de ejemplo 123',
    domain: 'demo.local',
    type: 'DEMO',
    createdAt: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString().slice(0, 10),
  },
];

const RESOURCE_PATH = '/clinics';

export async function fetchClinics(): Promise<Clinic[]> {
  try {
    const response = await apiClient.get<Clinic[]>(RESOURCE_PATH);
    return response.data;
  } catch (error) {
    console.warn(
      '[api] Falling back to static clinics list. Configure backend or credentials to disable this message.',
      error,
    );
    return FALLBACK_CLINICS;
  }
}

export async function fetchClinicById(id: string): Promise<Clinic | undefined> {
  try {
    const response = await apiClient.get<Clinic>(`${RESOURCE_PATH}/${id}`);
    return response.data;
  } catch (error) {
    console.warn(
      `[api] Clinic ${id} could not be fetched. Falling back to static data.`,
      error,
    );
    return FALLBACK_CLINICS.find(clinic => clinic.id === id);
  }
}

