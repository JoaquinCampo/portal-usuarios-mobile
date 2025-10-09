import { useQuery } from '@tanstack/react-query';
import { fetchClinicById } from '../api/clinicsService';

export function useClinic(id: string) {
  return useQuery({
    queryKey: ['clinics', id],
    queryFn: () => fetchClinicById(id),
    enabled: Boolean(id),
  });
}
