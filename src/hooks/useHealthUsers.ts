import { useQuery } from '@tanstack/react-query';
import { fetchHealthUsers } from '../api/healthUsersService';

export function useHealthUsers() {
  return useQuery({
    queryKey: ['healthUsers'],
    queryFn: fetchHealthUsers,
  });
}

