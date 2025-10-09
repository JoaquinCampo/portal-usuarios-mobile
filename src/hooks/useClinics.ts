import { useQuery } from '@tanstack/react-query';
import { fetchClinics } from '../api/clinicsService';

export function useClinics() {
  return useQuery({
    queryKey: ['clinics'],
    queryFn: fetchClinics,
    staleTime: 60 * 1000,
  });
}
