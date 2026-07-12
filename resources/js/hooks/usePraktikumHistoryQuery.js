import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const PRAKTIKUM_HISTORY_QUERY_KEY = ["praktikum-history"];

const fetchPraktikumHistory = async (params = {}) => {
    const { data } = await api.get("/api-v1/praktikum/history", {
        params,
    });

    if (Array.isArray(data?.data)) {
        return data.data;
    }

    if (Array.isArray(data?.history)) {
        return data.history;
    }

    return [];
};

export const usePraktikumHistoryQuery = (params = {}, options = {}) =>
    useQuery({
        queryKey: [...PRAKTIKUM_HISTORY_QUERY_KEY, params],
        queryFn: () => fetchPraktikumHistory(params),
        staleTime: 5 * 60 * 1000,
        ...options,
    });
