import { apiClient } from './client';

export type ClinicalDocument = {
  id: string;
  title: string;
  contentUrl: string;
  clinicalHistoryId: string;
  healthWorkerIds: string[];
  createdAt: string;
  updatedAt: string;
};

const FALLBACK_DOCUMENTS: ClinicalDocument[] = [
  {
    id: 'doc-1',
    title: 'Consulta Cardiológica',
    contentUrl: 'https://example.com/documents/doc-1.pdf',
    clinicalHistoryId: 'history-1',
    healthWorkerIds: [],
    createdAt: '2024-12-10',
    updatedAt: '2024-12-10',
  },
  {
    id: 'doc-2',
    title: 'Análisis de Sangre',
    contentUrl: 'https://example.com/documents/doc-2.pdf',
    clinicalHistoryId: 'history-2',
    healthWorkerIds: [],
    createdAt: '2024-12-05',
    updatedAt: '2024-12-05',
  },
];

export async function fetchClinicalDocuments(): Promise<ClinicalDocument[]> {
  try {
    const response = await apiClient.get<ClinicalDocument[]>(
      '/clinical-documents',
    );
    return response.data;
  } catch (error) {
    console.warn(
      '[api] Falling back to static clinical documents list. Configure BACKEND_URL to disable this message.',
      error,
    );
    return FALLBACK_DOCUMENTS;
  }
}

export async function fetchClinicalDocumentById(
  id: string,
): Promise<ClinicalDocument | undefined> {
  try {
    const response = await apiClient.get<ClinicalDocument>(
      `/clinical-documents/${id}`,
    );
    return response.data;
  } catch (error) {
    console.warn(
      `[api] Falling back to static clinical document detail for id "${id}". Configure BACKEND_URL to disable this message.`,
      error,
    );
    return FALLBACK_DOCUMENTS.find(doc => doc.id === id);
  }
}

