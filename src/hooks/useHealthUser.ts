import { useQuery } from '@tanstack/react-query';
import { fetchHealthUserById } from '../api/healthUsersService';

export function useHealthUser(id: string) {
  return useQuery({
    queryKey: ['healthUser', id],
    queryFn: () => fetchHealthUserById(id),
    enabled: !!id,
  });
}

