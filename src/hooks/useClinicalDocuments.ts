import { useQuery } from '@tanstack/react-query';
import { fetchClinicalDocuments } from '../api/clinicalDocumentsService';

export function useClinicalDocuments() {
  return useQuery({
    queryKey: ['clinicalDocuments'],
    queryFn: fetchClinicalDocuments,
  });
}

