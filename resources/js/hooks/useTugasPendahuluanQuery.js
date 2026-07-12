import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const TUGAS_PENDAHULUAN_QUERY_KEY = ["tugas-pendahuluan"];

const fetchTugasPendahuluan = async () => {
    const { data } = await api.get("/api-v1/tugas-pendahuluan");

    if (Array.isArray(data?.data)) {
        return {
            items: data.data,
            meta: data.meta ?? {},
        };
    }

    if (data?.success === false) {
        throw new Error(data?.message ?? "Gagal memuat tugas pendahuluan");
    }

    return {
        items: [],
        meta: {},
    };
};

export const useTugasPendahuluanQuery = (options = {}) =>
    useQuery({
        queryKey: TUGAS_PENDAHULUAN_QUERY_KEY,
        queryFn: fetchTugasPendahuluan,
        staleTime: 5 * 60 * 1000,
        ...options,
    });
