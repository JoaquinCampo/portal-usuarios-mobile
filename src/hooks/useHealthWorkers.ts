import { useQuery } from '@tanstack/react-query';
import { fetchHealthWorkers } from '../api/healthWorkersService';

export function useHealthWorkers() {
  return useQuery({
    queryKey: ['healthWorkers'],
    queryFn: fetchHealthWorkers,
  });
}

