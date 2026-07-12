import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useNilaiComplaintsQuery() {
    return useQuery({
        queryKey: ['nilai-complaints-asisten'],
        queryFn: async () => {
            const response = await api.get('/api-v1/nilai-complaints/asisten');
            return response.data.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
