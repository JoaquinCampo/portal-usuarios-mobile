import { useQuery } from '@tanstack/react-query';
import { fetchHealthWorkerById } from '../api/healthWorkersService';

export function useHealthWorker(id: string) {
  return useQuery({
    queryKey: ['healthWorker', id],
    queryFn: () => fetchHealthWorkerById(id),
    enabled: !!id,
  });
}

