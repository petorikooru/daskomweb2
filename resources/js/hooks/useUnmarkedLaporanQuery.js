import { useQuery } from "@tanstack/react-query";
import { unmarkedSummary } from "@/lib/routes/laporanPraktikan";
import { api } from "@/lib/api";

export const UNMARKED_LAPORAN_QUERY_KEY = ["unmarked-laporan"];

const fetchUnmarkedSummary = async () => {
    const { data } = await api.get(unmarkedSummary.url());

    if (data?.success === false) {
        throw new Error(data?.message ?? "Gagal memuat data laporan.");
    }

    if (Array.isArray(data?.data)) {
        return data.data;
    }

    return [];
};

export const useUnmarkedLaporanQuery = (options = {}) =>
    useQuery({
        queryKey: UNMARKED_LAPORAN_QUERY_KEY,
        queryFn: fetchUnmarkedSummary,
        staleTime: 60 * 1000,
        ...options,
    });
