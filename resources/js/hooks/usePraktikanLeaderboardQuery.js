import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { leaderboardIndex } from "@/lib/routes/leaderboard";

const LEADERBOARD_QUERY_KEY = "praktikan-leaderboard";

const fetchPraktikanLeaderboard = async ({ queryKey }) => {
    const [, filters = {}] = queryKey;
    const { data } = await api.get(leaderboardIndex.url({ query: filters }));

    if (data?.status === "success") {
        const items = Array.isArray(data.leaderboard) ? data.leaderboard : [];

        return {
            items,
            message: data.message ?? null,
        };
    }

    const errorMessage = data?.message ?? "Gagal memuat leaderboard praktikan";
    throw new Error(errorMessage);
};

export const usePraktikanLeaderboardQuery = (filters = {}, options = {}) =>
    useQuery({
        queryKey: [LEADERBOARD_QUERY_KEY, filters],
        queryFn: fetchPraktikanLeaderboard,
        keepPreviousData: true,
        staleTime: 60 * 1000,
        ...options,
    });
