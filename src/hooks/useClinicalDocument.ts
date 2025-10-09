import { useQuery } from '@tanstack/react-query';
import { fetchClinicalDocumentById } from '../api/clinicalDocumentsService';

export function useClinicalDocument(id: string) {
  return useQuery({
    queryKey: ['clinicalDocument', id],
    queryFn: () => fetchClinicalDocumentById(id),
    enabled: !!id,
  });
}

