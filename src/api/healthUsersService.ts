import { apiClient } from './client';

export type HealthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  document: string;
  documentType: string;
  gender: string;
  createdAt: string;
  updatedAt: string;
  clinicIds: string[];
  clinicalHistoryId: string;
};

const FALLBACK_USERS: HealthUser[] = [
  {
    id: 'user-1',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@email.com',
    phone: '+598 99 123 456',
    dateOfBirth: '1985-05-15',
    address: 'Av. Italia 2350, Montevideo',
    document: '4.567.890-1',
    documentType: 'ID',
    gender: 'MALE',
    createdAt: '2023-01-10',
    updatedAt: '2024-12-01',
    clinicIds: [],
    clinicalHistoryId: 'history-1',
  },
  {
    id: 'user-2',
    firstName: 'María',
    lastName: 'González',
    email: 'maria.gonzalez@email.com',
    phone: '+598 98 765 432',
    dateOfBirth: '1992-08-22',
    address: 'Bv. Artigas 1234, Montevideo',
    document: '5.123.456-7',
    documentType: 'ID',
    gender: 'FEMALE',
    createdAt: '2023-02-15',
    updatedAt: '2024-11-20',
    clinicIds: [],
    clinicalHistoryId: 'history-2',
  },
];

export async function fetchHealthUsers(): Promise<HealthUser[]> {
  try {
    const response = await apiClient.get<HealthUser[]>('/health-users');
    return response.data;
  } catch (error) {
    console.warn(
      '[api] Falling back to static health users list. Configure BACKEND_URL to disable this message.',
      error,
    );
    return FALLBACK_USERS;
  }
}

export async function fetchHealthUserById(
  id: string,
): Promise<HealthUser | undefined> {
  try {
    const response = await apiClient.get<HealthUser>(`/health-users/${id}`);
    return response.data;
  } catch (error) {
    console.warn(
      `[api] Falling back to static health user detail for id "${id}". Configure BACKEND_URL to disable this message.`,
      error,
    );
    return FALLBACK_USERS.find(user => user.id === id);
  }
}

